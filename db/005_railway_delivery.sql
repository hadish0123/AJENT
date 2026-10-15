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
);

CREATE TABLE IF NOT EXISTS railway_delivery_variables (
  id UUID PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES railway_deliveries(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  scope VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(delivery_id, name, scope)
);

CREATE TABLE IF NOT EXISTS railway_delivery_logs (
  id UUID PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES railway_deliveries(id) ON DELETE CASCADE,
  stream VARCHAR(30) NOT NULL,
  severity VARCHAR(40) NOT NULL,
  message TEXT NOT NULL,
  external_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS railway_deliveries_project_idx
ON railway_deliveries (project_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS railway_delivery_logs_idx
ON railway_delivery_logs (delivery_id, created_at DESC);
