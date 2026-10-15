CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  client_name VARCHAR(120) NOT NULL DEFAULT '',
  type VARCHAR(40) NOT NULL,
  brief TEXT NOT NULL,
  budget VARCHAR(120) NOT NULL DEFAULT '',
  deadline VARCHAR(60) NOT NULL DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'intake',
  requirements JSONB NOT NULL,
  task_graph JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_updated_at_idx
ON projects (updated_at DESC);
