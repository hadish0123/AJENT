import { NextResponse } from "next/server";
import { executionCheckSchema } from "@/lib/execution";
import { upsertExecutionCheck } from "@/lib/execution-db";
import { auditMutation } from "@/lib/audit";

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
    await auditMutation(request, { action: "execution.check", resourceType: "execution", resourceId: id, metadata: { name: check.name, status: check.status } });
    return NextResponse.json({ check }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record check." },
      { status: 500 },
    );
  }
}
