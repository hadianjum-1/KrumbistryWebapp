"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Database,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { posDb, type PendingSale } from "@/lib/posDb";
import {
  checkBackendReachable,
  syncDownCatalog,
  pushPendingSales,
  getLocalDeviceCode,
} from "@/lib/posSyncEngine";

export default function PosSyncPage() {
  const [deviceCode, setDeviceCode] = useState("POS-01");
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [isBrowserOnline, setIsBrowserOnline] = useState(true);
  const [pendingSales, setPendingSales] = useState<PendingSale[]>([]);
  const [cachedProductCount, setCachedProductCount] = useState(0);
  const [cachedStaffCount, setCachedStaffCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [serverConflicts, setServerConflicts] = useState<any[]>([]);

  useEffect(() => {
    setDeviceCode(getLocalDeviceCode());
    loadQueue();
    checkConn();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        loadQueue();
        checkConn();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkConn = async () => {
    setIsBrowserOnline(navigator.onLine);
    const reachable = await checkBackendReachable();
    setIsBackendReachable(reachable);

    if (reachable) {
      try {
        const res = await fetch("/api/pos/conflicts");
        const data = await res.json();
        if (data.success) {
          setServerConflicts(data.conflicts || []);
        }
      } catch {}
    }
  };

  const loadQueue = async () => {
    if (!posDb) return;
    try {
      const pending = await posDb.pendingSales
        .where("syncStatus")
        .anyOf(["PENDING", "SYNCING", "FAILED"])
        .toArray();
      setPendingSales(pending);

      const pCount = await posDb.cachedProducts.count();
      setCachedProductCount(pCount);

      const sCount = await posDb.offlineStaff.count();
      setCachedStaffCount(sCount);
    } catch {}
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const isReachable = await checkBackendReachable();
      if (!isReachable) {
        setSyncResult("Central database is unreachable. Check your internet connection.");
        setSyncing(false);
        return;
      }

      // 1. Push pending offline sales (with auto-retry for failed/syncing items)
      const pushRes = await pushPendingSales();

      // 2. Pull fresh catalog & staff credentials
      const pullRes = await syncDownCatalog();

      await loadQueue();
      await checkConn();

      if (pushRes.failedCount > 0 && pushRes.syncedCount === 0) {
        setSyncResult(
          `Sync attempted: ${pushRes.failedCount} transaction(s) could not sync. Check terminal device registration and connection.`
        );
      } else {
        setSyncResult(
          `Sync Complete: ${pushRes.syncedCount} sales synced successfully, ${pushRes.conflictsCount} inventory conflicts reported, ${pullRes.productsCount} catalog items refreshed.`
        );
      }
    } catch (err: unknown) {
      setSyncResult(err instanceof Error ? err.message : "Sync encountered an error");
    } finally {
      setSyncing(false);
    }
  };

  const handleResetQueueToPending = async () => {
    if (!posDb) return;
    try {
      await posDb.pendingSales
        .where("syncStatus")
        .anyOf(["FAILED", "SYNCING"])
        .modify({ syncStatus: "PENDING", syncError: undefined });
      await loadQueue();
      setSyncResult("All stuck or failed sales have been reset to PENDING. Click 'Sync Now' to push.");
    } catch (err: unknown) {
      setSyncResult(err instanceof Error ? err.message : "Failed to reset queue");
    }
  };

  const handleClearQueue = async () => {
    if (!posDb) return;
    if (!window.confirm("Are you sure you want to clear all offline transactions from this device? This cannot be undone.")) {
      return;
    }
    try {
      await posDb.pendingSales.clear();
      await loadQueue();
      setSyncResult("Offline transactions queue has been cleared.");
    } catch (err: unknown) {
      setSyncResult(err instanceof Error ? err.message : "Failed to clear queue");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#32190D]">
            Multi-Device Sync Engine
          </h1>
          <p className="text-xs text-[#806E5D] mt-0.5">
            Offline reconciliation, queue inspector &amp; conflict resolver · Terminal: <span className="font-bold text-[#32190D]">{deviceCode}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pendingSales.some((s) => s.syncStatus === "FAILED" || s.syncStatus === "SYNCING") && (
            <button
              type="button"
              onClick={handleResetQueueToPending}
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-all shadow-xs"
            >
              <span>Reset Stuck to Pending</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-[#32190D] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#F8F3E9] hover:bg-[#D6A64B] hover:text-[#32190D] transition-all shadow-md disabled:opacity-50"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
            <span>{syncing ? "Synchronizing..." : "Sync Now"}</span>
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-[#D6A64B]/40 text-[#32190D] text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} className="text-[#8C6219] shrink-0" />
          <span>{syncResult}</span>
        </div>
      )}

      {/* Connectivity Status & Device Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Neon Database Status */}
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#806E5D]">
              Neon Database Status
            </span>
            {isBackendReachable ? (
              <Wifi size={18} className="text-emerald-600" />
            ) : (
              <WifiOff size={18} className="text-amber-600" />
            )}
          </div>
          <p className="mt-3 text-lg font-serif font-bold text-[#32190D]">
            {isBackendReachable ? "Central DB Reachable" : "Offline / Unreachable"}
          </p>
          <p className="mt-1 text-[11px] text-[#806E5D]">
            {isBackendReachable
              ? "Live sync and real-time inventory active"
              : "Transactions will persist locally in IndexedDB"}
          </p>
        </div>

        {/* Local Storage Cache */}
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#806E5D]">
              IndexedDB Storage
            </span>
            <Database size={18} className="text-[#D6A64B]" />
          </div>
          <p className="mt-3 text-lg font-serif font-bold text-[#32190D]">
            {cachedProductCount} Products Cached
          </p>
          <p className="mt-1 text-[11px] text-[#806E5D]">
            {cachedStaffCount} offline staff credentials provisioned
          </p>
        </div>

        {/* Pending Sync Queue */}
        <div className="rounded-2xl border border-[#32190D]/10 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#806E5D]">
              Pending Upload Queue
            </span>
            <Clock size={18} className="text-[#8C6219]" />
          </div>
          <p className="mt-3 text-lg font-serif font-bold text-[#32190D]">
            {pendingSales.length} Transactions
          </p>
          <p className="mt-1 text-[11px] text-[#806E5D]">
            {pendingSales.length === 0
              ? "All offline sales are up-to-date"
              : "Will sync automatically upon reconnection"}
          </p>
        </div>
      </div>

      {/* Pending Transactions Queue Table */}
      <div className="rounded-3xl border border-[#32190D]/10 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#32190D]/10 bg-[#FAF6EE] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#32190D]">
              Pending Offline Transactions Queue
            </h3>
            <p className="text-xs text-[#806E5D]">
              Sales recorded offline waiting for server acknowledgement
            </p>
          </div>
          <span className="text-xs font-bold text-[#8C6219]">
            {pendingSales.length} In Queue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
              <tr>
                <th className="px-6 py-3">Receipt #</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {pendingSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    Queue is empty. No pending offline transactions.
                  </td>
                </tr>
              ) : (
                pendingSales.map((sale) => (
                  <tr key={sale.clientTransactionId} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 font-mono font-bold text-[#32190D]">
                      {sale.receiptNumber}
                      {sale.syncError && (
                        <p className="font-sans font-normal text-[10px] text-red-600 max-w-xs truncate" title={sale.syncError}>
                          {sale.syncError}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 whitespace-nowrap">
                      {new Date(sale.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3.5 font-medium">
                      {sale.customerName}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500">
                      {sale.items.reduce((s, i) => s + i.quantity, 0)} items
                    </td>
                    <td className="px-6 py-3.5 font-bold text-[#32190D]">
                      Rs. {sale.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-[#8C6219]">
                      {sale.payment.method}
                    </td>
                    <td className="px-6 py-3.5">
                      {sale.syncStatus === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          <AlertTriangle size={11} /> FAILED
                        </span>
                      ) : sale.syncStatus === "SYNCING" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <RefreshCw size={11} className="animate-spin" /> SYNCING
                        </span>
                      ) : sale.syncStatus === "SYNCED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 size={11} /> SYNCED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock size={11} /> PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Device Inventory Conflict Reports */}
      {serverConflicts.length > 0 && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50/50 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-700" size={20} />
            <h3 className="font-serif text-lg font-bold text-amber-900">
              Multi-Device Offline Inventory Conflicts ({serverConflicts.length})
            </h3>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            These sales occurred while devices were offline simultaneously, causing the physical
            counter sales to exceed available central stock. All financial transactions have been
            preserved safely; review the discrepancies below for baking / stock reconciliation.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-amber-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-100/60 text-amber-900 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Product</th>
                  <th className="px-4 py-2.5">Device</th>
                  <th className="px-4 py-2.5">Sold Offline</th>
                  <th className="px-4 py-2.5">Stock at Sync</th>
                  <th className="px-4 py-2.5">Oversold By</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {serverConflicts.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-bold text-[#32190D]">{c.productName}</td>
                    <td className="px-4 py-3 text-gray-600">{c.device?.deviceCode || "POS"}</td>
                    <td className="px-4 py-3 font-semibold">{c.requestedQuantity} pcs</td>
                    <td className="px-4 py-3 text-gray-600">{c.availableQuantityAtSync} pcs</td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      +{c.requestedQuantity - Math.max(0, c.availableQuantityAtSync)} pcs
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold uppercase">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
