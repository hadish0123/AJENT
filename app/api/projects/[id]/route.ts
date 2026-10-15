import { NextResponse } from "next/server";
import { getProject, updateProject } from "@/lib/db";
import { updateProjectSchema } from "@/lib/projects";
import { auditMutation } from "@/lib/audit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load project." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const project = await updateProject(id, parsed.data);

    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    await auditMutation(request, { action: "project.update", resourceType: "project", resourceId: project.id, metadata: { status: project.status } });
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update project." },
      { status: 500 },
    );
  }
}
