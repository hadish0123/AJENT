import { z } from "zod";
import { getAgentsForProject, type AgentKey } from "./agents";
import { PROJECT_TYPES, type ProjectType } from "./project-types";

export const PROJECT_STATUSES = [
  "intake",
  "planned",
  "designing",
  "building",
  "reviewing",
  "testing",
  "ready",
  "deployed",
  "paused",
  "cancelled",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type TaskStatus = "pending" | "ready" | "active" | "blocked" | "done";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  clientName: z.string().trim().max(120).optional().default(""),
  type: z.enum(PROJECT_TYPES),
  brief: z.string().trim().min(20).max(20000),
  budget: z.string().trim().max(120).optional().default(""),
  deadline: z.string().trim().max(60).optional().default(""),
  mustHave: z.array(z.string().trim().min(1).max(300)).max(30).optional().default([]),
  constraints: z.array(z.string().trim().min(1).max(300)).max(30).optional().default([]),
});

export const updateProjectSchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  brief: z.string().trim().min(20).max(20000).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required.",
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export type ProjectRequirements = {
  brief: string;
  mustHave: string[];
  constraints: string[];
  acceptanceCriteria: string[];
};

export type ProjectTask = {
  id: string;
  title: string;
  agent: AgentKey;
  status: TaskStatus;
  dependsOn: string[];
};

export type ProjectRecord = {
  id: string;
  name: string;
  clientName: string;
  type: ProjectType;
  brief: string;
  budget: string;
  deadline: string;
  status: ProjectStatus;
  requirements: ProjectRequirements;
  taskGraph: ProjectTask[];
  createdAt: string;
  updatedAt: string;
};

const taskTitle: Record<AgentKey, string> = {
  requirements: "Analyze requirements",
  product: "Define product scope",
  architect: "Design system architecture",
  uiux: "Design UX and interface system",
  frontend: "Implement frontend",
  backend: "Implement backend",
  database: "Design and implement data layer",
  telegram: "Implement Telegram bot",
  mobile: "Implement mobile application",
  game: "Implement gameplay systems",
  vpn: "Implement VPN panel integration",
  security: "Run security review",
  qa: "Run QA and acceptance tests",
  devops: "Prepare deployment",
  lead: "Integrate and approve final build",
};

export function buildTaskGraph(type: ProjectType): ProjectTask[] {
  const agents = getAgentsForProject(type);
  const tasks: ProjectTask[] = [];
  let previousCore: string[] = [];

  for (const agent of agents) {
    const id = `task-${agent.key}`;

    let dependsOn = previousCore;

    if (agent.key === "frontend" || agent.key === "backend" || agent.key === "database" ||
        agent.key === "telegram" || agent.key === "mobile" || agent.key === "game" || agent.key === "vpn") {
      dependsOn = tasks
        .filter((task) => ["architect", "uiux"].includes(task.agent))
        .map((task) => task.id);
    }

    if (agent.key === "security" || agent.key === "qa") {
      dependsOn = tasks
        .filter((task) => ["frontend", "backend", "database", "telegram", "mobile", "game", "vpn"].includes(task.agent))
        .map((task) => task.id);
    }

    if (agent.key === "devops") {
      dependsOn = tasks.filter((task) => task.agent === "qa").map((task) => task.id);
    }

    if (agent.key === "lead") {
      dependsOn = tasks.filter((task) => ["security", "qa", "devops"].includes(task.agent)).map((task) => task.id);
    }

    const task: ProjectTask = {
      id,
      title: taskTitle[agent.key],
      agent: agent.key,
      status: tasks.length === 0 ? "ready" : "pending",
      dependsOn,
    };

    tasks.push(task);

    if (["requirements", "product", "architect", "uiux"].includes(agent.key)) {
      previousCore = [id];
    }
  }

  return tasks;
}

export function buildInitialRequirements(input: CreateProjectInput): ProjectRequirements {
  return {
    brief: input.brief,
    mustHave: input.mustHave,
    constraints: input.constraints,
    acceptanceCriteria: [
      "Scope is confirmed before implementation.",
      "Build passes type checks and production build.",
      "Critical flows are tested before deployment.",
      "Secrets are stored outside source control.",
    ],
  };
}
