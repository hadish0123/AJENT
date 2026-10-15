import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "hadi-dev-studio",
    version: "0.6.0",
    phase: "railway-delivery",
    capabilities: {
      agentCouncil: true,
      githubExecution: true,
      qaBrowser: true,
      railwayDelivery: true,
    },
    timestamp: new Date().toISOString(),
  });
}
