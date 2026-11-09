"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  ExternalLink,
} from "lucide-react";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

interface CustomOrderDetail {
  id: string;
  referenceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventType: string;
  eventDate: string;
  deliveryDate: string | null;
  servings: string;
  cakeSize: string | null;
  flavor: string | null;
  filling: string | null;
  designDescription: string;
  budgetRange: string | null;
  images: string[];
  additionalNotes: string | null;
  status: string;
  quotedPrice: number | null;
  adminNotes: string | null;
  createdAt: string;
}

export default function CustomOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<CustomOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable fields
  const [status, setStatus] = useState("NEW");
  const [quotedPrice, setQuotedPrice] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (!orderId) return;

    fetch(`/api/admin/custom-orders/${orderId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.data) {
          throw new Error(json.error || "Custom consultation not found");
        }
        setOrder(json.data);
        setStatus(json.data.status);
        setQuotedPrice(
          json.data.quotedPrice !== null && json.data.quotedPrice !== undefined
            ? String(json.data.quotedPrice)
            : ""
        );
        setAdminNotes(json.data.adminNotes || "");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error loading consultation";
        setErrorMessage(msg);
      })
      .finally(() => setIsLoading(false));
  }, [orderId]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/custom-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null,
          adminNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update consultation");
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status,
              quotedPrice: quotedPrice ? parseFloat(quotedPrice) : null,
              adminNotes,
            }
          : prev
      );
      setSuccessMessage("Consultation and quotation details saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating consultation";
      setErrorMessage(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!order) return "#";
    const cleanPhone = order.customerPhone.replace(/[^\d+]/g, "");
    let msg = `Hello ${order.customerName}, this is KRUMBISTRY Bake Shop regarding your bespoke ${order.eventType} cake consultation #${order.referenceNumber}.`;
    if (quotedPrice) {
      msg += ` We have reviewed your vision and the estimated quotation is Rs. ${parseFloat(
        quotedPrice
      ).toLocaleString()}.`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
        <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
        <span className="text-xs text-[#32190D]/60">Loading consultation dossier...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 flex items-start gap-3">
        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-base">Consultation Request Not Found</h2>
          <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
          <Link
            href="/admin/custom-orders"
            className="inline-block mt-3 text-xs font-semibold text-[#32190D] underline"
          >
            ← Return to Consultations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/custom-orders"
            className="p-2 rounded-lg border border-[#32190D]/10 bg-white hover:bg-[#F8F3E9] text-[#32190D] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-2xl font-bold text-[#32190D]">
                #{order.referenceNumber}
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#D6A64B]/40 bg-[#D6A64B]/15 text-[#8C6219]">
                {order.status}
              </span>
            </div>
            <p className="text-xs text-[#32190D]/60 mt-0.5">
              Submitted on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-xs font-semibold text-white hover:bg-[#20ba5a] transition-colors shadow-sm"
          >
            <MessageCircle size={15} />
            <span>WhatsApp Quotation</span>
          </a>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Event Specs & Design Brief */}
        <div className="lg:col-span-2 space-y-6">
          {/* Design Brief Card */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Cake Vision & Design Brief
            </h2>

            <div className="p-4 rounded-xl bg-[#F8F3E9]/50 border border-[#32190D]/10 text-xs text-[#32190D] leading-relaxed whitespace-pre-wrap">
              {order.designDescription}
            </div>

            {order.additionalNotes && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]/70 mb-1">
                  Additional Notes
                </label>
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                  {order.additionalNotes}
                </div>
              </div>
            )}
          </div>

          {/* Event & Flavor Specifications */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Event & Flavor Specifications
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Celebration Event
                </span>
                <div className="font-semibold text-sm text-[#32190D] mt-0.5">
                  {order.eventType}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Event Date
                </span>
                <div className="font-semibold text-xs text-[#32190D] mt-0.5 font-mono">
                  {order.eventDate}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Required Delivery Date
                </span>
                <div className="font-semibold text-xs text-[#32190D] mt-0.5 font-mono">
                  {order.deliveryDate || "Same as event date"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Guest Servings
                </span>
                <div className="font-semibold text-xs text-[#32190D] mt-0.5">
                  {order.servings}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Cake Size / Tiers
                </span>
                <div className="font-semibold text-xs text-[#32190D] mt-0.5">
                  {order.cakeSize || "Standard recommended"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Budget Range
                </span>
                <div className="font-semibold text-xs text-[#32190D] mt-0.5">
                  {order.budgetRange || "Flexible"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Sponge Flavor
                </span>
                <div className="font-semibold text-xs text-[#32190D] mt-0.5">
                  {order.flavor || "Consultation choice"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F3E9]/40 border border-[#32190D]/10 sm:col-span-2">
                <span className="text-[#32190D]/60 uppercase tracking-wider font-semibold text-[10px]">
                  Artisanal Filling & Buttercream
                </span>
                <div className="font-semibold text-xs text-[#32190D] mt-0.5">
                  {order.filling || "Chef's recommendation"}
                </div>
              </div>
            </div>
          </div>

          {/* Reference Images */}
          {order.images && order.images.length > 0 && (
            <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
                Customer Reference & Moodboard ({order.images.length})
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {order.images.map((imgUrl, idx) => (
                  <a
                    key={idx}
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square rounded-xl overflow-hidden bg-[#F8F3E9] border border-[#32190D]/10 block"
                  >
                    <ImagePlaceholder
                      src={imgUrl}
                      alt={`Reference ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                      <ExternalLink size={16} />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Quotation Controls & Customer Dossier */}
        <div className="space-y-6">
          {/* Quotation Management */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Quotation & Production Status
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Consultation Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
              >
                <option value="NEW">NEW (Awaiting review)</option>
                <option value="REVIEWING">REVIEWING (Chef assessing)</option>
                <option value="QUOTED">QUOTED (Price sent to client)</option>
                <option value="CONFIRMED">CONFIRMED (Client accepted)</option>
                <option value="IN_PRODUCTION">IN_PRODUCTION (In Kitchen)</option>
                <option value="COMPLETED">COMPLETED (Delivered)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Quoted Price (PKR / Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="e.g. 280.00"
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono font-semibold text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Internal Staff Notes
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Allergy flags, delivery logistics, agreed modifications..."
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#32190D] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isUpdating ? (
                <Loader2 size={14} className="animate-spin text-[#D6A64B]" />
              ) : (
                <Save size={14} className="text-[#D6A64B]" />
              )}
              <span>Save Consultation</span>
            </button>
          </div>

          {/* Customer Profile */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Client Information
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#32190D]/50 text-[10px] uppercase font-semibold">
                  Client Name
                </span>
                <p className="font-semibold text-sm text-[#32190D]">
                  {order.customerName}
                </p>
              </div>

              <div>
                <span className="text-[#32190D]/50 text-[10px] uppercase font-semibold">
                  Email
                </span>
                <a
                  href={`mailto:${order.customerEmail}`}
                  className="flex items-center gap-1.5 text-xs text-[#32190D] hover:underline font-mono mt-0.5"
                >
                  <Mail size={13} className="text-[#D6A64B]" />
                  <span>{order.customerEmail}</span>
                </a>
              </div>

              <div>
                <span className="text-[#32190D]/50 text-[10px] uppercase font-semibold">
                  Phone / WhatsApp
                </span>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="flex items-center gap-1.5 text-xs text-[#32190D] hover:underline font-mono mt-0.5"
                >
                  <Phone size={13} className="text-[#D6A64B]" />
                  <span>{order.customerPhone}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

