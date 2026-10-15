import { NextResponse } from "next/server";
import { createExecutionSchema } from "@/lib/execution";
import { createGitHubExecution, getExecutionByRun } from "@/lib/execution-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const execution = await getExecutionByRun(id);
    return NextResponse.json({ execution });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load execution." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = createExecutionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid GitHub execution payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const execution = await createGitHubExecution(
      id,
      parsed.data.repository,
      parsed.data.baseBranch,
    );

    return NextResponse.json({ execution }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create GitHub execution.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : message.includes("must be completed") ? 409 : 500 },
    );
  }
}
