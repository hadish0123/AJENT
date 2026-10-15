import { randomUUID } from "node:crypto";
import { getDatabase } from "./database";
import { parseJsonColumn } from "./json-column";

export type AuditOutcome = "success" | "failure";

export type AuditEvent = {
  id: string;
  actor: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
  outcome: AuditOutcome;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type AuditRow = {
  id: string;
  actor: string;
  role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  request_id: string;
  outcome: AuditOutcome;
  metadata: Record<string, unknown>;
  created_at: Date | string;
};

let initialized = false;

export async function ensureAuditSchema() {
  if (initialized) return;
  const sql = getDatabase();

  await sql`
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
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS audit_events_created_idx
    ON audit_events (created_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS audit_events_resource_idx
    ON audit_events (resource_type, resource_id, created_at DESC)
  `;

  initialized = true;
}

function normalize(row: AuditRow): AuditEvent {
  return {
    id: row.id,
    actor: row.actor,
    role: row.role,
    action: row.action,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    requestId: row.request_id,
    outcome: row.outcome,
    metadata: parseJsonColumn<Record<string, unknown>>(row.metadata),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function sanitizeMetadata(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 4) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.length > 1000 ? `${value.slice(0, 997)}...` : value;
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.slice(0, 30).map((item) => sanitizeMetadata(item, depth + 1));
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 40)) {
      if (/(password|secret|token|authorization|cookie|api[_-]?key)/i.test(key)) {
        output[key] = "[redacted]";
      } else {
        output[key] = sanitizeMetadata(item, depth + 1);
      }
    }
    return output;
  }

  return String(value);
}

export async function recordAuditEvent(input: {
  actor: string;
  role: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  requestId: string;
  outcome?: AuditOutcome;
  metadata?: Record<string, unknown>;
}) {
  await ensureAuditSchema();
  const sql = getDatabase();
  const id = randomUUID();
  const metadata = sanitizeMetadata(input.metadata ?? {}) as Record<string, unknown>;

  const rows = await sql`
    INSERT INTO audit_events (
      id, actor, role, action, resource_type, resource_id, request_id, outcome, metadata
    )
    VALUES (
      ${id}::uuid,
      ${input.actor},
      ${input.role},
      ${input.action},
      ${input.resourceType},
      ${input.resourceId ?? ""},
      ${input.requestId},
      ${input.outcome ?? "success"},
      ${JSON.stringify(metadata)}::jsonb
    )
    RETURNING *
  `;

  return normalize(rows[0] as unknown as AuditRow);
}

export async function listAuditEvents(limit = 100) {
  await ensureAuditSchema();
  const sql = getDatabase();
  const safeLimit = Math.max(1, Math.min(limit, 500));

  const rows = await sql`
    SELECT *
    FROM audit_events
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;

  return rows.map((row) => normalize(row as unknown as AuditRow));
}
