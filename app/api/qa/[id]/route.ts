import { NextResponse } from "next/server";
import { getQARunBundle } from "@/lib/qa-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const bundle = await getQARunBundle(id);

    if (!bundle) {
      return NextResponse.json({ error: "QA run not found." }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load QA run." },
      { status: 500 },
    );
  }
}
