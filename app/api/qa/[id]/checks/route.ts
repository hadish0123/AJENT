import { NextResponse } from "next/server";
import { qaCheckSchema } from "@/lib/qa";
import { upsertQACheck } from "@/lib/qa-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = qaCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid QA check.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const check = await upsertQACheck(id, parsed.data);
    return NextResponse.json({ check }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record QA check." },
      { status: 500 },
    );
  }
}
