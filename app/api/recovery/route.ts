import { NextResponse } from "next/server";
import { auditMutation } from "@/lib/audit";
import { requirePermission } from "@/lib/request-auth";
import {
  RECOVERY_ACTIONS,
  RECOVERY_DESCRIPTIONS,
  recoveryRequestSchema,
} from "@/lib/recovery";
import { executeRecovery } from "@/lib/recovery-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "studio:read");
    return NextResponse.json({
      actions: RECOVERY_ACTIONS.map((action) => ({
        action,
        description: RECOVERY_DESCRIPTIONS[action],
      })),
    });
  } catch (error) {
    const status = error instanceof Error && "status" in error
      ? Number((error as { status: number }).status)
      : 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load recovery actions." },
      { status },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(request, "recovery:write");
    const body = await request.json();
    const parsed = recoveryRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid recovery request.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await executeRecovery(parsed.data.action, parsed.data.resourceId);

    await auditMutation(request, {
      action: `recovery.${parsed.data.action}`,
      resourceType: result.resourceType,
      resourceId: result.resourceId,
      metadata: { nextResourceId: result.nextResourceId, status: result.status },
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recovery failed.";
    const status = error instanceof Error && "status" in error
      ? Number((error as { status: number }).status)
      : message.includes("not found")
        ? 404
        : message.includes("Only ")
          ? 409
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
