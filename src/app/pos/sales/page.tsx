"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { posDb, type PendingSale, type PendingSaleItem } from "@/lib/posDb";
import ThermalReceipt, { ReceiptData } from "@/components/pos/ThermalReceipt";
import { checkBackendReachable } from "@/lib/posSyncEngine";

interface SaleRecord {
  id: string;
  orderNumber: string;
  receiptNumber: string;
  createdAt: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  isOfflineSync?: boolean;
  isPendingOffline?: boolean;
  staffName?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  amountReceived?: number;
  change?: number;
}

export default function PosSalesPage() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const combined: SaleRecord[] = [];

    // 1. Load local offline pending sales from IndexedDB first
    if (posDb) {
      try {
        const localSales = await posDb.pendingSales.toArray();
        for (const ls of localSales) {
          combined.push({
            id: ls.clientTransactionId,
            orderNumber: ls.receiptNumber,
            receiptNumber: ls.receiptNumber,
            createdAt: ls.createdAt,
            customerName: ls.customerName,
            total: ls.total,
            paymentMethod: ls.payment.method,
            isPendingOffline: ls.syncStatus === "PENDING" || ls.syncStatus === "SYNCING" || ls.syncStatus === "FAILED",
            isOfflineSync: true,
            staffName: ls.staffName,
            items: ls.items.map((i: PendingSaleItem) => ({
              name: i.productName,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.unitPrice * i.quantity,
              notes: i.notes,
            })),
            subtotal: ls.subtotal,
            discount: ls.discount,
            tax: ls.tax,
            amountReceived: ls.payment.amountReceived,
            change: ls.payment.changeGiven,
          });
        }
      } catch {}
    }

    // 2. Fetch server sales if online
    const isOnline = await checkBackendReachable();
    if (isOnline) {
      try {
        const res = await fetch("/api/pos/sales?limit=60");
        const data = await res.json();
        if (data.success && data.sales) {
          for (const s of data.sales) {
            // Deduplicate if already present from local DB
            if (!combined.some((c) => c.receiptNumber === s.receiptNumber)) {
              combined.push({
                id: s.id,
                orderNumber: s.orderNumber,
                receiptNumber: s.receiptNumber,
                createdAt: s.createdAt,
                customerName: s.customerName,
                total: s.total,
                paymentMethod: s.paymentMethod,
                isOfflineSync: s.isOfflineSync,
                isPendingOffline: false,
                staffName: s.staff?.name,
                items: s.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  totalPrice: i.totalPrice,
                  notes: i.notes,
                })),
                subtotal: s.subtotal,
                discount: s.discount,
                tax: s.tax,
                amountReceived: s.payments?.[0]?.amountReceived,
                change: s.payments?.[0]?.changeGiven,
              });
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load server sales:", err);
      }
    }

    // Sort descending by date
    combined.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setSales(combined);
    setLoading(false);
  };

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.receiptNumber.toLowerCase().includes(q) ||
      s.orderNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q)
    );
  });

  const handleReprint = (sale: SaleRecord) => {
    const receiptData: ReceiptData = {
      orderNumber: sale.orderNumber,
      receiptNumber: sale.receiptNumber,
      createdAt: sale.createdAt,
      cashierName: sale.staffName || "Staff",
      deviceCode: "POS",
      customerName: sale.customerName,
      items: sale.items,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      amountReceived: sale.amountReceived,
      change: sale.change,
      isOffline: sale.isPendingOffline,
    };

    setSelectedReceipt(receiptData);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#32190D]">
            Sales Transaction History
          </h1>
          <p className="text-xs text-[#806E5D] mt-0.5">
            Audit logs, customer receipts &amp; 80mm reprinting
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#806E5D]"
          />
          <input
            type="text"
            placeholder="Search receipt # or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#32190D]/15 bg-white py-2.5 pl-10 pr-4 text-xs text-[#32190D] placeholder:text-[#806E5D]/60 focus:border-[#D6A64B] focus:outline-none focus:ring-2 focus:ring-[#D6A64B]/20 shadow-xs"
          />
        </div>
      </div>

      {/* Sales Table Card */}
      <div className="rounded-3xl border border-[#32190D]/10 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] text-[#32190D] font-serif border-b border-[#32190D]/10">
              <tr>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                  Receipt #
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                  Date &amp; Time
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                  Customer
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                  Items
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                  Payment
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                  Total
                </th>
                <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px]">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right font-bold uppercase tracking-wider text-[11px]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No sales recorded yet.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const dateStr = new Date(sale.createdAt).toLocaleString(
                    "en-PK",
                    {
                      timeZone: "Asia/Karachi",
                      dateStyle: "short",
                      timeStyle: "short",
                    }
                  );

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-[#F8F3E9]/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-bold text-[#32190D]">
                        {sale.receiptNumber}
                      </td>
                      <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-5 py-4 font-medium text-[#32190D]">
                        {sale.customerName}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {sale.items.length} items (
                        {sale.items.reduce((s, i) => s + i.quantity, 0)} pcs)
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#8C6219]">
                        {sale.paymentMethod.replace(/_/g, " ")}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#32190D]">
                        Rs. {sale.total.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {sale.isPendingOffline ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <Clock size={11} /> Pending Sync
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={11} /> Synced
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleReprint(sale)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#32190D]/20 text-[#32190D] font-semibold text-xs hover:bg-[#32190D] hover:text-[#F8F3E9] transition-all"
                        >
                          <Printer size={13} />
                          <span>Reprint</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Preview Modal */}
      {selectedReceipt && (
        <ThermalReceipt
          receipt={selectedReceipt}
          autoPrint={false}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
