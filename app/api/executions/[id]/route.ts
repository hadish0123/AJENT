import { NextResponse } from "next/server";
import { executionSyncSchema } from "@/lib/execution";
import { getExecutionBundle, syncExecution } from "@/lib/execution-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const bundle = await getExecutionBundle(id);

    if (!bundle) {
      return NextResponse.json({ error: "Execution not found." }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load execution." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = executionSyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid execution update.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const execution = await syncExecution(id, parsed.data);
    return NextResponse.json({ execution });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update execution.";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 });
  }
}
