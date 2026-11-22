"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Store,
  Phone,
  Truck,
  Share2,
  ExternalLink,
} from "lucide-react";
import { FaTiktok, FaFacebookF } from "react-icons/fa";
import InstagramIcon from "@/components/ui/InstagramIcon";
import StorageUsageOverview from "@/components/admin/StorageUsageOverview";

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    bakeryName: "",
    tagline: "",
    announcementText: "",
    announcementSubtext: "",
    contactEmail: "",
    contactPhone: "",
    whatsappNumber: "",
    address: "",
    openingHours: "",
    currency: "PKR",
    currencySymbol: "Rs.",
    deliveryFee: "0",
    freeDeliveryThreshold: "0",
    minimumOrderAmount: "0",
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.data) {
          throw new Error(json.error || "Failed to load store settings");
        }
        const d = json.data;
        setSettings({
          bakeryName: d.bakeryName || "",
          tagline: d.tagline || "",
          announcementText: d.announcementText || "",
          announcementSubtext: d.announcementSubtext || "",
          contactEmail: d.contactEmail || "",
          contactPhone: d.contactPhone || "",
          whatsappNumber: d.whatsappNumber || "",
          address: d.address || "",
          openingHours: d.openingHours || "",
          currency: d.currency || "PKR",
          currencySymbol: d.currencySymbol || "Rs.",
          deliveryFee: String(d.deliveryFee ?? "0"),
          freeDeliveryThreshold: String(d.freeDeliveryThreshold ?? "0"),
          minimumOrderAmount: String(d.minimumOrderAmount ?? "0"),
          instagramUrl: d.instagramUrl || "",
          facebookUrl: d.facebookUrl || "",
          tiktokUrl: d.tiktokUrl || "",
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error loading settings";
        setErrorMessage(msg);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleUrlBlur = (field: "instagramUrl" | "facebookUrl" | "tiktokUrl") => {
    let val = settings[field].trim();
    if (!val) return;
    if (val.startsWith("@")) {
      const handle = val.slice(1);
      if (field === "instagramUrl") val = `https://www.instagram.com/${handle}`;
      else if (field === "tiktokUrl") val = `https://www.tiktok.com/@${handle}`;
      else if (field === "facebookUrl") val = `https://www.facebook.com/${handle}`;
    } else if (!/^https?:\/\//i.test(val)) {
      val = `https://${val}`;
    }
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save settings");
      }

      setSuccessMessage("Bakery settings updated successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving settings";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
        <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
        <span className="text-xs text-[#32190D]/60">Loading settings configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
            Bakery &amp; Storefront Settings
          </h1>
          <p className="text-xs text-[#32190D]/70 mt-1">
            Configure business hours, contact numbers, delivery rules, social media channels, and monitor storage capacity.
          </p>
        </div>

        <button
          type="button"
          onClick={(e) => {
            const form = document.getElementById("admin-settings-form") as HTMLFormElement | null;
            if (form) form.requestSubmit();
          }}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#32190D] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin text-[#D6A64B]" />
          ) : (
            <Save size={14} className="text-[#D6A64B]" />
          )}
          <span>Save Settings</span>
        </button>
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

      {/* Storage & Usage Overview Monitoring Section */}
      <StorageUsageOverview />

      {/* Settings Form */}
      <form id="admin-settings-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
        {/* Section 1: Store Identity & Announcement */}
        <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#32190D]/10">
            <Store size={18} className="text-[#D6A64B]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#32190D]">
              Brand Identity & Announcement Bar
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Bakery Name
              </label>
              <input
                type="text"
                value={settings.bakeryName}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, bakeryName: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Brand Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, tagline: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Top Announcement Main Text
              </label>
              <input
                type="text"
                value={settings.announcementText}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    announcementText: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Top Announcement Subtext
              </label>
              <input
                type="text"
                value={settings.announcementSubtext}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    announcementSubtext: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Operating Hours */}
        <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#32190D]/10">
            <Phone size={18} className="text-[#D6A64B]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#32190D]">
              Contact Channels & Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactEmail: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Phone Number
              </label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    contactPhone: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                WhatsApp Number (Digits with country code)
              </label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    whatsappNumber: e.target.value,
                  }))
                }
                placeholder="e.g. 15551234567"
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Bakery Physical Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, address: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Opening & Baking Hours
              </label>
              <input
                type="text"
                value={settings.openingHours}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    openingHours: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Delivery Rules & Minimums */}
        <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#32190D]/10">
            <Truck size={18} className="text-[#D6A64B]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#32190D]">
              Delivery Fees & Order Thresholds
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Standard Delivery Fee (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.deliveryFee}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    deliveryFee: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Free Delivery Above (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.freeDeliveryThreshold}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    freeDeliveryThreshold: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Minimum Order Amount (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={settings.minimumOrderAmount}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    minimumOrderAmount: e.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Social Links */}
        <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#32190D]/10">
            <div className="flex items-center gap-2">
              <Share2 size={18} className="text-[#D6A64B]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#32190D]">
                Social Media Channels
              </h2>
            </div>
            <span className="text-[11px] text-[#32190D]/50 hidden sm:inline">
              Changes sync immediately to storefront header &amp; footer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Instagram */}
            <div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  <InstagramIcon size={14} className="text-[#D6A64B]" />
                  <span>Instagram Profile</span>
                </label>
                {settings.instagramUrl ? (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D6A64B] hover:text-[#b88c38] transition-colors"
                  >
                    <span>Test Link</span>
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="text-[11px] text-[#32190D]/40">Not set</span>
                )}
              </div>
              <input
                type="text"
                placeholder="https://instagram.com/krumbistry or @krumbistry"
                value={settings.instagramUrl}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    instagramUrl: e.target.value,
                  }))
                }
                onBlur={() => handleUrlBlur("instagramUrl")}
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] placeholder:text-[#32190D]/30 focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Facebook */}
            <div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  <FaFacebookF size={13} className="text-sky-700" />
                  <span>Facebook Page</span>
                </label>
                {settings.facebookUrl ? (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D6A64B] hover:text-[#b88c38] transition-colors"
                  >
                    <span>Test Link</span>
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="text-[11px] text-[#32190D]/40">Not set</span>
                )}
              </div>
              <input
                type="text"
                placeholder="https://facebook.com/krumbistry"
                value={settings.facebookUrl}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    facebookUrl: e.target.value,
                  }))
                }
                onBlur={() => handleUrlBlur("facebookUrl")}
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] placeholder:text-[#32190D]/30 focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            {/* TikTok */}
            <div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  <FaTiktok size={13} className="text-[#32190D]" />
                  <span>TikTok Profile</span>
                </label>
                {settings.tiktokUrl ? (
                  <a
                    href={settings.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D6A64B] hover:text-[#b88c38] transition-colors"
                  >
                    <span>Test Link</span>
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="text-[11px] text-[#32190D]/40">Not set</span>
                )}
              </div>
              <input
                type="text"
                placeholder="https://tiktok.com/@krumbistry or @krumbistry"
                value={settings.tiktokUrl}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    tiktokUrl: e.target.value,
                  }))
                }
                onBlur={() => handleUrlBlur("tiktokUrl")}
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs font-mono text-[#32190D] placeholder:text-[#32190D]/30 focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
    </div>
  );
}

