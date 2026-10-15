import { NextResponse } from "next/server";
import { bugCreateSchema } from "@/lib/qa";
import { createQABug } from "@/lib/qa-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = bugCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid QA bug.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const bug = await createQABug(id, parsed.data);
    return NextResponse.json({ bug }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record QA bug." },
      { status: 500 },
    );
  }
}
