import { randomUUID } from "node:crypto";
import { recordAuditEvent } from "./audit-db";
import { getRequestPrincipal } from "./request-auth";

export async function auditMutation(
  request: Request,
  input: {
    action: string;
    resourceType: string;
    resourceId?: string;
    outcome?: "success" | "failure";
    metadata?: Record<string, unknown>;
  },
) {
  try {
    const principal = await getRequestPrincipal(request);
    await recordAuditEvent({
      actor: principal?.sub ?? "anonymous",
      role: principal?.role ?? "anonymous",
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      requestId: request.headers.get("x-request-id") || randomUUID(),
      outcome: input.outcome ?? "success",
      metadata: input.metadata,
    });
  } catch {
    // Auditing must not turn a successful control-plane mutation into a failure.
  }
}
