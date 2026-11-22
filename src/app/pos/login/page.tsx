"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Delete,
  Store,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  checkBackendReachable,
  authenticateStaffOffline,
  getLocalDeviceCode,
  syncDownCatalog,
} from "@/lib/posSyncEngine";

export default function PosLoginPage() {
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [deviceCode, setDeviceCode] = useState("POS-01");
  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  useEffect(() => {
    setDeviceCode(getLocalDeviceCode());

    const checkConn = async () => {
      const reachable = await checkBackendReachable();
      setIsBackendReachable(reachable);
    };
    checkConn();

    // Cache catalog initial seed once on mount
    syncDownCatalog().catch(() => {});

    window.addEventListener("online", checkConn);
    window.addEventListener("offline", checkConn);

    return () => {
      window.removeEventListener("online", checkConn);
      window.removeEventListener("offline", checkConn);
    };
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleDigit = (digit: string) => {
    if (lockoutSeconds) return;
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  };

  const handleBackspace = () => {
    if (lockoutSeconds) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (lockoutSeconds) return;
    setPin("");
    setError(null);
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4 || lockoutSeconds) return;

    setLoading(true);
    setError(null);

    try {
      const isOnline = await checkBackendReachable();

      if (isOnline) {
        // Online login
        const res = await fetch("/api/pos/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin, deviceCode }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem(
            "krumbistry_pos_active_staff",
            JSON.stringify(data.staff)
          );
          router.push("/pos");
          return;
        } else {
          setError(data.error || "Invalid PIN");
          setPin("");
        }
      } else {
        // Offline login via IndexedDB
        const offlineResult = await authenticateStaffOffline(pin, deviceCode);
        if (offlineResult.success && offlineResult.staff) {
          localStorage.setItem(
            "krumbistry_pos_active_staff",
            JSON.stringify(offlineResult.staff)
          );
          router.push("/pos");
          return;
        } else {
          if (offlineResult.locked && offlineResult.lockoutRemainingSeconds) {
            setLockoutSeconds(offlineResult.lockoutRemainingSeconds);
          }
          setError(offlineResult.error || "Offline verification failed.");
          setPin("");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#32190D] text-[#F8F3E9] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-[#FAF6EE] text-[#32190D] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#D6A64B]/40">
        {/* Brand Header */}
        <div className="text-center pb-6 border-b border-[#32190D]/10">
          <div className="w-12 h-12 rounded-full bg-[#32190D] text-[#D6A64B] mx-auto flex items-center justify-center mb-3 shadow-md">
            <Lock size={22} />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            KRUMBISTRY POS
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs font-semibold text-[#8C6219] uppercase tracking-wider">
              Terminal: {deviceCode}
            </span>
            <span className="text-[#32190D]/30">·</span>
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isBackendReachable
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isBackendReachable ? <Wifi size={12} /> : <WifiOff size={12} />}
              {isBackendReachable ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* PIN Dots Display */}
        <div className="py-6 text-center">
          <p className="text-xs uppercase tracking-widest font-semibold text-[#806E5D] mb-3">
            Enter Staff Security PIN
          </p>

          <div className="flex justify-center items-center gap-3 h-8">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    isFilled
                      ? "bg-[#32190D] border-[#32190D] scale-110"
                      : "border-[#32190D]/30 bg-transparent"
                  }`}
                />
              );
            })}
          </div>

          {/* Error / Lockout Banner */}
          {error && (
            <div className="mt-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {lockoutSeconds && (
            <p className="mt-2 text-xs text-amber-700 font-bold">
              Terminal Locked. Try again in {lockoutSeconds}s.
            </p>
          )}
        </div>

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 pb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={!!lockoutSeconds || loading}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-white border border-[#32190D]/10 font-serif text-2xl font-semibold text-[#32190D] hover:bg-[#D6A64B]/20 active:scale-95 transition-all shadow-xs disabled:opacity-40"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            disabled={!!lockoutSeconds || loading || pin.length === 0}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-white/50 border border-[#32190D]/10 text-xs uppercase tracking-wider font-bold text-[#806E5D] hover:bg-white active:scale-95 transition-all disabled:opacity-40"
          >
            Clear
          </button>

          <button
            type="button"
            disabled={!!lockoutSeconds || loading}
            onClick={() => handleDigit("0")}
            className="h-14 rounded-2xl bg-white border border-[#32190D]/10 font-serif text-2xl font-semibold text-[#32190D] hover:bg-[#D6A64B]/20 active:scale-95 transition-all shadow-xs disabled:opacity-40"
          >
            0
          </button>

          <button
            type="button"
            disabled={!!lockoutSeconds || loading || pin.length === 0}
            onClick={handleBackspace}
            aria-label="Delete"
            className="h-14 rounded-2xl bg-white/50 border border-[#32190D]/10 flex items-center justify-center text-[#806E5D] hover:bg-white active:scale-95 transition-all disabled:opacity-40"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Unlock Action Button */}
        <button
          type="button"
          disabled={pin.length < 4 || !!lockoutSeconds || loading}
          onClick={() => handleUnlock()}
          className="w-full h-12 rounded-2xl bg-[#32190D] text-[#F8F3E9] text-sm font-semibold tracking-wider uppercase hover:bg-[#D6A64B] hover:text-[#32190D] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin text-[#D6A64B]" />
              <span>Verifying PIN...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>Unlock Terminal</span>
            </>
          )}
        </button>

        {/* Default PIN Helper for initial test */}
        <div className="mt-4 pt-3 border-t border-[#32190D]/10 text-center text-[10px] text-[#806E5D]">
          <span>Default Staff PINs: </span>
          <span className="font-mono font-bold">1234</span> (Manager) ·{" "}
          <span className="font-mono font-bold">5678</span> (Cashier) ·{" "}
          <span className="font-mono font-bold">9999</span> (Owner)
        </div>
      </div>
    </div>
  );
}
