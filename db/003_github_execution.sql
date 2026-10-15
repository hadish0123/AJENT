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
);

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
);

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
);
