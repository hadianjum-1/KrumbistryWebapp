"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Laptop,
  Trash2,
  Sparkles,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string | null;
  role: "OWNER" | "MANAGER" | "CASHIER";
  active?: boolean;
  isActive?: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count?: {
    orders?: number;
    registerSessions?: number;
  };
}

interface PosDevice {
  id: string;
  deviceCode: string;
  name: string;
  status: string;
  lastActiveAt: string | null;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [devices, setDevices] = useState<PosDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetStaffId, setResetStaffId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"CASHIER" | "MANAGER" | "OWNER">("CASHIER");
  const [pinLength, setPinLength] = useState<4 | 6>(4);
  const [pin, setPin] = useState("");

  // Reset PIN states
  const [resetPinLength, setResetPinLength] = useState<4 | 6>(4);
  const [newPin, setNewPin] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/staff");
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff);
        setDevices(data.devices || []);
      }
    } catch {
      setErrorMsg("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const generateRandomPin = (len: 4 | 6, target: "new" | "reset") => {
    const min = len === 4 ? 1000 : 100000;
    const max = len === 4 ? 9999 : 999999;
    const randomPin = String(Math.floor(min + Math.random() * (max - min + 1)));
    if (target === "new") {
      setPin(randomPin);
    } else {
      setNewPin(randomPin);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanPin = pin.trim();
    if (cleanPin.length !== pinLength) {
      setErrorMsg(`PIN must be exactly ${pinLength} numeric digits.`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, pin: cleanPin, pinLength }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create staff member");
      }

      setShowAddModal(false);
      setName("");
      setEmail("");
      setPin("");
      setRole("CASHIER");
      setPinLength(4);
      setSuccessMsg(`Staff member "${data.staff.name}" created with a ${pinLength}-digit PIN.`);
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setErrorMsg(null);
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Staff member status updated successfully.");
        fetchStaff();
      } else {
        throw new Error(data.error || "Failed to update status");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaffId || !newPin) return;

    const cleanPin = newPin.trim();
    if (cleanPin.length !== resetPinLength) {
      setErrorMsg(`New PIN must be exactly ${resetPinLength} digits.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetStaffId, pin: cleanPin, pinLength: resetPinLength }),
      });
      const data = await res.json();
      if (data.success) {
        setResetStaffId(null);
        setNewPin("");
        setSuccessMsg(`PIN successfully updated to a ${resetPinLength}-digit code.`);
        fetchStaff();
      } else {
        throw new Error(data.error || "Failed to update PIN");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/staff?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete staff member");
      }

      setSuccessMsg(data.message || `Staff member "${deleteTarget.name}" deleted.`);
      setDeleteTarget(null);
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#32190D] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#D6A64B]" />
            POS Staff &amp; Team Access
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage staff authorization PINs (4 or 6 digits), POS terminal roles, and registered devices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchStaff}
            className="p-2 text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-50 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setShowAddModal(true);
              setPin("");
              setErrorMsg(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#32190D] text-white rounded-lg text-sm font-medium hover:bg-[#4a2614] transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D6A64B]" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 font-serif font-medium text-stone-800 flex items-center justify-between">
          <span>Authorized Staff Members ({staff.length})</span>
          <span className="text-xs font-sans text-stone-400">
            Log in to POS terminals using their 4 or 6-digit numeric PIN
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-[#F8F3E9]/60 text-stone-700 font-medium border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">POS Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D6A64B]" />
                    Loading staff members...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    No staff members found. Click &quot;Add Staff Member&quot; to authorize your first cashier.
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-stone-900">{s.name}</div>
                      {s.email && <div className="text-xs text-stone-400">{s.email}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          s.role === "OWNER"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : s.role === "MANAGER"
                            ? "bg-blue-100 text-blue-800 border border-blue-200"
                            : "bg-stone-100 text-stone-700 border border-stone-200"
                        }`}
                      >
                        {s.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {(s.active ?? s.isActive ?? true) ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-500">
                      {s.lastLoginAt
                        ? new Date(s.lastLoginAt).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reset PIN */}
                        <button
                          onClick={() => {
                            setResetStaffId(s.id);
                            setNewPin("");
                            setResetPinLength(4);
                            setErrorMsg(null);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition flex items-center gap-1 cursor-pointer"
                          title="Change or reset numeric PIN"
                        >
                          <KeyRound className="w-3 h-3 text-[#D6A64B]" />
                          Reset PIN
                        </button>

                        {/* Toggle Active / Deactivate */}
                        <button
                          onClick={() => handleToggleStatus(s.id, s.active ?? s.isActive ?? true)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition cursor-pointer ${
                            (s.active ?? s.isActive ?? true)
                              ? "text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-200"
                              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          }`}
                        >
                          {(s.active ?? s.isActive ?? true) ? "Deactivate" : "Activate"}
                        </button>

                        {/* Delete Staff Member */}
                        <button
                          onClick={() => setDeleteTarget(s)}
                          className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 rounded-lg border border-rose-200 transition cursor-pointer"
                          title="Delete staff member permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POS Devices Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 font-serif font-medium text-stone-800 flex items-center gap-2">
          <Laptop className="w-4 h-4 text-[#D6A64B]" />
          Registered POS Terminals ({devices.length})
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {devices.map((d) => (
            <div
              key={d.id}
              className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-stone-200 text-stone-800 rounded">
                    {d.deviceCode}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      d.status === "AUTHORIZED" || d.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800 font-medium"
                        : "bg-rose-100 text-rose-800 font-medium"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <div className="font-medium text-stone-900 mt-2">{d.name}</div>
              </div>
              <div className="text-xs text-stone-400 mt-3 pt-2 border-t border-stone-200/60">
                Last active:{" "}
                {d.lastActiveAt
                  ? new Date(d.lastActiveAt).toLocaleString()
                  : "Never"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-stone-200">
            <div className="p-4 bg-[#32190D] text-white flex items-center justify-between">
              <h3 className="font-serif font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D6A64B]" />
                Add POS Staff Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6A64B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@krumbistry.com"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D6A64B]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  POS Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A64B]"
                >
                  <option value="CASHIER">Cashier (Standard Checkout)</option>
                  <option value="MANAGER">Manager (Discounts, Drawer, Reports)</option>
                  <option value="OWNER">Owner (Full Admin Access)</option>
                </select>
              </div>

              {/* PIN Length Selection (4-Digit vs 6-Digit) */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  PIN Type / Length *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPinLength(4);
                      setPin("");
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      pinLength === 4
                        ? "bg-[#32190D] text-white border-[#32190D] shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-[#D6A64B]" />
                    <span>4-Digit PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPinLength(6);
                      setPin("");
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      pinLength === 6
                        ? "bg-[#32190D] text-white border-[#32190D] shadow-xs"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-[#D6A64B]" />
                    <span>6-Digit PIN</span>
                  </button>
                </div>
              </div>

              {/* Numeric PIN Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-stone-700">
                    Numeric PIN ({pinLength} digits) *
                  </label>
                  <button
                    type="button"
                    onClick={() => generateRandomPin(pinLength, "new")}
                    className="text-[11px] text-[#8C6219] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Sparkles className="w-3 h-3 text-[#D6A64B]" />
                    Generate Random
                  </button>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={pinLength}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, pinLength))}
                  placeholder={pinLength === 4 ? "e.g. 1234" : "e.g. 123456"}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#D6A64B]"
                />
                <div className="flex justify-between items-center text-[11px] text-stone-500 mt-1">
                  <span>Enter {pinLength} numbers for the POS touch keypad.</span>
                  <span className="font-mono text-stone-400">
                    {pin.length} / {pinLength}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-sm rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || pin.length !== pinLength}
                  className="px-4 py-2 bg-[#32190D] text-white text-sm font-medium rounded-lg hover:bg-[#4a2614] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin text-[#D6A64B]" />}
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetStaffId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-stone-200">
            <div className="p-4 bg-[#32190D] text-white flex items-center justify-between">
              <h3 className="font-serif font-medium flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D6A64B]" />
                Update Staff PIN
              </h3>
              <button
                onClick={() => setResetStaffId(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleResetPin} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Select PIN Length
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetPinLength(4);
                      setNewPin("");
                    }}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 cursor-pointer ${
                      resetPinLength === 4
                        ? "bg-[#32190D] text-white border-[#32190D]"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <Lock className="w-3 h-3 text-[#D6A64B]" />
                    4-Digit PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetPinLength(6);
                      setNewPin("");
                    }}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition flex items-center justify-center gap-1 cursor-pointer ${
                      resetPinLength === 6
                        ? "bg-[#32190D] text-white border-[#32190D]"
                        : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <Shield className="w-3 h-3 text-[#D6A64B]" />
                    6-Digit PIN
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-stone-700">
                    New {resetPinLength}-Digit Numeric PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => generateRandomPin(resetPinLength, "reset")}
                    className="text-[11px] text-[#8C6219] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Sparkles className="w-3 h-3 text-[#D6A64B]" />
                    Random
                  </button>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={resetPinLength}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, resetPinLength))}
                  placeholder={`Enter ${resetPinLength} digits`}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#D6A64B]"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Staff member will enter this on the terminal touch keypad.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setResetStaffId(null)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-sm rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || newPin.length !== resetPinLength}
                  className="px-4 py-1.5 bg-[#32190D] text-white text-sm font-medium rounded-lg hover:bg-[#4a2614] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D6A64B]" />}
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Staff Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-stone-200">
            <div className="p-4 bg-rose-600 text-white flex items-center justify-between">
              <h3 className="font-serif font-medium flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-white" />
                Delete Staff Member
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-rose-200 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-stone-700">
                Are you sure you want to permanently delete{" "}
                <span className="font-bold text-stone-900">&quot;{deleteTarget.name}&quot;</span> ({deleteTarget.role})?
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                This action cannot be undone. This staff member will be immediately revoked from all POS terminals and offline devices.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-sm rounded-lg hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDeleteStaff}
                  className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-lg hover:bg-rose-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
