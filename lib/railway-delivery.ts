import { z } from "zod";
import type { GitHubExecutionRecord } from "./execution";
import type { QARunRecord } from "./qa";
import type { ProjectRecord } from "./projects";
import { getSpecialistVariableNames } from "./specialist-workflows";

export const RAILWAY_DELIVERY_STATUSES = [
  "planned",
  "provisioning",
  "configured",
  "deploying",
  "healthy",
  "failed",
  "blocked",
] as const;

export type RailwayDeliveryStatus = (typeof RAILWAY_DELIVERY_STATUSES)[number];

export const RAILWAY_HEALTH_STATES = [
  "unknown",
  "deploying",
  "healthy",
  "unhealthy",
  "offline",
] as const;

export type RailwayHealthState = (typeof RAILWAY_HEALTH_STATES)[number];

export const RAILWAY_VARIABLE_SCOPES = ["environment", "service"] as const;
export type RailwayVariableScope = (typeof RAILWAY_VARIABLE_SCOPES)[number];

export const RAILWAY_VARIABLE_STATUSES = ["planned", "synced", "sealed"] as const;
export type RailwayVariableStatus = (typeof RAILWAY_VARIABLE_STATUSES)[number];

export const RAILWAY_LOG_STREAMS = ["build", "deploy", "http", "system"] as const;
export type RailwayLogStream = (typeof RAILWAY_LOG_STREAMS)[number];

export type RailwayDeliveryRecord = {
  id: string;
  qaRunId: string;
  executionId: string;
  projectId: string;
  repository: string;
  branch: string;
  status: RailwayDeliveryStatus;
  railwayProjectId: string | null;
  environmentId: string | null;
  serviceId: string | null;
  deploymentId: string | null;
  domain: string | null;
  healthState: RailwayHealthState;
  healthText: string;
  healthCheckedAt: string | null;
  lastError: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type RailwayVariableRecord = {
  id: string;
  deliveryId: string;
  name: string;
  scope: RailwayVariableScope;
  status: RailwayVariableStatus;
  createdAt: string;
  updatedAt: string;
};

export type RailwayLogRecord = {
  id: string;
  deliveryId: string;
  stream: RailwayLogStream;
  severity: string;
  message: string;
  externalTimestamp: string | null;
  createdAt: string;
};

export const createRailwayDeliverySchema = z.object({
  repository: z.string().trim().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  branch: z.string().trim().min(1).max(120).default("main"),
});

export const railwayDeliverySyncSchema = z.object({
  status: z.enum(RAILWAY_DELIVERY_STATUSES).optional(),
  railwayProjectId: z.string().trim().max(200).nullable().optional(),
  environmentId: z.string().trim().max(200).nullable().optional(),
  serviceId: z.string().trim().max(200).nullable().optional(),
  deploymentId: z.string().trim().max(200).nullable().optional(),
  domain: z.string().trim().max(500).nullable().optional(),
  healthState: z.enum(RAILWAY_HEALTH_STATES).optional(),
  healthText: z.string().trim().max(2000).optional(),
  healthCheckedAt: z.string().datetime().nullable().optional(),
  lastError: z.string().trim().max(5000).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one Railway delivery field is required.",
});

export const railwayVariableSchema = z.object({
  name: z.string().trim().regex(/^[A-Z][A-Z0-9_]{1,127}$/),
  scope: z.enum(RAILWAY_VARIABLE_SCOPES).default("service"),
  status: z.enum(RAILWAY_VARIABLE_STATUSES).default("synced"),
});

export const railwayLogSchema = z.object({
  stream: z.enum(RAILWAY_LOG_STREAMS),
  severity: z.string().trim().max(40).default("info"),
  message: z.string().trim().min(1).max(8000),
  externalTimestamp: z.string().datetime().nullable().optional().default(null),
});

export const REQUIRED_RAILWAY_VARIABLES = ["DATABASE_URL"] as const;

export function getRailwayRequiredVariables(
  project?: Pick<ProjectRecord, "type" | "brief">,
) {
  const specialist = project
    ? getSpecialistVariableNames(project.type, project.brief).required
    : [];

  return [...new Set<string>([...REQUIRED_RAILWAY_VARIABLES, ...specialist])];
}

export function getRailwayDeliveryGate(
  delivery: RailwayDeliveryRecord,
  variables: RailwayVariableRecord[],
  requiredVariableNames: string[] = [...REQUIRED_RAILWAY_VARIABLES],
) {
  const syncedVariables = new Set(
    variables
      .filter((item) => item.status === "synced" || item.status === "sealed")
      .map((item) => item.name),
  );

  const missingVariables = requiredVariableNames.filter(
    (name) => !syncedVariables.has(name),
  );

  const missingInfrastructure = [
    delivery.railwayProjectId ? "" : "project",
    delivery.environmentId ? "" : "environment",
    delivery.serviceId ? "" : "service",
    delivery.deploymentId ? "" : "deployment",
    delivery.domain ? "" : "domain",
  ].filter(Boolean);

  const ready =
    delivery.status === "healthy" &&
    delivery.healthState === "healthy" &&
    missingInfrastructure.length === 0 &&
    missingVariables.length === 0;

  return {
    ready,
    missingInfrastructure,
    missingVariables,
    healthReady: delivery.healthState === "healthy",
  };
}

export function buildRailwayDeliveryPlan(
  delivery: RailwayDeliveryRecord,
  qaRun: QARunRecord,
  execution: GitHubExecutionRecord,
  project: Pick<ProjectRecord, "type" | "brief">,
) {
  return {
    repository: delivery.repository,
    branch: delivery.branch,
    sourceExecution: execution.id,
    sourceQaRun: qaRun.id,
    configuration: {
      builder: "RAILPACK",
      buildCommand: "npm run build",
      startCommand: "npm run start",
      healthcheckPath: "/api/health",
      healthcheckTimeoutSeconds: 100,
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 3,
    },
    requiredVariables: getRailwayRequiredVariables(project),
    requiresPublicDomain: true,
  };
}

export function buildRailwayToolInstructions(
  delivery: RailwayDeliveryRecord,
  qaRun: QARunRecord,
  execution: GitHubExecutionRecord,
  project: Pick<ProjectRecord, "type" | "brief">,
) {
  return {
    repository: delivery.repository,
    branch: delivery.branch,
    currentRailway: {
      projectId: delivery.railwayProjectId,
      environmentId: delivery.environmentId,
      serviceId: delivery.serviceId,
      deploymentId: delivery.deploymentId,
      domain: delivery.domain,
    },
    requiredVariables: getRailwayRequiredVariables(project),
    sequence: [
      "Verify the Railway account and workspace can create resources.",
      "Create a private Railway project with PR deploys enabled when no Railway project ID is recorded.",
      "Create the application service from the confirmed GitHub repository and branch.",
      "Configure RAILPACK, build/start commands, /api/health, and ON_FAILURE restart policy.",
      "Set every required variable name from the delivery plan without exposing secret values; DATABASE_URL should reference the attached database or a secure external Postgres URL.",
      "Generate a Railway service domain for the application.",
      "Poll environment status and recent deployments until the service settles.",
      "Read build/deploy logs when a deployment fails or crashes and route failures back into implementation.",
      "Sync Railway IDs, domain, variable names, deployment state, and health state into HADI Dev Studio.",
      "Run live browser validation against the public HTTPS domain after the service is healthy.",
    ],
    safety: [
      "Never store plaintext Railway secrets in the HADI Dev Studio database.",
      "Do not claim a deployment is live until Railway reports a successful healthy service.",
      "Do not restart database services as part of generic recovery.",
    ],
  };
}
