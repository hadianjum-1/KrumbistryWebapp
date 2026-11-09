import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getCustomOrders } from "@/services/customOrderService";
import type { CustomOrder } from "@prisma/client";

function normalizeCustomOrder(co: CustomOrder) {
  return {
    id: co.id,
    referenceNumber: co.referenceCode,
    customerName: co.customerName,
    customerEmail: co.email,
    customerPhone: co.phone,
    eventType: co.eventType,
    eventDate: co.eventDate instanceof Date ? co.eventDate.toISOString().slice(0, 10) : String(co.eventDate),
    servings: co.servings,
    budgetRange: co.budgetRange ?? null,
    images: co.referenceImages ?? [],
    status: co.status,
    quotedPrice: co.quotedPrice !== null ? Number(co.quotedPrice) : null,
    createdAt: co.createdAt,
  };
}

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const result = await getCustomOrders({ status, search, page, limit });
  return NextResponse.json({
    success: true,
    data: result.orders.map(normalizeCustomOrder),
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}
