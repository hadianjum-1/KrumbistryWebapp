import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { initialProducts } from "@/data/mockCatalog";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all"; // 'all' | 'today' | 'yesterday' | '24h' | 'custom'
  const customDateStr = searchParams.get("date"); // 'YYYY-MM-DD'

  const now = new Date();

  // Time boundaries
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const endOfYesterday = new Date(startOfToday.getTime() - 1);

  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Custom date bounds
  let customStart = startOfToday;
  let customEnd = endOfToday;
  if (customDateStr) {
    const parts = customDateStr.split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      customStart = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
      customEnd = new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999);
    }
  }

  // Determine filter where clause
  let filterWhere: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (filter === "today") {
    filterWhere = { createdAt: { gte: startOfToday, lte: endOfToday } };
  } else if (filter === "yesterday") {
    filterWhere = { createdAt: { gte: startOfYesterday, lte: endOfYesterday } };
  } else if (filter === "24h") {
    filterWhere = { createdAt: { gte: twentyFourHoursAgo } };
  } else if (filter === "custom" && customDateStr) {
    filterWhere = { createdAt: { gte: customStart, lte: customEnd } };
  }

  try {
    // Batch 1: Key entity counts
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomOrders,
      newCustomOrders,
      totalInquiries,
      newInquiries,
    ] = await Promise.all([
      db.product.count(),
      db.product.count({ where: { published: true, available: true } }),
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { status: "COMPLETED" } }),
      db.customOrder.count(),
      db.customOrder.count({ where: { status: "NEW" } }),
      db.inquiry.count(),
      db.inquiry.count({ where: { status: "NEW" } }),
    ]);

    // Batch 2: Detailed orders and inquiries
    const [
      allPaidOrders,
      ordersLast24h,
      ordersToday,
      ordersYesterday,
      filteredOrdersList,
      recentInquiries,
    ] = await Promise.all([
      db.order.findMany({
        where: { paymentStatus: "PAID" },
        select: { total: true },
      }),
      // 24 Hours orders
      db.order.findMany({
        where: { createdAt: { gte: twentyFourHoursAgo } },
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      // Today orders
      db.order.findMany({
        where: { createdAt: { gte: startOfToday, lte: endOfToday } },
        include: { items: true },
      }),
      // Yesterday orders
      db.order.findMany({
        where: { createdAt: { gte: startOfYesterday, lte: endOfYesterday } },
        include: { items: true },
      }),
      // Filtered orders list
      db.order.findMany({
        where: filterWhere,
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      }),
      // Recent inquiries
      db.inquiry.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalRevenue = allPaidOrders.reduce(
      (acc: number, curr: { total: unknown }) => acc + Number(curr.total),
      0
    );

    // 24h metrics
    const revenue24h = ordersLast24h
      .filter((o) => o.paymentStatus === "PAID" || o.status === "COMPLETED")
      .reduce((acc, o) => acc + Number(o.total), 0);

    // Today metrics
    const revenueToday = ordersToday
      .filter((o) => o.paymentStatus === "PAID" || o.status === "COMPLETED")
      .reduce((acc, o) => acc + Number(o.total), 0);

    // Yesterday metrics
    const revenueYesterday = ordersYesterday
      .filter((o) => o.paymentStatus === "PAID" || o.status === "COMPLETED")
      .reduce((acc, o) => acc + Number(o.total), 0);

    // Filtered summary
    const filteredTotalRevenue = filteredOrdersList
      .filter((o) => o.paymentStatus === "PAID" || o.status === "COMPLETED")
      .reduce((acc, o) => acc + Number(o.total), 0);

    // Build 24-hour hourly blocks (6 blocks of 4 hours)
    const blocks24h: Array<{ label: string; count: number; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const blockEnd = new Date(now.getTime() - i * 4 * 60 * 60 * 1000);
      const blockStart = new Date(blockEnd.getTime() - 4 * 60 * 60 * 1000);
      const ordersInBlock = ordersLast24h.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= blockStart.getTime() && t < blockEnd.getTime();
      });
      const revInBlock = ordersInBlock
        .filter((o) => o.paymentStatus === "PAID" || o.status === "COMPLETED")
        .reduce((acc, o) => acc + Number(o.total), 0);

      const label = `${blockStart.getHours().toString().padStart(2, "0")}:00 - ${blockEnd.getHours().toString().padStart(2, "0")}:00`;
      blocks24h.push({
        label,
        count: ordersInBlock.length,
        revenue: revInBlock,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          active: activeProducts,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
          totalRevenue,
          recent: filteredOrdersList,
        },
        customOrders: {
          total: totalCustomOrders,
          new: newCustomOrders,
        },
        inquiries: {
          total: totalInquiries,
          new: newInquiries,
          recent: recentInquiries,
        },
        analytics: {
          filter,
          date: customDateStr || null,
          today: {
            orders: ordersToday.length,
            revenue: revenueToday,
          },
          yesterday: {
            orders: ordersYesterday.length,
            revenue: revenueYesterday,
          },
          last24h: {
            orders: ordersLast24h.length,
            revenue: revenue24h,
            blocks: blocks24h,
          },
          filtered: {
            orders: filteredOrdersList.length,
            revenue: filteredTotalRevenue,
          },
        },
      },
    });
  } catch (error) {
    console.warn("Admin dashboard query fallback:", error);
    return NextResponse.json({
      success: true,
      data: {
        products: {
          total: initialProducts.length,
          active: initialProducts.filter((p) => p.published).length,
        },
        orders: {
          total: 0,
          pending: 0,
          completed: 0,
          totalRevenue: 0,
          recent: [],
        },
        customOrders: {
          total: 0,
          new: 0,
        },
        inquiries: {
          total: 0,
          new: 0,
          recent: [],
        },
        analytics: {
          filter: "all",
          date: null,
          today: { orders: 0, revenue: 0 },
          yesterday: { orders: 0, revenue: 0 },
          last24h: { orders: 0, revenue: 0, blocks: [] },
          filtered: { orders: 0, revenue: 0 },
        },
      },
    });
  }
}
