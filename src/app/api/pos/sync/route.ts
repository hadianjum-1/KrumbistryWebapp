import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/posAuth";
import { PosPaymentMethod, Prisma } from "@prisma/client";
import { z } from "zod";

const syncTransactionSchema = z.object({
  clientTransactionId: z.string().min(1),
  deviceCode: z.string().default("POS-01"),
  staffId: z.string().default("anonymous-staff"),
  receiptNumber: z.string(),
  createdAt: z.string(), // ISO string from local device clock
  customerName: z.string().nullish().transform((v) => v || "Walk-in Customer"),
  customerPhone: z.string().nullish().transform((v) => v || "Walk-in"),
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string().nullish().transform((v) => v || "Bakery Item"),
      productSku: z.string().nullish().transform((v) => v || ""),
      unitPrice: z.number().min(0),
      quantity: z.number().int().min(1),
      notes: z.string().optional(),
    })
  ),
  subtotal: z.number().min(0),
  discount: z.number().min(0).default(0),
  discountReason: z.string().optional(),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  payment: z.object({
    method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "JAZZ_CASH", "EASYPAISA"]),
    amountReceived: z.number().min(0).optional(),
    changeGiven: z.number().min(0).optional(),
    reference: z.string().optional(),
  }),
});

const syncBatchSchema = z.object({
  deviceCode: z.string(),
  transactions: z.array(syncTransactionSchema),
  registerMovements: z
    .array(
      z.object({
        clientMovementId: z.string().optional(),
        type: z.enum(["CASH_IN", "CASH_OUT"]),
        amount: z.number().positive(),
        reason: z.string(),
        createdAt: z.string(),
        staffId: z.string(),
      })
    )
    .optional()
    .default([]),
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
    const body = await request.json();
    const parsed = syncBatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid sync batch schema.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { deviceCode, transactions, registerMovements } = parsed.data;

    // 1. Verify Device
    const cleanCode = (deviceCode || "").trim();
    let device = await db.device.findUnique({
      where: { deviceCode: cleanCode },
    });

    if (!device) {
      // Fallback: check case-insensitive or any authorized device
      device = await db.device.findFirst({
        where: {
          OR: [
            { deviceCode: { equals: cleanCode, mode: "insensitive" } },
            { status: "AUTHORIZED" },
          ],
        },
      });
    }

    if (!device) {
      return NextResponse.json(
        { success: false, error: `Device ${deviceCode} is not registered.` },
        { status: 403 }
      );
    }

    if (device.status === "REVOKED") {
      return NextResponse.json(
        { success: false, error: `Device ${deviceCode} has been revoked.` },
        { status: 403 }
      );
    }

    const syncedTransactionIds: string[] = [];
    const conflictReports: Array<{
      clientTransactionId: string;
      productId: string;
      productName: string;
      oversoldQuantity: number;
      availableStock: number;
    }> = [];
    const failedTransactions: Array<{ clientTransactionId: string; error: string }> = [];

    // 2. Process each offline transaction atomically
    for (const txData of transactions) {
      try {
        // Idempotency check: Has this clientTransactionId already been synchronized?
        const existingOrder = await db.order.findUnique({
          where: { clientTransactionId: txData.clientTransactionId },
        });

        if (existingOrder) {
          // Already synchronized, safely acknowledge
          syncedTransactionIds.push(txData.clientTransactionId);
          continue;
        }

        // Verify staff validity (or fallback to device's registered staff)
        let staff = await db.staff.findUnique({ where: { id: txData.staffId } });
        if (!staff) {
          staff = await db.staff.findFirst({ where: { active: true } });
        }

        const dateStr = new Date(txData.createdAt).toISOString().slice(0, 10).replace(/-/g, "");
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const orderNumber = `POS-OFF-${dateStr}-${randomSuffix}`;

        // Atomic transaction per sale
        await db.$transaction(async (prismaTx) => {
          // Check stock levels for all products in this offline sale
          for (const item of txData.items) {
            const product = await prismaTx.product.findUnique({
              where: { id: item.productId },
            });

            if (product && product.trackInventory) {
              const currentStock = product.stockQuantity;
              const isOversold = currentStock < item.quantity;

              if (isOversold) {
                // Record inventory conflict for manager/owner review!
                // Real offline cash sales are NOT discarded; they are recorded with an audit conflict!
                const oversoldBy = item.quantity - Math.max(0, currentStock);

                await prismaTx.inventoryConflict.create({
                  data: {
                    clientTransactionId: txData.clientTransactionId,
                    deviceId: device.id,
                    productId: product.id,
                    productName: product.name,
                    requestedQuantity: item.quantity,
                    availableQuantityAtSync: currentStock,
                    status: "PENDING_REVIEW",
                    notes: `Device ${deviceCode} sold ${item.quantity} units while offline on ${txData.createdAt}. Available stock at sync was ${currentStock}. Oversold by ${oversoldBy} units.`,
                  },
                });

                conflictReports.push({
                  clientTransactionId: txData.clientTransactionId,
                  productId: product.id,
                  productName: product.name,
                  oversoldQuantity: oversoldBy,
                  availableStock: currentStock,
                });
              }

              // Decrement stock (allows negative if oversold, explicitly auditable)
              const newBalance = currentStock - item.quantity;
              await prismaTx.product.update({
                where: { id: product.id },
                data: { stockQuantity: newBalance },
              });

              // Record stock movement
              await prismaTx.stockMovement.create({
                data: {
                  productId: product.id,
                  type: "SALE_POS",
                  quantity: -item.quantity,
                  balanceAfter: newBalance,
                  notes: `Offline POS Sale Receipt ${txData.receiptNumber} (Device: ${deviceCode})`,
                  staffId: staff?.id || null,
                  createdAt: new Date(txData.createdAt),
                },
              });
            }
          }

          // Prepare order items, resolving existing product IDs to prevent foreign key issues
          const preparedItems = await Promise.all(
            txData.items.map(async (i) => {
              const productExists = await prismaTx.product.findUnique({
                where: { id: i.productId },
                select: { id: true },
              });
              return {
                productId: productExists ? productExists.id : null,
                productName: i.productName,
                productSku: i.productSku,
                unitPrice: i.unitPrice,
                quantity: i.quantity,
                totalPrice: i.unitPrice * i.quantity,
                notes: i.notes,
              };
            })
          );

          // Create the Order
          const createdOrder = await prismaTx.order.create({
            data: {
              orderNumber,
              source: "POS",
              customerName: txData.customerName,
              customerEmail: "counter@krumbistry.com",
              customerPhone: txData.customerPhone,
              deliveryAddress: `Physical Counter - ${device.branch}`,
              status: "COMPLETED",
              paymentMethod: mapToOrderPaymentMethod(txData.payment.method),
              paymentStatus: "PAID",
              subtotal: txData.subtotal,
              deliveryFee: 0,
              discount: txData.discount,
              tax: txData.tax,
              total: txData.total,
              internalNotes: txData.discountReason
                ? `Offline sync. Discount reason: ${txData.discountReason}`
                : "Offline sync",
              deviceId: device.id,
              staffId: staff?.id || null,
              receiptNumber: txData.receiptNumber,
              clientTransactionId: txData.clientTransactionId,
              isOfflineSync: true,
              syncedAt: new Date(),
              createdAt: new Date(txData.createdAt),
              items: {
                create: preparedItems,
              },
            },
          });

          // Create Payment record
          await prismaTx.payment.create({
            data: {
              orderId: createdOrder.id,
              method: txData.payment.method as PosPaymentMethod,
              amount: txData.total,
              amountReceived: txData.payment.amountReceived || txData.total,
              changeGiven: txData.payment.changeGiven || 0,
              reference: txData.payment.reference || null,
              status: "PAID",
              createdAt: new Date(txData.createdAt),
            },
          });
        }, {
          maxWait: 10000,
          timeout: 30000,
        });

        syncedTransactionIds.push(txData.clientTransactionId);
      } catch (txErr: unknown) {
        console.error(`Sync error for transaction ${txData.clientTransactionId}:`, txErr);
        failedTransactions.push({
          clientTransactionId: txData.clientTransactionId,
          error: txErr instanceof Error ? txErr.message : "Sync write failed",
        });
      }
    }

    // 3. Update Device Last Sync Timestamp & Record Sync Batch
    const now = new Date();
    await db.device.update({
      where: { id: device.id },
      data: { lastSyncAt: now },
    });

    await db.posSyncBatch.create({
      data: {
        deviceId: device.id,
        transactionsCount: transactions.length,
        successCount: syncedTransactionIds.length,
        conflictCount: conflictReports.length,
        failedCount: failedTransactions.length,
        syncedAt: now,
      },
    });

    await logAudit({
      action: "POS_OFFLINE_SYNC",
      entity: "PosSyncBatch",
      deviceId: device.id,
      details: {
        deviceCode,
        syncedCount: syncedTransactionIds.length,
        conflictsCount: conflictReports.length,
        failedCount: failedTransactions.length,
      },
    });

    return NextResponse.json({
      success: true,
      syncedAt: now.toISOString(),
      syncedTransactionIds,
      conflictReports,
      failedTransactions,
    });
  } catch (error) {
    console.error("POST /api/pos/sync fatal error:", error);
    return NextResponse.json(
      { success: false, error: "Synchronization service error." },
      { status: 500 }
    );
  }
}
