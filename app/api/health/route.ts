import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "hadi-dev-studio",
    version: "0.1.0",
    phase: "foundation",
    timestamp: new Date().toISOString(),
  });
}
