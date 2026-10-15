import { z } from "zod";
import { AGENTS, getAgentsForProject, type AgentKey } from "./agents";
import type { ProjectRecord } from "./projects";

export const RUN_STAGES = ["analysis", "debate", "review", "lead"] as const;
export type RunStage = (typeof RUN_STAGES)[number];

export const RUN_STATUSES = ["active", "completed", "failed", "cancelled"] as const;
export type AgentRunStatus = (typeof RUN_STATUSES)[number];

export const AGENT_STANCES = ["approve", "revise", "block"] as const;
export type AgentStance = (typeof AGENT_STANCES)[number];

const AGENT_KEYS = [
  "requirements",
  "product",
  "architect",
  "uiux",
  "frontend",
  "backend",
  "database",
  "telegram",
  "mobile",
  "game",
  "vpn",
  "security",
  "qa",
  "devops",
  "lead",
] as const satisfies readonly AgentKey[];

export const agentOutputInputSchema = z.object({
  agent: z.enum(AGENT_KEYS),
  stage: z.enum(RUN_STAGES),
  stance: z.enum(AGENT_STANCES),
  confidence: z.number().int().min(0).max(100),
  summary: z.string().trim().min(20).max(6000),
  decisions: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  risks: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  actions: z.array(z.string().trim().min(1).max(1000)).max(30).default([]),
  questions: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
  artifacts: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
});

export type AgentOutputInput = z.infer<typeof agentOutputInputSchema>;

export type AgentStagePlan = Record<RunStage, AgentKey[]>;

export type AgentRunRecord = {
  id: string;
  projectId: string;
  status: AgentRunStatus;
  currentStage: RunStage;
  participants: AgentKey[];
  stagePlan: AgentStagePlan;
  finalReport: FinalReport | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type AgentOutputRecord = AgentOutputInput & {
  id: string;
  runId: string;
  createdAt: string;
};

export type ConsensusSummary = {
  approve: number;
  revise: number;
  block: number;
  averageConfidence: number;
};

export type FinalReport = {
  executiveSummary: string;
  decisions: string[];
  risks: string[];
  actions: string[];
  confidence: number;
  consensus: ConsensusSummary;
  generatedBy: "lead";
};

export type NextAgentTask = {
  agent: AgentKey;
  name: string;
  mission: string;
  stage: RunStage;
  prompt: string;
};

const builderAgents: AgentKey[] = [
  "architect",
  "uiux",
  "frontend",
  "backend",
  "database",
  "telegram",
  "mobile",
  "game",
  "vpn",
];

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function buildStagePlan(project: ProjectRecord): AgentStagePlan {
  const available = new Set(getAgentsForProject(project.type).map((agent) => agent.key));
  const pick = (keys: AgentKey[]) => keys.filter((key) => available.has(key));

  return {
    analysis: pick(["requirements", "product", "architect"]),
    debate: unique(pick(builderAgents)),
    review: pick(["security", "qa", "devops"]),
    lead: pick(["lead"]),
  };
}

export function getParticipants(stagePlan: AgentStagePlan): AgentKey[] {
  return unique(RUN_STAGES.flatMap((stage) => stagePlan[stage]));
}

export function getNextStage(stage: RunStage): RunStage | null {
  const index = RUN_STAGES.indexOf(stage);
  return RUN_STAGES[index + 1] ?? null;
}

export function getConsensus(outputs: AgentOutputRecord[]): ConsensusSummary {
  if (outputs.length === 0) {
    return { approve: 0, revise: 0, block: 0, averageConfidence: 0 };
  }

  const counts = outputs.reduce(
    (acc, output) => {
      acc[output.stance] += 1;
      return acc;
    },
    { approve: 0, revise: 0, block: 0 } as Record<AgentStance, number>,
  );

  const averageConfidence = Math.round(
    outputs.reduce((sum, output) => sum + output.confidence, 0) / outputs.length,
  );

  return { ...counts, averageConfidence };
}

function priorContext(outputs: AgentOutputRecord[]): string {
  if (outputs.length === 0) return "No prior agent output is available yet.";

  return outputs
    .map((output) => {
      const decisions = output.decisions.length ? output.decisions.join("; ") : "none";
      const risks = output.risks.length ? output.risks.join("; ") : "none";
      return [
        `[${output.stage}] ${output.agent}`,
        `stance=${output.stance}, confidence=${output.confidence}`,
        `summary: ${output.summary}`,
        `decisions: ${decisions}`,
        `risks: ${risks}`,
      ].join("\n");
    })
    .join("\n\n");
}

export function buildAgentPrompt(
  project: ProjectRecord,
  run: AgentRunRecord,
  outputs: AgentOutputRecord[],
  agentKey: AgentKey,
): string {
  const definition = AGENTS.find((agent) => agent.key === agentKey);
  if (!definition) throw new Error(`Unknown agent: ${agentKey}`);

  const stage = run.currentStage;
  const stageInstructions: Record<RunStage, string> = {
    analysis:
      "Analyze the request independently. Extract scope, assumptions, constraints, acceptance criteria and major technical decisions. Do not implement code yet.",
    debate:
      "Review prior analysis and challenge weak assumptions. Propose the strongest implementation approach from your specialty. Explicitly call out disagreements and trade-offs.",
    review:
      "Act as a critical reviewer. Look for security, QA, operational, integration and delivery risks. Approve only when the plan is implementable; otherwise request revisions or block.",
    lead:
      "Synthesize the entire council. Resolve disagreements, select the final architecture and implementation sequence, and produce an actionable build plan for the next phase.",
  };

  return [
    "HADI DEV STUDIO — INTERNAL AGENT TASK",
    `Run: ${run.id}`,
    `Stage: ${stage}`,
    `Agent: ${definition.name}`,
    `Mission: ${definition.mission}`,
    "",
    "PROJECT",
    `Name: ${project.name}`,
    `Type: ${project.type}`,
    `Client: ${project.clientName || "Direct project"}`,
    `Budget: ${project.budget || "Not set"}`,
    `Deadline: ${project.deadline || "Not set"}`,
    `Brief: ${project.brief}`,
    "",
    "MUST HAVE",
    project.requirements.mustHave.length ? `- ${project.requirements.mustHave.join("\n- ")}` : "None explicitly listed.",
    "",
    "CONSTRAINTS",
    project.requirements.constraints.length ? `- ${project.requirements.constraints.join("\n- ")}` : "None explicitly listed.",
    "",
    "STAGE INSTRUCTION",
    stageInstructions[stage],
    "",
    "PRIOR COUNCIL OUTPUTS",
    priorContext(outputs),
    "",
    "RETURN ONLY A STRUCTURED RESULT MATCHING THIS CONTRACT:",
    JSON.stringify(
      {
        agent: agentKey,
        stage,
        stance: "approve | revise | block",
        confidence: "integer 0..100",
        summary: "concise but complete reasoning result",
        decisions: ["decision"],
        risks: ["risk"],
        actions: ["next action"],
        questions: ["blocking or useful question"],
        artifacts: ["file/path or deliverable to create next"],
      },
      null,
      2,
    ),
  ].join("\n");
}

export function getNextAgentTasks(
  project: ProjectRecord,
  run: AgentRunRecord,
  outputs: AgentOutputRecord[],
): NextAgentTask[] {
  if (run.status !== "active") return [];

  const expected = run.stagePlan[run.currentStage];
  const completed = new Set(
    outputs
      .filter((output) => output.stage === run.currentStage)
      .map((output) => output.agent),
  );

  return expected
    .filter((agent) => !completed.has(agent))
    .map((agent) => {
      const definition = AGENTS.find((item) => item.key === agent);
      if (!definition) throw new Error(`Unknown agent: ${agent}`);

      return {
        agent,
        name: definition.name,
        mission: definition.mission,
        stage: run.currentStage,
        prompt: buildAgentPrompt(project, run, outputs, agent),
      };
    });
}

export function buildFinalReport(outputs: AgentOutputRecord[]): FinalReport {
  const lead = [...outputs].reverse().find(
    (output) => output.stage === "lead" && output.agent === "lead",
  );

  if (!lead) {
    throw new Error("Lead Builder output is required to complete a run.");
  }

  const reviewOutputs = outputs.filter((output) => output.stage !== "lead");
  return {
    executiveSummary: lead.summary,
    decisions: unique(lead.decisions),
    risks: unique(lead.risks),
    actions: unique(lead.actions),
    confidence: lead.confidence,
    consensus: getConsensus(reviewOutputs),
    generatedBy: "lead",
  };
}
