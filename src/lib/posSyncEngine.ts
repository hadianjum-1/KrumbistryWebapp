import bcrypt from "bcryptjs";
import {
  posDb,
  type CachedProduct,
  type CachedCategory,
  type OfflineStaff,
  type PendingSale,
  type LocalRegisterSession,
} from "./posDb";

export interface SyncStatusState {
  isOnline: boolean;
  isBackendReachable: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
}

const DEFAULT_DEVICE_CODE = "POS-01";

/**
 * Get local device code or fallback
 */
export function getLocalDeviceCode(): string {
  if (typeof window === "undefined") return DEFAULT_DEVICE_CODE;
  return localStorage.getItem("krumbistry_pos_device_code") || DEFAULT_DEVICE_CODE;
}

/**
 * Set local device code
 */
export function setLocalDeviceCode(code: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("krumbistry_pos_device_code", code.trim());
  }
}

/**
 * Check genuine backend reachability
 */
export async function checkBackendReachable(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("/api/pos/health", {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Pull Catalog & Staff into IndexedDB
 */
export async function syncDownCatalog(): Promise<{
  success: boolean;
  productsCount: number;
  categoriesCount: number;
  staffCount: number;
}> {
  if (!posDb) return { success: false, productsCount: 0, categoriesCount: 0, staffCount: 0 };

  try {
    const deviceCode = getLocalDeviceCode();

    // 1. Fetch Products & Categories
    const prodRes = await fetch("/api/pos/products", { cache: "no-store" });
    if (!prodRes.ok) throw new Error("Failed to fetch products from server");
    const prodData = await prodRes.json();

    if (prodData.success) {
      await posDb.transaction("rw", posDb.cachedProducts, posDb.cachedCategories, async () => {
        await posDb.cachedProducts.clear();
        await posDb.cachedCategories.clear();

        await posDb.cachedProducts.bulkPut(
          prodData.products.map((p: any) => ({
            ...p,
            updatedAt: new Date().toISOString(),
          }))
        );

        await posDb.cachedCategories.bulkPut(prodData.categories);
      });
    }

    // 2. Fetch Authorized Offline Staff Credentials
    const staffRes = await fetch(`/api/pos/auth/offline-pack?deviceCode=${deviceCode}`, {
      cache: "no-store",
    });

    let staffCount = 0;
    if (staffRes.ok) {
      const staffData = await staffRes.json();
      if (staffData.success && staffData.staff) {
        await posDb.offlineStaff.clear();
        await posDb.offlineStaff.bulkPut(
          staffData.staff.map((s: any) => ({
            id: s.id,
            name: s.name,
            role: s.role,
            pinHash: s.pinHash,
            maxOfflineHours: s.maxOfflineHours || 72,
            cachedAt: new Date().toISOString(),
          }))
        );
        staffCount = staffData.staff.length;

        // Store device profile
        await posDb.deviceProfile.put({
          id: staffData.device.id,
          deviceCode: staffData.device.deviceCode,
          name: staffData.device.name,
          branch: staffData.device.branch,
          allowOffline: staffData.device.allowOffline,
          lastSyncAt: new Date().toISOString(),
        });
      }
    }

    return {
      success: true,
      productsCount: prodData.products?.length || 0,
      categoriesCount: prodData.categories?.length || 0,
      staffCount,
    };
  } catch (err) {
    console.warn("syncDownCatalog error:", err);
    return { success: false, productsCount: 0, categoriesCount: 0, staffCount: 0 };
  }
}

/**
 * Push Pending Sales to Server (Offline Synchronization)
 */
export async function pushPendingSales(): Promise<{
  success: boolean;
  syncedCount: number;
  conflictsCount: number;
  failedCount: number;
}> {
  if (!posDb) return { success: false, syncedCount: 0, conflictsCount: 0, failedCount: 0 };

  const deviceCode = getLocalDeviceCode();

  // Reset any stuck SYNCING or FAILED sales to PENDING before collecting batch
  await posDb.pendingSales
    .where("syncStatus")
    .anyOf(["SYNCING", "FAILED"])
    .modify({ syncStatus: "PENDING" });

  // Find all pending sales
  const pending = await posDb.pendingSales
    .where("syncStatus")
    .equals("PENDING")
    .toArray();

  if (pending.length === 0) {
    return { success: true, syncedCount: 0, conflictsCount: 0, failedCount: 0 };
  }

  try {
    // Mark as SYNCING in local DB
    for (const p of pending) {
      await posDb.pendingSales.update(p.clientTransactionId, { syncStatus: "SYNCING" });
    }

    const payload = {
      deviceCode,
      transactions: pending.map((p: PendingSale) => ({
        clientTransactionId: p.clientTransactionId,
        deviceCode: p.deviceCode || deviceCode,
        staffId: p.staffId,
        receiptNumber: p.receiptNumber,
        createdAt: p.createdAt,
        customerName: p.customerName || "Walk-in Customer",
        customerPhone: p.customerPhone || "Walk-in",
        items: p.items.map((it: any) => ({
          productId: it.productId,
          productName: it.productName || it.name || "Bakery Item",
          productSku: it.productSku || it.sku || "",
          quantity: it.quantity || 1,
          unitPrice: it.unitPrice || 0,
          notes: it.notes || undefined,
        })),
        subtotal: p.subtotal,
        discount: p.discount || 0,
        discountReason: p.discountReason || undefined,
        tax: p.tax || 0,
        total: p.total,
        payment: {
          method: p.payment?.method || "CASH",
          amountReceived: p.payment?.amountReceived || p.total,
          changeGiven: p.payment?.changeGiven || 0,
          reference: p.payment?.reference || undefined,
        },
      })),
    };

    const res = await fetch("/api/pos/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody.error || `Server HTTP ${res.status}`;
      // Revert to FAILED on HTTP error with clear message
      for (const p of pending) {
        await posDb.pendingSales.update(p.clientTransactionId, {
          syncStatus: "FAILED",
          syncError: errMsg,
        });
      }
      return { success: false, syncedCount: 0, conflictsCount: 0, failedCount: pending.length };
    }

    const data = await res.json();

    if (data.success) {
      const syncedIds = new Set(data.syncedTransactionIds || []);
      const now = new Date().toISOString();

      for (const p of pending) {
        if (syncedIds.has(p.clientTransactionId)) {
          await posDb.pendingSales.update(p.clientTransactionId, {
            syncStatus: "SYNCED",
            syncedAt: now,
          });
        }
      }

      // Check if any individual transactions failed
      if (Array.isArray(data.failedTransactions)) {
        for (const ft of data.failedTransactions) {
          await posDb.pendingSales.update(ft.clientTransactionId, {
            syncStatus: "FAILED",
            syncError: ft.error || "Sync error",
          });
        }
      }

      // Refresh product stock levels after successful sync
      syncDownCatalog().catch(() => {});

      return {
        success: true,
        syncedCount: data.syncedTransactionIds?.length || 0,
        conflictsCount: data.conflictReports?.length || 0,
        failedCount: data.failedTransactions?.length || 0,
      };
    } else {
      for (const p of pending) {
        await posDb.pendingSales.update(p.clientTransactionId, {
          syncStatus: "FAILED",
          syncError: data.error || "Sync rejected",
        });
      }
      return { success: false, syncedCount: 0, conflictsCount: 0, failedCount: pending.length };
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Network error";
    for (const p of pending) {
      await posDb.pendingSales.update(p.clientTransactionId, {
        syncStatus: "FAILED",
        syncError: errorMsg,
      });
    }
    return { success: false, syncedCount: 0, conflictsCount: 0, failedCount: pending.length };
  }
}

/**
 * Complete POS Sale (Online first with seamless Offline Fallback)
 */
export async function executePosCheckout(saleInput: {
  staffId: string;
  staffName: string;
  deviceCode: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    productId: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
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
  registerSessionId?: string;
}): Promise<{
  success: boolean;
  isOffline: boolean;
  receiptNumber: string;
  orderNumber?: string;
  error?: string;
}> {
  const isOnline = await checkBackendReachable();
  const clientTransactionId = crypto.randomUUID();
  const sequence = Date.now().toString().slice(-6);
  const localReceiptNumber = `KRB-${saleInput.deviceCode}-${sequence}`;

  // 1. Try Online Checkout First
  if (isOnline) {
    try {
      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientTransactionId,
          receiptNumber: localReceiptNumber,
          customerName: saleInput.customerName || "Walk-in Customer",
          customerPhone: saleInput.customerPhone || "Walk-in",
          items: saleInput.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            notes: i.notes,
          })),
          discount: saleInput.discount,
          discountReason: saleInput.discountReason,
          tax: saleInput.tax,
          payment: saleInput.payment,
          registerSessionId: saleInput.registerSessionId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Also save to local synced sales history for offline receipt reprinting
        if (posDb) {
          await posDb.pendingSales.put({
            clientTransactionId,
            deviceCode: saleInput.deviceCode,
            staffId: saleInput.staffId,
            staffName: saleInput.staffName,
            receiptNumber: data.order.receiptNumber,
            createdAt: new Date().toISOString(),
            customerName: saleInput.customerName || "Walk-in Customer",
            customerPhone: saleInput.customerPhone || "Walk-in",
            items: saleInput.items,
            subtotal: saleInput.subtotal,
            discount: saleInput.discount,
            discountReason: saleInput.discountReason,
            tax: saleInput.tax,
            total: saleInput.total,
            payment: saleInput.payment,
            syncStatus: "SYNCED",
            syncedAt: new Date().toISOString(),
          });
        }

        return {
          success: true,
          isOffline: false,
          receiptNumber: data.order.receiptNumber,
          orderNumber: data.order.orderNumber,
        };
      }
    } catch (onlineErr) {
      console.warn("Online checkout failed, falling back to offline persistence:", onlineErr);
    }
  }

  // 2. Offline Sale Execution & Local Persistence
  if (!posDb) {
    return { success: false, isOffline: true, receiptNumber: "", error: "IndexedDB not available" };
  }

  const now = new Date().toISOString();

  // Save to pending sales queue
  const pendingSale: PendingSale = {
    clientTransactionId,
    deviceCode: saleInput.deviceCode,
    staffId: saleInput.staffId,
    staffName: saleInput.staffName,
    receiptNumber: localReceiptNumber,
    createdAt: now,
    customerName: saleInput.customerName || "Walk-in Customer",
    customerPhone: saleInput.customerPhone || "Walk-in",
    items: saleInput.items,
    subtotal: saleInput.subtotal,
    discount: saleInput.discount,
    discountReason: saleInput.discountReason,
    tax: saleInput.tax,
    total: saleInput.total,
    payment: saleInput.payment,
    syncStatus: "PENDING",
  };

  await posDb.pendingSales.put(pendingSale);

  // Decrement local cached inventory so cashier sees updated stock immediately
  for (const item of saleInput.items) {
    const cached = await posDb.cachedProducts.get(item.productId);
    if (cached && cached.trackInventory) {
      const newStock = cached.stockQuantity - item.quantity;
      await posDb.cachedProducts.update(item.productId, {
        stockQuantity: newStock,
        isLowStock: newStock <= cached.lowStockThreshold,
      });
    }
  }

  // Update local register session totals if active
  const activeSession = await posDb.localRegisterSession
    .where("status")
    .equals("OPEN")
    .first();

  if (activeSession) {
    const isCash = saleInput.payment.method === "CASH";
    const isCard = saleInput.payment.method === "CARD";
    await posDb.localRegisterSession.update(activeSession.id, {
      cashSalesTotal: isCash
        ? activeSession.cashSalesTotal + saleInput.total
        : activeSession.cashSalesTotal,
      cardSalesTotal: isCard
        ? activeSession.cardSalesTotal + saleInput.total
        : activeSession.cardSalesTotal,
      otherSalesTotal:
        !isCash && !isCard
          ? activeSession.otherSalesTotal + saleInput.total
          : activeSession.otherSalesTotal,
      cashSalesCount: isCash
        ? activeSession.cashSalesCount + 1
        : activeSession.cashSalesCount,
    });
  }

  // Record local audit log
  await posDb.localAuditLogs.add({
    action: "OFFLINE_SALE_COMPLETED",
    entity: "PendingSale",
    entityId: clientTransactionId,
    staffId: saleInput.staffId,
    details: JSON.stringify({
      receiptNumber: localReceiptNumber,
      total: saleInput.total,
      paymentMethod: saleInput.payment.method,
    }),
    createdAt: now,
  });

  // Attempt background sync immediately so the sale reaches central DB & dashboard right away
  pushPendingSales().catch(() => {});

  return {
    success: true,
    isOffline: true,
    receiptNumber: localReceiptNumber,
  };
}

/**
 * Offline Staff PIN Authentication with Rate Limiting and Lockout
 */
export async function authenticateStaffOffline(
  pin: string,
  deviceCode: string
): Promise<{
  success: boolean;
  staff?: { id: string; name: string; role: "OWNER" | "MANAGER" | "CASHIER" };
  error?: string;
  locked?: boolean;
  lockoutRemainingSeconds?: number;
}> {
  if (!posDb) return { success: false, error: "Database not ready" };

  const now = Date.now();

  // Check device lockout state
  const lockout = await posDb.offlineLockoutState.get(deviceCode);
  if (lockout && lockout.lockedUntil && lockout.lockedUntil > now) {
    const diffSeconds = Math.ceil((lockout.lockedUntil - now) / 1000);
    return {
      success: false,
      locked: true,
      lockoutRemainingSeconds: diffSeconds,
      error: `Terminal locked due to repeated incorrect PIN attempts. Try again in ${diffSeconds}s.`,
    };
  }

  // Check active offline staff records
  const cachedStaff = await posDb.offlineStaff.toArray();
  if (cachedStaff.length === 0) {
    return {
      success: false,
      error: "No offline credentials cached. Please connect to internet to authorize staff.",
    };
  }

  let matchedStaff: OfflineStaff | null = null;
  for (const s of cachedStaff) {
    const isMatch = bcrypt.compareSync(pin.trim(), s.pinHash);
    if (isMatch) {
      matchedStaff = s;
      break;
    }
  }

  if (matchedStaff) {
    // Reset lockout state on success
    await posDb.offlineLockoutState.put({
      deviceCode,
      failedAttempts: 0,
      lockedUntil: null,
    });

    // Record audit
    await posDb.localAuditLogs.add({
      action: "OFFLINE_LOGIN_SUCCESS",
      entity: "Staff",
      entityId: matchedStaff.id,
      staffId: matchedStaff.id,
      details: `Role: ${matchedStaff.role}`,
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      staff: {
        id: matchedStaff.id,
        name: matchedStaff.name,
        role: matchedStaff.role,
      },
    };
  } else {
    // Failed attempt increment
    const currentAttempts = (lockout?.failedAttempts || 0) + 1;
    let lockedUntil: number | null = null;

    if (currentAttempts >= 5) {
      lockedUntil = now + 5 * 60 * 1000; // 5 minute lockout
    }

    await posDb.offlineLockoutState.put({
      deviceCode,
      failedAttempts: currentAttempts,
      lockedUntil,
    });

    await posDb.localAuditLogs.add({
      action: "OFFLINE_LOGIN_FAILED",
      entity: "Staff",
      details: `Attempt ${currentAttempts}`,
      createdAt: new Date().toISOString(),
    });

    if (lockedUntil) {
      return {
        success: false,
        locked: true,
        lockoutRemainingSeconds: 300,
        error: "Terminal locked for 5 minutes due to 5 failed attempts.",
      };
    }

    return {
      success: false,
      error: `Incorrect PIN. (${5 - currentAttempts} attempts remaining before lockout)`,
    };
  }
}
