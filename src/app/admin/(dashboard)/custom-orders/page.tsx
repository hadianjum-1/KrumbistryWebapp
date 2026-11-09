"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Cake,
  Search,
  RefreshCw,
  Eye,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface CustomOrder {
  id: string;
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  servings: string;
  budgetRange: string | null;
  status: string;
  quotedPrice: number | null;
  createdAt: string;
  images: string[];
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchCustomOrders = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/custom-orders");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load custom order inquiries");
      }
      setOrders(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading requests";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/custom-orders")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) setOrders(json.data);
      })
      .catch((err) => {
        if (!ignore) setErrorMessage(err instanceof Error ? err.message : "Error loading requests");
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
      case "NEW":
        return "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
      case "REVIEWING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "QUOTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CONFIRMED":
      case "IN_PRODUCTION":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED":
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const list = Array.isArray(orders) ? orders : [];
  const filteredOrders = list.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (order.referenceNumber ?? "").toLowerCase().includes(q) ||
      (order.customerName ?? "").toLowerCase().includes(q) ||
      (order.customerEmail ?? "").toLowerCase().includes(q) ||
      (order.eventType ?? "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
            Bespoke Cake Consultations
          </h1>
          <p className="text-xs text-[#32190D]/70 mt-1">
            Review custom event cake requests, inspect reference images, and provide pricing quotes.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCustomOrders}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw size={14} className="text-[#D6A64B]" />
          <span>Refresh Consultations</span>
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
            placeholder="Search reference #, customer, or event type (e.g. Wedding)..."
            className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-10 pr-4 py-2 text-xs text-[#32190D] placeholder:text-[#32190D]/40 focus:border-[#D6A64B] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by consultation status"
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            <option value="ALL">All Consultation Statuses</option>
            <option value="NEW">New (Requires Review)</option>
            <option value="REVIEWING">Under Review</option>
            <option value="QUOTED">Price Quoted</option>
            <option value="CONFIRMED">Customer Confirmed</option>
            <option value="IN_PRODUCTION">In Production</option>
            <option value="COMPLETED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white border border-[#32190D]/10 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#32190D]/60 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
            <span>Loading custom requests...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center">
            <Cake size={32} className="mx-auto text-[#32190D]/20 mb-2" />
            <p className="text-sm font-semibold text-[#32190D]">No custom consultation requests found</p>
            <p className="text-xs text-[#32190D]/60 mt-1">
              Requests submitted through the Custom Orders page will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F3E9]/50 border-b border-[#32190D]/10 text-[#32190D]/70 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Servings</th>
                  <th className="py-3 px-4">Quoted Price</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#32190D]/5">
                {filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-[#F8F3E9]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#32190D]">
                        {order.referenceNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#32190D]">
                          {order.customerName}
                        </div>
                        <div className="text-[11px] text-[#32190D]/60 font-mono">
                          {order.customerPhone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-[#32190D]/80">
                        {order.eventType}
                      </td>

                      <td className="py-3.5 px-4 text-[#32190D]/80 font-mono">
                        {order.eventDate}
                      </td>

                      <td className="py-3.5 px-4 text-[#32190D]/80">
                        {order.servings}
                      </td>

                      <td className="py-3.5 px-4">
                        {order.quotedPrice ? (
                          <span className="font-semibold text-emerald-800 font-mono">
                            Rs. {Number(order.quotedPrice).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#32190D]/50 italic">
                            Pending quote
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/custom-orders/${order.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-[#8C6219] hover:text-[#32190D] underline decoration-[#D6A64B]"
                        >
                          <Eye size={13} />
                          <span>Review</span>
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

