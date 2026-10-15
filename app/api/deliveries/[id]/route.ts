import { NextResponse } from "next/server";
import { railwayDeliverySyncSchema } from "@/lib/railway-delivery";
import {
  getRailwayDeliveryBundle,
  syncRailwayDelivery,
} from "@/lib/railway-delivery-db";
import { auditMutation } from "@/lib/audit";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const bundle = await getRailwayDeliveryBundle(id);

    if (!bundle) {
      return NextResponse.json({ error: "Railway delivery not found." }, { status: 404 });
    }

    return NextResponse.json(bundle);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Railway delivery." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = railwayDeliverySyncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid Railway delivery update.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const delivery = await syncRailwayDelivery(id, parsed.data);
    await auditMutation(request, { action: "delivery.sync", resourceType: "delivery", resourceId: delivery.id, metadata: { status: delivery.status, healthState: delivery.healthState } });
    return NextResponse.json({ delivery });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Railway delivery.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : 500 },
    );
  }
}
