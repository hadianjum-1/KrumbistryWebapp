"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Receipt,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";
import { posDb, type CachedProduct, type CachedCategory } from "@/lib/posDb";
import {
  checkBackendReachable,
  syncDownCatalog,
  executePosCheckout,
  getLocalDeviceCode,
} from "@/lib/posSyncEngine";
import ThermalReceipt, { ReceiptData } from "@/components/pos/ThermalReceipt";
import TrialPaymentPopup from "@/components/pos/TrialPaymentPopup";

interface CartItem {
  product: CachedProduct;
  quantity: number;
  notes?: string;
}

export default function POSPage() {
  const [products, setProducts] = useState<CachedProduct[]>([]);
  const [categories, setCategories] = useState<CachedCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Discount
  const [discount, setDiscount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("");
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Customer
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("Walk-in");

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "BANK_TRANSFER" | "JAZZ_CASH" | "EASYPAISA"
  >("CASH");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState("");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Completed Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Staff and device
  const [staff, setStaff] = useState<{ id: string; name: string; role: string } | null>(null);
  const [deviceCode, setDeviceCode] = useState("POS-01");

  // Load Catalog & Staff
  useEffect(() => {
    setDeviceCode(getLocalDeviceCode());

    // Load active staff
    const savedStaff = localStorage.getItem("krumbistry_pos_active_staff");
    if (savedStaff) {
      try {
        setStaff(JSON.parse(savedStaff));
      } catch {}
    }

    const loadData = async () => {
      // 1. Try local cache first for instant load (<10ms)
      if (posDb) {
        try {
          const localProds = await posDb.cachedProducts.toArray();
          const localCats = await posDb.cachedCategories.toArray();
          if (localProds.length > 0) {
            setProducts(localProds);
            setCategories(localCats);
          }
        } catch {}
      }

      // 2. Refresh from server if online
      const reachable = await checkBackendReachable();
      if (reachable) {
        await syncDownCatalog();
        if (posDb) {
          const freshProds = await posDb.cachedProducts.toArray();
          const freshCats = await posDb.cachedCategories.toArray();
          setProducts(freshProds);
          setCategories(freshCats);
        }
      }
    };

    loadData();
  }, []);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "ALL" ||
        p.categoryId === selectedCategory ||
        p.categorySlug === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = item.product.salePrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const change = useMemo(() => {
    if (paymentMethod !== "CASH") return 0;
    return Math.max(0, amountReceived - grandTotal);
  }, [paymentMethod, amountReceived, grandTotal]);

  // Cart operations
  const addToCart = (product: CachedProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setDiscountReason("");
  };

  // Open Checkout
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setAmountReceived(grandTotal); // default exact amount
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  // Complete Sale
  const handleCompleteSale = async () => {
    if (paymentMethod === "CASH" && amountReceived < grandTotal) {
      setCheckoutError(
        `Cash received (Rs. ${amountReceived.toLocaleString()}) is less than total amount (Rs. ${grandTotal.toLocaleString()}).`
      );
      return;
    }

    setIsProcessing(true);
    setCheckoutError(null);

    try {
      const result = await executePosCheckout({
        staffId: staff?.id || "anonymous-staff",
        staffName: staff?.name || "Cashier",
        deviceCode,
        customerName,
        customerPhone,
        items: cart.map((i) => ({
          productId: i.product.id,
          productName: i.product.name,
          productSku: i.product.sku,
          quantity: i.quantity,
          unitPrice: i.product.salePrice ?? i.product.price,
          notes: i.notes,
        })),
        subtotal,
        discount,
        discountReason,
        tax: 0,
        total: grandTotal,
        payment: {
          method: paymentMethod,
          amountReceived: paymentMethod === "CASH" ? amountReceived : grandTotal,
          changeGiven: change,
          reference: paymentReference || undefined,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Checkout failed");
      }

      // Build receipt for instant thermal print
      const receipt: ReceiptData = {
        receiptNumber: result.receiptNumber,
        orderNumber: result.orderNumber,
        createdAt: new Date().toISOString(),
        cashierName: staff?.name || "Staff",
        deviceCode,
        customerName,
        customerPhone,
        items: cart.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          unitPrice: i.product.salePrice ?? i.product.price,
          totalPrice: (i.product.salePrice ?? i.product.price) * i.quantity,
          notes: i.notes,
        })),
        subtotal,
        discount,
        discountReason,
        tax: 0,
        total: grandTotal,
        paymentMethod,
        amountReceived: paymentMethod === "CASH" ? amountReceived : grandTotal,
        change,
        isOffline: result.isOffline,
      };

      setActiveReceipt(receipt);
      setIsCheckoutOpen(false);
      clearCart();
    } catch (err: unknown) {
      setCheckoutError(
        err instanceof Error ? err.message : "Failed to record transaction."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Quick Summary & Category Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#32190D]">
            Sales Counter Terminal
          </h1>
          <p className="text-xs text-[#806E5D] mt-0.5">
            Physical bakery register · Handcrafted bakery catalog
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#806E5D]"
          />
          <input
            type="text"
            placeholder="Search products or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#32190D]/15 bg-white py-2.5 pl-10 pr-4 text-xs text-[#32190D] placeholder:text-[#806E5D]/60 focus:border-[#D6A64B] focus:outline-none focus:ring-2 focus:ring-[#D6A64B]/20 shadow-xs"
          />
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            selectedCategory === "ALL"
              ? "bg-[#32190D] text-[#F8F3E9] shadow-md shadow-[#32190D]/20"
              : "bg-white border border-[#32190D]/15 text-[#32190D] hover:bg-[#F8F3E9]"
          }`}
        >
          All Items ({products.length})
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id || selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                isSelected
                  ? "bg-[#32190D] text-[#F8F3E9] shadow-md shadow-[#32190D]/20"
                  : "bg-white border border-[#32190D]/15 text-[#32190D] hover:bg-[#F8F3E9]"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Main Terminal Grid: Products on Left, Cart on Right */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        {/* Products Grid */}
        <div className="space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#32190D]/20 bg-white/60 p-12 text-center">
              <Package size={40} className="text-[#D6A64B] mb-3" />
              <h3 className="font-serif text-lg font-bold text-[#32190D]">
                No Products Found
              </h3>
              <p className="mt-1 text-xs text-[#806E5D] max-w-sm">
                Try selecting another category or clear your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const currentPrice = product.salePrice ?? product.price;
                const isOutOfStock = product.trackInventory && product.stockQuantity <= 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => addToCart(product)}
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-3.5 text-left transition-all duration-200 outline-none ${
                      isOutOfStock
                        ? "border-red-200 opacity-60 cursor-not-allowed bg-red-50/20"
                        : "border-[#32190D]/10 hover:border-[#D6A64B] hover:shadow-lg hover:shadow-[#D6A64B]/10 active:scale-[0.98]"
                    }`}
                  >
                    <div>
                      {/* Product Image Thumbnail */}
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-[#F8F3E9] mb-2.5">
                        {product.mainImage ? (
                          <Image
                            src={product.mainImage}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#D6A64B]">
                            <Package size={28} />
                          </div>
                        )}

                        {/* Stock Badge */}
                        <div className="absolute top-2 right-2">
                          {isOutOfStock ? (
                            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                              Sold Out
                            </span>
                          ) : product.isLowStock ? (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                              Low ({product.stockQuantity})
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#32190D]/80 backdrop-blur-xs px-2 py-0.5 text-[9px] font-medium text-[#F8F3E9]">
                              Qty: {product.stockQuantity}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Category */}
                      <h3 className="font-serif text-sm font-semibold text-[#32190D] line-clamp-1 group-hover:text-[#8C6219] transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-[#806E5D] mt-0.5">
                        SKU: {product.sku}
                      </p>
                    </div>

                    {/* Price & Add Indicator */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-sm font-bold text-[#32190D]">
                          Rs. {currentPrice.toLocaleString()}
                        </span>
                        {product.salePrice && (
                          <span className="ml-1.5 text-[10px] text-gray-400 line-through">
                            Rs. {product.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="w-7 h-7 rounded-full bg-[#FAF6EE] border border-[#D6A64B]/40 text-[#8C6219] flex items-center justify-center group-hover:bg-[#32190D] group-hover:text-[#F8F3E9] transition-colors">
                        <Plus size={14} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Current Order / Cart */}
        <div className="flex flex-col rounded-3xl border border-[#32190D]/10 bg-white p-5 shadow-sm h-fit sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-[#32190D]/10">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#8C6219]" />
                <h2 className="font-serif text-lg font-bold text-[#32190D]">
                  Current Order
                </h2>
              </div>
              <p className="text-[11px] text-[#806E5D]">
                Cashier: {staff?.name || "Terminal Staff"}
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-red-600 hover:text-red-700 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Customer Input */}
          <div className="py-3 border-b border-gray-100 flex items-center gap-2">
            <User size={15} className="text-[#806E5D]" />
            <input
              type="text"
              placeholder="Customer Name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="text-xs w-full bg-transparent border-none text-[#32190D] placeholder:text-[#806E5D]/50 focus:outline-none"
            />
          </div>

          {/* Cart Items List */}
          <div className="my-3 flex-1 overflow-y-auto max-h-[340px] divide-y divide-gray-100 pr-1">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart size={32} className="text-gray-300 mb-2" />
                <p className="text-xs font-semibold text-gray-500">
                  Cart is empty
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Tap bakery items on the left to add
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const itemPrice = item.product.salePrice ?? item.product.price;
                const lineTotal = itemPrice * item.quantity;

                return (
                  <div key={item.product.id} className="py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-[#32190D] truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          Rs. {itemPrice.toLocaleString()} each
                        </p>
                      </div>

                      <span className="text-xs font-bold text-[#32190D]">
                        Rs. {lineTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Stepper & Delete */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50/70 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-xs transition-all"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-[#32190D]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-xs transition-all"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Calculations Summary */}
          <div className="border-t border-[#32190D]/10 pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>

            {/* Discount Action */}
            <div className="flex justify-between items-center text-gray-600">
              <button
                type="button"
                onClick={() => setShowDiscountModal(true)}
                className="text-[11px] font-semibold text-[#8C6219] hover:underline"
              >
                {discount > 0 ? "Edit Discount" : "+ Add Discount"}
              </button>
              {discount > 0 && (
                <span className="font-semibold text-red-600">
                  - Rs. {discount.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex justify-between items-baseline border-t border-gray-200 pt-3">
              <span className="font-serif text-base font-bold text-[#32190D]">
                Total Amount
              </span>
              <span className="font-serif text-xl font-bold text-[#32190D]">
                Rs. {grandTotal.toLocaleString()}
              </span>
            </div>

            {/* Checkout Action */}
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={handleOpenCheckout}
              className="w-full mt-3 h-12 rounded-2xl bg-[#32190D] text-[#F8F3E9] text-xs font-bold uppercase tracking-wider hover:bg-[#D6A64B] hover:text-[#32190D] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Pay Rs. {grandTotal.toLocaleString()}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <h3 className="font-serif text-lg font-bold text-[#32190D] mb-1">
              Apply Order Discount
            </h3>
            <p className="text-xs text-[#806E5D] mb-4">
              Enter discount amount in PKR (subject to staff role permission).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#32190D] block mb-1">
                  Discount Amount (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="e.g. 200"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-[#D6A64B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#32190D] block mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  placeholder="e.g. Regular VIP guest, promotional courtesy"
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-sm focus:border-[#D6A64B] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiscount(0);
                  setDiscountReason("");
                  setShowDiscountModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="px-5 py-2 rounded-xl bg-[#32190D] text-white text-xs font-semibold hover:bg-[#D6A64B] hover:text-[#32190D]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Drawer / Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#32190D]">
                  Complete Payment
                </h3>
                <p className="text-xs text-[#806E5D]">
                  Total Due: <strong className="text-[#32190D] font-mono text-sm">Rs. {grandTotal.toLocaleString()}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {checkoutError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-600" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#32190D] block mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "CASH", label: "Cash", icon: DollarSign },
                  { id: "CARD", label: "Card", icon: CreditCard },
                  { id: "JAZZ_CASH", label: "JazzCash", icon: Receipt },
                  { id: "EASYPAISA", label: "Easypaisa", icon: Receipt },
                  { id: "BANK_TRANSFER", label: "Bank Transfer", icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-[#32190D] text-[#F8F3E9] border-[#32190D] shadow-md shadow-[#32190D]/15"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={16} className="mb-1 text-[#D6A64B]" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered & Quick Cash Buttons */}
            {paymentMethod === "CASH" && (
              <div className="mt-5 space-y-3 bg-[#FAF6EE] p-4 rounded-2xl border border-[#D6A64B]/30">
                <div>
                  <label className="text-xs font-bold text-[#32190D] block mb-1">
                    Cash Tendered (Rs.)
                  </label>
                  <input
                    type="number"
                    min={grandTotal}
                    value={amountReceived || ""}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-300 p-2.5 font-mono text-base font-bold text-[#32190D] focus:border-[#D6A64B] focus:outline-none bg-white"
                  />
                </div>

                {/* Quick denomination pills */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    grandTotal,
                    500,
                    1000,
                    2000,
                    5000,
                  ]
                    .filter((val, idx, arr) => val >= grandTotal && arr.indexOf(val) === idx)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmountReceived(val)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          amountReceived === val
                            ? "bg-[#32190D] text-white"
                            : "bg-white border border-gray-300 text-[#32190D] hover:bg-gray-50"
                        }`}
                      >
                        Rs. {val.toLocaleString()}
                      </button>
                    ))}
                </div>

                {/* Change Calculated */}
                <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                  <span className="text-xs font-bold text-[#32190D]">
                    Change Due to Customer:
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-800">
                    Rs. {change.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Reference for digital payments */}
            {paymentMethod !== "CASH" && (
              <div className="mt-5">
                <label className="text-xs font-bold text-[#32190D] block mb-1">
                  Transaction / Approval Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Card slip #, JazzCash TID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 p-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                />
              </div>
            )}

            {/* Confirm Checkout Button */}
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100"
              >
                Back to Cart
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCompleteSale}
                className="px-6 py-2.5 rounded-xl bg-[#32190D] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#D6A64B] hover:text-[#32190D] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Complete & Print Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant 80mm Thermal Receipt Preview & Print Modal */}
      {activeReceipt && (
        <ThermalReceipt
          receipt={activeReceipt}
          autoPrint={true}
          onClose={() => setActiveReceipt(null)}
        />
      )}
      <TrialPaymentPopup
  isOwner={true}
  trialEndDate="2026-11-27T23:59:59+05:00"
  onPaymentClick={() => {
    alert("Payment instructions given in Developer Console");
    console.info("KRUMBISTRY POS: Contact the developer for payment instructions.");
  }}
  paymentCompleted={false}
/>
    </div>
   
  );
}
