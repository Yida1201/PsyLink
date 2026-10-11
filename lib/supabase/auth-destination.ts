import type { createClient } from "./server";

/** Navigation only: every admin API still checks the signed-in user's role. */
export async function authDestination(
  client: Awaited<ReturnType<typeof createClient>>,
  next: string | null,
): Promise<"/" | "/admin"> {
  // Only known, relative destinations are allowed. Never redirect to user URLs.
  if (next !== null) return next === "/admin" ? "/admin" : "/";

  // Older token-hash templates omit `next`. Resolve their destination using the
  // authoritative staff table, never email addresses or editable user metadata.
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) return "/";
    const staff = await client.from("bloomie_staff").select("role")
      .eq("user_id", user.id).maybeSingle();
    if (!staff.error && ["admin", "editor", "reviewer"].includes(staff.data?.role)) {
      return "/admin";
    }
  } catch {
    // A missing staff table must not prevent ordinary users from signing in.
  }
  return "/";
}
