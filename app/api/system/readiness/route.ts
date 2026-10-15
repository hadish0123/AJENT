import { NextResponse } from "next/server";
import { getAuthReadiness } from "@/lib/auth";
import { getDatabase } from "@/lib/database";
import { requirePermission } from "@/lib/request-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "studio:read");

    let database = false;
    try {
      const sql = getDatabase();
      await sql`SELECT 1 AS ok`;
      database = true;
    } catch {
      database = false;
    }

    const auth = getAuthReadiness();
    const ready =
      database &&
      (!auth.required || (auth.ownerPasswordConfigured && auth.secretConfigured));

    return NextResponse.json({
      ready,
      checks: {
        database,
        auth,
      },
      version: "1.0.0",
    }, { status: ready ? 200 : 503 });
  } catch (error) {
    const status = error instanceof Error && "status" in error
      ? Number((error as { status: number }).status)
      : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to determine readiness." },
      { status },
    );
  }
}
