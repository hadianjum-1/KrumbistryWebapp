import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/services/settingsService";
import { initialProducts } from "@/data/mockCatalog";

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  customerNotes?: string;
  paymentMethod?: PaymentMethod;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string;
  }>;
}

export async function createOrder(input: CreateOrderInput) {
  const siteSettings = await getSettings();

  // 1. Fetch products from database or fallback catalog
  const productIds = input.items.map((i) => i.productId);

  let verifiedProducts: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    available: boolean;
  }> = [];

  try {
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds } },
    });
    verifiedProducts = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: Number(p.salePrice ?? p.price),
      available: p.available,
    }));
  } catch (error) {
    console.warn("Database lookup fallback during order creation:", error);
  }

  // Fallback to mock catalog if needed
  if (verifiedProducts.length === 0) {
    verifiedProducts = initialProducts
      .filter((p) => productIds.includes(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.salePrice ?? p.price,
        available: p.available,
      }));
  }

  // 2. Server-Side Price Calculation & Verification
  let subtotal = 0;
  const orderItemsData: Array<{
    productId: string;
    productName: string;
    productSku: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    notes?: string;
  }> = [];

  for (const item of input.items) {
    const matched = verifiedProducts.find((p) => p.id === item.productId);
    if (!matched) {
      throw new Error(`Product with ID ${item.productId} was not found or is unavailable.`);
    }
    if (!matched.available) {
      throw new Error(`Product ${matched.name} is currently out of stock.`);
    }

    const itemTotal = matched.price * item.quantity;
    subtotal += itemTotal;

    orderItemsData.push({
      productId: matched.id,
      productName: matched.name,
      productSku: matched.sku,
      unitPrice: matched.price,
      quantity: item.quantity,
      totalPrice: itemTotal,
      notes: item.notes,
    });
  }

  // Check minimum order amount
  if (subtotal < siteSettings.minimumOrderAmount) {
    throw new Error(
      `Minimum order amount is ${siteSettings.currencySymbol} ${siteSettings.minimumOrderAmount.toLocaleString()}`
    );
  }

  // Calculate delivery fee
  const deliveryFee =
    subtotal >= siteSettings.freeDeliveryThreshold ? 0 : siteSettings.deliveryFee;
  const total = subtotal + deliveryFee;

  // Generate unique order number
  const orderNumber = `KR-ORD-${Date.now().toString().slice(-6)}${Math.floor(100 + Math.random() * 900)}`;

  // 3. Database Transaction
  try {
    const createdOrder = await db.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          deliveryAddress: input.deliveryAddress,
          customerNotes: input.customerNotes,
          status: "PENDING",
          paymentMethod: input.paymentMethod || "CASH_ON_DELIVERY",
          paymentStatus: "UNPAID",
          subtotal,
          deliveryFee,
          total,
          items: {
            create: orderItemsData.map((item) => ({
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
        include: { items: true },
      });

      return order;
    });

    return {
      success: true,
      order: createdOrder,
    };
  } catch (dbError) {
    console.warn("Database order transaction fallback:", dbError);
    // Return structured receipt if db is not connected yet
    return {
      success: true,
      order: {
        id: `mock-${orderNumber}`,
        orderNumber,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        customerNotes: input.customerNotes,
        status: "PENDING" as OrderStatus,
        paymentMethod: (input.paymentMethod || "CASH_ON_DELIVERY") as PaymentMethod,
        paymentStatus: "UNPAID" as PaymentStatus,
        subtotal,
        deliveryFee,
        total,
        items: orderItemsData,
        createdAt: new Date().toISOString(),
      },
    };
  }
}

export async function getOrders(options?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.OrderWhereInput = {};
    if (options?.status && options.status !== "ALL") {
      where.status = options.status as OrderStatus;
    }
    if (options?.search) {
      where.OR = [
        { orderNumber: { contains: options.search, mode: "insensitive" } },
        { customerName: { contains: options.search, mode: "insensitive" } },
        { customerPhone: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const fetchQuery = async () => {
      const orders = await db.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
      const total = await db.order.count({ where });
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
    console.warn("Database getOrders fallback:", error);
    return { orders: [], total: 0, page: 1, totalPages: 1 };
  }
}

export async function getOrderById(id: string) {
  return db.order.findUnique({
    where: { id },
    include: { items: true },
  });
}

export async function updateOrderStatus(
  id: string,
  data: {
    status?: string;
    paymentStatus?: string;
    notes?: string;
    internalNotes?: string;
  }
) {
  // Map UI field names to Prisma field names, coerce payment status to valid enum
  const updateData: Prisma.OrderUpdateInput = {};
  if (data.status) updateData.status = data.status as OrderStatus;
  if (data.paymentStatus) {
    // "PENDING" from UI maps to "UNPAID" in DB schema
    const pmtMap: Record<string, string> = { PENDING: "UNPAID" };
    updateData.paymentStatus = (pmtMap[data.paymentStatus] ?? data.paymentStatus) as PaymentStatus;
  }
  if (data.notes !== undefined) updateData.internalNotes = data.notes;
  if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;

  return db.order.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });
}
