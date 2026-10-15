import { z } from "zod";
import type { GitHubExecutionRecord } from "./execution";

export const QA_RUN_STATUSES = ["pending", "running", "passed", "failed", "blocked"] as const;
export type QARunStatus = (typeof QA_RUN_STATUSES)[number];

export const QA_SOURCES = ["ci", "browser_operator", "manual"] as const;
export type QASource = (typeof QA_SOURCES)[number];

export const QA_CHECK_TYPES = [
  "typecheck",
  "unit",
  "build",
  "api",
  "browser",
  "visual",
  "security",
] as const;
export type QACheckType = (typeof QA_CHECK_TYPES)[number];

export const QA_CHECK_STATUSES = ["pending", "passed", "failed", "blocked"] as const;
export type QACheckStatus = (typeof QA_CHECK_STATUSES)[number];

export const BUG_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type BugSeverity = (typeof BUG_SEVERITIES)[number];

export const BUG_STATUSES = ["open", "fixing", "fixed", "verified", "wont_fix"] as const;
export type BugStatus = (typeof BUG_STATUSES)[number];

export type QARunRecord = {
  id: string;
  executionId: string;
  projectId: string;
  source: QASource;
  targetUrl: string;
  status: QARunStatus;
  requiredChecks: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type QACheckRecord = {
  id: string;
  qaRunId: string;
  type: QACheckType;
  name: string;
  status: QACheckStatus;
  details: string;
  evidenceUrl: string;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
};

export type BugRecord = {
  id: string;
  qaRunId: string;
  severity: BugSeverity;
  status: BugStatus;
  title: string;
  description: string;
  reproduction: string[];
  expected: string;
  actual: string;
  path: string;
  assignedAgent: string;
  fixedCommitSha: string | null;
  createdAt: string;
  updatedAt: string;
};

export const createQARunSchema = z.object({
  source: z.enum(QA_SOURCES).default("ci"),
  targetUrl: z.string().trim().url().or(z.literal("")).default(""),
  requiredChecks: z
    .array(z.string().trim().min(1).max(120))
    .min(1)
    .max(20)
    .default(["typecheck", "unit", "build", "browser-smoke"]),
});

export const qaCheckSchema = z.object({
  type: z.enum(QA_CHECK_TYPES),
  name: z.string().trim().min(2).max(120),
  status: z.enum(QA_CHECK_STATUSES),
  details: z.string().trim().max(5000).default(""),
  evidenceUrl: z.string().trim().url().or(z.literal("")).default(""),
  durationMs: z.number().int().nonnegative().nullable().optional().default(null),
});

export const bugCreateSchema = z.object({
  severity: z.enum(BUG_SEVERITIES),
  title: z.string().trim().min(3).max(240),
  description: z.string().trim().min(10).max(8000),
  reproduction: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  expected: z.string().trim().max(4000).default(""),
  actual: z.string().trim().max(4000).default(""),
  path: z.string().trim().max(500).default(""),
  assignedAgent: z.string().trim().max(120).default("qa"),
});

export const bugUpdateSchema = z.object({
  status: z.enum(BUG_STATUSES).optional(),
  assignedAgent: z.string().trim().max(120).optional(),
  fixedCommitSha: z
    .string()
    .trim()
    .regex(/^[0-9a-f]{40}$/i)
    .nullable()
    .optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one bug field is required.",
});

export function getQAGate(run: QARunRecord, checks: QACheckRecord[], bugs: BugRecord[]) {
  const checkMap = new Map(checks.map((check) => [check.name.toLowerCase(), check]));
  const missingChecks = run.requiredChecks.filter((name) => !checkMap.has(name.toLowerCase()));
  const failedChecks = checks.filter((check) => check.status === "failed");
  const blockedChecks = checks.filter((check) => check.status === "blocked");
  const unresolvedBugs = bugs.filter(
    (bug) => !["verified", "wont_fix"].includes(bug.status),
  );
  const criticalBugs = unresolvedBugs.filter((bug) => bug.severity === "critical");

  const ready =
    missingChecks.length === 0 &&
    failedChecks.length === 0 &&
    blockedChecks.length === 0 &&
    unresolvedBugs.length === 0 &&
    run.requiredChecks.every(
      (name) => checkMap.get(name.toLowerCase())?.status === "passed",
    );

  return {
    ready,
    missingChecks,
    failedChecks: failedChecks.map((check) => check.name),
    blockedChecks: blockedChecks.map((check) => check.name),
    unresolvedBugs: unresolvedBugs.length,
    criticalBugs: criticalBugs.length,
  };
}

export function buildBrowserValidationProtocol(
  run: QARunRecord,
  execution: GitHubExecutionRecord,
) {
  return {
    targetUrl: run.targetUrl,
    requiresPublicHttps: true,
    mode: "PRIME Browser Operator",
    steps: [
      "Open the target URL in an isolated browser session.",
      "Verify the page loads without a visible runtime error.",
      "Exercise primary navigation and the main call-to-action.",
      "Validate responsive layout at normal desktop width.",
      "Inspect forms for labels, validation, disabled/loading states and submission behavior.",
      "Capture screenshots for meaningful UI failures.",
      "Record every browser finding as a QA check or bug.",
      "Close the browser session after validation.",
    ],
    execution: {
      repository: execution.repository,
      branch: execution.workingBranch,
      prNumber: execution.prNumber,
    },
  };
}
