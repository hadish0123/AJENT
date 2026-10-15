import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents";

export function GET() {
  return NextResponse.json({
    count: AGENTS.length,
    agents: AGENTS,
  });
}
