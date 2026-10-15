import { randomUUID } from "node:crypto";
import { getDatabase } from "./database";
import { ensureExecutionSchema, getExecution } from "./execution-db";
import { parseJsonColumn } from "./json-column";
import {
  buildBrowserValidationProtocol,
  getQAGate,
  type BugRecord,
  type BugStatus,
  type QACheckRecord,
  type QARunRecord,
  type QARunStatus,
} from "./qa";

type QARunRow = {
  id: string;
  execution_id: string;
  project_id: string;
  source: QARunRecord["source"];
  target_url: string;
  status: QARunStatus;
  required_checks: string[];
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
};

type QACheckRow = {
  id: string;
  qa_run_id: string;
  type: QACheckRecord["type"];
  name: string;
  status: QACheckRecord["status"];
  details: string;
  evidence_url: string;
  duration_ms: number | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type BugRow = {
  id: string;
  qa_run_id: string;
  severity: BugRecord["severity"];
  status: BugStatus;
  title: string;
  description: string;
  reproduction: string[];
  expected: string;
  actual: string;
  path: string;
  assigned_agent: string;
  fixed_commit_sha: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

let initialized = false;

export async function ensureQASchema() {
  if (initialized) return;
  await ensureExecutionSchema();
  const sql = getDatabase();

  await sql`
    CREATE TABLE IF NOT EXISTS qa_runs (
      id UUID PRIMARY KEY,
      execution_id UUID NOT NULL REFERENCES github_executions(id) ON DELETE CASCADE,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      source VARCHAR(40) NOT NULL,
      target_url TEXT NOT NULL DEFAULT '',
      status VARCHAR(30) NOT NULL,
      required_checks JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS qa_checks (
      id UUID PRIMARY KEY,
      qa_run_id UUID NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
      type VARCHAR(40) NOT NULL,
      name VARCHAR(120) NOT NULL,
      status VARCHAR(30) NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      evidence_url TEXT NOT NULL DEFAULT '',
      duration_ms INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(qa_run_id, name)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS qa_bugs (
      id UUID PRIMARY KEY,
      qa_run_id UUID NOT NULL REFERENCES qa_runs(id) ON DELETE CASCADE,
      severity VARCHAR(20) NOT NULL,
      status VARCHAR(30) NOT NULL,
      title VARCHAR(240) NOT NULL,
      description TEXT NOT NULL,
      reproduction JSONB NOT NULL,
      expected TEXT NOT NULL DEFAULT '',
      actual TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL DEFAULT '',
      assigned_agent VARCHAR(120) NOT NULL DEFAULT 'qa',
      fixed_commit_sha VARCHAR(40),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS qa_runs_execution_idx
    ON qa_runs (execution_id, updated_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS qa_bugs_run_idx
    ON qa_bugs (qa_run_id, status, severity)
  `;

  initialized = true;
}

function normalizeRun(row: QARunRow): QARunRecord {
  return {
    id: row.id,
    executionId: row.execution_id,
    projectId: row.project_id,
    source: row.source,
    targetUrl: row.target_url,
    status: row.status,
    requiredChecks: parseJsonColumn<string[]>(row.required_checks),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

function normalizeCheck(row: QACheckRow): QACheckRecord {
  return {
    id: row.id,
    qaRunId: row.qa_run_id,
    type: row.type,
    name: row.name,
    status: row.status,
    details: row.details,
    evidenceUrl: row.evidence_url,
    durationMs: row.duration_ms,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function normalizeBug(row: BugRow): BugRecord {
  return {
    id: row.id,
    qaRunId: row.qa_run_id,
    severity: row.severity,
    status: row.status,
    title: row.title,
    description: row.description,
    reproduction: parseJsonColumn<string[]>(row.reproduction),
    expected: row.expected,
    actual: row.actual,
    path: row.path,
    assignedAgent: row.assigned_agent,
    fixedCommitSha: row.fixed_commit_sha,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function createQARun(
  executionId: string,
  source: QARunRecord["source"],
  targetUrl: string,
  requiredChecks: string[],
): Promise<QARunRecord> {
  await ensureQASchema();
  const execution = await getExecution(executionId);
  if (!execution) throw new Error("Execution not found.");

  const id = randomUUID();
  const sql = getDatabase();

  const rows = await sql`
    INSERT INTO qa_runs (
      id, execution_id, project_id, source, target_url, status, required_checks
    )
    VALUES (
      ${id}::uuid,
      ${executionId}::uuid,
      ${execution.projectId}::uuid,
      ${source},
      ${targetUrl},
      'running',
      ${JSON.stringify(requiredChecks)}::jsonb
    )
    RETURNING *
  `;

  await sql`
    UPDATE projects
    SET status = 'testing', updated_at = NOW()
    WHERE id = ${execution.projectId}::uuid
  `;

  return normalizeRun(rows[0] as unknown as QARunRow);
}

export async function listExecutionQARuns(executionId: string): Promise<QARunRecord[]> {
  await ensureQASchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM qa_runs
    WHERE execution_id = ${executionId}::uuid
    ORDER BY updated_at DESC
    LIMIT 50
  `;

  return rows.map((row) => normalizeRun(row as unknown as QARunRow));
}

export async function getQARun(id: string): Promise<QARunRecord | null> {
  await ensureQASchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM qa_runs
    WHERE id = ${id}::uuid
    LIMIT 1
  `;

  return rows.length ? normalizeRun(rows[0] as unknown as QARunRow) : null;
}

export async function listQAChecks(qaRunId: string): Promise<QACheckRecord[]> {
  await ensureQASchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM qa_checks
    WHERE qa_run_id = ${qaRunId}::uuid
    ORDER BY created_at ASC
  `;

  return rows.map((row) => normalizeCheck(row as unknown as QACheckRow));
}

export async function listQABugs(qaRunId: string): Promise<BugRecord[]> {
  await ensureQASchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM qa_bugs
    WHERE qa_run_id = ${qaRunId}::uuid
    ORDER BY
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      created_at ASC
  `;

  return rows.map((row) => normalizeBug(row as unknown as BugRow));
}

async function reconcileQARun(qaRunId: string) {
  const run = await getQARun(qaRunId);
  if (!run) return null;

  const [checks, bugs] = await Promise.all([
    listQAChecks(qaRunId),
    listQABugs(qaRunId),
  ]);

  const gate = getQAGate(run, checks, bugs);
  const hasFailure =
    checks.some((check) => check.status === "failed") ||
    bugs.some((bug) => !["verified", "wont_fix"].includes(bug.status));

  const nextStatus: QARunStatus = gate.ready ? "passed" : hasFailure ? "failed" : "running";
  const sql = getDatabase();

  await sql`
    UPDATE qa_runs
    SET
      status = ${nextStatus},
      completed_at = ${gate.ready ? new Date().toISOString() : null}::timestamptz,
      updated_at = NOW()
    WHERE id = ${qaRunId}::uuid
  `;

  if (gate.ready) {
    await sql`
      UPDATE projects
      SET status = 'ready', updated_at = NOW()
      WHERE id = ${run.projectId}::uuid
    `;
  } else if (hasFailure) {
    await sql`
      UPDATE projects
      SET status = 'building', updated_at = NOW()
      WHERE id = ${run.projectId}::uuid
    `;

    await sql`
      UPDATE github_executions
      SET status = 'coding', updated_at = NOW()
      WHERE id = ${run.executionId}::uuid
        AND status <> 'failed'
    `;
  }

  return { gate, status: nextStatus };
}

export async function upsertQACheck(
  qaRunId: string,
  input: Omit<QACheckRecord, "id" | "qaRunId" | "createdAt" | "updatedAt">,
) {
  await ensureQASchema();
  const sql = getDatabase();
  const id = randomUUID();

  const rows = await sql`
    INSERT INTO qa_checks (
      id, qa_run_id, type, name, status, details, evidence_url, duration_ms
    )
    VALUES (
      ${id}::uuid,
      ${qaRunId}::uuid,
      ${input.type},
      ${input.name},
      ${input.status},
      ${input.details},
      ${input.evidenceUrl},
      ${input.durationMs}
    )
    ON CONFLICT (qa_run_id, name)
    DO UPDATE SET
      type = EXCLUDED.type,
      status = EXCLUDED.status,
      details = EXCLUDED.details,
      evidence_url = EXCLUDED.evidence_url,
      duration_ms = EXCLUDED.duration_ms,
      updated_at = NOW()
    RETURNING *
  `;

  await reconcileQARun(qaRunId);
  return normalizeCheck(rows[0] as unknown as QACheckRow);
}

export async function createQABug(
  qaRunId: string,
  input: Omit<BugRecord, "id" | "qaRunId" | "status" | "fixedCommitSha" | "createdAt" | "updatedAt">,
) {
  await ensureQASchema();
  const sql = getDatabase();
  const id = randomUUID();

  const rows = await sql`
    INSERT INTO qa_bugs (
      id, qa_run_id, severity, status, title, description, reproduction,
      expected, actual, path, assigned_agent, fixed_commit_sha
    )
    VALUES (
      ${id}::uuid,
      ${qaRunId}::uuid,
      ${input.severity},
      'open',
      ${input.title},
      ${input.description},
      ${JSON.stringify(input.reproduction)}::jsonb,
      ${input.expected},
      ${input.actual},
      ${input.path},
      ${input.assignedAgent},
      NULL
    )
    RETURNING *
  `;

  await reconcileQARun(qaRunId);
  return normalizeBug(rows[0] as unknown as BugRow);
}

export async function updateQABug(
  bugId: string,
  patch: Partial<Pick<BugRecord, "status" | "assignedAgent" | "fixedCommitSha">>,
) {
  await ensureQASchema();
  const sql = getDatabase();

  const currentRows = await sql`
    SELECT * FROM qa_bugs
    WHERE id = ${bugId}::uuid
    LIMIT 1
  `;

  if (!currentRows.length) return null;
  const current = normalizeBug(currentRows[0] as unknown as BugRow);

  const rows = await sql`
    UPDATE qa_bugs
    SET
      status = ${patch.status ?? current.status},
      assigned_agent = ${patch.assignedAgent ?? current.assignedAgent},
      fixed_commit_sha = ${patch.fixedCommitSha === undefined ? current.fixedCommitSha : patch.fixedCommitSha},
      updated_at = NOW()
    WHERE id = ${bugId}::uuid
    RETURNING *
  `;

  const bug = normalizeBug(rows[0] as unknown as BugRow);
  await reconcileQARun(bug.qaRunId);
  return bug;
}

export async function getQARunBundle(id: string) {
  const run = await getQARun(id);
  if (!run) return null;

  const execution = await getExecution(run.executionId);
  if (!execution) return null;

  const [checks, bugs] = await Promise.all([
    listQAChecks(id),
    listQABugs(id),
  ]);

  return {
    run,
    execution,
    checks,
    bugs,
    gate: getQAGate(run, checks, bugs),
    browser: buildBrowserValidationProtocol(run, execution),
  };
}
