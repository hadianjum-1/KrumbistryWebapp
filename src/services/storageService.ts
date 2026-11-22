import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";

// Configure Cloudinary using server environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryStorageInfo {
  status: "healthy" | "unconfigured" | "error";
  error?: string;
  plan: string;
  usedBytes: number;
  usedFormatted: string;
  limitBytes: number | null;
  limitFormatted: string | null;
  usedPercent: number | null;
  remainingBytes: number | null;
  remainingFormatted: string | null;
  assetsCount: number;
  bandwidthBytes: number;
  bandwidthFormatted: string;
  creditsUsage?: number;
  creditsLimit?: number;
  creditsPercent?: number;
  lastUpdated?: string;
}

export interface NeonTableSize {
  name: string;
  bytes: number;
  formatted: string;
}

export interface NeonStorageInfo {
  status: "healthy" | "error";
  error?: string;
  databaseName: string;
  usedBytes: number;
  usedFormatted: string;
  quotaBytes: number | null;
  quotaFormatted: string | null;
  usedPercent: number | null;
  remainingBytes: number | null;
  remainingFormatted: string | null;
  topTables: NeonTableSize[];
}

export interface StorageStats {
  timestamp: string;
  cloudinary: CloudinaryStorageInfo;
  neon: NeonStorageInfo;
}

// In-memory cache to prevent provider rate limits on repeated UI refreshes (60s TTL)
let cachedStats: { data: StorageStats; expiresAt: number } | null = null;
let lastRefreshTime = 0;

export function formatBytes(bytes: number, decimals = 2): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Fetch Cloudinary account usage via official Admin API
 */
export async function getCloudinaryStorage(): Promise<CloudinaryStorageInfo> {
  const isConfigured =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (!isConfigured) {
    return {
      status: "unconfigured",
      error: "Cloudinary credentials not configured on server.",
      plan: "Unconfigured",
      usedBytes: 0,
      usedFormatted: "0 MB",
      limitBytes: null,
      limitFormatted: null,
      usedPercent: null,
      remainingBytes: null,
      remainingFormatted: null,
      assetsCount: 0,
      bandwidthBytes: 0,
      bandwidthFormatted: "0 MB",
    };
  }

  try {
    const usage = await cloudinary.api.usage();

    const usedBytes = Number(usage.storage?.usage || 0);
    const bandwidthBytes = Number(usage.bandwidth?.usage || 0);
    const assetsCount = Number(usage.resources ?? usage.objects?.usage ?? 0);
    const plan = usage.plan || "Free";

    // Cloudinary modern plans use unified Credits (1 Credit = 1 GB storage or bandwidth)
    const creditsUsage = typeof usage.credits?.usage === "number" ? usage.credits.usage : undefined;
    const creditsLimit = typeof usage.credits?.limit === "number" ? usage.credits.limit : undefined;
    const creditsPercent = typeof usage.credits?.used_percent === "number" ? usage.credits.used_percent : undefined;

    let limitBytes: number | null = null;
    let usedPercent: number | null = null;
    let remainingBytes: number | null = null;

    if (creditsLimit && creditsLimit > 0) {
      // 1 credit = 1 GB = 1024 * 1024 * 1024 bytes in Cloudinary credit allowance
      limitBytes = creditsLimit * 1024 * 1024 * 1024;
      if (typeof creditsPercent === "number") {
        usedPercent = Math.min(100, Math.max(0, creditsPercent));
      } else if (limitBytes > 0) {
        usedPercent = Math.min(100, Math.max(0, parseFloat(((usedBytes / limitBytes) * 100).toFixed(1))));
      }
      remainingBytes = Math.max(0, limitBytes - usedBytes);
    } else if (usage.storage?.limit && Number(usage.storage.limit) > 0) {
      limitBytes = Number(usage.storage.limit);
      usedPercent = Math.min(100, Math.max(0, parseFloat(((usedBytes / limitBytes) * 100).toFixed(1))));
      remainingBytes = Math.max(0, limitBytes - usedBytes);
    }

    return {
      status: "healthy",
      plan,
      usedBytes,
      usedFormatted: formatBytes(usedBytes),
      limitBytes,
      limitFormatted: limitBytes ? formatBytes(limitBytes) : null,
      usedPercent,
      remainingBytes,
      remainingFormatted: remainingBytes !== null ? formatBytes(remainingBytes) : null,
      assetsCount,
      bandwidthBytes,
      bandwidthFormatted: formatBytes(bandwidthBytes),
      creditsUsage,
      creditsLimit,
      creditsPercent,
      lastUpdated: usage.last_updated || new Date().toISOString().slice(0, 10),
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to fetch Cloudinary usage";
    console.error("Cloudinary storage check error:", errorMsg);
    return {
      status: "error",
      error: errorMsg,
      plan: "Unavailable",
      usedBytes: 0,
      usedFormatted: "Unavailable",
      limitBytes: null,
      limitFormatted: null,
      usedPercent: null,
      remainingBytes: null,
      remainingFormatted: null,
      assetsCount: 0,
      bandwidthBytes: 0,
      bandwidthFormatted: "Unavailable",
    };
  }
}

/**
 * Fetch Neon PostgreSQL database size and top tables using system functions
 */
export async function getNeonStorage(): Promise<NeonStorageInfo> {
  try {
    // 1. Query exact database size in bytes
    const sizeResult: Array<{ size_bytes: string; size_pretty: string; db_name: string }> =
      await db.$queryRawUnsafe(
        "SELECT pg_database_size(current_database())::text as size_bytes, pg_size_pretty(pg_database_size(current_database())) as size_pretty, current_database() as db_name"
      );

    const usedBytes = Number(sizeResult[0]?.size_bytes || 0);
    const dbName = sizeResult[0]?.db_name || "neondb";

    // 2. Query top 5 relation sizes for granular breakdown
    let topTables: NeonTableSize[] = [];
    try {
      const tablesResult: Array<{ relname: string; bytes: string; pretty_size: string }> =
        await db.$queryRawUnsafe(
          "SELECT relname, pg_total_relation_size(relid)::text as bytes, pg_size_pretty(pg_total_relation_size(relid)) as pretty_size FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 5"
        );
      topTables = tablesResult.map((t) => ({
        name: t.relname,
        bytes: Number(t.bytes || 0),
        formatted: t.pretty_size || formatBytes(Number(t.bytes || 0)),
      }));
    } catch (tblErr) {
      console.warn("Failed to retrieve top table sizes:", tblErr);
    }

    // 3. Check for configured Neon plan quota if provided in environment
    // Neon Free Tier default allocation is 0.5 GB (500 MB) per project
    let quotaBytes: number | null = null;
    let usedPercent: number | null = null;
    let remainingBytes: number | null = null;

    if (process.env.NEON_STORAGE_LIMIT_BYTES) {
      quotaBytes = Number(process.env.NEON_STORAGE_LIMIT_BYTES);
    } else if (process.env.NEON_STORAGE_LIMIT_MB) {
      quotaBytes = Number(process.env.NEON_STORAGE_LIMIT_MB) * 1024 * 1024;
    }

    if (quotaBytes && quotaBytes > 0) {
      usedPercent = Math.min(100, Math.max(0, parseFloat(((usedBytes / quotaBytes) * 100).toFixed(1))));
      remainingBytes = Math.max(0, quotaBytes - usedBytes);
    }

    return {
      status: "healthy",
      databaseName: dbName,
      usedBytes,
      usedFormatted: formatBytes(usedBytes),
      quotaBytes,
      quotaFormatted: quotaBytes ? formatBytes(quotaBytes) : "Plan quota unavailable",
      usedPercent,
      remainingBytes,
      remainingFormatted: remainingBytes !== null ? formatBytes(remainingBytes) : null,
      topTables,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to query database size";
    console.error("Neon storage check error:", errorMsg);
    return {
      status: "error",
      error: errorMsg,
      databaseName: "neondb",
      usedBytes: 0,
      usedFormatted: "Unavailable",
      quotaBytes: null,
      quotaFormatted: "Unavailable",
      usedPercent: null,
      remainingBytes: null,
      remainingFormatted: null,
      topTables: [],
    };
  }
}

/**
 * Get unified storage statistics with TTL caching & throttle protection
 */
export async function getStorageStats(forceRefresh = false): Promise<StorageStats> {
  const now = Date.now();

  // If cached and still valid, and not forced, return cache
  if (!forceRefresh && cachedStats && cachedStats.expiresAt > now) {
    return cachedStats.data;
  }

  // Throttle forced refreshes to at most once every 5 seconds to prevent rate limiting
  if (forceRefresh && now - lastRefreshTime < 5000 && cachedStats) {
    return cachedStats.data;
  }

  lastRefreshTime = now;

  // Execute both provider checks in parallel so one failure does not block the other
  const [cloudinaryStats, neonStats] = await Promise.all([
    getCloudinaryStorage(),
    getNeonStorage(),
  ]);

  const stats: StorageStats = {
    timestamp: new Date().toISOString(),
    cloudinary: cloudinaryStats,
    neon: neonStats,
  };

  // Cache for 60 seconds
  cachedStats = {
    data: stats,
    expiresAt: now + 60000,
  };

  return stats;
}
