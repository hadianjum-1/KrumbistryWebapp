import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await db.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        trackInventory: true,
        stockQuantity: true,
        lowStockThreshold: true,
        available: true,
        category: {
          select: { name: true },
        },
      },
    });

    const recentMovements = await db.stockMovement.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { name: true, sku: true },
        },
      },
    });

    return NextResponse.json({ success: true, products, recentMovements });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load inventory" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { productId, adjustment, type, reason } = await request.json();

    if (!productId || typeof adjustment !== "number" || adjustment === 0) {
      return NextResponse.json(
        { success: false, error: "Valid product ID and non-zero adjustment required" },
        { status: 400 }
      );
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const previousStock = product.stockQuantity;
    const newStock = Math.max(0, previousStock + adjustment);

    // Map client adjustment types to valid Prisma StockMovementType enum
    let movementType: "INITIAL" | "PURCHASE" | "SALE_POS" | "SALE_ONLINE" | "WASTAGE" | "RETURN" | "ADJUSTMENT" = "ADJUSTMENT";
    if (type === "WASTAGE") movementType = "WASTAGE";
    else if (type === "PURCHASE" || type === "RESTOCK") movementType = "PURCHASE";
    else if (type === "RETURN") movementType = "RETURN";
    else if (type === "INITIAL") movementType = "INITIAL";
    else movementType = "ADJUSTMENT";

    const [updatedProduct, movement] = await db.$transaction([
      db.product.update({
        where: { id: productId },
        data: {
          stockQuantity: newStock,
          trackInventory: true,
        },
      }),
      db.stockMovement.create({
        data: {
          productId,
          type: movementType,
          quantity: adjustment,
          balanceAfter: newStock,
          notes: reason || "Manual stock adjustment by admin",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      movement,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to adjust inventory" },
      { status: 500 }
    );
  }
}
