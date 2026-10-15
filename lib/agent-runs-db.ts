import { randomUUID } from "node:crypto";
import { getDatabase } from "./database";
import { ensureProjectSchema, getProject } from "./db";
import {
  buildFinalReport,
  buildStagePlan,
  getNextAgentTasks,
  getNextStage,
  getParticipants,
  type AgentOutputInput,
  type AgentOutputRecord,
  type AgentRunRecord,
  type AgentRunStatus,
  type AgentStagePlan,
  type FinalReport,
  type RunStage,
} from "./orchestration";

type AgentRunRow = {
  id: string;
  project_id: string;
  status: AgentRunStatus;
  current_stage: RunStage;
  participants: AgentRunRecord["participants"];
  stage_plan: AgentStagePlan;
  final_report: FinalReport | null;
  created_at: Date | string;
  updated_at: Date | string;
  completed_at: Date | string | null;
};

type AgentOutputRow = {
  id: string;
  run_id: string;
  agent_key: AgentOutputRecord["agent"];
  stage: AgentOutputRecord["stage"];
  payload: AgentOutputInput;
  created_at: Date | string;
};

let initialized = false;

export async function ensureAgentRunSchema() {
  if (initialized) return;

  await ensureProjectSchema();
  const sql = getDatabase();

  await sql`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id UUID PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      status VARCHAR(30) NOT NULL,
      current_stage VARCHAR(30) NOT NULL,
      participants JSONB NOT NULL,
      stage_plan JSONB NOT NULL,
      final_report JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS agent_outputs (
      id UUID PRIMARY KEY,
      run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
      agent_key VARCHAR(40) NOT NULL,
      stage VARCHAR(30) NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(run_id, agent_key, stage)
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS agent_runs_project_idx
    ON agent_runs (project_id, updated_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS agent_outputs_run_idx
    ON agent_outputs (run_id, created_at ASC)
  `;

  initialized = true;
}

function normalizeRun(row: AgentRunRow): AgentRunRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    currentStage: row.current_stage,
    participants: row.participants,
    stagePlan: row.stage_plan,
    finalReport: row.final_report,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

function normalizeOutput(row: AgentOutputRow): AgentOutputRecord {
  return {
    id: row.id,
    runId: row.run_id,
    ...row.payload,
    agent: row.agent_key,
    stage: row.stage,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createAgentRun(projectId: string): Promise<AgentRunRecord | null> {
  await ensureAgentRunSchema();
  const project = await getProject(projectId);
  if (!project) return null;

  const sql = getDatabase();
  const stagePlan = buildStagePlan(project);
  const participants = getParticipants(stagePlan);
  const now = new Date().toISOString();
  const id = randomUUID();

  const rows = await sql`
    INSERT INTO agent_runs (
      id, project_id, status, current_stage, participants, stage_plan,
      final_report, created_at, updated_at
    )
    VALUES (
      ${id}::uuid,
      ${projectId}::uuid,
      'active',
      'analysis',
      ${JSON.stringify(participants)}::jsonb,
      ${JSON.stringify(stagePlan)}::jsonb,
      NULL,
      ${now}::timestamptz,
      ${now}::timestamptz
    )
    RETURNING *
  `;

  return normalizeRun(rows[0] as unknown as AgentRunRow);
}

export async function listProjectRuns(projectId: string): Promise<AgentRunRecord[]> {
  await ensureAgentRunSchema();
  const sql = getDatabase();

  const rows = await sql`
    SELECT *
    FROM agent_runs
    WHERE project_id = ${projectId}::uuid
    ORDER BY updated_at DESC
    LIMIT 50
  `;

  return rows.map((row) => normalizeRun(row as unknown as AgentRunRow));
}

export async function getAgentRun(runId: string): Promise<AgentRunRecord | null> {
  await ensureAgentRunSchema();
  const sql = getDatabase();

  const rows = await sql`
    SELECT *
    FROM agent_runs
    WHERE id = ${runId}::uuid
    LIMIT 1
  `;

  return rows.length ? normalizeRun(rows[0] as unknown as AgentRunRow) : null;
}

export async function listAgentOutputs(runId: string): Promise<AgentOutputRecord[]> {
  await ensureAgentRunSchema();
  const sql = getDatabase();

  const rows = await sql`
    SELECT *
    FROM agent_outputs
    WHERE run_id = ${runId}::uuid
    ORDER BY created_at ASC
  `;

  return rows.map((row) => normalizeOutput(row as unknown as AgentOutputRow));
}

export async function getAgentRunBundle(runId: string) {
  const run = await getAgentRun(runId);
  if (!run) return null;

  const [project, outputs] = await Promise.all([
    getProject(run.projectId),
    listAgentOutputs(run.id),
  ]);

  if (!project) return null;

  return {
    run,
    project,
    outputs,
    next: getNextAgentTasks(project, run, outputs),
  };
}

export async function submitAgentOutput(runId: string, input: AgentOutputInput) {
  await ensureAgentRunSchema();
  const run = await getAgentRun(runId);
  if (!run) throw new Error("Agent run not found.");
  if (run.status !== "active") throw new Error("Agent run is not active.");
  if (input.stage !== run.currentStage) {
    throw new Error(`Expected stage ${run.currentStage}, received ${input.stage}.`);
  }

  const expectedAgents = run.stagePlan[run.currentStage];
  if (!expectedAgents.includes(input.agent)) {
    throw new Error(`Agent ${input.agent} is not assigned to stage ${run.currentStage}.`);
  }

  const sql = getDatabase();
  const outputId = randomUUID();

  await sql`
    INSERT INTO agent_outputs (id, run_id, agent_key, stage, payload)
    VALUES (
      ${outputId}::uuid,
      ${runId}::uuid,
      ${input.agent},
      ${input.stage},
      ${JSON.stringify(input)}::jsonb
    )
    ON CONFLICT (run_id, agent_key, stage)
    DO UPDATE SET
      payload = EXCLUDED.payload,
      created_at = NOW()
  `;

  const outputs = await listAgentOutputs(runId);
  const completedAgents = new Set(
    outputs
      .filter((output) => output.stage === run.currentStage)
      .map((output) => output.agent),
  );

  const stageComplete = expectedAgents.every((agent) => completedAgents.has(agent));

  if (stageComplete) {
    const nextStage = getNextStage(run.currentStage);

    if (nextStage) {
      await sql`
        UPDATE agent_runs
        SET current_stage = ${nextStage}, updated_at = NOW()
        WHERE id = ${runId}::uuid
      `;
    } else {
      const finalReport = buildFinalReport(outputs);

      await sql`
        UPDATE agent_runs
        SET
          status = 'completed',
          final_report = ${JSON.stringify(finalReport)}::jsonb,
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${runId}::uuid
      `;

      await sql`
        UPDATE projects
        SET
          status = CASE WHEN status = 'intake' THEN 'planned' ELSE status END,
          updated_at = NOW()
        WHERE id = ${run.projectId}::uuid
      `;
    }
  } else {
    await sql`
      UPDATE agent_runs
      SET updated_at = NOW()
      WHERE id = ${runId}::uuid
    `;
  }

  return getAgentRunBundle(runId);
}
