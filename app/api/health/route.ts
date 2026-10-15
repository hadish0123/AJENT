import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "hadi-dev-studio",
    version: "0.5.0",
    phase: "qa-browser-testing",
    capabilities: {
      agentCouncil: true,
      githubExecution: true,
      qaBrowser: true,
      railwayDeployment: false,
    },
    timestamp: new Date().toISOString(),
  });
}
