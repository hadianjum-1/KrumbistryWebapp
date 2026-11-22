import Dexie, { type EntityTable } from "dexie";

export interface CachedProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  salePrice?: number | null;
  sku: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  mainImage: string;
  available: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  updatedAt: string;
}

export interface CachedCategory {
  id: string;
  name: string;
  slug: string;
}

export interface OfflineStaff {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "CASHIER";
  pinHash: string;
  maxOfflineHours: number;
  cachedAt: string;
}

export interface DeviceProfile {
  id: string;
  deviceCode: string;
  name: string;
  branch: string;
  allowOffline: boolean;
  lastSyncAt?: string;
}

export interface PendingSaleItem {
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
}

export interface PendingSale {
  clientTransactionId: string;
  deviceCode: string;
  staffId: string;
  staffName: string;
  receiptNumber: string;
  createdAt: string; // ISO string
  customerName: string;
  customerPhone: string;
  items: PendingSaleItem[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  tax: number;
  total: number;
  payment: {
    method: "CASH" | "CARD" | "BANK_TRANSFER" | "JAZZ_CASH" | "EASYPAISA";
    amountReceived?: number;
    changeGiven?: number;
    reference?: string;
  };
  syncStatus: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
  syncError?: string;
  syncedAt?: string;
}

export interface LocalRegisterSession {
  id: string;
  deviceCode: string;
  staffId: string;
  staffName: string;
  openedAt: string;
  openingCash: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  otherSalesTotal: number;
  cashInTotal: number;
  cashOutTotal: number;
  cashSalesCount: number;
  status: "OPEN" | "CLOSED";
  closedAt?: string;
  closingCash?: number;
  expectedCash?: number;
  cashDifference?: number;
  notes?: string;
}

export interface LocalAuditLog {
  id?: number;
  action: string;
  entity: string;
  entityId?: string;
  staffId?: string;
  details?: string;
  createdAt: string;
}

export interface OfflineLockoutState {
  deviceCode: string;
  failedAttempts: number;
  lockedUntil: number | null; // Timestamp ms
}

class KrumbistryPosDatabase extends Dexie {
  cachedProducts!: EntityTable<CachedProduct, "id">;
  cachedCategories!: EntityTable<CachedCategory, "id">;
  offlineStaff!: EntityTable<OfflineStaff, "id">;
  deviceProfile!: EntityTable<DeviceProfile, "deviceCode">;
  pendingSales!: EntityTable<PendingSale, "clientTransactionId">;
  localRegisterSession!: EntityTable<LocalRegisterSession, "id">;
  localAuditLogs!: EntityTable<LocalAuditLog, "id">;
  offlineLockoutState!: EntityTable<OfflineLockoutState, "deviceCode">;

  constructor() {
    super("KrumbistryPosDB");

    this.version(1).stores({
      cachedProducts: "id, categoryId, categorySlug, sku, name",
      cachedCategories: "id, slug",
      offlineStaff: "id, role",
      deviceProfile: "deviceCode",
      pendingSales: "clientTransactionId, syncStatus, createdAt, receiptNumber",
      localRegisterSession: "id, deviceCode, status",
      localAuditLogs: "++id, action, createdAt",
      offlineLockoutState: "deviceCode",
    });
  }
}

// Global browser singleton
export const posDb = typeof window !== "undefined" ? new KrumbistryPosDatabase() : (null as any);
