import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auditMutation } from "@/lib/audit";
import { insertProject, listProjects } from "@/lib/db";
import {
  buildInitialRequirements,
  buildTaskGraph,
  createProjectSchema,
  type ProjectRecord,
} from "@/lib/projects";

export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load projects." },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid project payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const input = parsed.data;

    const project: ProjectRecord = {
      id: randomUUID(),
      name: input.name,
      clientName: input.clientName,
      type: input.type,
      brief: input.brief,
      budget: input.budget,
      deadline: input.deadline,
      status: "intake",
      requirements: buildInitialRequirements(input),
      taskGraph: buildTaskGraph(input.type, input.brief),
      createdAt: now,
      updatedAt: now,
    };

    const saved = await insertProject(project);
    await auditMutation(request, { action: "project.create", resourceType: "project", resourceId: saved.id, metadata: { type: saved.type } });
    return NextResponse.json({ project: saved }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create project." },
      { status: 500 },
    );
  }
}
