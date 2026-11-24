"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import TrialPaymentPopup from "@/components/pos/TrialPaymentPopup";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Receipt,
  ArrowRight,
  Printer,
  Calendar,
  CreditCard,
  Store,
  Clock,
} from "lucide-react";
import { getLocalDeviceCode, checkBackendReachable, pushPendingSales } from "@/lib/posSyncEngine";
import { posDb } from "@/lib/posDb";

export default function PosDashboardPage() {
  const [deviceCode, setDeviceCode] = useState("POS-01");
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [offlineQueueTotal, setOfflineQueueTotal] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const code = getLocalDeviceCode();
    setDeviceCode(code);

    const loadMetrics = async (showSpinner = false) => {
      if (showSpinner) setIsRefreshing(true);
      try {
        const res = await fetch(`/api/pos/dashboard?deviceCode=${code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setMetrics(data);
          }
        }

        // Check local offline queue in IndexedDB
        if (posDb) {
          const unsynced = await posDb.pendingSales
            .where("syncStatus")
            .anyOf(["PENDING", "SYNCING", "FAILED"])
            .toArray();
          setOfflineQueueCount(unsynced.length);
          setOfflineQueueTotal(unsynced.reduce((acc: number, s: { total?: number }) => acc + (s.total || 0), 0));
        }
      } catch (err) {
        console.warn("Failed to load dashboard metrics:", err);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    loadMetrics();

    // Refresh when user returns to this tab
    const handleFocus = () => {
      if (!document.hidden) {
        loadMetrics();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    // Relaxed background refresh only when tab is actively visible (every 30 seconds)
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        loadMetrics();
      }
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      clearInterval(pollInterval);
    };
  }, []);

  const handleQuickSync = async () => {
    setIsSyncing(true);
    try {
      await pushPendingSales();
      const code = getLocalDeviceCode();
      const res = await fetch(`/api/pos/dashboard?deviceCode=${code}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setMetrics(data);
      }
      if (posDb) {
        const unsynced = await posDb.pendingSales
          .where("syncStatus")
          .anyOf(["PENDING", "SYNCING", "FAILED"])
          .toArray();
        setOfflineQueueCount(unsynced.length);
        setOfflineQueueTotal(unsynced.reduce((acc: number, s: { total?: number }) => acc + (s.total || 0), 0));
      }
    } catch (err) {
      console.warn("Quick sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    
    <div className="space-y-7">
      {/* Page Heading */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#32190D]">
            Daily POS Dashboard
          </h1>
          <p className="text-xs text-[#806E5D]">
            Real-time bakery sales, drawer status &amp; transaction metrics
          </p>
        </div>

        <Link
          href="/pos"
          className="inline-flex items-center gap-2 rounded-xl bg-[#32190D] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#F8F3E9] hover:bg-[#D6A64B] hover:text-[#32190D] transition-all shadow-md w-fit"
        >
          <span>Open Sales Counter</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Offline Pending Transactions Alert Banner */}
      {offlineQueueCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <Clock size={18} className="text-amber-700 shrink-0" />
            <div>
              <p className="font-bold text-amber-900">
                {offlineQueueCount} Offline Sale{offlineQueueCount > 1 ? "s" : ""} Pending Sync (Rs. {offlineQueueTotal.toLocaleString()})
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Recorded locally on this terminal. Synchronize to update central revenue and inventory.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleQuickSync}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition-all shadow-xs disabled:opacity-50"
            >
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
            <Link
              href="/pos/sync"
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-white text-amber-900 font-bold text-xs hover:bg-amber-100 transition-all"
            >
              Queue Details →
            </Link>
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Sales */}
        <div className="rounded-3xl border border-[#32190D]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#806E5D]">
              Today&apos;s Revenue
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FAF6EE] text-[#8C6219] flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-[#32190D]">
            Rs. {loading ? "—" : (metrics?.metrics?.todaySalesTotal || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-[#806E5D]">
            {metrics?.metrics?.transactionCount || 0} customer orders today
          </p>
        </div>

        {/* Cash Collected */}
        <div className="rounded-3xl border border-[#32190D]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#806E5D]">
              Cash Collected
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-emerald-800">
            Rs. {loading ? "—" : (metrics?.metrics?.cashCollected || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-[#806E5D]">Physical counter cash</p>
        </div>

        {/* Digital / Card Payments */}
        <div className="rounded-3xl border border-[#32190D]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#806E5D]">
              Cards &amp; Digital
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-[#32190D]">
            Rs.{" "}
            {loading
              ? "—"
              : (
                  (metrics?.metrics?.cardCollected || 0) +
                  (metrics?.metrics?.otherCollected || 0)
                ).toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-[#806E5D]">
            Card, JazzCash &amp; Easypaisa
          </p>
        </div>

        {/* Avg Transaction Value */}
        <div className="rounded-3xl border border-[#32190D]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#806E5D]">
              Average Ticket
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-[#32190D]">
            Rs.{" "}
            {loading
              ? "—"
              : Math.round(metrics?.metrics?.avgTransactionValue || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-[#806E5D]">Average basket size</p>
        </div>
      </div>

      {/* Register Shift & Recent Sales Split */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Active Register Card */}
        <div className="rounded-3xl border border-[#32190D]/10 bg-[#FAF6EE] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#32190D]/10">
              <h3 className="font-serif text-lg font-bold text-[#32190D]">
                Register Shift
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  metrics?.activeRegister
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {metrics?.activeRegister ? "SHIFT OPEN" : "CLOSED"}
              </span>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#806E5D]">Terminal:</span>
                <strong className="text-[#32190D]">{deviceCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#806E5D]">Current Staff:</span>
                <strong className="text-[#32190D]">{metrics?.currentStaff?.name || "Staff"}</strong>
              </div>
              {metrics?.activeRegister && (
                <div className="flex justify-between">
                  <span className="text-[#806E5D]">Opening Float:</span>
                  <strong className="text-[#32190D]">
                    Rs. {metrics.activeRegister.openingCash?.toLocaleString()}
                  </strong>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/pos/register"
            className="w-full mt-4 py-2.5 rounded-xl border border-[#32190D]/20 bg-white text-xs font-bold text-center text-[#32190D] hover:bg-[#32190D] hover:text-white transition-all shadow-xs"
          >
            Manage Register Drawer
          </Link>
        </div>

        {/* Recent Transactions Table */}
        <div className="rounded-3xl border border-[#32190D]/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-serif text-lg font-bold text-[#32190D]">
              Recent Today Sales
            </h3>
            <Link
              href="/pos/sales"
              className="text-xs font-semibold text-[#8C6219] hover:underline"
            >
              View Full History →
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {metrics?.recentSales?.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">
                No transactions recorded today yet.
              </p>
            ) : (
              metrics?.recentSales?.map((sale: any) => (
                <div
                  key={sale.id}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-[#32190D]">
                      {sale.receiptNumber}
                    </span>
                    <p className="text-[11px] text-gray-400">
                      {new Date(sale.createdAt).toLocaleTimeString()} · {sale.paymentMethod}
                    </p>
                  </div>

                  <span className="font-bold text-[#32190D] font-mono text-sm">
                    Rs. {sale.total.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <TrialPaymentPopup
  isOwner={true}
  trialEndDate="2026-11-24T23:59:59+05:00"
  paymentUrl="https://your-payment-link.com"
  paymentCompleted={false}
/>
    </div>
  );
}
