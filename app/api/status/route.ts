import { NextResponse } from "next/server";
import { serviceStatus } from "@/lib/psylink/service";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return NextResponse.json(serviceStatus(request), {
    headers: { "Cache-Control": "no-store" },
  });
}
