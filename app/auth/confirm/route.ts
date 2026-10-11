import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validSupabaseConfig } from "@/lib/supabase/config";
import { authDestination } from "@/lib/supabase/auth-destination";

// Use the token-hash email template in LOGIN_SETUP.md to allow a user to open
// the email in a different browser from the one that requested it.
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  let destination = "/?auth=error";
  if (
    tokenHash &&
    type === "email" &&
    validSupabaseConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    )
  ) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });
      if (!error) destination = await authDestination(supabase, request.nextUrl.searchParams.get("next"));
    } catch {
      // Do not expose authentication tokens or provider errors.
    }
  }
  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: destination },
  });
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
