import { NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import {
  getSpecialistExecutionChecks,
  getSpecialistQaChecks,
  getSpecialistVariableNames,
  getSpecialistWorkflows,
} from "@/lib/specialist-workflows";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({
      projectId: project.id,
      projectType: project.type,
      workflows: getSpecialistWorkflows(project.type, project.brief),
      executionChecks: getSpecialistExecutionChecks(project.type, project.brief),
      qaChecks: getSpecialistQaChecks(project.type, project.brief),
      variables: getSpecialistVariableNames(project.type, project.brief),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load specialist workflows." },
      { status: 500 },
    );
  }
}
