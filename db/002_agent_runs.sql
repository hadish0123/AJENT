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
);

CREATE TABLE IF NOT EXISTS agent_outputs (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  agent_key VARCHAR(40) NOT NULL,
  stage VARCHAR(30) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(run_id, agent_key, stage)
);

CREATE INDEX IF NOT EXISTS agent_runs_project_idx
ON agent_runs (project_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS agent_outputs_run_idx
ON agent_outputs (run_id, created_at ASC);
