import { NextResponse } from "next/server";
import { bugUpdateSchema } from "@/lib/qa";
import { updateQABug } from "@/lib/qa-db";
import { auditMutation } from "@/lib/audit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = bugUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid bug update.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const bug = await updateQABug(id, parsed.data);

    if (!bug) {
      return NextResponse.json({ error: "Bug not found." }, { status: 404 });
    }

    await auditMutation(request, { action: "qa.bug.update", resourceType: "bug", resourceId: bug.id, metadata: { status: bug.status, fixedCommitSha: bug.fixedCommitSha } });
    return NextResponse.json({ bug });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update bug." },
      { status: 500 },
    );
  }
}
