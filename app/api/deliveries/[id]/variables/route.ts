import { NextResponse } from "next/server";
import { railwayVariableSchema } from "@/lib/railway-delivery";
import { upsertRailwayVariable } from "@/lib/railway-delivery-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = railwayVariableSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Railway variable record.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const variable = await upsertRailwayVariable(id, parsed.data);
    return NextResponse.json({ variable }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record Railway variable." },
      { status: 500 },
    );
  }
}
