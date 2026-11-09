import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateOrderStatusSchema } from "@/lib/validations";
import { getOrderById, updateOrderStatus } from "@/services/orderService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface DbOrderItem {
  id: string;
  productId?: string | null;
  productName?: string;
  name?: string;
  productSku?: string;
  unitPrice: unknown;
  quantity: number;
  totalPrice: unknown;
  notes?: string | null;
  product?: {
    mainImage: string;
    slug: string;
  } | null;
}

interface DbOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  customerNotes?: string | null;
  internalNotes?: string | null;
  status: string;
  paymentStatus: string;
  subtotal: unknown;
  deliveryFee: unknown;
  total: unknown;
  createdAt: Date | string;
  items?: DbOrderItem[];
}

function normalizeOrder(order: DbOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    deliveryType: "Delivery",
    deliveryAddress: order.deliveryAddress,
    deliveryDate: null,
    deliveryTimeSlot: null,
    specialInstructions: order.customerNotes ?? null,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    discount: 0,
    total: Number(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus,
    notes: order.internalNotes ?? null,
    createdAt: order.createdAt,
    items: (order.items || []).map((item) => ({
      id: item.id,
      name: item.productName || item.name || "Bakery Creation",
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      notes: item.notes ?? null,
      product: item.product ?? undefined,
    })),
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: normalizeOrder(order as unknown as DbOrder) });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await request.json();
    const validated = updateOrderStatusSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatus(id, validated.data);
    return NextResponse.json({ success: true, data: normalizeOrder(updated as unknown as DbOrder) });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/orders/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
