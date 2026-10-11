import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validSupabaseConfig } from "@/lib/supabase/config";
import { authDestination } from "@/lib/supabase/auth-destination";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  let destination = "/?auth=error";
  if (
    code &&
    validSupabaseConfig(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    )
  ) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) destination = await authDestination(supabase, request.nextUrl.searchParams.get("next"));
    } catch {
      // An unavailable auth service should offer a fresh login, not a 500 page.
    }
  }
  // A relative redirect keeps the browser's public host, including behind
  // Vercel/Next.js proxies that may expose an internal URL to the handler.
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
