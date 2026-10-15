import { describe, expect, it } from "vitest";
import {
  getRailwayDeliveryGate,
  getRailwayRequiredVariables,
  type RailwayDeliveryRecord,
  type RailwayVariableRecord,
} from "../../lib/railway-delivery";

const delivery: RailwayDeliveryRecord = {
  id: "delivery",
  qaRunId: "qa",
  executionId: "execution",
  projectId: "project",
  repository: "owner/repo",
  branch: "main",
  status: "healthy",
  railwayProjectId: "project-id",
  environmentId: "environment-id",
  serviceId: "service-id",
  deploymentId: "deployment-id",
  domain: "app.up.railway.app",
  healthState: "healthy",
  healthText: "Online",
  healthCheckedAt: new Date(0).toISOString(),
  lastError: "",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  completedAt: new Date(0).toISOString(),
};

function variable(name: string): RailwayVariableRecord {
  return {
    id: name,
    deliveryId: delivery.id,
    name,
    scope: "service",
    status: "synced",
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}

describe("Railway delivery gate", () => {
  it("passes only when infrastructure, required variables and health are ready", () => {
    const gate = getRailwayDeliveryGate(delivery, [variable("DATABASE_URL")]);
    expect(gate.ready).toBe(true);
    expect(gate.missingInfrastructure).toEqual([]);
    expect(gate.missingVariables).toEqual([]);
  });

  it("blocks when DATABASE_URL is not synced", () => {
    const gate = getRailwayDeliveryGate(delivery, []);
    expect(gate.ready).toBe(false);
    expect(gate.missingVariables).toEqual(["DATABASE_URL"]);
  });

  it("blocks when deployment infrastructure is incomplete", () => {
    const gate = getRailwayDeliveryGate(
      { ...delivery, domain: null, deploymentId: null },
      [variable("DATABASE_URL")],
    );

    expect(gate.ready).toBe(false);
    expect(gate.missingInfrastructure).toEqual(["deployment", "domain"]);
  });

  it("blocks unhealthy production", () => {
    const gate = getRailwayDeliveryGate(
      { ...delivery, healthState: "unhealthy", status: "failed" },
      [variable("DATABASE_URL")],
    );

    expect(gate.ready).toBe(false);
    expect(gate.healthReady).toBe(false);
  });

  it("adds specialist secrets to the Railway requirement list", () => {
    const required = getRailwayRequiredVariables({
      type: "telegram-bot",
      brief: "Sell VPN subscriptions with Sanaei provisioning.",
    });

    expect(required).toEqual(
      expect.arrayContaining([
        "DATABASE_URL",
        "TELEGRAM_BOT_TOKEN",
        "VPN_PANEL_BASE_URL",
        "VPN_PANEL_API_TOKEN",
      ]),
    );
  });
});
