"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  product?: {
    mainImage: string;
    slug: string;
  };
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: string;
  deliveryAddress: string | null;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  specialInstructions: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: string;
  paymentStatus: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields
  const [currentStatus, setCurrentStatus] = useState("");
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/admin/orders/${orderId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.data) {
          throw new Error(json.error || "Order not found");
        }
        setOrder(json.data);
        setCurrentStatus(json.data.status);
        setCurrentPaymentStatus(json.data.paymentStatus);
        setAdminNotes(json.data.notes || "");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error loading order";
        setErrorMessage(msg);
      })
      .finally(() => setIsLoading(false));
  }, [orderId]);

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: currentStatus,
          paymentStatus: currentPaymentStatus,
          notes: adminNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update order status");
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: currentStatus,
              paymentStatus: currentPaymentStatus,
              notes: adminNotes,
            }
          : prev
      );
      setSuccessMessage("Order status and notes updated successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating order";
      setErrorMessage(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!order) return "#";
    const cleanPhone = order.customerPhone.replace(/[^\d+]/g, "");
    const msg = `Hello ${order.customerName}, this is KRUMBISTRY Bake Shop regarding your order #${order.orderNumber}.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
        <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
        <span className="text-xs text-[#32190D]/60">Retrieving order dossier...</span>
      </div>
    );
  }

  if (errorMessage && !order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 flex items-start gap-3">
        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-base">Order Not Found</h2>
          <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
          <Link
            href="/admin/orders"
            className="inline-block mt-3 text-xs font-semibold text-[#32190D] underline"
          >
            ← Return to Orders List
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-lg border border-[#32190D]/10 bg-white hover:bg-[#F8F3E9] text-[#32190D] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-bold text-[#32190D]">
                #{order.orderNumber}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#D6A64B]/40 bg-[#D6A64B]/15 text-[#8C6219]">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-[#32190D]/60 mt-0.5">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-colors shadow-2xs cursor-pointer"
          >
            <Printer size={14} className="text-[#D6A64B]" />
            <span>Print Receipt</span>
          </button>

          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-xs font-semibold text-white hover:bg-[#20ba5a] transition-colors shadow-sm"
          >
            <MessageCircle size={15} />
            <span>WhatsApp Customer</span>
          </a>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Items & Fulfillment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ordered Items Table */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219] mb-4">
              Ordered Creations ({order.items.length})
            </h2>

            <div className="divide-y divide-[#32190D]/5">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm text-[#32190D]">
                      {item.name}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-[#32190D]/60 mt-0.5 italic">
                        &quot;{item.notes}&quot;
                      </p>
                    )}
                    <div className="text-xs text-[#32190D]/60 mt-1 font-mono">
                      Rs. {Number(item.unitPrice).toLocaleString()} × {item.quantity}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-semibold text-sm text-[#32190D]">
                      Rs. {Number(item.totalPrice).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="mt-6 pt-4 border-t border-[#32190D]/10 space-y-2 text-xs">
              <div className="flex justify-between text-[#32190D]/70">
                <span>Items Subtotal</span>
                <span className="font-mono">Rs. {Number(order.subtotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#32190D]/70">
                <span>Delivery & Packaging</span>
                <span className="font-mono">
                  {order.deliveryFee > 0
                    ? `Rs. ${Number(order.deliveryFee).toLocaleString()}`
                    : "Complimentary (Rs. 0)"}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Special Discount</span>
                  <span className="font-mono">-Rs. {Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-[#32190D]/10 text-base font-bold text-[#32190D]">
                <span>Total Amount</span>
                <span className="font-mono text-lg text-[#8C6219]">
                  Rs. {Number(order.total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Logistics Details */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Fulfillment Logistics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Fulfillment Type
                </span>
                <div className="font-semibold text-sm text-[#32190D] mt-0.5 capitalize">
                  {order.deliveryType}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Required Timing
                </span>
                <div className="font-semibold text-xs text-[#32190D] mt-0.5">
                  {order.deliveryDate || "As soon as possible"}
                  {order.deliveryTimeSlot && ` (${order.deliveryTimeSlot})`}
                </div>
              </div>
            </div>

            {order.deliveryAddress && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]/70">
                  Delivery Destination
                </label>
                <div className="mt-1 flex items-start gap-2 p-3 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10 text-xs text-[#32190D]">
                  <MapPin size={16} className="text-[#D6A64B] shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress}</span>
                </div>
              </div>
            )}

            {order.specialInstructions && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]/70">
                  Customer Special Instructions
                </label>
                <div className="mt-1 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                  &quot;{order.specialInstructions}&quot;
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Status Modifier & Customer Dossier */}
        <div className="space-y-6">
          {/* Status Changer Card */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Fulfillment Control
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Order Status
              </label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
              >
                <option value="PENDING">PENDING (Awaiting Review)</option>
                <option value="CONFIRMED">CONFIRMED (Accepted)</option>
                <option value="PREPARING">PREPARING (Baking in Kitchen)</option>
                <option value="READY">READY (Ready for Dispatch / Pickup)</option>
                <option value="COMPLETED">COMPLETED (Delivered)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Payment Status
              </label>
              <select
                value={currentPaymentStatus}
                onChange={(e) => setCurrentPaymentStatus(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
              >
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID (Settled)</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Internal Staff Notes
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Kitchen notes, packaging details, driver assigned..."
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#32190D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isUpdating ? (
                <Loader2 size={14} className="animate-spin text-[#D6A64B]" />
              ) : (
                <Save size={14} className="text-[#D6A64B]" />
              )}
              <span>Update Order</span>
            </button>
          </div>

          {/* Customer Information Card */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Customer Profile
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#32190D]/50 text-[10px] uppercase font-semibold">
                  Name
                </span>
                <p className="font-semibold text-sm text-[#32190D]">
                  {order.customerName}
                </p>
              </div>

              <div>
                <span className="text-[#32190D]/50 text-[10px] uppercase font-semibold">
                  Email
                </span>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="flex items-center gap-1.5 text-xs text-[#32190D] hover:underline font-mono mt-0.5"
                >
                  <Mail size={13} className="text-[#D6A64B]" />
                  <span>{order.customerEmail}</span>
                </a>
              </div>

              <div>
                <span className="text-[#32190D]/50 text-[10px] uppercase font-semibold">
                  Phone / WhatsApp
                </span>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-1.5 text-xs text-[#32190D] hover:underline font-mono mt-0.5"
                >
                  <Phone size={13} className="text-[#D6A64B]" />
                  <span>{order.customerPhone}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

