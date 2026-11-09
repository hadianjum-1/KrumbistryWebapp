import { NextRequest, NextResponse } from "next/server";
import { createOrderSchema } from "@/lib/validations";
import { createOrder } from "@/services/orderService";
import { sendOrderConfirmationEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = createOrderSchema.safeParse(json);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors)
        .map(([k, v]) => `${k}: ${v?.join(", ")}`)
        .join("; ");
      console.error("POST /api/orders validation failed:", errorMsg, JSON.stringify(json));
      return NextResponse.json(
        {
          success: false,
          error: errorMsg || "Validation error",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await createOrder(validated.data);

    // Send order confirmation emails asynchronously
    sendOrderConfirmationEmails({
      orderNumber: result.order.orderNumber,
      customerName: result.order.customerName,
      customerEmail: result.order.customerEmail,
      customerPhone: result.order.customerPhone,
      deliveryType: "Standard Delivery",
      deliveryAddress: result.order.deliveryAddress,
      items: result.order.items.map((it) => ({
        name: it.productName,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        totalPrice: Number(it.totalPrice),
      })),
      subtotal: Number(result.order.subtotal),
      deliveryFee: Number(result.order.deliveryFee),
      total: Number(result.order.total),
    }).catch((err) => console.error("Order email error:", err));

    return NextResponse.json(
      {
        success: true,
        message: "Order placed successfully",
        data: result.order,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/orders error:", error);
    const message = error instanceof Error ? error.message : "Failed to process order.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
