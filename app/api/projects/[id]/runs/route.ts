import { NextResponse } from "next/server";
import { createAgentRun, listProjectRuns } from "@/lib/agent-runs-db";
import { auditMutation } from "@/lib/audit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const runs = await listProjectRuns(id);
    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to list agent runs." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const run = await createAgentRun(id);

    if (!run) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    await auditMutation(request, { action: "agent_run.create", resourceType: "agent_run", resourceId: run.id, metadata: { projectId: id } });
    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create agent run." },
      { status: 500 },
    );
  }
}
