import { NextResponse } from "next/server";
import { submitAgentOutput } from "@/lib/agent-runs-db";
import { agentOutputInputSchema } from "@/lib/orchestration";
import { auditMutation } from "@/lib/audit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = agentOutputInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid agent output.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const bundle = await submitAgentOutput(id, parsed.data);
    await auditMutation(request, { action: "agent_output.submit", resourceType: "agent_run", resourceId: id, metadata: { agent: parsed.data.agent, stage: parsed.data.stage } });
    return NextResponse.json(bundle);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit agent output.";
    const status =
      message.includes("not found")
        ? 404
        : message.includes("Expected stage") ||
            message.includes("not assigned") ||
            message.includes("not active")
          ? 409
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
