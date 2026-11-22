"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import { getLocalDeviceCode, checkBackendReachable } from "@/lib/posSyncEngine";
import { posDb, type LocalRegisterSession } from "@/lib/posDb";

interface RegisterSessionState {
  id: string;
  openedAt: string;
  openingCash: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  otherSalesTotal: number;
  cashInTotal: number;
  cashOutTotal: number;
  cashSalesCount: number;
  expectedCash: number;
  staff?: { name: string; role: string };
  cashMovements?: Array<{
    id: string;
    type: string;
    amount: number;
    reason: string;
    createdAt: string;
  }>;
}

export default function PosRegisterPage() {
  const [deviceCode, setDeviceCode] = useState("POS-01");
  const [activeSession, setActiveSession] = useState<RegisterSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Open Register Form
  const [openingFloat, setOpeningFloat] = useState<number>(5000);
  const [openNotes, setOpenNotes] = useState("");

  // Cash In / Cash Out Form
  const [movementType, setMovementType] = useState<"CASH_IN" | "CASH_OUT">("CASH_IN");
  const [movementAmount, setMovementAmount] = useState<number>(0);
  const [movementReason, setMovementReason] = useState("");
  const [showMovementModal, setShowMovementModal] = useState(false);

  // Close Register Form
  const [countedCash, setCountedCash] = useState<number>(0);
  const [closeNotes, setCloseNotes] = useState("");
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closedSummary, setClosedSummary] = useState<any | null>(null);

  useEffect(() => {
    const code = getLocalDeviceCode();
    setDeviceCode(code);
    loadRegister(code);
  }, []);

  const loadRegister = async (code: string) => {
    setLoading(true);
    setError(null);

    // Try server first if online
    const isOnline = await checkBackendReachable();
    if (isOnline) {
      try {
        const res = await fetch(`/api/pos/register?deviceCode=${code}`);
        const data = await res.json();
        if (data.success && data.hasActiveSession) {
          setActiveSession(data.session);
          setCountedCash(data.session.expectedCash);

          // Mirror into local IndexedDB
          if (posDb) {
            await posDb.localRegisterSession.put({
              id: data.session.id,
              deviceCode: code,
              staffId: data.session.staff?.id || "anonymous",
              staffName: data.session.staff?.name || "Staff",
              openedAt: data.session.openedAt,
              openingCash: data.session.openingCash,
              cashSalesTotal: data.session.cashSalesTotal,
              cardSalesTotal: data.session.cardSalesTotal,
              otherSalesTotal: data.session.otherSalesTotal,
              cashInTotal: data.session.cashInTotal,
              cashOutTotal: data.session.cashOutTotal,
              cashSalesCount: data.session.cashSalesCount,
              status: "OPEN",
            });
          }
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Server register lookup failed, checking local:", err);
      }
    }

    // Fallback to local IndexedDB session
    if (posDb) {
      try {
        const local = await posDb.localRegisterSession
          .where("status")
          .equals("OPEN")
          .first();

        if (local) {
          const expected =
            local.openingCash +
            local.cashSalesTotal +
            local.cashInTotal -
            local.cashOutTotal;

          setActiveSession({
            id: local.id,
            openedAt: local.openedAt,
            openingCash: local.openingCash,
            cashSalesTotal: local.cashSalesTotal,
            cardSalesTotal: local.cardSalesTotal,
            otherSalesTotal: local.otherSalesTotal,
            cashInTotal: local.cashInTotal,
            cashOutTotal: local.cashOutTotal,
            cashSalesCount: local.cashSalesCount,
            expectedCash: expected,
            staff: { name: local.staffName, role: "Staff" },
          });
          setCountedCash(expected);
        } else {
          setActiveSession(null);
        }
      } catch {}
    }

    setLoading(false);
  };

  const handleOpenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isOnline = await checkBackendReachable();
    if (isOnline) {
      try {
        const res = await fetch("/api/pos/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceCode,
            openingCash: openingFloat,
            notes: openNotes,
          }),
        });
        const data = await res.json();
        if (data.success) {
          loadRegister(deviceCode);
          return;
        } else {
          setError(data.error || "Failed to open register.");
        }
      } catch {}
    }

    // Offline open register fallback
    if (posDb) {
      const sessionId = crypto.randomUUID();
      const now = new Date().toISOString();
      const localStaff = localStorage.getItem("krumbistry_pos_active_staff");
      const parsedStaff = localStaff ? JSON.parse(localStaff) : { name: "Cashier", id: "offline" };

      await posDb.localRegisterSession.put({
        id: sessionId,
        deviceCode,
        staffId: parsedStaff.id,
        staffName: parsedStaff.name,
        openedAt: now,
        openingCash: openingFloat,
        cashSalesTotal: 0,
        cardSalesTotal: 0,
        otherSalesTotal: 0,
        cashInTotal: 0,
        cashOutTotal: 0,
        cashSalesCount: 0,
        status: "OPEN",
        notes: openNotes,
      });

      loadRegister(deviceCode);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || movementAmount <= 0 || !movementReason.trim()) return;

    const isOnline = await checkBackendReachable();
    if (isOnline) {
      try {
        const res = await fetch("/api/pos/register/movement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSession.id,
            type: movementType,
            amount: movementAmount,
            reason: movementReason.trim(),
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowMovementModal(false);
          setMovementAmount(0);
          setMovementReason("");
          loadRegister(deviceCode);
          return;
        }
      } catch {}
    }

    // Offline update in IndexedDB
    if (posDb) {
      const isCashIn = movementType === "CASH_IN";
      await posDb.localRegisterSession.update(activeSession.id, {
        cashInTotal: isCashIn
          ? activeSession.cashInTotal + movementAmount
          : activeSession.cashInTotal,
        cashOutTotal: !isCashIn
          ? activeSession.cashOutTotal + movementAmount
          : activeSession.cashOutTotal,
      });

      setShowMovementModal(false);
      setMovementAmount(0);
      setMovementReason("");
      loadRegister(deviceCode);
    }
  };

  const handleCloseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const isOnline = await checkBackendReachable();
    if (isOnline) {
      try {
        const res = await fetch("/api/pos/register/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSession.id,
            closingCash: countedCash,
            notes: closeNotes,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setClosedSummary(data.session);
          setShowCloseModal(false);
          setActiveSession(null);
          if (posDb) {
            await posDb.localRegisterSession.update(activeSession.id, {
              status: "CLOSED",
              closedAt: new Date().toISOString(),
              closingCash: countedCash,
            });
          }
          return;
        }
      } catch {}
    }

    // Offline register close in IndexedDB
    if (posDb) {
      const diff = countedCash - activeSession.expectedCash;
      await posDb.localRegisterSession.update(activeSession.id, {
        status: "CLOSED",
        closedAt: new Date().toISOString(),
        closingCash: countedCash,
        expectedCash: activeSession.expectedCash,
        cashDifference: diff,
      });

      setClosedSummary({
        id: activeSession.id,
        openingCash: activeSession.openingCash,
        closingCash: countedCash,
        expectedCash: activeSession.expectedCash,
        cashDifference: diff,
        cashSalesTotal: activeSession.cashSalesTotal,
        cardSalesTotal: activeSession.cardSalesTotal,
        otherSalesTotal: activeSession.otherSalesTotal,
      });

      setShowCloseModal(false);
      setActiveSession(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#32190D]">
          Register Drawer &amp; Shift Management
        </h1>
        <p className="text-xs text-[#806E5D] mt-0.5">
          Terminal: <strong className="text-[#32190D]">{deviceCode}</strong> · Cash Float &amp; Reconciliation
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-[#32190D]/10 bg-white p-12 text-center text-gray-400 text-xs">
          Checking drawer session...
        </div>
      ) : activeSession ? (
        /* Active Open Register Shift View */
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#D6A64B]/40 bg-[#FAF6EE] p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#32190D] text-[#D6A64B] flex items-center justify-center font-bold">
                  <Unlock size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-lg font-bold text-[#32190D]">
                      Active Register Shift
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      OPEN
                    </span>
                  </div>
                  <p className="text-xs text-[#806E5D]">
                    Opened: {new Date(activeSession.openedAt).toLocaleString()} by{" "}
                    <strong>{activeSession.staff?.name || "Staff"}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(true)}
                  className="rounded-xl border border-[#32190D]/20 bg-white px-4 py-2.5 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-all shadow-xs"
                >
                  Cash In / Cash Out
                </button>

                <button
                  type="button"
                  onClick={() => setShowCloseModal(true)}
                  className="rounded-xl bg-[#32190D] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#F8F3E9] hover:bg-[#D6A64B] hover:text-[#32190D] transition-all shadow-md"
                >
                  End Shift &amp; Close Drawer
                </button>
              </div>
            </div>

            {/* Shift Metrics Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 border border-[#32190D]/10">
                <span className="text-[11px] font-semibold text-[#806E5D] uppercase tracking-wider">
                  Opening Float
                </span>
                <p className="mt-1 font-mono text-xl font-bold text-[#32190D]">
                  Rs. {activeSession.openingCash.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-[#32190D]/10">
                <span className="text-[11px] font-semibold text-[#806E5D] uppercase tracking-wider">
                  Cash Sales ({activeSession.cashSalesCount})
                </span>
                <p className="mt-1 font-mono text-xl font-bold text-emerald-700">
                  + Rs. {activeSession.cashSalesTotal.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 border border-[#32190D]/10">
                <span className="text-[11px] font-semibold text-[#806E5D] uppercase tracking-wider">
                  Cash In / Out
                </span>
                <p className="mt-1 font-mono text-sm font-semibold text-[#32190D]">
                  In: +Rs. {activeSession.cashInTotal.toLocaleString()}
                  <br />
                  Out: -Rs. {activeSession.cashOutTotal.toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl bg-[#32190D] text-[#F8F3E9] p-4 shadow-md">
                <span className="text-[11px] font-semibold text-[#D6A64B] uppercase tracking-wider">
                  Expected Drawer Cash
                </span>
                <p className="mt-1 font-mono text-2xl font-bold text-white">
                  Rs. {activeSession.expectedCash.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Non-Cash Sales Summary */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#806E5D] pt-4 border-t border-[#32190D]/10">
              <div>
                Card Sales: <strong>Rs. {activeSession.cardSalesTotal.toLocaleString()}</strong>
              </div>
              <div>·</div>
              <div>
                Other Payments (JazzCash/Easypaisa):{" "}
                <strong>Rs. {activeSession.otherSalesTotal.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Open Shift: Prompt to Open Register */
        <div className="rounded-3xl border border-[#32190D]/10 bg-white p-8 max-w-lg mx-auto text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FAF6EE] text-[#D6A64B] border border-[#D6A64B]/40 mx-auto flex items-center justify-center mb-4">
            <Lock size={26} />
          </div>

          <h3 className="font-serif text-2xl font-bold text-[#32190D]">
            Register is Currently Closed
          </h3>
          <p className="text-xs text-[#806E5D] mt-1 max-w-sm mx-auto leading-relaxed">
            Open the cash drawer float to begin recording cash transactions on terminal{" "}
            <strong>{deviceCode}</strong>.
          </p>

          <form onSubmit={handleOpenRegister} className="mt-6 space-y-4 text-left">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#32190D] block mb-1">
                Opening Cash Float (PKR)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 p-3 font-mono text-lg font-bold text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
              />
              <p className="text-[11px] text-[#806E5D] mt-1">
                Count the physical bills in the drawer before starting the shift.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#32190D] block mb-1">
                Shift Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Morning bakery shift"
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-[#32190D] text-[#F8F3E9] text-xs font-bold uppercase tracking-wider hover:bg-[#D6A64B] hover:text-[#32190D] transition-all shadow-md"
            >
              Start Shift &amp; Open Drawer (Rs. {openingFloat.toLocaleString()})
            </button>
          </form>
        </div>
      )}

      {/* Closed Summary Banner */}
      {closedSummary && (
        <div className="rounded-3xl border border-emerald-300 bg-emerald-50/70 p-6 text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={20} className="text-emerald-700" />
            <h4 className="font-serif text-lg font-bold">Shift Closed &amp; Reconciled</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3">
            <div>
              Expected Cash: <strong>Rs. {closedSummary.expectedCash?.toLocaleString()}</strong>
            </div>
            <div>
              Counted Cash: <strong>Rs. {closedSummary.closingCash?.toLocaleString()}</strong>
            </div>
            <div>
              Discrepancy:{" "}
              <strong className={closedSummary.cashDifference === 0 ? "text-emerald-700" : "text-red-700"}>
                Rs. {closedSummary.cashDifference?.toLocaleString()}
              </strong>
            </div>
            <div>
              Total Cash Sales: <strong>Rs. {closedSummary.cashSalesTotal?.toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Cash In / Cash Out Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-lg font-bold text-[#32190D] mb-3">
              Record Cash Movement
            </h3>

            <form onSubmit={handleAddMovement} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType("CASH_IN")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    movementType === "CASH_IN"
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  Cash In (+)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("CASH_OUT")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                    movementType === "CASH_OUT"
                      ? "bg-red-700 text-white border-red-700"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  Cash Out (-)
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#32190D] block mb-1">
                  Amount (PKR)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementAmount || ""}
                  onChange={(e) => setMovementAmount(Number(e.target.value))}
                  placeholder="e.g. 500"
                  className="w-full rounded-xl border border-gray-300 p-2.5 font-mono text-base font-bold text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#32190D] block mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Milk delivery payment, petty cash"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#32190D] text-white text-xs font-bold hover:bg-[#D6A64B] hover:text-[#32190D]"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Register Modal */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-[#32190D] mb-1">
              Close Register &amp; Reconcile Cash
            </h3>
            <p className="text-xs text-[#806E5D] mb-4">
              Count the physical cash in the drawer and enter below.
            </p>

            <form onSubmit={handleCloseRegister} className="space-y-4">
              <div className="bg-[#FAF6EE] p-4 rounded-2xl space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Opening Float:</span>
                  <span>Rs. {activeSession.openingCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>+ Cash Sales:</span>
                  <span>Rs. {activeSession.cashSalesTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>+ Cash In:</span>
                  <span>Rs. {activeSession.cashInTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Cash Out:</span>
                  <span>Rs. {activeSession.cashOutTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#32190D] pt-2 border-t border-[#32190D]/10">
                  <span>Expected Drawer Cash:</span>
                  <span>Rs. {activeSession.expectedCash.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#32190D] block mb-1">
                  Physical Counted Cash (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 p-3 font-mono text-lg font-bold text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                />
              </div>

              {/* Difference Preview */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs font-semibold text-gray-500">
                  Calculated Discrepancy:
                </span>
                <span
                  className={`font-mono text-sm font-bold ${
                    countedCash - activeSession.expectedCash === 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  }`}
                >
                  {countedCash - activeSession.expectedCash >= 0 ? "+" : ""}
                  Rs. {(countedCash - activeSession.expectedCash).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#32190D] block mb-1">
                  Closing Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Discrepancy explanation if any"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-700 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-800 transition-all shadow-md"
                >
                  Close &amp; Finalize Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
