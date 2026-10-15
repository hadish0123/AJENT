import { NextResponse } from "next/server";
import { listAuditEvents } from "@/lib/audit-db";
import { requirePermission } from "@/lib/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "audit:read");
    const url = new URL(request.url);
    const rawLimit = Number(url.searchParams.get("limit") || 100);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 100;
    const events = await listAuditEvents(limit);
    return NextResponse.json({ events });
  } catch (error) {
    const status = error instanceof Error && "status" in error
      ? Number((error as { status: number }).status)
      : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load audit log." },
      { status },
    );
  }
}
