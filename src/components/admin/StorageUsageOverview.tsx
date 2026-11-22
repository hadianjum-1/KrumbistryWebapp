"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Cloud,
  Database,
  RefreshCw,
  HardDrive,
  Layers,
  Activity,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  ArrowUpRight,
  Info,
} from "lucide-react";
import type { StorageStats } from "@/services/storageService";

export default function StorageUsageOverview() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");

  const fetchStorageData = useCallback(async (forced = false) => {
    if (forced) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const url = forced ? "/api/admin/system/storage?refresh=true" : "/api/admin/system/storage";
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load storage statistics.");
      }

      setStats(json.data);
      const now = new Date();
      setLastRefreshedAt(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error querying storage capacity";
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStorageData();
  }, [fetchStorageData]);

  // Determine progress bar color based on usage percentage
  const getProgressColor = (percent: number | null) => {
    if (percent === null) return "bg-[#D6A64B]";
    if (percent >= 90) return "bg-rose-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getTextColor = (percent: number | null) => {
    if (percent === null) return "text-[#32190D]";
    if (percent >= 90) return "text-rose-600";
    if (percent >= 70) return "text-amber-600";
    return "text-emerald-700";
  };

  return (
    <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header & Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF6EE] border border-[#32190D]/10 flex items-center justify-center text-[#D6A64B] shadow-xs">
            <HardDrive size={20} />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#32190D]">
              Storage &amp; Usage
            </h2>
            <p className="text-xs text-[#32190D]/60 mt-0.5">
              Live capacity and quota metrics for Cloudinary Media and Neon PostgreSQL database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {lastRefreshedAt && (
            <span className="text-[11px] font-mono text-[#32190D]/50 hidden sm:inline-block">
              Updated: {lastRefreshedAt}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchStorageData(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#32190D]/15 bg-[#FAF6EE] text-xs font-medium text-[#32190D] hover:border-[#D6A64B] hover:bg-white transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            title="Fetch live usage metrics"
          >
            <RefreshCw
              size={13}
              className={`text-[#D6A64B] ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>{isRefreshing ? "Checking..." : "Refresh Usage"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchStorageData(true)}
            className="text-xs font-semibold underline hover:no-underline text-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && !stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="rounded-xl border border-[#32190D]/10 bg-[#FAF6EE]/50 p-5 space-y-4">
            <div className="h-4 bg-[#32190D]/10 rounded w-1/3"></div>
            <div className="h-8 bg-[#32190D]/10 rounded w-1/2"></div>
            <div className="h-2 bg-[#32190D]/10 rounded w-full"></div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-10 bg-[#32190D]/10 rounded"></div>
              <div className="h-10 bg-[#32190D]/10 rounded"></div>
            </div>
          </div>
          <div className="rounded-xl border border-[#32190D]/10 bg-[#FAF6EE]/50 p-5 space-y-4">
            <div className="h-4 bg-[#32190D]/10 rounded w-1/3"></div>
            <div className="h-8 bg-[#32190D]/10 rounded w-1/2"></div>
            <div className="h-2 bg-[#32190D]/10 rounded w-full"></div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-10 bg-[#32190D]/10 rounded"></div>
              <div className="h-10 bg-[#32190D]/10 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {/* Two Storage Cards */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card A: Cloudinary Media Storage */}
          <div className="rounded-xl border border-[#32190D]/10 bg-gradient-to-br from-[#FAF6EE]/60 to-white p-5 flex flex-col justify-between space-y-4 shadow-2xs">
            {/* Card Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                    <Cloud size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#32190D]">
                      Cloudinary Media Storage
                    </h3>
                    <p className="text-[11px] text-[#32190D]/60">Product images &amp; uploaded cake assets</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                    {stats.cloudinary.plan} Plan
                  </span>
                  {stats.cloudinary.status === "healthy" && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                      Online
                    </span>
                  )}
                </div>
              </div>

              {/* Main Storage Metric */}
              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold text-[#32190D]">
                      {stats.cloudinary.usedFormatted}
                    </span>
                    {stats.cloudinary.limitFormatted && (
                      <span className="text-xs text-[#32190D]/50 font-medium">
                        / {stats.cloudinary.limitFormatted} Available
                      </span>
                    )}
                  </div>

                  {stats.cloudinary.usedPercent !== null && (
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-white border border-[#32190D]/10 shadow-2xs ${getTextColor(
                        stats.cloudinary.usedPercent
                      )}`}
                    >
                      {stats.cloudinary.usedPercent}% Used
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                {stats.cloudinary.usedPercent !== null ? (
                  <div className="mt-2.5">
                    <div className="w-full h-2.5 rounded-full bg-[#32190D]/10 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                          stats.cloudinary.usedPercent
                        )}`}
                        style={{ width: `${Math.min(100, Math.max(2, stats.cloudinary.usedPercent))}%` }}
                      ></div>
                    </div>
                    {stats.cloudinary.remainingFormatted && (
                      <div className="flex justify-between items-center mt-1.5 text-[11px] text-[#32190D]/60">
                        <span>Remaining: {stats.cloudinary.remainingFormatted}</span>
                        <span>Capacity: {stats.cloudinary.limitFormatted}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-[#32190D]/60 flex items-center gap-1">
                    <Info size={12} className="text-[#D6A64B]" />
                    <span>Usage tracked dynamically without fixed plan quota limit.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cloudinary Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-[#32190D]/10">
              <div className="bg-white/80 border border-[#32190D]/10 rounded-lg p-2.5">
                <span className="block text-[10px] uppercase tracking-wider text-[#32190D]/50 font-semibold">
                  Stored Assets
                </span>
                <span className="font-mono text-xs font-bold text-[#32190D] flex items-center gap-1 mt-0.5">
                  <ImageIcon size={12} className="text-[#D6A64B]" />
                  {stats.cloudinary.assetsCount} items
                </span>
              </div>

              <div className="bg-white/80 border border-[#32190D]/10 rounded-lg p-2.5">
                <span className="block text-[10px] uppercase tracking-wider text-[#32190D]/50 font-semibold">
                  Monthly Bandwidth
                </span>
                <span className="font-mono text-xs font-bold text-[#32190D] flex items-center gap-1 mt-0.5">
                  <Activity size={12} className="text-sky-500" />
                  {stats.cloudinary.bandwidthFormatted}
                </span>
              </div>

              <div className="bg-white/80 border border-[#32190D]/10 rounded-lg p-2.5 col-span-2 sm:col-span-1">
                <span className="block text-[10px] uppercase tracking-wider text-[#32190D]/50 font-semibold">
                  Credits Used
                </span>
                <span className="font-mono text-xs font-bold text-[#32190D] flex items-center gap-1 mt-0.5">
                  <Layers size={12} className="text-emerald-600" />
                  {stats.cloudinary.creditsUsage !== undefined
                    ? `${stats.cloudinary.creditsUsage} / ${stats.cloudinary.creditsLimit ?? 25}`
                    : "Included"}
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Neon PostgreSQL Database Storage */}
          <div className="rounded-xl border border-[#32190D]/10 bg-gradient-to-br from-[#FAF6EE]/60 to-white p-5 flex flex-col justify-between space-y-4 shadow-2xs">
            {/* Card Header */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <Database size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#32190D]">
                      Neon Database Storage
                    </h3>
                    <p className="text-[11px] text-[#32190D]/60">
                      PostgreSQL database: <span className="font-mono">{stats.neon.databaseName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                    Serverless
                  </span>
                </div>
              </div>

              {/* Main Storage Metric */}
              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl font-bold text-[#32190D]">
                      {stats.neon.usedFormatted}
                    </span>
                    <span className="text-xs text-[#32190D]/50 font-medium">Used</span>
                  </div>

                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#FAF6EE] border border-[#32190D]/10 text-[#32190D]/70 shadow-2xs">
                    {stats.neon.quotaFormatted}
                  </span>
                </div>

                {/* Progress Bar (Only when a reliable quota exists) */}
                {stats.neon.usedPercent !== null ? (
                  <div className="mt-2.5">
                    <div className="w-full h-2.5 rounded-full bg-[#32190D]/10 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(
                          stats.neon.usedPercent
                        )}`}
                        style={{ width: `${Math.min(100, Math.max(2, stats.neon.usedPercent))}%` }}
                      ></div>
                    </div>
                    {stats.neon.remainingFormatted && (
                      <div className="flex justify-between items-center mt-1.5 text-[11px] text-[#32190D]/60">
                        <span>Remaining: {stats.neon.remainingFormatted}</span>
                        <span>Limit: {stats.neon.quotaFormatted}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2.5 p-2 rounded-lg bg-[#FAF6EE]/80 border border-[#32190D]/10 text-[11px] text-[#32190D]/70 flex items-start gap-1.5">
                    <Info size={13} className="text-[#D6A64B] shrink-0 mt-0.5" />
                    <span>
                      Database size calculated via <code className="font-mono text-[10px] bg-white px-1 py-0.5 rounded border border-[#32190D]/10">pg_database_size()</code>. Neon automatically autoscales compute and storage on demand.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Tables Breakdown */}
            {stats.neon.topTables.length > 0 && (
              <div className="pt-3 border-t border-[#32190D]/10">
                <span className="block text-[10px] uppercase tracking-wider text-[#32190D]/50 font-semibold mb-1.5">
                  Top Storage Tables
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {stats.neon.topTables.map((table) => (
                    <span
                      key={table.name}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-[#32190D]/10 text-[11px] font-mono text-[#32190D]"
                      title={`${table.name}: ${table.bytes.toLocaleString()} bytes`}
                    >
                      <span className="font-medium text-[#32190D]/80">{table.name}</span>
                      <span className="text-[10px] font-bold text-[#D6A64B] bg-[#FAF6EE] px-1 rounded">
                        {table.formatted}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
