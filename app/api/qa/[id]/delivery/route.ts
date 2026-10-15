import { NextResponse } from "next/server";
import { createRailwayDeliverySchema } from "@/lib/railway-delivery";
import {
  createRailwayDelivery,
  getRailwayDeliveryByQaRun,
} from "@/lib/railway-delivery-db";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const delivery = await getRailwayDeliveryByQaRun(id);
    return NextResponse.json({ delivery });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Railway delivery." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = createRailwayDeliverySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Railway delivery payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const delivery = await createRailwayDelivery(
      id,
      parsed.data.repository,
      parsed.data.branch,
    );

    return NextResponse.json({ delivery }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Railway delivery.";
    return NextResponse.json(
      { error: message },
      {
        status: message.includes("not found")
          ? 404
          : message.includes("QA gate")
            ? 409
            : 500,
      },
    );
  }
}
