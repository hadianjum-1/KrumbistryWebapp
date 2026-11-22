import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit } from "@/lib/posAuth";
import { PosPaymentMethod, Prisma } from "@prisma/client";
import { z } from "zod";

const checkoutSchema = z.object({
  clientTransactionId: z.string().min(1).optional(),
  receiptNumber: z.string().optional(),
  customerName: z.string().default("Walk-in Customer"),
  customerPhone: z.string().default("Walk-in"),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        notes: z.string().optional(),
      })
    )
    .min(1, "Order must contain at least one item"),
  discount: z.number().min(0).default(0),
  discountReason: z.string().optional(),
  tax: z.number().min(0).default(0),
  payment: z.object({
    method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "JAZZ_CASH", "EASYPAISA"]),
    amountReceived: z.number().min(0).optional(),
    reference: z.string().optional(),
  }),
  registerSessionId: z.string().optional(),
});

function mapToOrderPaymentMethod(posMethod: string): "CASH_ON_DELIVERY" | "BANK_TRANSFER" | "ONLINE" {
  switch (posMethod?.toUpperCase()) {
    case "CASH":
      return "CASH_ON_DELIVERY";
    case "BANK_TRANSFER":
      return "BANK_TRANSFER";
    case "CARD":
    case "JAZZ_CASH":
    case "EASYPAISA":
    default:
      return "ONLINE";
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requirePosSession(["OWNER", "MANAGER", "CASHIER"]);

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid checkout request", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      clientTransactionId,
      receiptNumber: clientReceiptNumber,
      customerName,
      customerPhone,
      items: rawItems,
      discount: requestedDiscount,
      discountReason,
      tax,
      payment: paymentData,
      registerSessionId,
    } = parsed.data;

    // Check discount permissions: Only Owner and Manager can apply discounts over 0
    if (requestedDiscount > 0 && session.role === "CASHIER") {
      return NextResponse.json(
        { success: false, error: "Cashiers cannot apply custom discounts. Manager approval required." },
        { status: 403 }
      );
    }

    // Check device authorization
    const cleanDeviceCode = (session.deviceCode || "").trim();
    let device = await db.device.findUnique({
      where: { deviceCode: cleanDeviceCode },
    });

    if (!device) {
      device = await db.device.findFirst({
        where: {
          OR: [
            { deviceCode: { equals: cleanDeviceCode, mode: "insensitive" } },
            { status: "AUTHORIZED" },
          ],
        },
      });
    }

    if (!device || device.status === "REVOKED") {
      return NextResponse.json(
        { success: false, error: "This device is revoked or unauthorized." },
        { status: 403 }
      );
    }

    // 1. Fetch products & Recalculate Totals from authoritative database prices
    const productIds = rawItems.map((i) => i.productId);
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    if (dbProducts.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more products were not found in the catalog." },
        { status: 400 }
      );
    }

    let calculatedSubtotal = 0;
    const validatedOrderItems: Array<{
      productId: string;
      productName: string;
      productSku: string;
      unitPrice: number;
      quantity: number;
      totalPrice: number;
      notes?: string;
      trackInventory: boolean;
      currentStock: number;
    }> = [];

    for (const item of rawItems) {
      const p = dbProducts.find((prod) => prod.id === item.productId)!;

      if (!p.published) {
        return NextResponse.json(
          { success: false, error: `Product ${p.name} is not available for sale.` },
          { status: 400 }
        );
      }

      // Check stock availability
      if (p.trackInventory && p.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for ${p.name}. Available: ${p.stockQuantity}, Requested: ${item.quantity}`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(p.salePrice ?? p.price);
      const lineTotal = unitPrice * item.quantity;
      calculatedSubtotal += lineTotal;

      validatedOrderItems.push({
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        unitPrice,
        quantity: item.quantity,
        totalPrice: lineTotal,
        notes: item.notes,
        trackInventory: p.trackInventory,
        currentStock: p.stockQuantity,
      });
    }

    const calculatedTotal = Math.max(0, calculatedSubtotal - requestedDiscount + tax);

    // Validate cash payment
    let changeGiven = 0;
    if (paymentData.method === "CASH") {
      const tendered = paymentData.amountReceived ?? calculatedTotal;
      if (tendered < calculatedTotal) {
        return NextResponse.json(
          {
            success: false,
            error: `Cash received (Rs. ${tendered}) is less than total amount (Rs. ${calculatedTotal}).`,
          },
          { status: 400 }
        );
      }
      changeGiven = Math.max(0, tendered - calculatedTotal);
    }

    // Generate unique order number and receipt number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `POS-${dateStr}-${randomSuffix}`;
    const receiptNumber =
      clientReceiptNumber || `KRB-${session.deviceCode}-${Date.now().toString().slice(-6)}`;

    // Atomic Database Transaction
    const result = await db.$transaction(async (tx) => {
      // Create the Order record
      const order = await tx.order.create({
        data: {
          orderNumber,
          source: "POS",
          customerName,
          customerEmail: "counter@krumbistry.com",
          customerPhone,
          deliveryAddress: `Physical Counter - ${device.branch}`,
          status: "COMPLETED",
          paymentMethod: mapToOrderPaymentMethod(paymentData.method),
          paymentStatus: "PAID",
          subtotal: calculatedSubtotal,
          deliveryFee: 0,
          discount: requestedDiscount,
          tax,
          total: calculatedTotal,
          internalNotes: discountReason ? `Discount reason: ${discountReason}` : null,
          deviceId: device.id,
          staffId: session.staffId,
          registerSessionId: registerSessionId || null,
          receiptNumber,
          clientTransactionId: clientTransactionId || null,
          isOfflineSync: false,
          syncedAt: new Date(),
          items: {
            create: validatedOrderItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
              notes: item.notes,
            })),
          },
        },
      });

      // Create Payment Record
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentData.method as PosPaymentMethod,
          amount: calculatedTotal,
          amountReceived: paymentData.amountReceived || calculatedTotal,
          changeGiven,
          reference: paymentData.reference || null,
          status: "PAID",
        },
      });

      // Deduct inventory and record stock movements
      for (const item of validatedOrderItems) {
        if (item.trackInventory) {
          const newBalance = item.currentStock - item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "SALE_POS",
              quantity: -item.quantity,
              balanceAfter: newBalance,
              referenceId: order.id,
              notes: `POS Sale Receipt ${receiptNumber}`,
              staffId: session.staffId,
            },
          });
        }
      }

      // Update Register Session Totals if active session provided
      if (registerSessionId) {
        const updateData: Prisma.PosRegisterSessionUpdateInput = {};
        if (paymentData.method === "CASH") {
          updateData.cashSalesCount = { increment: 1 };
          updateData.cashSalesTotal = { increment: calculatedTotal };
        } else if (paymentData.method === "CARD") {
          updateData.cardSalesTotal = { increment: calculatedTotal };
        } else {
          updateData.otherSalesTotal = { increment: calculatedTotal };
        }

        await tx.posRegisterSession.update({
          where: { id: registerSessionId },
          data: updateData,
        });
      }

      return order;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    // Record Audit Event
    await logAudit({
      action: "POS_SALE_COMPLETED",
      entity: "Order",
      entityId: result.id,
      staffId: session.staffId,
      deviceId: device.id,
      details: {
        receiptNumber,
        total: calculatedTotal,
        paymentMethod: paymentData.method,
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: result.id,
        orderNumber: result.orderNumber,
        receiptNumber,
        createdAt: result.createdAt.toISOString(),
        cashier: session.name,
        deviceCode: session.deviceCode,
        branch: device.branch,
        customerName,
        subtotal: calculatedSubtotal,
        discount: requestedDiscount,
        tax,
        total: calculatedTotal,
        paymentMethod: paymentData.method,
        amountReceived: paymentData.amountReceived || calculatedTotal,
        change: changeGiven,
        items: validatedOrderItems.map((i) => ({
          name: i.productName,
          sku: i.productSku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          notes: i.notes,
        })),
      },
    });
  } catch (error) {
    console.error("POS Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process sale. Please try again." },
      { status: 500 }
    );
  }
}
