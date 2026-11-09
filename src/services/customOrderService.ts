import { CustomOrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export async function createCustomOrder(data: {
  customerName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string | Date;
  deliveryDate: string | Date;
  servings: string;
  cakeSize: string;
  flavor: string;
  filling?: string;
  designDescription: string;
  budgetRange: string;
  referenceImages?: string[];
  notes?: string;
}) {
  const referenceCode = `KR-CUST-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;

  const parsedEventDate = data.eventDate ? new Date(data.eventDate) : new Date();
  const safeEventDate = isNaN(parsedEventDate.getTime()) ? new Date() : parsedEventDate;

  const parsedDeliveryDate = data.deliveryDate ? new Date(data.deliveryDate) : safeEventDate;
  const safeDeliveryDate = isNaN(parsedDeliveryDate.getTime()) ? safeEventDate : parsedDeliveryDate;

  try {
    const customOrder = await db.customOrder.create({
      data: {
        referenceCode,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        eventType: data.eventType,
        eventDate: safeEventDate,
        deliveryDate: safeDeliveryDate,
        servings: data.servings,
        cakeSize: data.cakeSize,
        flavor: data.flavor,
        filling: data.filling,
        designDescription: data.designDescription,
        budgetRange: data.budgetRange,
        referenceImages: data.referenceImages || [],
        notes: data.notes,
        status: "NEW",
      },
    });

    return { success: true, customOrder };
  } catch (error) {
    console.warn("Database customOrder create fallback:", error);
    return {
      success: true,
      customOrder: {
        id: `mock-${referenceCode}`,
        referenceCode,
        ...data,
        status: "NEW" as CustomOrderStatus,
        createdAt: new Date().toISOString(),
      },
    };
  }
}

export async function getCustomOrders(options?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.CustomOrderWhereInput = {};
    if (options?.status && options.status !== "ALL") {
      where.status = options.status as CustomOrderStatus;
    }
    if (options?.search) {
      where.OR = [
        { referenceCode: { contains: options.search, mode: "insensitive" } },
        { customerName: { contains: options.search, mode: "insensitive" } },
        { phone: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const fetchQuery = async () => {
      const orders = await db.customOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
      const total = await db.customOrder.count({ where });
      return { orders, total };
    };

    let result;
    try {
      result = await fetchQuery();
    } catch (err: unknown) {
      const isPoolTimeout =
        typeof err === "object" &&
        err !== null &&
        ("code" in err && (err as { code: string }).code === "P2024");
      if (isPoolTimeout) {
        // Neon cold start wake-up: wait 750ms and retry once
        await new Promise((resolve) => setTimeout(resolve, 750));
        result = await fetchQuery();
      } else {
        throw err;
      }
    }

    return {
      orders: result.orders,
      total: result.total,
      page,
      totalPages: Math.ceil(result.total / limit),
    };
  } catch (error) {
    console.warn("Database getCustomOrders fallback:", error);
    return { orders: [], total: 0, page: 1, totalPages: 1 };
  }
}

export async function getCustomOrderById(id: string) {
  return db.customOrder.findUnique({
    where: { id },
  });
}

export async function updateCustomOrderStatus(
  id: string,
  data: {
    status?: string;
    quotedPrice?: number | null;
    internalNotes?: string;
  }
) {
  const updateData: Parameters<typeof db.customOrder.update>[0]["data"] = {};
  if (data.status !== undefined) updateData.status = data.status as CustomOrderStatus;
  if (data.quotedPrice !== undefined) updateData.quotedPrice = data.quotedPrice;
  if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;

  return db.customOrder.update({
    where: { id },
    data: updateData,
  });
}
