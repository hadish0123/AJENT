import { getDatabase } from "./database";
import { ensureProjectSchema, getProject, updateProject } from "./db";
import { ensureExecutionSchema, getExecution } from "./execution-db";
import { createQARun, ensureQASchema, getQARun } from "./qa-db";
import {
  ensureRailwayDeliverySchema,
  getRailwayDelivery,
  syncRailwayDelivery,
} from "./railway-delivery-db";
import type { RecoveryAction, RecoveryResult } from "./recovery";

export async function executeRecovery(
  action: RecoveryAction,
  resourceId: string,
): Promise<RecoveryResult> {
  const sql = getDatabase();

  if (action === "project.resume") {
    await ensureProjectSchema();
    const project = await getProject(resourceId);
    if (!project) throw new Error("Project not found.");
    if (project.status !== "paused") {
      throw new Error("Only paused projects can be resumed.");
    }

    const updated = await updateProject(resourceId, { status: "planned" });
    if (!updated) throw new Error("Project not found.");

    return {
      action,
      resourceType: "project",
      resourceId,
      status: updated.status,
      message: "Project resumed to planned state.",
    };
  }

  if (action === "execution.retry") {
    await ensureExecutionSchema();
    const execution = await getExecution(resourceId);
    if (!execution) throw new Error("Execution not found.");
    if (execution.status !== "failed") {
      throw new Error("Only failed executions can be retried.");
    }

    await sql`
      UPDATE github_execution_checks
      SET status = 'pending', details = '', updated_at = NOW()
      WHERE execution_id = ${resourceId}::uuid
        AND status = 'failed'
    `;

    await sql`
      UPDATE github_executions
      SET status = 'coding', completed_at = NULL, updated_at = NOW()
      WHERE id = ${resourceId}::uuid
    `;

    return {
      action,
      resourceType: "execution",
      resourceId,
      status: "coding",
      message: "Execution returned to coding and failed checks were reset.",
    };
  }

  if (action === "qa.retry") {
    await ensureQASchema();
    const run = await getQARun(resourceId);
    if (!run) throw new Error("QA run not found.");
    if (!["failed", "blocked"].includes(run.status)) {
      throw new Error("Only failed or blocked QA runs can be retried.");
    }

    const next = await createQARun(
      run.executionId,
      run.source,
      run.targetUrl,
      run.requiredChecks,
    );

    return {
      action,
      resourceType: "qa",
      resourceId,
      nextResourceId: next.id,
      status: next.status,
      message: "A fresh QA run was created with the same validation requirements.",
    };
  }

  await ensureRailwayDeliverySchema();
  const delivery = await getRailwayDelivery(resourceId);
  if (!delivery) throw new Error("Railway delivery not found.");
  if (!["failed", "blocked"].includes(delivery.status)) {
    throw new Error("Only failed or blocked deliveries can be retried.");
  }

  const updated = await syncRailwayDelivery(resourceId, {
    status: "planned",
    deploymentId: null,
    healthState: "unknown",
    healthText: "",
    healthCheckedAt: null,
    lastError: "",
  });

  return {
    action,
    resourceType: "delivery",
    resourceId,
    status: updated.status,
    message: "Delivery reset to planned while preserving reusable Railway infrastructure IDs.",
  };
}
