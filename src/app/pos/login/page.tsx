"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Delete,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  ShieldCheck,
  Settings,
} from "lucide-react";
import {
  checkBackendReachable,
  authenticateStaffOffline,
  getLocalDeviceCode,
  setLocalDeviceCode,
  syncDownCatalog,
} from "@/lib/posSyncEngine";
import { posDb } from "@/lib/posDb";

interface StaffSummary {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "CASHIER";
}

export default function PosLoginPage() {
  const router = useRouter();

  const [pin, setPin] = useState("");
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [deviceCode, setDeviceCode] = useState("POS-01");
  const [isEditingDevice, setIsEditingDevice] = useState(false);
  const [deviceInput, setDeviceInput] = useState("POS-01");

  const [staffList, setStaffList] = useState<StaffSummary[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffSummary | null>(null);

  const [isBackendReachable, setIsBackendReachable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Load device code and cached staff on mount
  useEffect(() => {
    const code = getLocalDeviceCode();
    setDeviceCode(code);
    setDeviceInput(code);

    const checkConn = async () => {
      const reachable = await checkBackendReachable();
      setIsBackendReachable(reachable);
    };
    checkConn();

    // Initial catalog & offline credentials sync
    syncDownCatalog()
      .then(async () => {
        if (posDb) {
          const cached = await posDb.offlineStaff.toArray();
          if (cached && cached.length > 0) {
            setStaffList(
              cached.map((s: any) => ({
                id: s.id,
                name: s.name,
                role: s.role as any,
              }))
            );
          }
        }
      })
      .catch(() => {});

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

  const handleDigit = useCallback(
    (digit: string) => {
      if (lockoutSeconds || loading) return;
      setError(null);

      setPin((prev) => {
        // Auto-switch to 6-digit mode if user enters more than 4 digits
        if (prev.length === 4 && pinLength === 4) {
          setPinLength(6);
        }
        if (prev.length < pinLength) {
          return prev + digit;
        }
        return prev;
      });
    },
    [lockoutSeconds, loading, pinLength]
  );

  const handleBackspace = useCallback(() => {
    if (lockoutSeconds || loading) return;
    setPin((prev) => prev.slice(0, -1));
  }, [lockoutSeconds, loading]);

  const handleClear = useCallback(() => {
    if (lockoutSeconds || loading) return;
    setPin("");
    setError(null);
  }, [lockoutSeconds, loading]);

  const handleUnlock = useCallback(
    async (pinToVerify?: string) => {
      const currentPin = pinToVerify ?? pin;
      if (currentPin.length < 4 || lockoutSeconds || loading) return;

      setLoading(true);
      setError(null);

      try {
        const isOnline = await checkBackendReachable();

        if (isOnline) {
          // Online login
          const res = await fetch("/api/pos/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pin: currentPin,
              deviceCode,
              staffId: selectedStaff?.id,
            }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            localStorage.setItem(
              "krumbistry_pos_active_staff",
              JSON.stringify(data.staff)
            );
            if (data.device?.deviceCode) {
              setLocalDeviceCode(data.device.deviceCode);
            }
            router.push("/pos");
            return;
          } else {
            setError(data.error || "Incorrect PIN. Please try again.");
            setPin("");
          }
        } else {
          // Offline verification via local encrypted IndexedDB
          const offlineResult = await authenticateStaffOffline(currentPin, deviceCode);
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
        setError(err instanceof Error ? err.message : "Authentication error.");
        setPin("");
      } finally {
        setLoading(false);
      }
    },
    [pin, lockoutSeconds, loading, deviceCode, selectedStaff, router]
  );

  // Auto-submit when user finishes entering the expected PIN digits
  useEffect(() => {
    if (pin.length === pinLength && !loading && !lockoutSeconds) {
      handleUnlock(pin);
    }
  }, [pin, pinLength, loading, lockoutSeconds, handleUnlock]);

  // Physical keyboard listener (numpad and standard number keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditingDevice) return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pin.length >= 4) {
          handleUnlock();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear, handleUnlock, isEditingDevice, pin.length]);

  const handleSaveDeviceCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = deviceInput.trim() || "POS-01";
    setDeviceCode(clean);
    setLocalDeviceCode(clean);
    setIsEditingDevice(false);
    syncDownCatalog().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#32190D] text-[#F8F3E9] flex flex-col justify-center items-center p-4 selection:bg-[#D6A64B] selection:text-[#32190D]">
      <div className="w-full max-w-sm bg-[#FAF6EE] text-[#32190D] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#D6A64B]/40 transition-all">
        {/* Brand Header */}
        <div className="text-center pb-4 border-b border-[#32190D]/10">
          <div className="w-11 h-11 rounded-2xl bg-[#32190D] text-[#D6A64B] mx-auto flex items-center justify-center mb-2.5 shadow-md">
            <Lock size={20} />
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#32190D]">
            KRUMBISTRY POS
          </h1>

          {/* Terminal & Connectivity Status Bar */}
          <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditingDevice(!isEditingDevice)}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#8C6219] hover:underline cursor-pointer bg-[#32190D]/5 px-2 py-0.5 rounded-md"
              title="Click to edit terminal device code"
            >
              <Settings size={10} />
              <span>{deviceCode}</span>
            </button>
            <span className="text-[#32190D]/30">·</span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isBackendReachable
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isBackendReachable ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isBackendReachable ? "ONLINE" : "OFFLINE READY"}
            </span>
          </div>

          {/* Device Code Inline Editor */}
          {isEditingDevice && (
            <form onSubmit={handleSaveDeviceCode} className="mt-2.5 flex items-center gap-1.5 justify-center">
              <input
                type="text"
                value={deviceInput}
                onChange={(e) => setDeviceInput(e.target.value)}
                placeholder="POS-01"
                className="px-2 py-1 text-xs border border-stone-300 rounded-md font-mono w-32 text-center uppercase"
                autoFocus
              />
              <button
                type="submit"
                className="px-2 py-1 bg-[#32190D] text-white text-xs font-semibold rounded-md"
              >
                Save
              </button>
            </form>
          )}
        </div>

        {/* Staff Quick Selection (if staff members are registered) */}
        {staffList.length > 0 && (
          <div className="py-2.5 border-b border-[#32190D]/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#806E5D] flex items-center gap-1">
                <User size={11} />
                <span>Select User (Optional)</span>
              </span>
              {selectedStaff && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaff(null);
                    setPin("");
                  }}
                  className="text-[10px] text-[#8C6219] hover:underline font-semibold"
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => {
                  setSelectedStaff(null);
                  setPin("");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedStaff === null
                    ? "bg-[#32190D] text-white shadow-xs"
                    : "bg-white border border-[#32190D]/10 text-stone-700 hover:bg-stone-50"
                }`}
              >
                Quick PIN
              </button>
              {staffList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStaff(s);
                    setPin("");
                    setError(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    selectedStaff?.id === s.id
                      ? "bg-[#D6A64B] text-[#32190D] font-bold shadow-xs"
                      : "bg-white border border-[#32190D]/10 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="text-[9px] opacity-70">({s.role})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PIN Length Mode Selector (4-Digit vs 6-Digit) */}
        <div className="pt-3 pb-1 flex justify-center items-center gap-2">
          <div className="inline-flex rounded-xl p-0.5 bg-[#32190D]/5 border border-[#32190D]/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setPinLength(4);
                setPin("");
                setError(null);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                pinLength === 4
                  ? "bg-white text-[#32190D] shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              4-Digit PIN
            </button>
            <button
              type="button"
              onClick={() => {
                setPinLength(6);
                setPin("");
                setError(null);
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                pinLength === 6
                  ? "bg-white text-[#32190D] shadow-xs"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              6-Digit PIN
            </button>
          </div>
        </div>

        {/* PIN Dots Display */}
        <div className="py-4 text-center">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-[#806E5D] mb-3">
            {selectedStaff ? `Enter PIN for ${selectedStaff.name}` : `Enter ${pinLength}-Digit Security PIN`}
          </p>

          <div className="flex justify-center items-center gap-3 h-8">
            {Array.from({ length: pinLength }).map((_, idx) => {
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
            <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
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
        <div className="grid grid-cols-3 gap-2 pb-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={!!lockoutSeconds || loading}
              onClick={() => handleDigit(digit)}
              className="h-13 sm:h-14 rounded-2xl bg-white border border-[#32190D]/10 font-serif text-2xl font-semibold text-[#32190D] hover:bg-[#D6A64B]/20 active:scale-95 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            disabled={!!lockoutSeconds || loading || pin.length === 0}
            onClick={handleClear}
            className="h-13 sm:h-14 rounded-2xl bg-white/50 border border-[#32190D]/10 text-xs uppercase tracking-wider font-bold text-[#806E5D] hover:bg-white active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
          >
            Clear
          </button>

          <button
            type="button"
            disabled={!!lockoutSeconds || loading}
            onClick={() => handleDigit("0")}
            className="h-13 sm:h-14 rounded-2xl bg-white border border-[#32190D]/10 font-serif text-2xl font-semibold text-[#32190D] hover:bg-[#D6A64B]/20 active:scale-95 transition-all shadow-xs disabled:opacity-40 cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            disabled={!!lockoutSeconds || loading || pin.length === 0}
            onClick={handleBackspace}
            aria-label="Delete"
            className="h-13 sm:h-14 rounded-2xl bg-white/50 border border-[#32190D]/10 flex items-center justify-center text-[#806E5D] hover:bg-white active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Unlock Action Button */}
        <button
          type="button"
          disabled={pin.length < 4 || !!lockoutSeconds || loading}
          onClick={() => handleUnlock()}
          className="w-full h-12 rounded-2xl bg-[#32190D] text-[#F8F3E9] text-xs font-semibold tracking-wider uppercase hover:bg-[#D6A64B] hover:text-[#32190D] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin text-[#D6A64B]" />
              <span>Verifying Terminal Access...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} className="text-[#D6A64B]" />
              <span>Unlock POS Terminal</span>
            </>
          )}
        </button>

        {/* Production Footer: Passwords REMOVED completely */}
        <div className="mt-3.5 pt-3 border-t border-[#32190D]/10 text-center flex items-center justify-center gap-1.5 text-[10px] text-[#806E5D]">
          <ShieldCheck size={12} className="text-[#D6A64B]" />
          <span>KRUMBISTRY Bake Shop · POS Terminal Encrypted Access</span>
        </div>
      </div>
    </div>
  );
}
