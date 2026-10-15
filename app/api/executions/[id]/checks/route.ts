import { NextResponse } from "next/server";
import { executionCheckSchema } from "@/lib/execution";
import { upsertExecutionCheck } from "@/lib/execution-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = executionCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid execution check.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const check = await upsertExecutionCheck(id, parsed.data);
    return NextResponse.json({ check }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record check." },
      { status: 500 },
    );
  }
}
