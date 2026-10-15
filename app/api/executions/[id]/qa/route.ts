import { NextResponse } from "next/server";
import { createQARunSchema } from "@/lib/qa";
import { createQARun, listExecutionQARuns } from "@/lib/qa-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const runs = await listExecutionQARuns(id);
    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list QA runs." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = createQARunSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid QA run payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const run = await createQARun(
      id,
      parsed.data.source,
      parsed.data.targetUrl,
      parsed.data.requiredChecks,
    );

    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create QA run.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : 500 },
    );
  }
}
