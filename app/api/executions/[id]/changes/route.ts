import { NextResponse } from "next/server";
import { executionChangeSchema } from "@/lib/execution";
import { upsertExecutionChange } from "@/lib/execution-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = executionChangeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid execution change.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const change = await upsertExecutionChange(id, parsed.data);
    return NextResponse.json({ change }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record change." },
      { status: 500 },
    );
  }
}
