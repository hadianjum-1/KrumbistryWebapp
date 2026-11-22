"use client";

import { useEffect, useState } from "react";
import {
  Boxes,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  History,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ProductInventory {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  available: boolean;
  category?: { name: string };
}

interface StockMovement {
  id: string;
  type?: string;
  movementType?: string;
  quantity?: number;
  quantityChange?: number;
  quantityBefore?: number;
  quantityAfter?: number;
  balanceAfter?: number;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  product: {
    name: string;
    sku: string | null;
  };
}

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustingProduct, setAdjustingProduct] = useState<ProductInventory | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [movementType, setMovementType] = useState<string>("MANUAL_ADJUSTMENT");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setMovements(data.recentMovements || []);
      }
    } catch {
      setErrorMsg("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustmentValue === 0) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          adjustment: adjustmentValue,
          type: movementType,
          reason: adjustmentReason || "Admin manual adjustment",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      setAdjustingProduct(null);
      setAdjustmentValue(0);
      setAdjustmentReason("");
      fetchInventory();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#32190D] flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#D6A64B]" />
            Stock &amp; Finished Product Inventory
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Real-time stock counts across POS terminals and website orders, plus audit ledger history.
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="p-2 text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-50 transition self-start sm:self-auto"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
          {errorMsg}
        </div>
      )}

      {/* Product Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 font-serif font-medium text-stone-800">
          Products &amp; Current Stock ({products.length})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-[#F8F3E9]/60 text-stone-700 font-medium border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Tracking</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading product inventory...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.trackInventory && p.stockQuantity <= p.lowStockThreshold;
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3.5 px-4 font-medium text-stone-900">{p.name}</td>
                      <td className="py-3.5 px-4 text-xs text-stone-500">
                        {p.category?.name || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-stone-500">
                        {p.sku || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold font-mono text-sm ${
                              isLow
                                ? "text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                                : "text-stone-800"
                            }`}
                          >
                            {p.stockQuantity}
                          </span>
                          {isLow && (
                            <span className="flex items-center text-xs text-amber-700 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 mr-0.5" /> Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.trackInventory ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Tracked
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">Untracked</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustmentValue(0);
                            setAdjustmentReason("");
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 transition"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Movements Audit Trail */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-4 border-b border-stone-200 font-serif font-medium text-stone-800 flex items-center gap-2">
          <History className="w-4 h-4 text-[#D6A64B]" />
          Recent Stock Movements Ledger ({movements.length})
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-[#F8F3E9]/60 text-stone-700 font-medium border-b border-stone-200 sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Date/Time</th>
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Change</th>
                <th className="py-2.5 px-3">Balance</th>
                <th className="py-2.5 px-3">Reason / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-stone-50/50">
                  <td className="py-2 px-3 text-stone-500 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-3 font-medium text-stone-800">
                    {m.product.name}
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                      {m.type || m.movementType || "ADJUSTMENT"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {(() => {
                      const qty = typeof m.quantity === "number" ? m.quantity : (m.quantityChange || 0);
                      return (
                        <span
                          className={`font-semibold font-mono ${
                            qty > 0
                              ? "text-emerald-700"
                              : qty < 0
                              ? "text-rose-700"
                              : "text-stone-600"
                          }`}
                        >
                          {qty > 0 ? `+${qty}` : qty}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-2 px-3 font-mono text-stone-600">
                    {typeof m.balanceAfter === "number"
                      ? `${m.balanceAfter - (m.quantity || 0)} → ${m.balanceAfter}`
                      : `${m.quantityBefore ?? "—"} → ${m.quantityAfter ?? "—"}`}
                  </td>
                  <td className="py-2 px-3 text-stone-500 truncate max-w-xs">
                    {m.notes || m.reason || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#32190D] text-white flex items-center justify-between">
              <h3 className="font-serif font-medium flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#D6A64B]" />
                Adjust Stock — {adjustingProduct.name}
              </h3>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-stone-400 hover:text-white text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAdjustStock} className="p-5 space-y-4">
              <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-600 space-y-1">
                <div>
                  Current on-hand stock:{" "}
                  <strong className="text-stone-900 font-mono text-sm">
                    {adjustingProduct.stockQuantity}
                  </strong>
                </div>
                <div>
                  New projected stock:{" "}
                  <strong className="text-stone-900 font-mono text-sm">
                    {Math.max(0, adjustingProduct.stockQuantity + adjustmentValue)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Movement Type
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A64B]"
                >
                  <option value="RESTOCK">Restock / Baked Fresh Today (+)</option>
                  <option value="MANUAL_ADJUSTMENT">Manual Count Adjustment</option>
                  <option value="WASTAGE">Bakery Wastage / Damaged (-)</option>
                  <option value="INTERNAL_USE">Sampling / Staff Tasting (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Quantity Adjustment (positive to add, negative to reduce)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentValue((v) => v - 1)}
                    className="p-2 border border-stone-300 rounded-lg hover:bg-stone-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-center font-mono font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustmentValue((v) => v + 1)}
                    className="p-2 border border-stone-300 rounded-lg hover:bg-stone-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Morning fresh bake tray or recount"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3.5 py-1.5 border border-stone-300 text-stone-700 text-sm rounded-lg hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || adjustmentValue === 0}
                  className="px-4 py-1.5 bg-[#32190D] text-white text-sm rounded-lg hover:bg-[#4a2614] flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
