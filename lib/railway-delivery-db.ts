import { randomUUID } from "node:crypto";
import { getDatabase } from "./database";
import { getProject } from "./db";
import { getQARunBundle, ensureQASchema } from "./qa-db";
import {
  buildRailwayDeliveryPlan,
  buildRailwayToolInstructions,
  getRailwayDeliveryGate,
  getRailwayRequiredVariables,
  type RailwayDeliveryRecord,
  type RailwayDeliveryStatus,
  type RailwayHealthState,
  type RailwayLogRecord,
  type RailwayVariableRecord,
} from "./railway-delivery";

type DeliveryRow = {
  id: string;
  qa_run_id: string;
  execution_id: string;
  project_id: string;
  repository: string;
  branch: string;
  status: RailwayDeliveryStatus;
  railway_project_id: string | null;
  environment_id: string | null;
  service_id: string | null;
  deployment_id: string | null;
  domain: string | null;
  health_state: RailwayHealthState;
  health_text: string;
  health_checked_at: Date | string | null;
  last_error: string;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
};

type VariableRow = {
  id: string;
  delivery_id: string;
  name: string;
  scope: RailwayVariableRecord["scope"];
  status: RailwayVariableRecord["status"];
  created_at: Date | string;
  updated_at: Date | string;
};

type LogRow = {
  id: string;
  delivery_id: string;
  stream: RailwayLogRecord["stream"];
  severity: string;
  message: string;
  external_timestamp: Date | string | null;
  created_at: Date | string;
};

let initialized = false;

export async function ensureRailwayDeliverySchema() {
  if (initialized) return;
  await ensureQASchema();
  const sql = getDatabase();

  await sql`
    CREATE TABLE IF NOT EXISTS railway_deliveries (
      id UUID PRIMARY KEY,
      qa_run_id UUID NOT NULL UNIQUE REFERENCES qa_runs(id) ON DELETE CASCADE,
      execution_id UUID NOT NULL REFERENCES github_executions(id) ON DELETE CASCADE,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      repository VARCHAR(240) NOT NULL,
      branch VARCHAR(120) NOT NULL,
      status VARCHAR(40) NOT NULL,
      railway_project_id VARCHAR(200),
      environment_id VARCHAR(200),
      service_id VARCHAR(200),
      deployment_id VARCHAR(200),
      domain TEXT,
      health_state VARCHAR(40) NOT NULL DEFAULT 'unknown',
      health_text TEXT NOT NULL DEFAULT '',
      health_checked_at TIMESTAMPTZ,
      last_error TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS railway_delivery_variables (
      id UUID PRIMARY KEY,
      delivery_id UUID NOT NULL REFERENCES railway_deliveries(id) ON DELETE CASCADE,
      name VARCHAR(128) NOT NULL,
      scope VARCHAR(30) NOT NULL,
      status VARCHAR(30) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(delivery_id, name, scope)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS railway_delivery_logs (
      id UUID PRIMARY KEY,
      delivery_id UUID NOT NULL REFERENCES railway_deliveries(id) ON DELETE CASCADE,
      stream VARCHAR(30) NOT NULL,
      severity VARCHAR(40) NOT NULL,
      message TEXT NOT NULL,
      external_timestamp TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS railway_deliveries_project_idx
    ON railway_deliveries (project_id, updated_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS railway_delivery_logs_idx
    ON railway_delivery_logs (delivery_id, created_at DESC)
  `;

  initialized = true;
}

function normalizeDelivery(row: DeliveryRow): RailwayDeliveryRecord {
  return {
    id: row.id,
    qaRunId: row.qa_run_id,
    executionId: row.execution_id,
    projectId: row.project_id,
    repository: row.repository,
    branch: row.branch,
    status: row.status,
    railwayProjectId: row.railway_project_id,
    environmentId: row.environment_id,
    serviceId: row.service_id,
    deploymentId: row.deployment_id,
    domain: row.domain,
    healthState: row.health_state,
    healthText: row.health_text,
    healthCheckedAt: row.health_checked_at ? new Date(row.health_checked_at).toISOString() : null,
    lastError: row.last_error,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

function normalizeVariable(row: VariableRow): RailwayVariableRecord {
  return {
    id: row.id,
    deliveryId: row.delivery_id,
    name: row.name,
    scope: row.scope,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function normalizeLog(row: LogRow): RailwayLogRecord {
  return {
    id: row.id,
    deliveryId: row.delivery_id,
    stream: row.stream,
    severity: row.severity,
    message: row.message,
    externalTimestamp: row.external_timestamp
      ? new Date(row.external_timestamp).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createRailwayDelivery(
  qaRunId: string,
  repository: string,
  branch: string,
): Promise<RailwayDeliveryRecord> {
  await ensureRailwayDeliverySchema();

  const existing = await getRailwayDeliveryByQaRun(qaRunId);
  if (existing) return existing;

  const qaBundle = await getQARunBundle(qaRunId);
  if (!qaBundle) throw new Error("QA run not found.");
  if (!qaBundle.gate.ready || qaBundle.run.status !== "passed") {
    throw new Error("QA gate must be ready before Railway delivery.");
  }

  const id = randomUUID();
  const sql = getDatabase();
  const rows = await sql`
    INSERT INTO railway_deliveries (
      id, qa_run_id, execution_id, project_id, repository, branch, status
    )
    VALUES (
      ${id}::uuid,
      ${qaRunId}::uuid,
      ${qaBundle.execution.id}::uuid,
      ${qaBundle.run.projectId}::uuid,
      ${repository},
      ${branch},
      'planned'
    )
    RETURNING *
  `;

  return normalizeDelivery(rows[0] as unknown as DeliveryRow);
}

export async function getRailwayDelivery(id: string): Promise<RailwayDeliveryRecord | null> {
  await ensureRailwayDeliverySchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM railway_deliveries
    WHERE id = ${id}::uuid
    LIMIT 1
  `;

  return rows.length ? normalizeDelivery(rows[0] as unknown as DeliveryRow) : null;
}

export async function getRailwayDeliveryByQaRun(
  qaRunId: string,
): Promise<RailwayDeliveryRecord | null> {
  await ensureRailwayDeliverySchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM railway_deliveries
    WHERE qa_run_id = ${qaRunId}::uuid
    LIMIT 1
  `;

  return rows.length ? normalizeDelivery(rows[0] as unknown as DeliveryRow) : null;
}

export async function listRailwayVariables(deliveryId: string): Promise<RailwayVariableRecord[]> {
  await ensureRailwayDeliverySchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM railway_delivery_variables
    WHERE delivery_id = ${deliveryId}::uuid
    ORDER BY name ASC
  `;

  return rows.map((row) => normalizeVariable(row as unknown as VariableRow));
}

export async function listRailwayLogs(deliveryId: string): Promise<RailwayLogRecord[]> {
  await ensureRailwayDeliverySchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM railway_delivery_logs
    WHERE delivery_id = ${deliveryId}::uuid
    ORDER BY created_at DESC
    LIMIT 200
  `;

  return rows.map((row) => normalizeLog(row as unknown as LogRow));
}

export async function syncRailwayDelivery(
  id: string,
  patch: Partial<
    Pick<
      RailwayDeliveryRecord,
      | "status"
      | "railwayProjectId"
      | "environmentId"
      | "serviceId"
      | "deploymentId"
      | "domain"
      | "healthState"
      | "healthText"
      | "healthCheckedAt"
      | "lastError"
    >
  >,
) {
  await ensureRailwayDeliverySchema();
  const current = await getRailwayDelivery(id);
  if (!current) throw new Error("Railway delivery not found.");

  const status = patch.status ?? current.status;
  const healthState = patch.healthState ?? current.healthState;
  const isComplete = status === "healthy" && healthState === "healthy";
  const completedAt = isComplete
    ? current.completedAt ?? new Date().toISOString()
    : current.completedAt;

  const sql = getDatabase();
  const rows = await sql`
    UPDATE railway_deliveries
    SET
      status = ${status},
      railway_project_id = ${patch.railwayProjectId === undefined ? current.railwayProjectId : patch.railwayProjectId},
      environment_id = ${patch.environmentId === undefined ? current.environmentId : patch.environmentId},
      service_id = ${patch.serviceId === undefined ? current.serviceId : patch.serviceId},
      deployment_id = ${patch.deploymentId === undefined ? current.deploymentId : patch.deploymentId},
      domain = ${patch.domain === undefined ? current.domain : patch.domain},
      health_state = ${healthState},
      health_text = ${patch.healthText ?? current.healthText},
      health_checked_at = ${patch.healthCheckedAt === undefined ? current.healthCheckedAt : patch.healthCheckedAt}::timestamptz,
      last_error = ${patch.lastError ?? current.lastError},
      completed_at = ${completedAt}::timestamptz,
      updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING *
  `;

  if (isComplete) {
    await sql`
      UPDATE projects
      SET status = 'deployed', updated_at = NOW()
      WHERE id = ${current.projectId}::uuid
    `;
  }

  return normalizeDelivery(rows[0] as unknown as DeliveryRow);
}

export async function upsertRailwayVariable(
  deliveryId: string,
  input: Pick<RailwayVariableRecord, "name" | "scope" | "status">,
) {
  await ensureRailwayDeliverySchema();
  const sql = getDatabase();
  const id = randomUUID();

  const rows = await sql`
    INSERT INTO railway_delivery_variables (
      id, delivery_id, name, scope, status
    )
    VALUES (
      ${id}::uuid,
      ${deliveryId}::uuid,
      ${input.name},
      ${input.scope},
      ${input.status}
    )
    ON CONFLICT (delivery_id, name, scope)
    DO UPDATE SET
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *
  `;

  return normalizeVariable(rows[0] as unknown as VariableRow);
}

export async function appendRailwayLog(
  deliveryId: string,
  input: Omit<RailwayLogRecord, "id" | "deliveryId" | "createdAt">,
) {
  await ensureRailwayDeliverySchema();
  const sql = getDatabase();
  const id = randomUUID();

  const rows = await sql`
    INSERT INTO railway_delivery_logs (
      id, delivery_id, stream, severity, message, external_timestamp
    )
    VALUES (
      ${id}::uuid,
      ${deliveryId}::uuid,
      ${input.stream},
      ${input.severity},
      ${input.message},
      ${input.externalTimestamp}::timestamptz
    )
    RETURNING *
  `;

  return normalizeLog(rows[0] as unknown as LogRow);
}

export async function getRailwayDeliveryBundle(id: string) {
  const delivery = await getRailwayDelivery(id);
  if (!delivery) return null;

  const qaBundle = await getQARunBundle(delivery.qaRunId);
  if (!qaBundle) return null;

  const [variables, logs, project] = await Promise.all([
    listRailwayVariables(id),
    listRailwayLogs(id),
    getProject(delivery.projectId),
  ]);

  if (!project) return null;

  const requiredVariables = getRailwayRequiredVariables(project);

  return {
    delivery,
    qaRun: qaBundle.run,
    execution: qaBundle.execution,
    project,
    variables,
    logs,
    gate: getRailwayDeliveryGate(delivery, variables, requiredVariables),
    plan: buildRailwayDeliveryPlan(delivery, qaBundle.run, qaBundle.execution, project),
    railway: buildRailwayToolInstructions(delivery, qaBundle.run, qaBundle.execution, project),
  };
}
