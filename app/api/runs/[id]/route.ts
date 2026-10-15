import { NextResponse } from "next/server";
import { getAgentRunBundle } from "@/lib/agent-runs-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const bundle = await getAgentRunBundle(id);

    if (!bundle) {
      return NextResponse.json({ error: "Agent run not found." }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load agent run." },
      { status: 500 },
    );
  }
}
