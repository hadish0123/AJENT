import type { AgentKey } from "./agents";
import type { ProjectType } from "./project-types";

export type SpecialistWorkflowKey = "telegram" | "vpn" | "mobile" | "game" | "ai";

export type SpecialistWorkflow = {
  key: SpecialistWorkflowKey;
  label: string;
  leadAgent: AgentKey;
  description: string;
  implementationSequence: string[];
  requiredArtifacts: string[];
  executionChecks: string[];
  qaChecks: string[];
  requiredVariableNames: string[];
  optionalVariableNames: string[];
  releaseGates: string[];
  riskControls: string[];
};

const VPN_HINT =
  /\b(vpn|vless|vmess|xray|wireguard|openvpn|sing-box|sanaei|pasargad|subscription)\b|فیلترشکن|کانفیگ|اشتراک\s*(vpn|وی\s*پی\s*ان)?/iu;

const AI_HINT =
  /\b(ai|llm|agent|agents|chatgpt|openai|anthropic|gemini|rag|embedding|vector)\b|هوش\s*مصنوعی|ایجنت|مدل\s*زبانی/iu;

export const SPECIALIST_WORKFLOWS: Record<SpecialistWorkflowKey, SpecialistWorkflow> = {
  telegram: {
    key: "telegram",
    label: "Telegram Bot Workflow",
    leadAgent: "telegram",
    description:
      "Command/callback routing, stateful conversations, Telegram API integration, payment-aware flows and secure bot delivery.",
    implementationSequence: [
      "Define commands, callback namespaces and conversation/state transitions.",
      "Define Telegram update ingestion mode: webhook for production or polling only when explicitly selected.",
      "Implement handlers with idempotency for retried updates and duplicate callbacks.",
      "Separate business logic from Telegram transport code.",
      "Add admin/support flows and rate/abuse controls where required.",
      "Validate secrets, webhook verification and user-facing error handling.",
    ],
    requiredArtifacts: [
      "Telegram command and callback map",
      "Conversation/state model",
      "Bot transport adapter",
      "User/admin flow acceptance matrix",
    ],
    executionChecks: ["telegram-contract"],
    qaChecks: ["telegram-routing"],
    requiredVariableNames: ["TELEGRAM_BOT_TOKEN"],
    optionalVariableNames: ["TELEGRAM_WEBHOOK_SECRET", "TELEGRAM_ADMIN_IDS"],
    releaseGates: [
      "Bot token is outside source control.",
      "All registered commands/callbacks resolve to handlers.",
      "Duplicate Telegram updates do not double-apply critical business actions.",
    ],
    riskControls: [
      "Never log bot tokens or payment credentials.",
      "Authenticate privileged admin actions independently from display names/usernames.",
      "Treat Telegram update payloads as untrusted input.",
    ],
  },
  vpn: {
    key: "vpn",
    label: "VPN / Subscription Workflow",
    leadAgent: "vpn",
    description:
      "Plans, trials, renewals, panel API integration, service provisioning, quota/expiry synchronization and subscription lifecycle.",
    implementationSequence: [
      "Confirm the exact VPN panel/provider and its supported API contract before implementation.",
      "Model plans, orders, services, trials, renewals and provisioning state explicitly.",
      "Implement a provider adapter so Sanaei/Pasargad/other supported panels do not leak into business logic.",
      "Make provisioning and renewal operations idempotent and traceable.",
      "Synchronize traffic, expiry and service status without exposing panel credentials.",
      "Add failure/retry handling for partial payment or panel API outages.",
    ],
    requiredArtifacts: [
      "VPN provider adapter contract",
      "Plan/order/service lifecycle model",
      "Provisioning idempotency strategy",
      "Trial and renewal rules",
      "Panel capability matrix",
    ],
    executionChecks: ["vpn-provider-contract"],
    qaChecks: ["vpn-provisioning"],
    requiredVariableNames: ["VPN_PANEL_BASE_URL", "VPN_PANEL_API_TOKEN"],
    optionalVariableNames: ["VPN_PANEL_PROVIDER", "VPN_TRIAL_POLICY"],
    releaseGates: [
      "Provider API capabilities are confirmed rather than assumed.",
      "Provisioning retries cannot create unintended duplicate services.",
      "Expiry/quota data has one authoritative synchronization path.",
    ],
    riskControls: [
      "Never store panel API tokens in GitHub or user-visible responses.",
      "Do not silently invent unsupported provider endpoints.",
      "Keep payment confirmation separate from service-provisioning success.",
    ],
  },
  mobile: {
    key: "mobile",
    label: "Mobile App Workflow",
    leadAgent: "mobile",
    description:
      "Mobile navigation, client state, API integration, platform behavior, offline/error states and releasable builds.",
    implementationSequence: [
      "Choose the mobile stack and target platforms from project requirements.",
      "Define navigation, deep-link and authentication state transitions.",
      "Implement network/client state with explicit loading, offline and retry behavior.",
      "Keep platform secrets/signing material outside the repository.",
      "Validate device-safe layout, accessibility and critical permission flows.",
      "Produce a reproducible debug/release build path for the chosen platform.",
    ],
    requiredArtifacts: [
      "Navigation map",
      "API/client state contract",
      "Platform permission matrix",
      "Build/release instructions",
    ],
    executionChecks: ["mobile-architecture"],
    qaChecks: ["mobile-critical-flow"],
    requiredVariableNames: [],
    optionalVariableNames: ["MOBILE_API_BASE_URL", "ANDROID_PACKAGE_NAME", "IOS_BUNDLE_ID"],
    releaseGates: [
      "Primary flows work from a clean install/session.",
      "Network failures have recoverable UI states.",
      "Signing credentials are never committed to source control.",
    ],
    riskControls: [
      "Request only permissions justified by a user-facing feature.",
      "Do not hard-code production API secrets into the client bundle.",
      "Treat device storage as user-controlled/untrusted unless cryptographically protected.",
    ],
  },
  game: {
    key: "game",
    label: "Game Workflow",
    leadAgent: "game",
    description:
      "Gameplay loop, state/save systems, input, performance budgets, deterministic rules where needed and playable build validation.",
    implementationSequence: [
      "Define the core gameplay loop and win/fail/progression states.",
      "Separate simulation/gameplay state from presentation where practical.",
      "Define save/load/versioning rules before persistent player data is introduced.",
      "Implement input, pause/resume and lifecycle behavior for target platforms.",
      "Set a measurable performance budget appropriate for the target hardware.",
      "Validate a clean playable path from launch to the primary gameplay objective.",
    ],
    requiredArtifacts: [
      "Core gameplay loop",
      "Game-state model",
      "Save/versioning contract",
      "Performance budget",
      "Playable smoke-test path",
    ],
    executionChecks: ["game-state-contract"],
    qaChecks: ["game-playable-smoke"],
    requiredVariableNames: [],
    optionalVariableNames: ["GAME_API_BASE_URL", "GAME_BUILD_CHANNEL"],
    releaseGates: [
      "A clean launch can reach the core gameplay loop.",
      "Save/load behavior is version-aware when persistence exists.",
      "Target performance budget is measured, not assumed.",
    ],
    riskControls: [
      "Do not couple authoritative online game state to a trustable client assumption.",
      "Validate external asset licenses before distribution.",
      "Avoid destructive save migrations without a recovery path.",
    ],
  },
  ai: {
    key: "ai",
    label: "AI System Workflow",
    leadAgent: "ai",
    description:
      "Model/provider boundaries, prompts, structured outputs, tool safety, retrieval context, evaluation and cost/latency controls.",
    implementationSequence: [
      "Define what requires model reasoning versus deterministic application logic.",
      "Choose provider/model only after latency, quality, privacy and cost requirements are known.",
      "Use structured schemas for model outputs that drive application behavior.",
      "Keep tool permissions narrow and validate every tool argument before execution.",
      "Add evaluation cases for hallucination-sensitive and failure-prone flows.",
      "Add timeout, retry, fallback and usage/cost controls where external model APIs are used.",
    ],
    requiredArtifacts: [
      "Model boundary and provider contract",
      "Prompt/tool contract",
      "Structured output schema",
      "Evaluation set",
      "Fallback and usage policy",
    ],
    executionChecks: ["ai-contract"],
    qaChecks: ["ai-evaluation"],
    requiredVariableNames: [],
    optionalVariableNames: ["OPENAI_API_KEY", "AI_PROVIDER_API_KEY", "AI_MODEL"],
    releaseGates: [
      "Model output that controls code paths is schema-validated.",
      "Tool execution requires explicit allowlisted capabilities.",
      "External model credentials are environment-managed and not committed.",
    ],
    riskControls: [
      "Internal HADI Dev Studio agents use ChatGPT directly and do not require a separate AI API solely for orchestration.",
      "Do not trust model-generated URLs, commands or tool parameters without validation.",
      "Separate retrieved/project context from privileged secrets whenever possible.",
    ],
  },
};

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function hasVpnScope(type: ProjectType, brief = "") {
  return type === "vpn-panel" ||
    (["telegram-bot", "admin-panel", "custom"].includes(type) && VPN_HINT.test(brief));
}

export function hasAiScope(type: ProjectType, brief = "") {
  return type === "ai-system" ||
    (["website", "telegram-bot", "admin-panel", "mobile-app", "custom"].includes(type) && AI_HINT.test(brief));
}

export function getSpecialistWorkflows(
  type: ProjectType,
  brief = "",
): SpecialistWorkflow[] {
  const keys: SpecialistWorkflowKey[] = [];

  if (type === "telegram-bot") keys.push("telegram");
  if (hasVpnScope(type, brief)) keys.push("vpn");
  if (type === "mobile-app") keys.push("mobile");
  if (type === "game") keys.push("game");
  if (hasAiScope(type, brief)) keys.push("ai");

  return unique(keys).map((key) => SPECIALIST_WORKFLOWS[key]);
}

export function getSpecialistExecutionChecks(type: ProjectType, brief = "") {
  return unique(
    getSpecialistWorkflows(type, brief).flatMap((workflow) => workflow.executionChecks),
  );
}

export function getSpecialistQaChecks(type: ProjectType, brief = "") {
  return unique(
    getSpecialistWorkflows(type, brief).flatMap((workflow) => workflow.qaChecks),
  );
}

export function getSpecialistVariableNames(type: ProjectType, brief = "") {
  const workflows = getSpecialistWorkflows(type, brief);
  return {
    required: unique(workflows.flatMap((workflow) => workflow.requiredVariableNames)),
    optional: unique(workflows.flatMap((workflow) => workflow.optionalVariableNames)),
  };
}

export function buildSpecialistPromptContext(type: ProjectType, brief = "") {
  const workflows = getSpecialistWorkflows(type, brief);
  if (!workflows.length) {
    return "No additional specialist production workflow is activated for this project.";
  }

  return workflows
    .map((workflow) => [
      `[${workflow.label}]`,
      `Lead: ${workflow.leadAgent}`,
      `Description: ${workflow.description}`,
      `Required artifacts: ${workflow.requiredArtifacts.join("; ")}`,
      `Release gates: ${workflow.releaseGates.join("; ")}`,
      `Risk controls: ${workflow.riskControls.join("; ")}`,
    ].join("\n"))
    .join("\n\n");
}
