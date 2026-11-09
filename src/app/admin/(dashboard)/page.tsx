"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Banknote,
  ShoppingBag,
  Package,
  Cake,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  Calendar,
  Filter,
} from "lucide-react";

interface DashboardData {
  products: {
    total: number;
    active: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    totalRevenue: number;
    recent: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      total: number;
      status: string;
      createdAt: string;
      items?: Array<{ name: string; quantity: number }>;
    }>;
  };
  customOrders: {
    total: number;
    new: number;
  };
  inquiries: {
    total: number;
    new: number;
    recent: Array<{
      id: string;
      name: string;
      email: string;
      subject: string;
      status: string;
      createdAt: string;
    }>;
  };
  analytics?: {
    filter: string;
    date: string | null;
    today: {
      orders: number;
      revenue: number;
    };
    yesterday: {
      orders: number;
      revenue: number;
    };
    last24h: {
      orders: number;
      revenue: number;
      blocks: Array<{
        label: string;
        count: number;
        revenue: number;
      }>;
    };
    filtered: {
      orders: number;
      revenue: number;
    };
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<"all" | "today" | "yesterday" | "24h" | "custom">("all");
  const [specificDate, setSpecificDate] = useState<string>("");

  const fetchDashboardMetrics = useCallback(
    async (
      type: "all" | "today" | "yesterday" | "24h" | "custom" = filterType,
      dateVal: string = specificDate,
      showRefreshIndicator = false
    ) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (type !== "all") params.set("filter", type);
        if (type === "custom" && dateVal) params.set("date", dateVal);

        const res = await fetch(`/api/admin/dashboard?${params.toString()}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load dashboard metrics");
        }
        setData(json.data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading dashboard";
        setError(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filterType, specificDate]
  );

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) setData(json.data);
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : "Error loading dashboard");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleFilterChange = (type: "all" | "today" | "yesterday" | "24h" | "custom") => {
    setFilterType(type);
    if (type !== "custom") {
      fetchDashboardMetrics(type, specificDate, true);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSpecificDate(val);
    setFilterType("custom");
    if (val) {
      fetchDashboardMetrics("custom", val, true);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "PREPARING":
      case "READY":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getInquiryStatusBadge = (status: string) => {
    switch (status) {
      case "RESPONDED":
      case "CLOSED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl md:text-3xl font-bold tracking-tight text-[#32190D]">
              Bakery Operations Hub
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#D6A64B]/15 px-2.5 py-0.5 text-xs font-semibold text-[#8C6219]">
              <Sparkles size={12} />
              Live Dashboard
            </span>
          </div>
          <p className="text-sm text-[#32190D]/70 mt-1">
            Real-time Pakistani Rupee (PKR) sales, 24-hour activity, and order fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchDashboardMetrics(filterType, specificDate, true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              size={14}
              className={`text-[#D6A64B] ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#32190D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={15} className="text-[#D6A64B]" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to fetch live metrics</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Interactive Sales & Date Filter Controls */}
      <div className="rounded-2xl border border-[#32190D]/10 bg-[#FAF6EE] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-[#8C6219]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#32190D]">
              Sales & Date Range Filter
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleFilterChange("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "all"
                  ? "bg-[#32190D] text-white shadow-xs"
                  : "bg-white text-[#32190D]/80 border border-[#32190D]/10 hover:bg-[#F8F3E9]"
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("today")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "today"
                  ? "bg-[#32190D] text-white shadow-xs"
                  : "bg-white text-[#32190D]/80 border border-[#32190D]/10 hover:bg-[#F8F3E9]"
              }`}
            >
              Today&apos;s Sales
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("yesterday")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "yesterday"
                  ? "bg-[#32190D] text-white shadow-xs"
                  : "bg-white text-[#32190D]/80 border border-[#32190D]/10 hover:bg-[#F8F3E9]"
              }`}
            >
              Past Day (Yesterday)
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange("24h")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === "24h"
                  ? "bg-[#32190D] text-white shadow-xs"
                  : "bg-white text-[#32190D]/80 border border-[#32190D]/10 hover:bg-[#F8F3E9]"
              }`}
            >
              Last 24 Hours
            </button>

            {/* Custom Date Input */}
            <div className="flex items-center gap-1.5 bg-white border border-[#32190D]/15 rounded-lg px-2.5 py-1">
              <Calendar size={13} className="text-[#8C6219]" />
              <input
                type="date"
                value={specificDate}
                onChange={handleDateChange}
                aria-label="Filter by specific date"
                className="text-xs text-[#32190D] bg-transparent outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary Banner */}
        {data?.analytics && (
          <div className="mt-4 pt-4 border-t border-[#32190D]/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-[#32190D]/10">
              <span className="text-[#32190D]/60 uppercase tracking-wider text-[10px] font-bold">
                Today&apos;s Performance
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-serif text-lg font-bold text-emerald-800">
                  Rs. {data.analytics.today.revenue.toLocaleString()}
                </span>
                <span className="text-[#32190D]/70 font-semibold">
                  {data.analytics.today.orders} orders
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#32190D]/10">
              <span className="text-[#32190D]/60 uppercase tracking-wider text-[10px] font-bold">
                Past Day (Yesterday)
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-serif text-lg font-bold text-[#8C6219]">
                  Rs. {data.analytics.yesterday.revenue.toLocaleString()}
                </span>
                <span className="text-[#32190D]/70 font-semibold">
                  {data.analytics.yesterday.orders} orders
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-[#32190D]/10">
              <span className="text-[#32190D]/60 uppercase tracking-wider text-[10px] font-bold">
                {filterType === "all"
                  ? "All-Time Velocity"
                  : filterType === "24h"
                  ? "24h Velocity"
                  : filterType === "custom"
                  ? `Selected Date (${specificDate || "N/A"})`
                  : `${filterType.toUpperCase()} Filtered`}
              </span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="font-serif text-lg font-bold text-[#32190D]">
                  Rs. {data.analytics.filtered.revenue.toLocaleString()}
                </span>
                <span className="text-[#32190D]/70 font-semibold">
                  {data.analytics.filtered.orders} orders
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 24-Hours Data & Velocity Section */}
      {data?.analytics?.last24h && (
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#32190D]/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#D6A64B]/20 text-[#8C6219] flex items-center justify-center">
                <Clock size={16} />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-[#32190D]">
                  24-Hour Velocity & Timeline
                </h2>
                <p className="text-xs text-[#32190D]/60">
                  Rolling 24-hour order flow and sales breakdown
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-[#32190D]/60">24h Sales: </span>
                <span className="font-bold text-emerald-800 font-mono">
                  Rs. {data.analytics.last24h.revenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#32190D]/60">24h Orders: </span>
                <span className="font-bold text-[#32190D]">
                  {data.analytics.last24h.orders}
                </span>
              </div>
            </div>
          </div>

          {/* Hourly Blocks Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            {data.analytics.last24h.blocks.map((block, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#FAF6EE] border border-[#32190D]/10 flex flex-col justify-between"
              >
                <span className="text-[10px] font-mono font-semibold text-[#8C6219]">
                  {block.label}
                </span>
                <div className="mt-2">
                  <span className="text-xs font-bold text-[#32190D] block font-mono">
                    Rs. {block.revenue.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#32190D]/60 mt-0.5 block">
                    {block.count} {block.count === 1 ? "order" : "orders"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#32190D]/60">
              {filterType === "all" ? "Total Revenue" : "Filtered Sales"}
            </span>
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Banknote size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
              Rs.{" "}
              {isLoading
                ? "..."
                : (filterType === "all"
                    ? data?.orders.totalRevenue ?? 0
                    : data?.analytics?.filtered.revenue ?? 0
                  ).toLocaleString()}
            </span>
            <p className="text-xs text-[#32190D]/60 mt-1">
              {filterType === "all"
                ? "All-time completed & paid revenue"
                : `Sales matching ${filterType} selection`}
            </p>
          </div>
        </div>

        {/* Orders in Queue */}
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#32190D]/60">
              Orders Queue
            </span>
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
                {isLoading ? "..." : data?.orders.pending ?? 0}
              </span>
              <span className="text-xs text-[#32190D]/60">
                pending / {isLoading ? "..." : data?.orders.total ?? 0} total
              </span>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8C6219] hover:underline mt-1"
            >
              <span>Manage orders</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Custom Cake Requests */}
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#32190D]/60">
              Custom Cakes
            </span>
            <div className="w-9 h-9 rounded-full bg-[#D6A64B]/20 text-[#8C6219] flex items-center justify-center">
              <Cake size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
                {isLoading ? "..." : data?.customOrders.new ?? 0}
              </span>
              <span className="text-xs text-[#32190D]/60">
                new requests / {isLoading ? "..." : data?.customOrders.total ?? 0} total
              </span>
            </div>
            <Link
              href="/admin/custom-orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8C6219] hover:underline mt-1"
            >
              <span>Review custom inquiries</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>

        {/* Active Catalog Products */}
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#32190D]/60">
              Catalog Products
            </span>
            <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <Package size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
                {isLoading ? "..." : data?.products.active ?? 0}
              </span>
              <span className="text-xs text-[#32190D]/60">
                active / {isLoading ? "..." : data?.products.total ?? 0} listed
              </span>
            </div>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#8C6219] hover:underline mt-1"
            >
              <span>View catalog items</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Customer Inquiries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (Span 2) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#32190D]/10 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#32190D]/10">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#32190D]">
                Recent Orders {filterType !== "all" && `(${filterType.toUpperCase()})`}
              </h2>
              <p className="text-xs text-[#32190D]/60 mt-0.5">
                {filterType === "all"
                  ? "Latest customer purchase orders"
                  : `Orders matching your selected ${filterType} filter`}
              </p>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6219] hover:underline"
            >
              <span>All Orders</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-[#32190D]/5 mt-2">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-[#32190D]/50">
                Loading orders...
              </div>
            ) : data?.orders.recent && data.orders.recent.length > 0 ? (
              data.orders.recent.map((order) => (
                <div
                  key={order.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F8F3E9]/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#32190D]">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs font-medium text-[#32190D]">
                        · {order.customerName}
                      </span>
                    </div>
                    <p className="text-xs text-[#32190D]/60">
                      {order.items && order.items.length > 0
                        ? order.items.map((i) => `${i.name} (${i.quantity})`).join(", ")
                        : order.customerEmail}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <span className="font-semibold text-xs text-[#32190D] font-mono">
                      Rs. {Number(order.total).toLocaleString()}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getOrderStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-xs text-[#8C6219] hover:text-[#32190D] transition-colors p-1"
                      aria-label="View order details"
                    >
                      <ArrowUpRight size={14} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#32190D]/50">
                No orders found for the selected filter period.
              </div>
            )}
          </div>
        </div>

        {/* Customer Inquiries Feed (Span 1) */}
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#32190D]/10">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#32190D]">
                Concierge Inquiries
              </h2>
              <p className="text-xs text-[#32190D]/60 mt-0.5">
                Customer messages & support requests
              </p>
            </div>
            <Link
              href="/admin/inquiries"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6219] hover:underline"
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-[#32190D]/5 mt-2">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-[#32190D]/50">
                Loading inquiries...
              </div>
            ) : data?.inquiries.recent && data.inquiries.recent.length > 0 ? (
              data.inquiries.recent.map((inq) => (
                <div
                  key={inq.id}
                  className="py-3.5 space-y-1 hover:bg-[#F8F3E9]/30 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#32190D]">
                      {inq.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getInquiryStatusBadge(
                        inq.status
                      )}`}
                    >
                      {inq.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#32190D]/80 truncate">
                    {inq.subject}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-[#32190D]/50 pt-0.5">
                    <span className="truncate max-w-[150px]">{inq.email}</span>
                    <span>
                      {new Date(inq.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-[#32190D]/50">
                No customer inquiries received yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
