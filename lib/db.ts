import { getDatabase } from "./database";
import type { ProjectRecord } from "./projects";
import { parseJsonColumn } from "./json-column";

type ProjectRow = {
  id: string;
  name: string;
  client_name: string;
  type: ProjectRecord["type"];
  brief: string;
  budget: string;
  deadline: string;
  status: ProjectRecord["status"];
  requirements: ProjectRecord["requirements"];
  task_graph: ProjectRecord["taskGraph"];
  created_at: Date | string;
  updated_at: Date | string;
};

let initialized = false;

export async function ensureProjectSchema() {
  if (initialized) return;
  const sql = getDatabase();

  await sql`
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
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS projects_updated_at_idx
    ON projects (updated_at DESC)
  `;

  initialized = true;
}

function normalize(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    clientName: row.client_name,
    type: row.type,
    brief: row.brief,
    budget: row.budget,
    deadline: row.deadline,
    status: row.status,
    requirements: parseJsonColumn<ProjectRecord["requirements"]>(row.requirements),
    taskGraph: parseJsonColumn<ProjectRecord["taskGraph"]>(row.task_graph),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listProjects(): Promise<ProjectRecord[]> {
  await ensureProjectSchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT *
    FROM projects
    ORDER BY updated_at DESC
    LIMIT 100
  `;

  return rows.map((row) => normalize(row as unknown as ProjectRow));
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  await ensureProjectSchema();
  const sql = getDatabase();
  const rows = await sql`
    SELECT *
    FROM projects
    WHERE id = ${id}::uuid
    LIMIT 1
  `;

  return rows.length ? normalize(rows[0] as unknown as ProjectRow) : null;
}

export async function insertProject(project: ProjectRecord): Promise<ProjectRecord> {
  await ensureProjectSchema();
  const sql = getDatabase();

  const rows = await sql`
    INSERT INTO projects (
      id, name, client_name, type, brief, budget, deadline, status,
      requirements, task_graph, created_at, updated_at
    )
    VALUES (
      ${project.id}::uuid,
      ${project.name},
      ${project.clientName},
      ${project.type},
      ${project.brief},
      ${project.budget},
      ${project.deadline},
      ${project.status},
      ${JSON.stringify(project.requirements)}::jsonb,
      ${JSON.stringify(project.taskGraph)}::jsonb,
      ${project.createdAt}::timestamptz,
      ${project.updatedAt}::timestamptz
    )
    RETURNING *
  `;

  return normalize(rows[0] as unknown as ProjectRow);
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<ProjectRecord, "name" | "brief" | "status">>,
): Promise<ProjectRecord | null> {
  await ensureProjectSchema();
  const sql = getDatabase();

  const current = await getProject(id);
  if (!current) return null;

  const name = patch.name ?? current.name;
  const brief = patch.brief ?? current.brief;
  const status = patch.status ?? current.status;

  const rows = await sql`
    UPDATE projects
    SET
      name = ${name},
      brief = ${brief},
      status = ${status},
      updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING *
  `;

  return rows.length ? normalize(rows[0] as unknown as ProjectRow) : null;
}
