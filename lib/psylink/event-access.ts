// Time-boxed guest access to live chat for a facilitated session (for example a
// classroom demo), so participants do not have to sign in.
//
// Off unless BOTH server-only variables are set:
//   EVENT_CODE           shared secret, 6–64 chars of A–Z a–z 0–9 _ -
//   EVENT_CODE_EXPIRES   ISO time with offset, at most MAX_WINDOW_DAYS ahead
// After the expiry the code is inert and chat needs sign-in again. Moderation,
// safety replies and source restrictions in the chat route still apply.
//
// Limits: each browser gets EVENT_GUEST_LIMIT replies (default 12), tracked in
// a signed cookie; clearing cookies resets it, so this slows a participant
// down rather than stopping a determined one. EVENT_TOTAL_LIMIT (default 600)
// is counted in memory per server instance and is a best-effort backstop.
// Neither is a substitute for the short expiry window.
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const MAX_WINDOW_DAYS = 14;
export const EVENT_COOKIE = "bloomie-event";
const codePattern = /^[A-Za-z0-9_-]{6,64}$/;

type Env = Record<string, string | undefined>;
export type EventConfig = {
  code: string;
  expires: number;
  guestLimit: number;
  totalLimit: number;
  key: Buffer;
};

function limit(value: string | undefined, fallback: number, max: number) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= max ? n : fallback;
}

/** Returns the active event, or null when unset, malformed, expired or too far ahead. */
export function eventConfig(env: Env, now: number): EventConfig | null {
  const code = env.EVENT_CODE || "";
  const expires = Date.parse(env.EVENT_CODE_EXPIRES || "");
  if (!codePattern.test(code) || !Number.isFinite(expires)) return null;
  if (now >= expires || expires - now > MAX_WINDOW_DAYS * 864e5) return null;
  // The signing key must not be derivable from the code participants hold.
  if (!env.OPENAI_API_KEY) return null;
  return {
    code,
    expires,
    guestLimit: limit(env.EVENT_GUEST_LIMIT, 12, 100),
    totalLimit: limit(env.EVENT_TOTAL_LIMIT, 600, 10000),
    key: createHash("sha256").update(`bloomie-event:${env.OPENAI_API_KEY}`).digest(),
  };
}

export function validEventCode(value: unknown): value is string {
  return typeof value === "string" && codePattern.test(value);
}

export function codeMatches(config: EventConfig, supplied: unknown) {
  if (!validEventCode(supplied)) return false;
  const a = createHash("sha256").update(config.code).digest();
  const b = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(a, b);
}

function sign(config: EventConfig, payload: string) {
  // Bound to the code, so a new event code starts everyone from zero.
  return createHmac("sha256", config.key).update(`${config.code}.${payload}`).digest("base64url");
}

function readCount(config: EventConfig, cookie: string | undefined) {
  const [id, count, signature, ...rest] = (cookie || "").split(".");
  if (!id || !signature || rest.length || !/^\d{1,4}$/.test(count || "")) return null;
  const expected = Buffer.from(sign(config, `${id}.${count}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return { id, count: Number(count) };
}

const totals = new Map<string, number>();
/** Test hook: forget the in-memory total. */
export function resetEventTotals() { totals.clear(); }

/** Spends one guest reply. A missing or tampered cookie counts as a new guest. */
export function consumeGuest(config: EventConfig, cookie: string | undefined) {
  const total = totals.get(config.code) || 0;
  if (total >= config.totalLimit) return { allowed: false as const };
  const seen = readCount(config, cookie) || { id: randomUUID(), count: 0 };
  if (seen.count >= config.guestLimit) return { allowed: false as const };
  totals.set(config.code, total + 1);
  const payload = `${seen.id}.${seen.count + 1}`;
  return { allowed: true as const, cookie: `${payload}.${sign(config, payload)}` };
}

/** Set-Cookie value. Partitioned + SameSite=None lets it work inside an iframe. */
export function eventCookieHeader(config: EventConfig, value: string, now: number, secure: boolean) {
  const maxAge = Math.max(1, Math.ceil((config.expires - now) / 1000));
  return `${EVENT_COOKIE}=${value}; Path=/api/chat; Max-Age=${maxAge}; HttpOnly; ` +
    (secure ? "Secure; SameSite=None; Partitioned" : "SameSite=Lax");
}

export function readEventCookie(header: string | null) {
  for (const part of (header || "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === EVENT_COOKIE) return value.join("=");
  }
  return undefined;
}
