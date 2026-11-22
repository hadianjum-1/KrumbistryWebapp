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

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"CASHIER" | "MANAGER" | "OWNER">("CASHIER");
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, pin }),
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
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStaff();
      }
    } catch {
      alert("Failed to update status");
    }
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStaffId || !newPin) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resetStaffId, pin: newPin }),
      });
      const data = await res.json();
      if (data.success) {
        setResetStaffId(null);
        setNewPin("");
        alert("PIN updated successfully");
      } else {
        alert(data.error || "Failed to update PIN");
      }
    } catch {
      alert("Failed to reset PIN");
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
            Manage staff authorization PINs, register roles, and registered POS devices.
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#32190D] text-white rounded-lg text-sm font-medium hover:bg-[#4a2614] transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 font-serif font-medium text-stone-800">
          Authorized Staff ({staff.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-[#F8F3E9]/60 text-stone-700 font-medium border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading staff members...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    No staff members found.
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
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setResetStaffId(s.id)}
                          className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 transition flex items-center gap-1"
                        >
                          <KeyRound className="w-3 h-3 text-[#D6A64B]" />
                          Reset PIN
                        </button>
                        <button
                          onClick={() => handleToggleStatus(s.id, s.active ?? s.isActive ?? true)}
                          className={`px-2.5 py-1 text-xs font-medium rounded border transition ${
                            (s.active ?? s.isActive ?? true)
                              ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                              : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                          }`}
                        >
                          {(s.active ?? s.isActive ?? true) ? "Deactivate" : "Activate"}
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
                      d.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800 font-medium"
                        : "bg-rose-100 text-rose-800"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#32190D] text-white flex items-center justify-between">
              <h3 className="font-serif font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#D6A64B]" />
                Add POS Staff Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-white text-lg leading-none"
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
                  POS Role
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
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Access PIN (4-6 digits) *
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 1234"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#D6A64B]"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Staff member will enter this numeric PIN on the POS terminal touch keypad.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 text-sm rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#32190D] text-white text-sm rounded-lg hover:bg-[#4a2614] flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {resetStaffId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#32190D] text-white flex items-center justify-between">
              <h3 className="font-serif font-medium flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#D6A64B]" />
                Update Staff PIN
              </h3>
              <button
                onClick={() => setResetStaffId(null)}
                className="text-stone-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleResetPin} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  New 4-6 Digit Numeric PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter new PIN"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#D6A64B]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetStaffId(null)}
                  className="px-3 py-1.5 border border-stone-300 text-stone-700 text-sm rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-[#32190D] text-white text-sm rounded-lg hover:bg-[#4a2614] flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
