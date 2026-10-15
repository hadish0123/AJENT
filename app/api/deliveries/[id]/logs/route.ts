import { NextResponse } from "next/server";
import { railwayLogSchema } from "@/lib/railway-delivery";
import { appendRailwayLog } from "@/lib/railway-delivery-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = railwayLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Railway log record.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const log = await appendRailwayLog(id, parsed.data);
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record Railway log." },
      { status: 500 },
    );
  }
}
