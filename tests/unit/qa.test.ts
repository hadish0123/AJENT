import { describe, expect, it } from "vitest";
import { getQAGate, type BugRecord, type QACheckRecord, type QARunRecord } from "../../lib/qa";

const run: QARunRecord = {
  id: "run",
  executionId: "execution",
  projectId: "project",
  source: "ci",
  targetUrl: "",
  status: "running",
  requiredChecks: ["typecheck", "unit", "build", "browser-smoke"],
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  completedAt: null,
};

function check(name: string, status: QACheckRecord["status"] = "passed"): QACheckRecord {
  return {
    id: name,
    qaRunId: run.id,
    type: name === "browser-smoke" ? "browser" : name === "unit" ? "unit" : name === "build" ? "build" : "typecheck",
    name,
    status,
    details: "",
    evidenceUrl: "",
    durationMs: 1,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

describe("QA gate", () => {
  it("passes when all required checks pass and no unresolved bugs exist", () => {
    const gate = getQAGate(
      run,
      run.requiredChecks.map((name) => check(name)),
      [],
    );

    expect(gate.ready).toBe(true);
    expect(gate.missingChecks).toEqual([]);
  });

  it("blocks on failed checks", () => {
    const checks = run.requiredChecks.map((name) =>
      name === "build" ? check(name, "failed") : check(name),
    );

    const gate = getQAGate(run, checks, []);
    expect(gate.ready).toBe(false);
    expect(gate.failedChecks).toEqual(["build"]);
  });

  it("blocks on unresolved bugs", () => {
    const bug: BugRecord = {
      id: "bug",
      qaRunId: run.id,
      severity: "high",
      status: "open",
      title: "Broken flow",
      description: "The primary flow is broken.",
      reproduction: ["Open page"],
      expected: "Works",
      actual: "Fails",
      path: "/",
      assignedAgent: "frontend",
      fixedCommitSha: null,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };

    const gate = getQAGate(run, run.requiredChecks.map((name) => check(name)), [bug]);
    expect(gate.ready).toBe(false);
    expect(gate.unresolvedBugs).toBe(1);
  });
});
