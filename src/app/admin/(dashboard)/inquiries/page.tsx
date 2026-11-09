"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Mail,
  Phone,
  MessageCircle,
  Trash2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  notes: string | null;
  createdAt: string;
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchInquiries = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/inquiries");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load inquiries");
      }
      const list = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.inquiries)
        ? json.inquiries
        : [];
      setInquiries(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading inquiries";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/inquiries")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) {
          const list = Array.isArray(json.data)
            ? json.data
            : Array.isArray(json.inquiries)
            ? json.inquiries
            : [];
          setInquiries(list);
        }
      })
      .catch((err) => {
        if (!ignore) setErrorMessage(err instanceof Error ? err.message : "Error loading inquiries");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleUpdateStatus = async (inqId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${inqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update status");
      }

      setInquiries((prev) =>
        prev.map((i) => (i.id === inqId ? { ...i, status: newStatus } : i))
      );
      if (selectedInquiry?.id === inqId) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async (inq: Inquiry) => {
    if (!confirm(`Delete message from ${inq.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/inquiries/${inq.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete inquiry");
      }

      setInquiries((prev) => prev.filter((i) => i.id !== inq.id));
      if (selectedInquiry?.id === inq.id) {
        setSelectedInquiry(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Deletion failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-rose-50 text-rose-700 border-rose-200 animate-pulse";
      case "IN_PROGRESS":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "RESPONDED":
      case "CLOSED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const list = Array.isArray(inquiries) ? inquiries : [];
  const filteredInquiries = list.filter((inq) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (inq.name ?? "").toLowerCase().includes(q) ||
      (inq.email ?? "").toLowerCase().includes(q) ||
      (inq.subject ?? "").toLowerCase().includes(q) ||
      (inq.message ?? "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" || inq.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
            Customer Inquiries
          </h1>
          <p className="text-xs text-[#32190D]/70 mt-1">
            General questions, catering messages, and feedback from the contact form.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInquiries}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-colors shadow-2xs cursor-pointer"
        >
          <RefreshCw size={14} className="text-[#D6A64B]" />
          <span>Refresh Inbox</span>
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#32190D]/10 rounded-2xl p-4 shadow-xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#32190D]/40 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inquiries by sender, email, subject, or keywords..."
            className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-10 pr-4 py-2 text-xs text-[#32190D] placeholder:text-[#32190D]/40 focus:border-[#D6A64B] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter inquiries by status"
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            <option value="ALL">All Inquiry Statuses</option>
            <option value="NEW">New (Unread)</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESPONDED">Responded</option>
            <option value="CLOSED">Closed / Resolved</option>
          </select>
        </div>
      </div>

      {/* Two Column Layout if an inquiry is selected */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inquiries Table / List */}
        <div
          className={`${
            selectedInquiry ? "lg:col-span-2" : "lg:col-span-3"
          } bg-white border border-[#32190D]/10 rounded-2xl shadow-sm overflow-hidden`}
        >
          {isLoading ? (
            <div className="py-20 text-center text-xs text-[#32190D]/60 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
              <span>Checking inquiry messages...</span>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare size={32} className="mx-auto text-[#32190D]/20 mb-2" />
              <p className="text-sm font-semibold text-[#32190D]">No inquiries found</p>
              <p className="text-xs text-[#32190D]/60 mt-1">
                Your customer inbox is clear.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F3E9]/50 border-b border-[#32190D]/10 text-[#32190D]/70 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#32190D]/5">
                  {filteredInquiries.map((inq) => {
                    const isSelected = selectedInquiry?.id === inq.id;
                    const dateStr = new Date(inq.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <tr
                        key={inq.id}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#D6A64B]/15"
                            : "hover:bg-[#F8F3E9]/40"
                        }`}
                        onClick={() => setSelectedInquiry(inq)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-xs text-[#32190D]">
                            {inq.name}
                          </div>
                          <div className="text-[11px] text-[#32190D]/60 font-mono">
                            {inq.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-[#32190D] max-w-xs truncate">
                          {inq.subject}
                        </td>

                        <td className="py-3.5 px-4 text-[#32190D]/60 font-mono">
                          {dateStr}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                              inq.status
                            )}`}
                          >
                            {inq.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(inq);
                            }}
                            className="p-1 rounded text-[#32190D]/40 hover:text-red-600 transition-colors"
                            title="Delete inquiry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Inquiry Reader Panel */}
        {selectedInquiry && (
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#32190D]/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8C6219]">
                Message Dossier
              </span>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="text-[#32190D]/50 hover:text-[#32190D]"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-[#32190D]">
                {selectedInquiry.subject}
              </h3>
              <p className="text-xs text-[#32190D]/50 mt-0.5">
                Received on {new Date(selectedInquiry.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Sender card */}
            <div className="p-3.5 rounded-xl bg-[#F8F3E9]/50 border border-[#32190D]/10 space-y-1.5 text-xs">
              <div className="font-semibold text-sm text-[#32190D]">
                {selectedInquiry.name}
              </div>
              <div className="flex items-center gap-2 text-[#32190D]/70 font-mono">
                <Mail size={12} className="text-[#D6A64B]" />
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="hover:underline"
                >
                  {selectedInquiry.email}
                </a>
              </div>
              {selectedInquiry.phone && (
                <div className="flex items-center gap-2 text-[#32190D]/70 font-mono">
                  <Phone size={12} className="text-[#D6A64B]" />
                  <a
                    href={`tel:${selectedInquiry.phone}`}
                    className="hover:underline"
                  >
                    {selectedInquiry.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#32190D]/60 mb-1">
                Inquiry Message
              </label>
              <div className="p-4 rounded-xl bg-[#F8F3E9]/30 border border-[#32190D]/10 text-xs text-[#32190D] leading-relaxed whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D] mb-1.5">
                Mark Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateStatus(selectedInquiry.id, st)}
                    disabled={isUpdatingStatus}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                      selectedInquiry.status === st
                        ? "bg-[#32190D] text-white border-[#32190D]"
                        : "bg-white text-[#32190D] border-[#32190D]/15 hover:bg-[#F8F3E9]"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Contact Buttons */}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={`mailto:${selectedInquiry.email}?subject=${encodeURIComponent(
                  `Re: ${selectedInquiry.subject} - KRUMBISTRY Bake Shop`
                )}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#32190D] py-2 px-3 text-xs font-semibold text-white hover:bg-[#432314] transition-colors"
              >
                <Mail size={14} className="text-[#D6A64B]" />
                <span>Reply by Email</span>
              </a>

              {selectedInquiry.phone && (
                <a
                  href={`https://wa.me/${selectedInquiry.phone.replace(
                    /[^\d+]/g,
                    ""
                  )}?text=${encodeURIComponent(
                    `Hello ${selectedInquiry.name}, this is KRUMBISTRY Bake Shop regarding your inquiry.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-2 px-3 text-xs font-semibold text-white hover:bg-[#20ba5a] transition-colors"
                >
                  <MessageCircle size={14} />
                  <span>Reply on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

