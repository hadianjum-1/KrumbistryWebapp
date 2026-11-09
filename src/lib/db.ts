import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Always sync DATABASE_URL from .env.local or .env on module load
try {
  const envPaths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const rawLine of content.split(/\r?\n/)) {
        const trimmed = rawLine.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (key === "DATABASE_URL") {
            process.env.DATABASE_URL = val;
          } else if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
} catch {
  // Ignore error
}

function getDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    // Neon PgBouncer requirement: pgbouncer=true prevents connection stalling on prepared statements
    if (url.hostname.includes("-pooler.") && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "30");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
    }
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "25");
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const resolvedDbUrl = getDatabaseUrl();

// Global cache to prevent multiple PrismaClient instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  activeUrl: string | undefined;
};

// Invalidate stale client if URL or connection pooling parameters changed
if (globalForPrisma.prisma && globalForPrisma.activeUrl !== resolvedDbUrl) {
  try {
    globalForPrisma.prisma.$disconnect();
  } catch {}
  globalForPrisma.prisma = undefined;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolvedDbUrl
      ? { db: { url: resolvedDbUrl } }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
  globalForPrisma.activeUrl = resolvedDbUrl;
}

export default db;
