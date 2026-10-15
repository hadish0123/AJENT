CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  actor VARCHAR(160) NOT NULL,
  role VARCHAR(40) NOT NULL,
  action VARCHAR(160) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  resource_id VARCHAR(240) NOT NULL DEFAULT '',
  request_id VARCHAR(120) NOT NULL,
  outcome VARCHAR(20) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_events_created_idx
ON audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_events_resource_idx
ON audit_events (resource_type, resource_id, created_at DESC);
