import type { ProjectType } from "./project-types";

export type AgentKey =
  | "requirements"
  | "product"
  | "architect"
  | "uiux"
  | "frontend"
  | "backend"
  | "database"
  | "telegram"
  | "mobile"
  | "game"
  | "vpn"
  | "security"
  | "qa"
  | "devops"
  | "lead";

export type AgentDefinition = {
  key: AgentKey;
  name: string;
  mission: string;
  projectTypes: ProjectType[] | ["all"];
};

export const AGENTS: AgentDefinition[] = [
  { key: "requirements", name: "Requirements Agent", mission: "Turn client requests into scope, constraints and acceptance criteria.", projectTypes: ["all"] },
  { key: "product", name: "Product Agent", mission: "Prioritize features, flows and MVP/full boundaries.", projectTypes: ["all"] },
  { key: "architect", name: "Architect Agent", mission: "Own system architecture, boundaries, stack and integration decisions.", projectTypes: ["all"] },
  { key: "uiux", name: "UI/UX Agent", mission: "Design information architecture, components and responsive user flows.", projectTypes: ["website", "admin-panel", "vpn-panel", "mobile-app", "game", "ai-system"] },
  { key: "frontend", name: "Frontend Agent", mission: "Implement production-grade frontend and client state.", projectTypes: ["website", "admin-panel", "vpn-panel", "ai-system"] },
  { key: "backend", name: "Backend Agent", mission: "Implement APIs, auth, business logic and external integrations.", projectTypes: ["website", "telegram-bot", "admin-panel", "vpn-panel", "mobile-app", "game", "ai-system", "custom"] },
  { key: "database", name: "Database Agent", mission: "Own data modeling, migrations, integrity and query design.", projectTypes: ["website", "telegram-bot", "admin-panel", "vpn-panel", "mobile-app", "game", "ai-system", "custom"] },
  { key: "telegram", name: "Telegram Bot Agent", mission: "Build Telegram flows, commands, callbacks, payments and bot architecture.", projectTypes: ["telegram-bot"] },
  { key: "mobile", name: "Mobile Agent", mission: "Own mobile architecture, navigation and platform delivery.", projectTypes: ["mobile-app"] },
  { key: "game", name: "Game Agent", mission: "Own gameplay architecture, loops, state and performance.", projectTypes: ["game"] },
  { key: "vpn", name: "VPN Panel Agent", mission: "Own subscriptions, provisioning and supported panel integrations.", projectTypes: ["vpn-panel", "telegram-bot", "admin-panel"] },
  { key: "security", name: "Security Agent", mission: "Review auth, secrets, permissions, input validation and abuse resistance.", projectTypes: ["all"] },
  { key: "qa", name: "QA Agent", mission: "Test builds, flows, regressions and deployment readiness.", projectTypes: ["all"] },
  { key: "devops", name: "DevOps Agent", mission: "Own Railway config, environments, health checks and deployments.", projectTypes: ["all"] },
  { key: "lead", name: "Lead Builder", mission: "Resolve disagreements, integrate work and own final readiness.", projectTypes: ["all"] },
];

export function getAgentsForProject(type: ProjectType) {
  return AGENTS.filter((agent) => agent.projectTypes[0] === "all" || (agent.projectTypes as ProjectType[]).includes(type));
}
