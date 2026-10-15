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
);

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
);

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
);

CREATE INDEX IF NOT EXISTS qa_runs_execution_idx
ON qa_runs (execution_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS qa_bugs_run_idx
ON qa_bugs (qa_run_id, status, severity);
