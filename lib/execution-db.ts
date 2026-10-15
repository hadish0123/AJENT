import { randomUUID } from "node:crypto";
import { getDatabase } from "./database";
import { getAgentRun } from "./agent-runs-db";
import { ensureAgentRunSchema } from "./agent-runs-db";
import { getProject } from "./db";
import { parseJsonColumn } from "./json-column";
import {
  buildExecutionPlan,
  buildGitHubToolInstructions,
  buildWorkingBranch,
  getMergeGate,
  type ExecutionChange,
  type ExecutionCheck,
  type ExecutionPlan,
  type ExecutionStatus,
  type GitHubExecutionRecord,
} from "./execution";
import type { AgentOutputRecord } from "./orchestration";

type ExecutionRow = {
  id: string;
  run_id: string;
  project_id: string;
  repository: string;
  base_branch: string;
  working_branch: string;
  status: ExecutionStatus;
  plan: ExecutionPlan;
  head_sha: string | null;
  pr_number: number | null;
  pr_url: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
};

type ChangeRow = {
  id: string;
  execution_id: string;
  path: string;
  operation: ExecutionChange["operation"];
  summary: string;
  status: ExecutionChange["status"];
  blob_sha: string | null;
  commit_sha: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type CheckRow = {
  id: string;
  execution_id: string;
  name: string;
  status: ExecutionCheck["status"];
  details: string;
  url: string;
  created_at: Date | string;
  updated_at: Date | string;
};

let initialized = false;

export async function ensureExecutionSchema() {
  if (initialized) return;
  await ensureAgentRunSchema();
  const sql = getDatabase();

  await sql`
    CREATE TABLE IF NOT EXISTS github_executions (
      id UUID PRIMARY KEY,
      run_id UUID NOT NULL UNIQUE REFERENCES agent_runs(id) ON DELETE CASCADE,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      repository VARCHAR(240) NOT NULL,
      base_branch VARCHAR(120) NOT NULL,
      working_branch VARCHAR(200) NOT NULL,
      status VARCHAR(40) NOT NULL,
      plan JSONB NOT NULL,
      head_sha VARCHAR(40),
      pr_number INTEGER,
      pr_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS github_execution_changes (
      id UUID PRIMARY KEY,
      execution_id UUID NOT NULL REFERENCES github_executions(id) ON DELETE CASCADE,
      path TEXT NOT NULL,
      operation VARCHAR(20) NOT NULL,
      summary TEXT NOT NULL,
      status VARCHAR(20) NOT NULL,
      blob_sha VARCHAR(40),
      commit_sha VARCHAR(40),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(execution_id, path)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS github_execution_checks (
      id UUID PRIMARY KEY,
      execution_id UUID NOT NULL REFERENCES github_executions(id) ON DELETE CASCADE,
      name VARCHAR(120) NOT NULL,
      status VARCHAR(20) NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(execution_id, name)
    )
  `;

  initialized = true;
}

function normalizeExecution(row: ExecutionRow): GitHubExecutionRecord {
  return {
    id: row.id,
    runId: row.run_id,
    projectId: row.project_id,
    repository: row.repository,
    baseBranch: row.base_branch,
    workingBranch: row.working_branch,
    status: row.status,
    plan: parseJsonColumn<ExecutionPlan>(row.plan),
    headSha: row.head_sha,
    prNumber: row.pr_number,
    prUrl: row.pr_url,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

function normalizeChange(row: ChangeRow): ExecutionChange {
  return {
    id: row.id,
    executionId: row.execution_id,
    path: row.path,
    operation: row.operation,
    summary: row.summary,
    status: row.status,
    blobSha: row.blob_sha,
    commitSha: row.commit_sha,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function normalizeCheck(row: CheckRow): ExecutionCheck {
  return {
    id: row.id,
    executionId: row.execution_id,
    name: row.name,
    status: row.status,
    details: row.details,
    url: row.url,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function createGitHubExecution(
  runId: string,
  repository: string,
  baseBranch: string,
): Promise<GitHubExecutionRecord> {
  await ensureExecutionSchema();

  const existing = await getExecutionByRun(runId);
  if (existing) return existing;

  const run = await getAgentRun(runId);
  if (!run) throw new Error("Agent run not found.");
  if (run.status !== "completed" || !run.finalReport) {
    throw new Error("Agent council must be completed before GitHub execution.");
  }

  const project = await getProject(run.projectId);
  if (!project) throw new Error("Project not found.");

  const id = randomUUID();
  const plan = buildExecutionPlan(project, run, run.finalReport);
  const workingBranch = buildWorkingBranch(project, id);
  const sql = getDatabase();

  const rows = await sql`
    INSERT INTO github_executions (
      id, run_id, project_id, repository, base_branch, working_branch, status, plan
    )
    VALUES (
      ${id}::uuid,
      ${runId}::uuid,
      ${run.projectId}::uuid,
      ${repository},
      ${baseBranch},
      ${workingBranch},
      'planned',
      ${JSON.stringify(plan)}::jsonb
    )
    RETURNING *
  `;

  await sql`
    UPDATE projects
    SET status = 'building', updated_at = NOW()
    WHERE id = ${run.projectId}::uuid
  `;

  return normalizeExecution(rows[0] as unknown as ExecutionRow);
}

export async function getExecution(id: string): Promise<GitHubExecutionRecord | null> {
  await ensureExecutionSchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM github_executions
    WHERE id = ${id}::uuid
    LIMIT 1
  `;

  return rows.length ? normalizeExecution(rows[0] as unknown as ExecutionRow) : null;
}

export async function getExecutionByRun(runId: string): Promise<GitHubExecutionRecord | null> {
  await ensureExecutionSchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM github_executions
    WHERE run_id = ${runId}::uuid
    LIMIT 1
  `;

  return rows.length ? normalizeExecution(rows[0] as unknown as ExecutionRow) : null;
}

export async function listExecutionChanges(executionId: string): Promise<ExecutionChange[]> {
  await ensureExecutionSchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM github_execution_changes
    WHERE execution_id = ${executionId}::uuid
    ORDER BY created_at ASC
  `;

  return rows.map((row) => normalizeChange(row as unknown as ChangeRow));
}

export async function listExecutionChecks(executionId: string): Promise<ExecutionCheck[]> {
  await ensureExecutionSchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT * FROM github_execution_checks
    WHERE execution_id = ${executionId}::uuid
    ORDER BY created_at ASC
  `;

  return rows.map((row) => normalizeCheck(row as unknown as CheckRow));
}

export async function getExecutionBundle(id: string) {
  const execution = await getExecution(id);
  if (!execution) return null;

  const [project, run, changes, checks] = await Promise.all([
    getProject(execution.projectId),
    getAgentRun(execution.runId),
    listExecutionChanges(id),
    listExecutionChecks(id),
  ]);

  if (!project || !run) return null;

  return {
    execution,
    project,
    run,
    changes,
    checks,
    mergeGate: getMergeGate(execution, changes, checks),
    github: buildGitHubToolInstructions(execution, changes, checks),
  };
}

export async function syncExecution(
  id: string,
  patch: Partial<Pick<GitHubExecutionRecord, "status" | "workingBranch" | "headSha" | "prNumber" | "prUrl">>,
) {
  await ensureExecutionSchema();
  const current = await getExecution(id);
  if (!current) throw new Error("Execution not found.");

  const sql = getDatabase();
  const status = patch.status ?? current.status;
  const completedAt = status === "completed" ? new Date().toISOString() : current.completedAt;

  const rows = await sql`
    UPDATE github_executions
    SET
      status = ${status},
      working_branch = ${patch.workingBranch ?? current.workingBranch},
      head_sha = ${patch.headSha === undefined ? current.headSha : patch.headSha},
      pr_number = ${patch.prNumber === undefined ? current.prNumber : patch.prNumber},
      pr_url = ${patch.prUrl === undefined ? current.prUrl : patch.prUrl},
      completed_at = ${completedAt}::timestamptz,
      updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING *
  `;

  if (status === "completed") {
    await sql`
      UPDATE projects
      SET status = 'ready', updated_at = NOW()
      WHERE id = ${current.projectId}::uuid
    `;
  }

  return normalizeExecution(rows[0] as unknown as ExecutionRow);
}

export async function upsertExecutionChange(
  executionId: string,
  input: Omit<ExecutionChange, "id" | "executionId" | "createdAt" | "updatedAt">,
) {
  await ensureExecutionSchema();
  const sql = getDatabase();
  const id = randomUUID();

  const rows = await sql`
    INSERT INTO github_execution_changes (
      id, execution_id, path, operation, summary, status, blob_sha, commit_sha
    )
    VALUES (
      ${id}::uuid,
      ${executionId}::uuid,
      ${input.path},
      ${input.operation},
      ${input.summary},
      ${input.status},
      ${input.blobSha},
      ${input.commitSha}
    )
    ON CONFLICT (execution_id, path)
    DO UPDATE SET
      operation = EXCLUDED.operation,
      summary = EXCLUDED.summary,
      status = EXCLUDED.status,
      blob_sha = EXCLUDED.blob_sha,
      commit_sha = EXCLUDED.commit_sha,
      updated_at = NOW()
    RETURNING *
  `;

  await sql`
    UPDATE github_executions
    SET status = CASE WHEN status = 'planned' THEN 'coding' ELSE status END, updated_at = NOW()
    WHERE id = ${executionId}::uuid
  `;

  return normalizeChange(rows[0] as unknown as ChangeRow);
}

export async function upsertExecutionCheck(
  executionId: string,
  input: Omit<ExecutionCheck, "id" | "executionId" | "createdAt" | "updatedAt">,
) {
  await ensureExecutionSchema();
  const sql = getDatabase();
  const id = randomUUID();

  const rows = await sql`
    INSERT INTO github_execution_checks (
      id, execution_id, name, status, details, url
    )
    VALUES (
      ${id}::uuid,
      ${executionId}::uuid,
      ${input.name},
      ${input.status},
      ${input.details},
      ${input.url}
    )
    ON CONFLICT (execution_id, name)
    DO UPDATE SET
      status = EXCLUDED.status,
      details = EXCLUDED.details,
      url = EXCLUDED.url,
      updated_at = NOW()
    RETURNING *
  `;

  return normalizeCheck(rows[0] as unknown as CheckRow);
}

export async function getExecutionContextForTools(id: string): Promise<{
  repository: string;
  baseBranch: string;
  workingBranch: string;
  plan: ExecutionPlan;
  finalReport: AgentOutputRecord | null;
} | null> {
  const bundle = await getExecutionBundle(id);
  if (!bundle) return null;

  return {
    repository: bundle.execution.repository,
    baseBranch: bundle.execution.baseBranch,
    workingBranch: bundle.execution.workingBranch,
    plan: bundle.execution.plan,
    finalReport: null,
  };
}
