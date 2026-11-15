import { NextResponse } from "next/server";

// The container's health check: answers without touching any tool, cache or upstream service.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
