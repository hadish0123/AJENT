import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "hadi-dev-studio",
    version: "0.7.0",
    phase: "specialist-workflows",
    capabilities: {
      agentCouncil: true,
      githubExecution: true,
      qaBrowser: true,
      railwayDelivery: true,
      specialistWorkflows: true,
    },
    timestamp: new Date().toISOString(),
  });
}
