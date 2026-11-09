import { NextRequest, NextResponse } from "next/server";
import { customOrderSchema } from "@/lib/validations";
import { createCustomOrder } from "@/services/customOrderService";
import { sendCustomOrderEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = customOrderSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const d = validated.data;
    const customerName = d.customerName || d.name || "Valued Guest";
    const email = d.customerEmail || d.email || "";
    const phone = d.customerPhone || d.phone || "";
    const notes = d.additionalNotes || d.notes || "";

    const result = await createCustomOrder({
      customerName,
      email,
      phone,
      eventType: d.eventType || "Custom Cake",
      eventDate: d.eventDate,
      deliveryDate: d.deliveryDate || d.eventDate,
      servings: d.servings || "10-20",
      cakeSize: d.cakeSize || "Standard",
      flavor: d.flavor || "Chef's choice",
      filling: d.filling || undefined,
      designDescription: d.designDescription,
      budgetRange: d.budgetRange || "Flexible",
      referenceImages: d.images,
      notes,
    });

    // Send transactional emails asynchronously
    sendCustomOrderEmails({
      referenceNumber: result.customOrder.referenceCode,
      customerName: result.customOrder.customerName,
      customerEmail: result.customOrder.email,
      customerPhone: result.customOrder.phone,
      eventType: result.customOrder.eventType,
      eventDate: result.customOrder.eventDate instanceof Date
        ? result.customOrder.eventDate.toISOString().slice(0, 10)
        : String(result.customOrder.eventDate),
      servings: result.customOrder.servings,
      budgetRange: result.customOrder.budgetRange,
      designDescription: result.customOrder.designDescription,
    }).catch((err) => console.error("Email send failed:", err));

    return NextResponse.json(
      {
        success: true,
        message: "Custom consultation request submitted successfully",
        data: {
          ...result.customOrder,
          referenceNumber: result.customOrder.referenceCode,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/custom-orders error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit custom order request." },
      { status: 500 }
    );
  }
}
