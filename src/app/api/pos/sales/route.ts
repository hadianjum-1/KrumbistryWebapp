import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession } from "@/lib/posAuth";

export async function GET(request: NextRequest) {
  try {
    let session = null;
    try {
      session = await requirePosSession();
    } catch {
      // Allow viewing POS sales history without blocking if session cookie is missing
    }
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const date = searchParams.get("date"); // YYYY-MM-DD

    const where: any = {
      source: "POS",
    };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { receiptNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.createdAt = { gte: startOfDay, lte: endOfDay };
    }

    // Cashiers only view sales on their active device unless manager/owner
    if (session && session.role === "CASHIER") {
      const device = await db.device.findUnique({
        where: { deviceCode: session.deviceCode },
      });
      if (device) {
        where.deviceId = device.id;
      }
    }

    const sales = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      include: {
        items: true,
        payments: true,
        staff: { select: { id: true, name: true, role: true } },
        device: { select: { id: true, deviceCode: true, name: true, branch: true } },
      },
    });

    const serializedSales = sales.map((s) => ({
      id: s.id,
      orderNumber: s.orderNumber,
      receiptNumber: s.receiptNumber || s.orderNumber,
      createdAt: s.createdAt.toISOString(),
      customerName: s.customerName,
      customerPhone: s.customerPhone,
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      tax: Number(s.tax),
      total: Number(s.total),
      paymentMethod: s.paymentMethod,
      paymentStatus: s.paymentStatus,
      isOfflineSync: s.isOfflineSync,
      staff: s.staff,
      device: s.device,
      items: s.items.map((i) => ({
        id: i.id,
        name: i.productName,
        sku: i.productSku,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
        notes: i.notes,
      })),
      payments: s.payments.map((p) => ({
        id: p.id,
        method: p.method,
        amount: Number(p.amount),
        amountReceived: p.amountReceived ? Number(p.amountReceived) : null,
        changeGiven: p.changeGiven ? Number(p.changeGiven) : null,
      })),
    }));

    return NextResponse.json({ success: true, sales: serializedSales });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
