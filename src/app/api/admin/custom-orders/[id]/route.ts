import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateCustomOrderStatusSchema } from "@/lib/validations";
import { getCustomOrderById, updateCustomOrderStatus } from "@/services/customOrderService";
import type { CustomOrder } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Normalize DB field names to what the admin UI expects */
function normalizeCustomOrder(co: CustomOrder) {
  return {
    id: co.id,
    referenceNumber: co.referenceCode,
    customerName: co.customerName,
    customerEmail: co.email,
    customerPhone: co.phone,
    eventType: co.eventType,
    eventDate: co.eventDate instanceof Date ? co.eventDate.toISOString().slice(0, 10) : String(co.eventDate),
    deliveryDate: co.deliveryDate instanceof Date ? co.deliveryDate.toISOString().slice(0, 10) : co.deliveryDate ? String(co.deliveryDate) : null,
    servings: co.servings,
    cakeSize: co.cakeSize ?? null,
    flavor: co.flavor ?? null,
    filling: co.filling ?? null,
    designDescription: co.designDescription,
    budgetRange: co.budgetRange ?? null,
    images: co.referenceImages ?? [],
    additionalNotes: co.notes ?? null,
    status: co.status,
    quotedPrice: co.quotedPrice !== null ? Number(co.quotedPrice) : null,
    adminNotes: co.internalNotes ?? null,
    createdAt: co.createdAt,
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const customOrder = await getCustomOrderById(id);
  if (!customOrder) {
    return NextResponse.json({ success: false, error: "Custom order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: normalizeCustomOrder(customOrder) });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await request.json();
    const validated = updateCustomOrderStatusSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateCustomOrderStatus(id, {
      status: validated.data.status,
      quotedPrice: validated.data.quotedPrice,
      internalNotes: validated.data.adminNotes ?? validated.data.internalNotes,
    });
    return NextResponse.json({ success: true, data: normalizeCustomOrder(updated) });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/custom-orders/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update custom order";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
