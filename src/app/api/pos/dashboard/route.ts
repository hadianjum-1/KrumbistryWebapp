import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession } from "@/lib/posAuth";

export async function GET(request: NextRequest) {
  try {
    let session = null;
    try {
      session = await requirePosSession();
    } catch {
      // Allow read-only metrics access for dashboard display even if session is not yet authenticated
    }

    const { searchParams } = new URL(request.url);
    const rawDeviceCode = searchParams.get("deviceCode") || session?.deviceCode || "POS-01";
    const cleanDeviceCode = rawDeviceCode.trim() || "POS-01";

    let device = await db.device.findUnique({
      where: { deviceCode: cleanDeviceCode },
      select: { id: true, deviceCode: true, name: true, branch: true, status: true, lastSyncAt: true },
    });

    if (!device) {
      device = await db.device.findFirst({
        where: {
          OR: [
            { deviceCode: { equals: cleanDeviceCode, mode: "insensitive" } },
            { status: "AUTHORIZED" },
          ],
        },
        select: { id: true, deviceCode: true, name: true, branch: true, status: true, lastSyncAt: true },
      });
    }

    if (!device) {
      device = await db.device.create({
        data: {
          deviceCode: cleanDeviceCode,
          name: cleanDeviceCode.toUpperCase().includes("POS") ? cleanDeviceCode : `Terminal ${cleanDeviceCode}`,
          branch: "Main Bakery",
          status: "AUTHORIZED",
          allowOffline: true,
          secretTokenHash: "auto-provisioned",
        },
        select: { id: true, deviceCode: true, name: true, branch: true, status: true, lastSyncAt: true },
      });
    }

    // Calculate today in server's local time (Peshawar / PKT or host time)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    // Get today's POS orders (either created today or synced today)
    const todayOrders = await db.order.findMany({
      where: {
        source: "POS",
        OR: [
          { createdAt: { gte: startOfToday } },
          { syncedAt: { gte: startOfToday } },
        ],
      },
      include: {
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    let todaySalesTotal = 0;
    let cashCollected = 0;
    let cardCollected = 0;
    let otherCollected = 0;

    for (const order of todayOrders) {
      const orderTotal = Number(order.total);
      todaySalesTotal += orderTotal;

      if (order.payments && order.payments.length > 0) {
        for (const p of order.payments) {
          const amt = Number(p.amount);
          if (p.method === "CASH") {
            cashCollected += amt;
          } else if (p.method === "CARD") {
            cardCollected += amt;
          } else {
            otherCollected += amt;
          }
        }
      } else {
        // Fallback to order paymentMethod
        if (order.paymentMethod === "CASH_ON_DELIVERY") {
          cashCollected += orderTotal;
        } else if (order.paymentMethod === "ONLINE") {
          cardCollected += orderTotal;
        } else {
          otherCollected += orderTotal;
        }
      }
    }

    const transactionCount = todayOrders.length;
    const avgTransactionValue = transactionCount > 0 ? todaySalesTotal / transactionCount : 0;

    // Check active register session for this device or any active shop drawer
    let activeRegister = device
      ? await db.posRegisterSession.findFirst({
          where: { deviceId: device.id, status: "OPEN" },
          include: {
            staff: { select: { id: true, name: true, role: true } },
            device: { select: { id: true, deviceCode: true, name: true } },
          },
          orderBy: { openedAt: "desc" },
        })
      : null;

    if (!activeRegister) {
      activeRegister = await db.posRegisterSession.findFirst({
        where: { status: "OPEN" },
        include: {
          staff: { select: { id: true, name: true, role: true } },
          device: { select: { id: true, deviceCode: true, name: true } },
        },
        orderBy: { openedAt: "desc" },
      });
    }

    // Unresolved inventory conflicts count
    const pendingConflictsCount = await db.inventoryConflict.count({
      where: { status: "PENDING_REVIEW" },
    });

    // Recent 5 sales
    const recentSales = todayOrders.slice(0, 5).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      receiptNumber: o.receiptNumber || o.orderNumber,
      total: Number(o.total),
      paymentMethod: o.payments[0]?.method || o.paymentMethod || "CASH",
      createdAt: o.createdAt.toISOString(),
      customerName: o.customerName,
    }));

    const openingCashNum = Number(activeRegister?.openingCash || 0);
    const cashSalesTotalNum = Number(activeRegister?.cashSalesTotal || 0);
    const cashInTotalNum = Number(activeRegister?.cashInTotal || 0);
    const cashOutTotalNum = Number(activeRegister?.cashOutTotal || 0);
    const expectedDrawerCash = openingCashNum + cashSalesTotalNum + cashInTotalNum - cashOutTotalNum;

    return NextResponse.json({
      success: true,
      metrics: {
        todaySalesTotal,
        transactionCount,
        cashCollected,
        cardCollected,
        otherCollected,
        avgTransactionValue,
        pendingConflictsCount,
      },
      device,
      activeRegister: activeRegister
        ? {
            id: activeRegister.id,
            openedAt: activeRegister.openedAt.toISOString(),
            openingCash: openingCashNum,
            expectedCash: expectedDrawerCash,
            cashSalesTotal: cashSalesTotalNum,
            cardSalesTotal: Number(activeRegister.cardSalesTotal || 0),
            otherSalesTotal: Number(activeRegister.otherSalesTotal || 0),
            cashSalesCount: activeRegister.cashSalesCount || 0,
            status: "OPEN",
            staff: activeRegister.staff,
            deviceCode: activeRegister.device?.deviceCode || cleanDeviceCode,
          }
        : null,
      recentSales,
      currentStaff: session
        ? {
            id: session.staffId,
            name: session.name,
            role: session.role,
          }
        : activeRegister?.staff
        ? {
            id: activeRegister.staff.id,
            name: activeRegister.staff.name,
            role: activeRegister.staff.role,
          }
        : {
            id: "master",
            name: "Master / Cashier",
            role: "OWNER",
          },
    });
  } catch (err: unknown) {
    console.error("POS Dashboard API error:", err);
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg === "UNAUTHORIZED" ? 401 : msg === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}
