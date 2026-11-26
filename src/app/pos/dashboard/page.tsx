"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowRight,
  Clock,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  User,
} from "lucide-react";
import { getLocalDeviceCode, checkBackendReachable, pushPendingSales } from "@/lib/posSyncEngine";
import { posDb } from "@/lib/posDb";

export default function PosDashboardPage() {
  const [deviceCode, setDeviceCode] = useState("POS-01");
  const [metrics, setMetrics] = useState<any>(null);
  const [registerSession, setRegisterSession] = useState<any>(null);
  const [localActiveSession, setLocalActiveSession] = useState<any>(null);
  const [activeStaff, setActiveStaff] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [offlineQueueTotal, setOfflineQueueTotal] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const code = getLocalDeviceCode();
    setDeviceCode(code);

    // Load active staff member from local terminal storage
    const savedStaff = localStorage.getItem("krumbistry_pos_active_staff");
    if (savedStaff) {
      try {
        setActiveStaff(JSON.parse(savedStaff));
      } catch {}
    }

    const loadMetrics = async (showSpinner = false) => {
      if (showSpinner) setIsRefreshing(true);
      try {
        const [dashRes, regRes] = await Promise.all([
          fetch(`/api/pos/dashboard?deviceCode=${encodeURIComponent(code)}`),
          fetch(`/api/pos/register?deviceCode=${encodeURIComponent(code)}`),
        ]);

        if (dashRes.ok) {
          const data = await dashRes.json();
          if (data.success) {
            setMetrics(data);
          }
        }

        if (regRes.ok) {
          const regData = await regRes.json();
          if (regData.success && regData.hasActiveSession) {
            setRegisterSession(regData.session);
            // Sync to local IndexedDB to ensure offline continuity
            if (posDb) {
              await posDb.localRegisterSession.put({
                id: regData.session.id,
                deviceCode: code,
                staffId: regData.session.staff?.id || "anonymous",
                staffName: regData.session.staff?.name || "Staff",
                openedAt: regData.session.openedAt,
                openingCash: regData.session.openingCash,
                cashSalesTotal: regData.session.cashSalesTotal,
                cardSalesTotal: regData.session.cardSalesTotal,
                otherSalesTotal: regData.session.otherSalesTotal,
                cashInTotal: regData.session.cashInTotal,
                cashOutTotal: regData.session.cashOutTotal,
                cashSalesCount: regData.session.cashSalesCount,
                status: "OPEN",
              });
            }
          } else {
            setRegisterSession(null);
          }
        }

        // Check local IndexedDB for active offline register session & pending sales
        if (posDb) {
          const localShift = await posDb.localRegisterSession
            .where("status")
            .equals("OPEN")
            .first();
          setLocalActiveSession(localShift || null);

          const unsynced = await posDb.pendingSales
            .where("syncStatus")
            .anyOf(["PENDING", "SYNCING", "FAILED"])
            .toArray();
          setOfflineQueueCount(unsynced.length);
          setOfflineQueueTotal(
            unsynced.reduce((acc: number, s: { total?: number }) => acc + (s.total || 0), 0)
          );
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
      const [dashRes, regRes] = await Promise.all([
        fetch(`/api/pos/dashboard?deviceCode=${encodeURIComponent(code)}`),
        fetch(`/api/pos/register?deviceCode=${encodeURIComponent(code)}`),
      ]);
      if (dashRes.ok) {
        const data = await dashRes.json();
        if (data.success) setMetrics(data);
      }
      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.success && regData.hasActiveSession) {
          setRegisterSession(regData.session);
        } else {
          setRegisterSession(null);
        }
      }
      if (posDb) {
        const localShift = await posDb.localRegisterSession
          .where("status")
          .equals("OPEN")
          .first();
        setLocalActiveSession(localShift || null);

        const unsynced = await posDb.pendingSales
          .where("syncStatus")
          .anyOf(["PENDING", "SYNCING", "FAILED"])
          .toArray();
        setOfflineQueueCount(unsynced.length);
        setOfflineQueueTotal(
          unsynced.reduce((acc: number, s: { total?: number }) => acc + (s.total || 0), 0)
        );
      }
    } catch (err) {
      console.warn("Quick sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Resolved active register shift (combining register API, dashboard API, and offline IndexedDB fallback)
  const activeShift =
    registerSession ||
    metrics?.activeRegister ||
    (localActiveSession
      ? {
          id: localActiveSession.id,
          openedAt: localActiveSession.openedAt,
          openingCash: Number(localActiveSession.openingCash || 0),
          expectedCash:
            Number(localActiveSession.openingCash || 0) +
            Number(localActiveSession.cashSalesTotal || 0) +
            Number(localActiveSession.cashInTotal || 0) -
            Number(localActiveSession.cashOutTotal || 0),
          cashSalesTotal: Number(localActiveSession.cashSalesTotal || 0),
          cashSalesCount: localActiveSession.cashSalesCount || 0,
          status: "OPEN",
          staff: {
            name: localActiveSession.staffName || activeStaff?.name || "Cashier",
            role: "Staff",
          },
          isOffline: true,
        }
      : null);
    (localActiveSession
      ? {
          id: localActiveSession.id,
          openedAt: localActiveSession.openedAt,
          openingCash: Number(localActiveSession.openingCash || 0),
          expectedCash:
            Number(localActiveSession.openingCash || 0) +
            Number(localActiveSession.cashSalesTotal || 0) +
            Number(localActiveSession.cashInTotal || 0) -
            Number(localActiveSession.cashOutTotal || 0),
          cashSalesTotal: Number(localActiveSession.cashSalesTotal || 0),
          cashSalesCount: localActiveSession.cashSalesCount || 0,
          status: "OPEN",
          staff: {
            name: localActiveSession.staffName || activeStaff?.name || "Cashier",
            role: "Staff",
          },
          isOffline: true,
        }
      : null);

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
          className="inline-flex items-center gap-2 rounded-xl bg-[#32190D] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#F8F3E9] hover:bg-[#D6A64B] hover:text-[#32190D] transition-all shadow-md w-fit cursor-pointer"
        >
          <span className="text-amber-50">Open Sales Counter</span>
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
              className="px-4 py-2 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
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
      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
        {/* Active Register Shift Card */}
        <div className="rounded-3xl border border-[#32190D]/10 bg-[#FAF6EE] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#32190D]/10">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    activeShift
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-200 text-stone-600"
                  }`}
                >
                  {activeShift ? <Unlock size={14} /> : <Lock size={14} />}
                </div>
                <h3 className="font-serif text-lg font-bold text-[#32190D]">
                  Register Shift
                </h3>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  activeShift
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-stone-200 text-stone-700 border border-stone-300"
                }`}
              >
                {activeShift ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>SHIFT OPEN</span>
                  </>
                ) : (
                  <span>SHIFT CLOSED</span>
                )}
              </span>
            </div>

            {/* Shift Details */}
            {activeShift ? (
              <div className="py-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[#32190D]/5">
                  <span className="text-[#806E5D]">Terminal:</span>
                  <span className="font-mono font-bold text-[#32190D] bg-white px-2 py-0.5 rounded border border-[#32190D]/10">
                    {deviceCode}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#32190D]/5">
                  <span className="text-[#806E5D]">Shift Opened By:</span>
                  <strong className="text-[#32190D] flex items-center gap-1">
                    <User size={12} className="text-[#D6A64B]" />
                    <span>{activeShift.staff?.name || activeStaff?.name || "Cashier"}</span>
                  </strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#32190D]/5">
                  <span className="text-[#806E5D]">Started At:</span>
                  <strong className="text-[#32190D] font-mono">
                    {activeShift.openedAt
                      ? new Date(activeShift.openedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Today"}
                  </strong>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-[#32190D]/5">
                  <span className="text-[#806E5D]">Opening Float:</span>
                  <strong className="text-[#32190D] font-mono">
                    Rs. {Number(activeShift.openingCash || 0).toLocaleString()}
                  </strong>
                </div>

                <div className="flex justify-between items-center py-1.5 bg-white p-2 rounded-xl border border-emerald-200">
                  <span className="text-emerald-900 font-semibold">Expected Cash in Drawer:</span>
                  <strong className="text-emerald-800 font-mono text-sm font-bold">
                    Rs. {Number(activeShift.expectedCash || activeShift.openingCash || 0).toLocaleString()}
                  </strong>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center mx-auto text-stone-500">
                  <Lock size={18} />
                </div>
                <p className="text-xs font-semibold text-[#32190D]">
                  No active shift open on terminal {deviceCode}
                </p>
                <p className="text-[11px] text-[#806E5D] max-w-xs mx-auto">
                  Open a new register shift and record your starting drawer cash float before accepting counter payments.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          {activeShift ? (
            <div className="space-y-2 mt-2">
              <Link
                href="/pos/register"
                className="w-full py-2.5 rounded-xl border border-[#32190D]/20 bg-white text-xs font-bold text-center text-[#32190D] hover:bg-[#32190D] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Manage Drawer &amp; Float</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <Link
              href="/pos/register"
              className="w-full mt-2 py-2.5 rounded-xl bg-[#32190D] text-xs font-bold text-center text-[#F8F3E9] hover:bg-[#D6A64B] hover:text-[#32190D] transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Unlock size={14} />
              <span>Open Register Shift Now</span>
            </Link>
          )}
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
                  className="py-3 flex items-center justify-between text-xs hover:bg-[#F8F3E9]/30 -mx-2 px-2 rounded-lg transition-colors"
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
    </div>
  );
}
