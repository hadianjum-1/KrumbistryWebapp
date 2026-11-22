"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Printer,
  RefreshCw,
  HardDrive,
  Shield,
  CheckCircle2,
  Trash2,
  Store,
} from "lucide-react";
import {
  getLocalDeviceCode,
  setLocalDeviceCode,
  syncDownCatalog,
} from "@/lib/posSyncEngine";
import { posDb } from "@/lib/posDb";
import ThermalReceipt, { ReceiptData } from "@/components/pos/ThermalReceipt";

export default function PosSettingsPage() {
  const [deviceCode, setDeviceCode] = useState("POS-01");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testReceipt, setTestReceipt] = useState<ReceiptData | null>(null);

  useEffect(() => {
    setDeviceCode(getLocalDeviceCode());
  }, []);

  const handleSaveDeviceCode = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalDeviceCode(deviceCode);
    setStatusMessage(`Device code saved as ${deviceCode}. Reloading catalog...`);
    syncDownCatalog().then(() => {
      setStatusMessage(`Device ${deviceCode} configured and synchronized.`);
    });
  };

  const handleTestPrint = () => {
    const mockReceipt: ReceiptData = {
      receiptNumber: `KRB-TEST-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString(),
      cashierName: "Printer Diagnostic Test",
      deviceCode,
      branch: "Main Bakery - Peshawar",
      customerName: "80mm Printer Alignment Test",
      items: [
        {
          name: "Belgian Chocolate Croissant",
          quantity: 2,
          unitPrice: 450,
          totalPrice: 900,
        },
        {
          name: "Signature Red Velvet Cake Slice",
          quantity: 1,
          unitPrice: 650,
          totalPrice: 650,
        },
      ],
      subtotal: 1550,
      discount: 50,
      discountReason: "Test Discount",
      tax: 0,
      total: 1500,
      paymentMethod: "CASH",
      amountReceived: 2000,
      change: 500,
    };

    setTestReceipt(mockReceipt);
  };

  const handleForceCacheRefresh = async () => {
    setIsRefreshing(true);
    setStatusMessage(null);
    try {
      const res = await syncDownCatalog();
      setStatusMessage(
        `Cache updated: ${res.productsCount} products and ${res.staffCount} staff credentials stored locally.`
      );
    } catch {
      setStatusMessage("Failed to update cache. Check internet connection.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearCache = async () => {
    if (!posDb) return;
    if (confirm("Are you sure you want to clear the local product cache? It will be re-downloaded.")) {
      await posDb.cachedProducts.clear();
      await posDb.cachedCategories.clear();
      await syncDownCatalog();
      setStatusMessage("Local cache reset and refreshed.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#32190D]">
          Terminal Configuration &amp; Settings
        </h1>
        <p className="text-xs text-[#806E5D] mt-0.5">
          Device identity, 80mm thermal printer testing &amp; local cache tools
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Device Registration Card */}
      <div className="rounded-3xl border border-[#32190D]/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Store size={18} className="text-[#8C6219]" />
          <h3 className="font-serif text-base font-bold text-[#32190D]">
            Device Identifier
          </h3>
        </div>

        <form onSubmit={handleSaveDeviceCode} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#32190D] block mb-1">
              Terminal Identifier Code
            </label>
            <input
              type="text"
              required
              value={deviceCode}
              onChange={(e) => setDeviceCode(e.target.value.toUpperCase())}
              placeholder="e.g. POS-01, POS-02"
              className="w-full sm:w-64 rounded-xl border border-gray-300 p-2.5 font-mono text-sm font-bold text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
            />
            <p className="text-[11px] text-[#806E5D] mt-1">
              Every physical counter terminal must have its own unique code for local receipt
              generation and multi-device audit trails.
            </p>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#32190D] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D6A64B] hover:text-[#32190D] transition-all shadow-md"
          >
            Save Device Identity
          </button>
        </form>
      </div>

      {/* Thermal Printer Testing */}
      <div className="rounded-3xl border border-[#32190D]/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Printer size={18} className="text-[#8C6219]" />
          <h3 className="font-serif text-base font-bold text-[#32190D]">
            Thermal Receipt Printer (80mm)
          </h3>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs text-[#806E5D] leading-relaxed">
            Test the 80mm thermal receipt layout, paper cutting margins, item alignment, and barcode/QR
            readability.
          </p>

          <button
            type="button"
            onClick={handleTestPrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#32190D]/20 text-[#32190D] font-bold text-xs hover:bg-[#FAF6EE] transition-all"
          >
            <Printer size={15} />
            <span>Print Diagnostic Test Receipt</span>
          </button>
        </div>
      </div>

      {/* Local IndexedDB Cache Management */}
      <div className="rounded-3xl border border-[#32190D]/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <HardDrive size={18} className="text-[#8C6219]" />
          <h3 className="font-serif text-base font-bold text-[#32190D]">
            Offline Cache &amp; Storage
          </h3>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <p className="text-[#806E5D] leading-relaxed">
            Download the latest product prices, inventory counts, and staff PIN security credentials into
            this device&apos;s local IndexedDB database so you can work completely offline.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleForceCacheRefresh}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#32190D] text-white font-bold text-xs hover:bg-[#D6A64B] hover:text-[#32190D] transition-all shadow-md disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? "Refreshing..." : "Force Download Latest Catalog"}</span>
            </button>

            <button
              type="button"
              onClick={handleClearCache}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 font-bold text-xs hover:bg-red-50 transition-all"
            >
              <Trash2 size={14} />
              <span>Reset Local Cache</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test Receipt Preview */}
      {testReceipt && (
        <ThermalReceipt
          receipt={testReceipt}
          autoPrint={true}
          onClose={() => setTestReceipt(null)}
        />
      )}
    </div>
  );
}
