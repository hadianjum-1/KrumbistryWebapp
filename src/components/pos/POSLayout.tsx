"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  ReceiptText,
  DollarSign,
  RefreshCw,
  Settings,
  Store,
  Wifi,
  WifiOff,
  User,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import {
  checkBackendReachable,
  syncDownCatalog,
  pushPendingSales,
  getLocalDeviceCode,
} from "@/lib/posSyncEngine";
import { posDb } from "@/lib/posDb";

interface POSLayoutProps {
  children: ReactNode;
}

export default function POSLayout({ children }: POSLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isBrowserOnline, setIsBrowserOnline] = useState(true);
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [currentStaff, setCurrentStaff] = useState<{
    id: string;
    name: string;
    role: string;
  } | null>(null);
  const [deviceCode, setDeviceCode] = useState("POS-01");

  // Load session & device info
  useEffect(() => {
    setDeviceCode(getLocalDeviceCode());

    // Register Service Worker for PWA
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/pos-sw.js")
        .then(() => console.log("POS Service Worker registered"))
        .catch((err) => console.warn("SW register non-fatal:", err));
    }

    // Load active staff session from server or local storage
    fetch("/api/pos/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.staff) {
          setCurrentStaff(data.staff);
        } else {
          // Check local session
          const localStaff = localStorage.getItem("krumbistry_pos_active_staff");
          if (localStaff) {
            try {
              setCurrentStaff(JSON.parse(localStaff));
            } catch {
              router.push("/pos/login");
            }
          } else {
            router.push("/pos/login");
          }
        }
      })
      .catch(() => {
        const localStaff = localStorage.getItem("krumbistry_pos_active_staff");
        if (localStaff) {
          try {
            setCurrentStaff(JSON.parse(localStaff));
          } catch {
            router.push("/pos/login");
          }
        } else {
          router.push("/pos/login");
        }
      });

    // Check pending sales count in IndexedDB (relaxed interval, only when active)
    const checkPending = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (posDb) {
        try {
          const count = await posDb.pendingSales
            .where("syncStatus")
            .equals("PENDING")
            .count();
          setPendingCount(count);
        } catch {}
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 15000);
    return () => clearInterval(interval);
  }, []);

  // Health and connectivity probe (runs on mount and on browser online/offline events)
  useEffect(() => {
    let active = true;

    const evaluateConnectivity = async () => {
      const browserOn = navigator.onLine;
      if (!active) return;
      setIsBrowserOnline(browserOn);

      if (browserOn) {
        const reachable = await checkBackendReachable();
        if (!active) return;
        setIsBackendReachable(reachable);

        // Auto sync if reachable and pending sales exist
        if (reachable && posDb && !isSyncing) {
          const count = await posDb.pendingSales
            .where("syncStatus")
            .equals("PENDING")
            .count();
          if (count > 0 && active) {
            setIsSyncing(true);
            try {
              await pushPendingSales();
              if (active && posDb) {
                const updatedCount = await posDb.pendingSales
                  .where("syncStatus")
                  .equals("PENDING")
                  .count();
                setPendingCount(updatedCount);
              }
            } catch {} finally {
              if (active) setIsSyncing(false);
            }
          }
        }
      } else {
        setIsBackendReachable(false);
      }
    };

    evaluateConnectivity();
    // Cache catalog initial seed once on mount
    syncDownCatalog().catch(() => {});

    window.addEventListener("online", evaluateConnectivity);
    window.addEventListener("offline", evaluateConnectivity);

    // Relaxed probe: only check every 60 seconds if tab is visible
    const probeTimer = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        evaluateConnectivity();
      }
    }, 60000);

    return () => {
      active = false;
      window.removeEventListener("online", evaluateConnectivity);
      window.removeEventListener("offline", evaluateConnectivity);
      clearInterval(probeTimer);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncDownCatalog();
      await pushPendingSales();
      if (posDb) {
        const count = await posDb.pendingSales
          .where("syncStatus")
          .equals("PENDING")
          .count();
        setPendingCount(count);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/pos/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("krumbistry_pos_active_staff");
    setCurrentStaff(null);
    router.push("/pos/login");
  };

  const navigation = [
    {
      label: "Point of Sale",
      href: "/pos",
      icon: ShoppingBag,
    },
    {
      label: "Sales History",
      href: "/pos/sales",
      icon: ReceiptText,
    },
    {
      label: "Register Shift",
      href: "/pos/register",
      icon: DollarSign,
    },
    {
      label: "Sync Engine",
      href: "/pos/sync",
      icon: RefreshCw,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      label: "Dashboard",
      href: "/pos/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Settings",
      href: "/pos/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F3E9] text-[#32190D] md:flex">
      {/* Sidebar */}
      <aside className="w-full border-b border-[#32190D]/10 bg-[#32190D] text-[#F8F3E9] md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col md:border-b-0 md:border-r md:border-white/10 print:hidden">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/pos" className="block">
            <h1 className="font-serif text-2xl tracking-wide text-[#F8F3E9]">
              KRUMBISTRY
            </h1>
            <p className="mt-1 text-[10px] tracking-[0.3em] text-[#D6A64B] font-semibold">
              POINT OF SALE · {deviceCode}
            </p>
          </Link>
        </div>

        {/* Current Staff Badge in Sidebar */}
        <div className="px-4 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#D6A64B] text-[#32190D] font-bold flex items-center justify-center text-xs shrink-0">
              {currentStaff ? currentStaff.name.charAt(0).toUpperCase() : <User size={14} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-[#F8F3E9]">
                {currentStaff ? currentStaff.name : "Guest Terminal"}
              </p>
              <p className="text-[10px] text-[#D6A64B] uppercase tracking-wider font-medium">
                {currentStaff?.role || "Staff"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title="Switch Staff / Lock Terminal"
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex gap-1.5 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-[#D6A64B] font-semibold text-[#32190D] shadow-md shadow-black/10"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive ? "bg-[#32190D] text-[#D6A64B]" : "bg-amber-500 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Store footer info */}
        <div className="hidden border-t border-white/10 p-4 md:block">
          <div className="rounded-xl bg-white/5 p-3.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[#D6A64B]">
                <Store size={15} />
                <span className="text-xs font-semibold">KRUMBISTRY Bake Shop</span>
              </div>
              <p className="mt-0.5 text-[10px] text-white/50">Terminal: {deviceCode}</p>
            </div>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Sync Catalog & Offline Sales Now"
              className="p-1.5 rounded-lg bg-white/10 text-[#D6A64B] hover:bg-[#D6A64B] hover:text-[#32190D] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1 md:ml-64">
        {/* Sticky Header with Real Connection & Sync Status */}
        <header className="sticky top-0 z-20 flex min-h-[68px] items-center justify-between border-b border-[#32190D]/10 bg-[#F8F3E9]/95 px-5 backdrop-blur md:px-8 print:hidden">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B68A35]">
                KRUMBISTRY BAKE SHOP
              </p>
              <h2 className="font-serif text-lg md:text-xl font-medium text-[#32190D]">
                {navigation.find((n) => n.href === pathname)?.label || "Point of Sale"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Pending Sync Alert */}
            {pendingCount > 0 && (
              <Link
                href="/pos/sync"
                className="flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-xs animate-pulse"
              >
                <AlertTriangle size={14} className="text-amber-700" />
                <span>{pendingCount} Pending Sync</span>
              </Link>
            )}

            {/* Syncing indicator */}
            {isSyncing && (
              <div className="flex items-center gap-1.5 rounded-full bg-blue-100 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-800">
                <RefreshCw size={13} className="animate-spin text-blue-600" />
                <span>Syncing...</span>
              </div>
            )}

            {/* Verified Central Neon Connectivity Pill */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-xs ${
                isBackendReachable
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : isBrowserOnline
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
              title={
                isBackendReachable
                  ? "Central Neon Database is Connected"
                  : "Offline Mode Active (Local IndexedDB will record sales)"
              }
            >
              {isBackendReachable ? (
                <Wifi size={14} className="text-emerald-700" />
              ) : (
                <WifiOff size={14} className="text-amber-700" />
              )}
              <span>{isBackendReachable ? "ONLINE" : "OFFLINE"}</span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
