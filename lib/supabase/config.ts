/** Reject incomplete setup before creating a client; never expose credentials. */
export function validSupabaseConfig(
  url: string | undefined,
  key: string | undefined,
) {
  if (!url || !key?.trim()) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}
