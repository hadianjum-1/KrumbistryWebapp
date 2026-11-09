"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  Eye,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/orders");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load orders");
      }
      setOrders(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading orders";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) setOrders(json.data);
      })
      .catch((err) => {
        if (!ignore) setErrorMessage(err instanceof Error ? err.message : "Error loading orders");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CONFIRMED":
      case "PREPARING":
      case "READY":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "FAILED":
      case "REFUNDED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const list = Array.isArray(orders) ? orders : [];
  const filteredOrders = list.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (order.orderNumber ?? "").toLowerCase().includes(q) ||
      (order.customerName ?? "").toLowerCase().includes(q) ||
      (order.customerEmail ?? "").toLowerCase().includes(q) ||
      (order.customerPhone ?? "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;
    const matchesPayment =
      paymentFilter === "ALL" || order.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
            Customer Orders
          </h1>
          <p className="text-xs text-[#32190D]/70 mt-1">
            Monitor, track fulfillment, and update delivery statuses.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw size={14} className="text-[#D6A64B]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#32190D]/10 rounded-2xl p-4 shadow-xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#32190D]/40 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, email, or phone..."
            className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-10 pr-4 py-2 text-xs text-[#32190D] placeholder:text-[#32190D]/40 focus:border-[#D6A64B] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by order fulfillment status"
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">In Kitchen / Baking</option>
            <option value="READY">Ready for Dispatch / Pickup</option>
            <option value="COMPLETED">Fulfilled / Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="Filter by payment status"
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            <option value="ALL">All Payments</option>
            <option value="PENDING">Payment Pending</option>
            <option value="PAID">Paid in Full</option>
            <option value="FAILED">Payment Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-[#32190D]/10 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#32190D]/60 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
            <span>Loading orders stream...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag size={32} className="mx-auto text-[#32190D]/20 mb-2" />
            <p className="text-sm font-semibold text-[#32190D]">No orders match your filter</p>
            <p className="text-xs text-[#32190D]/60 mt-1">
              New orders placed through the website will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F3E9]/50 border-b border-[#32190D]/10 text-[#32190D]/70 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Fulfillment</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#32190D]/5">
                {filteredOrders.map((order) => {
                  const itemCount = order.items?.reduce((acc, it) => acc + it.quantity, 0) ?? 0;
                  const dateStr = new Date(order.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={order.id} className="hover:bg-[#F8F3E9]/30 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-sm text-[#32190D]">
                          {order.orderNumber}
                        </div>
                        <div className="text-[11px] text-[#32190D]/50 flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#32190D]">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-[#32190D]/60 font-mono">
                          {order.customerPhone}
                        </div>
                      </td>

                      {/* Fulfillment Type */}
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium text-[#32190D]/80">
                          {(order.deliveryType ?? "delivery").toLowerCase()}
                        </span>
                      </td>

                      {/* Items Count */}
                      <td className="py-3.5 px-4 text-[#32190D]/70">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 font-semibold text-[#32190D]">
                        Rs. {Number(order.total).toLocaleString()}
                      </td>

                      {/* Order Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${getPaymentBadge(
                            order.paymentStatus
                          )}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#8C6219] hover:text-[#32190D] underline decoration-[#D6A64B]"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

