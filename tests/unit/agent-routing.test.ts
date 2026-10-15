import { describe, expect, it } from "vitest";
import { getAgentsForProject } from "../../lib/agents";
import { buildTaskGraph } from "../../lib/projects";

describe("specialist agent routing", () => {
  it("keeps a generic Telegram bot free of unrelated VPN work", () => {
    const keys = getAgentsForProject(
      "telegram-bot",
      "Support bot with ticket creation and admin replies.",
    ).map((agent) => agent.key);

    expect(keys).toContain("telegram");
    expect(keys).not.toContain("vpn");
  });

  it("adds the VPN specialist for a VPN sales Telegram bot", () => {
    const keys = getAgentsForProject(
      "telegram-bot",
      "Telegram bot for VPN subscriptions, trials and VLESS provisioning through Sanaei.",
    ).map((agent) => agent.key);

    expect(keys).toContain("telegram");
    expect(keys).toContain("vpn");
  });

  it("adds the AI specialist when the brief contains an AI system", () => {
    const keys = getAgentsForProject(
      "custom",
      "Build a multi-agent LLM workflow with structured tool outputs.",
    ).map((agent) => agent.key);

    expect(keys).toContain("ai");
  });

  it("adds routed specialists to the project task graph", () => {
    const tasks = buildTaskGraph(
      "telegram-bot",
      "Sell VPN subscriptions with Sanaei and an AI support assistant.",
    );
    const agents = tasks.map((task) => task.agent);

    expect(agents).toEqual(expect.arrayContaining(["telegram", "vpn", "ai", "security", "qa", "lead"]));
  });
});
