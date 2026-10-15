import { describe, expect, it } from "vitest";
import {
  getSpecialistExecutionChecks,
  getSpecialistQaChecks,
  getSpecialistWorkflows,
  hasAiScope,
  hasVpnScope,
} from "../../lib/specialist-workflows";

describe("specialist workflow routing", () => {
  it("routes a normal Telegram bot to the Telegram workflow only", () => {
    const keys = getSpecialistWorkflows(
      "telegram-bot",
      "Build a support bot with commands and ticket routing.",
    ).map((workflow) => workflow.key);

    expect(keys).toEqual(["telegram"]);
  });

  it("activates VPN workflow for a VPN sales Telegram bot", () => {
    const keys = getSpecialistWorkflows(
      "telegram-bot",
      "Sell VPN subscriptions and provision VLESS accounts using Sanaei panel.",
    ).map((workflow) => workflow.key);

    expect(keys).toEqual(["telegram", "vpn"]);
    expect(hasVpnScope("telegram-bot", "Sanaei VPN subscription bot")).toBe(true);
  });

  it("activates AI workflow when AI scope is explicit", () => {
    expect(hasAiScope("custom", "Multi-agent LLM decision system")).toBe(true);
    expect(
      getSpecialistWorkflows("ai-system", "Structured AI assistant").map((item) => item.key),
    ).toEqual(["ai"]);
  });

  it("routes mobile and game projects to their specialist workflows", () => {
    expect(getSpecialistWorkflows("mobile-app").map((item) => item.key)).toEqual(["mobile"]);
    expect(getSpecialistWorkflows("game").map((item) => item.key)).toEqual(["game"]);
  });

  it("provides project-specific execution and QA gates", () => {
    expect(
      getSpecialistExecutionChecks("vpn-panel", "Subscription panel"),
    ).toContain("vpn-provider-contract");

    expect(
      getSpecialistQaChecks("game", "2D game"),
    ).toContain("game-playable-smoke");
  });
});
