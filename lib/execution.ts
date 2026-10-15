import { z } from "zod";
import type { AgentRunRecord, FinalReport } from "./orchestration";
import type { ProjectRecord } from "./projects";
import { getSpecialistExecutionChecks } from "./specialist-workflows";

export const EXECUTION_STATUSES = [
  "planned",
  "branch_ready",
  "coding",
  "pr_open",
  "checks_running",
  "review_ready",
  "completed",
  "failed",
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const CHANGE_OPERATIONS = ["create", "update", "delete"] as const;
export type ChangeOperation = (typeof CHANGE_OPERATIONS)[number];

export const CHANGE_STATUSES = ["planned", "applied", "failed"] as const;
export type ChangeStatus = (typeof CHANGE_STATUSES)[number];

export const CHECK_STATUSES = ["pending", "passed", "failed"] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

export type ExecutionPlanItem = {
  id: string;
  title: string;
  rationale: string;
  paths: string[];
};

export type ExecutionPlan = {
  summary: string;
  items: ExecutionPlanItem[];
  requiredChecks: string[];
};

export type ExecutionChange = {
  id: string;
  executionId: string;
  path: string;
  operation: ChangeOperation;
  summary: string;
  status: ChangeStatus;
  blobSha: string | null;
  commitSha: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionCheck = {
  id: string;
  executionId: string;
  name: string;
  status: CheckStatus;
  details: string;
  url: string;
  createdAt: string;
  updatedAt: string;
};

export type GitHubExecutionRecord = {
  id: string;
  runId: string;
  projectId: string;
  repository: string;
  baseBranch: string;
  workingBranch: string;
  status: ExecutionStatus;
  plan: ExecutionPlan;
  headSha: string | null;
  prNumber: number | null;
  prUrl: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export const createExecutionSchema = z.object({
  repository: z.string().trim().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  baseBranch: z.string().trim().min(1).max(120).default("main"),
});

export const executionSyncSchema = z.object({
  status: z.enum(EXECUTION_STATUSES).optional(),
  workingBranch: z.string().trim().min(1).max(200).optional(),
  headSha: z.string().trim().regex(/^[0-9a-f]{40}$/i).nullable().optional(),
  prNumber: z.number().int().positive().nullable().optional(),
  prUrl: z.string().url().nullable().optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one execution field is required.",
});

export const executionChangeSchema = z.object({
  path: z.string().trim().min(1).max(500),
  operation: z.enum(CHANGE_OPERATIONS),
  summary: z.string().trim().min(3).max(2000),
  status: z.enum(CHANGE_STATUSES).default("planned"),
  blobSha: z.string().trim().regex(/^[0-9a-f]{40}$/i).nullable().optional().default(null),
  commitSha: z.string().trim().regex(/^[0-9a-f]{40}$/i).nullable().optional().default(null),
});

export const executionCheckSchema = z.object({
  name: z.string().trim().min(2).max(120),
  status: z.enum(CHECK_STATUSES),
  details: z.string().trim().max(4000).default(""),
  url: z.string().trim().url().or(z.literal("")).default(""),
});

export function slugifyBranch(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "project";
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

export function buildExecutionPlan(
  project: ProjectRecord,
  run: AgentRunRecord,
  finalReport: FinalReport,
): ExecutionPlan {
  const artifacts = unique(
    finalReport.actions
      .concat(finalReport.decisions)
      .slice(0, 12),
  );

  const items: ExecutionPlanItem[] = artifacts.map((text, index) => ({
    id: `plan-${String(index + 1).padStart(2, "0")}`,
    title: text.length > 90 ? `${text.slice(0, 87)}...` : text,
    rationale: index < finalReport.actions.length
      ? "Lead Builder action"
      : "Lead Builder decision",
    paths: [],
  }));

  if (items.length === 0) {
    items.push({
      id: "plan-01",
      title: "Implement approved project scope",
      rationale: "Fallback implementation item from completed agent council",
      paths: [],
    });
  }

  return {
    summary: `Execute the approved ${project.type} plan from council run ${run.id} on GitHub.`,
    items,
    requiredChecks: unique(["typecheck", "build", "review", ...getSpecialistExecutionChecks(project.type, project.brief)]),
  };
}

export function buildWorkingBranch(project: ProjectRecord, executionId: string): string {
  return `hadi/${slugifyBranch(project.name)}-${executionId.slice(0, 8)}`;
}

export function getMergeGate(
  execution: GitHubExecutionRecord,
  changes: ExecutionChange[],
  checks: ExecutionCheck[],
) {
  const appliedChanges = changes.filter((change) => change.status === "applied").length;
  const failedChanges = changes.filter((change) => change.status === "failed").length;
  const required = execution.plan.requiredChecks;
  const checkMap = new Map(checks.map((check) => [check.name.toLowerCase(), check]));

  const missingChecks = required.filter((name) => !checkMap.has(name.toLowerCase()));
  const failedChecks = checks.filter((check) => check.status === "failed");

  const ready =
    Boolean(execution.prNumber && execution.prUrl && execution.headSha) &&
    appliedChanges > 0 &&
    failedChanges === 0 &&
    missingChecks.length === 0 &&
    failedChecks.length === 0 &&
    required.every((name) => checkMap.get(name.toLowerCase())?.status === "passed");

  return {
    ready,
    appliedChanges,
    failedChanges,
    missingChecks,
    failedChecks: failedChecks.map((check) => check.name),
  };
}

export function buildGitHubToolInstructions(
  execution: GitHubExecutionRecord,
  changes: ExecutionChange[],
  checks: ExecutionCheck[],
) {
  const gate = getMergeGate(execution, changes, checks);

  return {
    repository: execution.repository,
    baseBranch: execution.baseBranch,
    workingBranch: execution.workingBranch,
    sequence: [
      "Read the repository and verify the current base branch head.",
      "Create the working branch if it does not already exist.",
      "Apply planned file changes using GitHub file/tree operations.",
      "Record each applied change and resulting commit SHA in the execution API.",
      "Open a pull request against the base branch.",
      "Record PR number, URL and head SHA.",
      "Wait for CI and review checks, then record every required check.",
      "Merge only when mergeGate.ready is true.",
    ],
    mergeGate: gate,
  };
}
