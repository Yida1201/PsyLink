import { validSupabaseConfig } from "@/lib/supabase/config";
/** Private loopback development preview never authorizes a public deployment. */
export function localPreview(request: Request) {
  const host = request.headers.get("host") || new URL(request.url).host;
  const forwarded = request.headers.get("x-forwarded-host");
  if (forwarded && forwarded !== host) return false;
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.LOCAL_AI_PREVIEW === "true" &&
    /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)
  );
}
export function serviceStatus(request: Request) {
  const preview = localPreview(request);
  const publicReady =
    process.env.CONTENT_REVIEWED === "true" &&
    validSupabaseConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    );
  const allowed = preview || publicReady;
  return {
    ai: Boolean(
      process.env.OPENAI_API_KEY &&
        process.env.OPENAI_MODEL &&
        process.env.AI_ENABLED === "true" &&
        allowed,
    ),
    stt: Boolean(process.env.OPENAI_API_KEY && process.env.STT_ENABLED === "true" && allowed),
    tts: Boolean(
      process.env.OPENAI_API_KEY &&
        process.env.TTS_ENABLED === "true" &&
        allowed,
    ),
    localPreview: preview,
    authRequired: !preview,
    search: false,
    reviewed: process.env.CONTENT_REVIEWED === "true",
  };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return (
      new URL(origin).host ===
      (request.headers.get("host") || new URL(request.url).host)
    );
  } catch {
    return false;
  }
}
