import { NextResponse } from "next/server";
import { getRequestPrincipal } from "@/lib/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const principal = await getRequestPrincipal(request);
  if (!principal) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    principal,
  });
}
