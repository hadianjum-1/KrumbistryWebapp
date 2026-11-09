"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
  Copy,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { siteSettings } from "@/config/site";
import { getBagOrderWhatsAppUrl } from "@/lib/whatsapp";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    totalItems,
  } = useCart();

  // Mode: "bag" | "checkout" | "success"
  const [viewMode, setViewMode] = useState<"bag" | "checkout" | "success">("bag");

  // Checkout form state
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    total: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const freeDeliveryDiff = siteSettings.freeDeliveryThreshold - subtotal;

  const handleWhatsAppOrder = () => {
    const bagItems = items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.salePrice ?? item.product.price,
    }));
    const url = getBagOrderWhatsAppUrl(
      bagItems,
      subtotal,
      deliveryFee,
      customerName,
      deliveryAddress
    );
    window.open(url, "_blank");
  };

  const handleOnlineOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setOrderError("Please complete your name, email, phone number, and delivery address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        customerNotes: customerNotes.trim() || undefined,
        paymentMethod: "CASH_ON_DELIVERY",
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          notes: item.notes,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to place your order. Please try again.");
      }

      setCompletedOrder({
        orderNumber: data.data.orderNumber,
        total: Number(data.data.total),
      });
      clearCart();
      setViewMode("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order processing failed.";
      setOrderError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    closeCart();
    if (viewMode === "success") {
      setViewMode("bag");
      setCompletedOrder(null);
    }
  };

  const copyOrderNumber = () => {
    if (completedOrder?.orderNumber) {
      navigator.clipboard.writeText(completedOrder.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#26140C]/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 md:pl-10">
        <aside
          aria-label="Your Bag"
          className="w-screen max-w-md bg-[#F8F3E9] text-[#32190D] shadow-2xl flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#32190D]/10 bg-[#FAF6EE] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full border border-[#D6A64B] grid place-items-center text-[#B88632]">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h2 className="font-serif text-lg font-medium leading-none">
                  {viewMode === "success"
                    ? "Order Confirmed"
                    : viewMode === "checkout"
                    ? "Delivery Details"
                    : "Your Bag"}
                </h2>
                <p className="text-xs text-[#806E5D] mt-1">
                  {viewMode === "success"
                    ? "Thank you for choosing KRUMBISTRY"
                    : `${totalItems} ${totalItems === 1 ? "creation" : "creations"} selected`}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close bag"
              className="w-9 h-9 rounded-full border border-[#32190D]/10 hover:border-[#D6A64B] grid place-items-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Success Screen */}
          {viewMode === "success" && completedOrder && (
            <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-center items-center text-center space-y-5 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center ring-8 ring-emerald-50">
                <CheckCircle2 size={32} />
              </div>

              <div>
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#8C6219]">
                  Baking Soon
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#32190D] mt-1">
                  Luxury In Every Bite
                </h3>
                <p className="text-xs text-[#32190D]/70 mt-2 max-w-xs mx-auto">
                  Your order has been registered and our chefs are reviewing your artisanal treats.
                </p>
              </div>

              {/* Order Reference Box */}
              <div className="w-full bg-white border border-[#D6A64B]/40 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between text-[#32190D]/60 text-[11px]">
                  <span>ORDER NUMBER</span>
                  <span>TOTAL PAID ON DELIVERY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-base text-[#32190D]">
                    {completedOrder.orderNumber}
                  </span>
                  <span className="font-mono font-bold text-base text-[#8C6219]">
                    {siteSettings.currencySymbol} {completedOrder.total.toLocaleString()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyOrderNumber}
                  className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md bg-[#F8F3E9] text-[11px] font-semibold text-[#32190D] hover:bg-[#F1EADD] transition-colors cursor-pointer"
                >
                  <Copy size={13} className="text-[#D6A64B]" />
                  <span>{copied ? "Copied to Clipboard!" : "Copy Reference #"}</span>
                </button>
              </div>

              <div className="space-y-2 w-full pt-2">
                <a
                  href={`https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(
                    `Hello KRUMBISTRY, I just placed order #${completedOrder.orderNumber} for Rs. ${completedOrder.total}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-xs font-semibold text-white hover:bg-[#20ba5a] transition-colors shadow-sm"
                >
                  <MessageCircle size={15} />
                  <span>Track Order on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-lg border border-[#32190D]/15 text-xs font-semibold text-[#32190D] hover:bg-[#FAF6EE] transition-colors cursor-pointer"
                >
                  Continue Browsing Bakery
                </button>
              </div>
            </div>
          )}

          {/* Checkout Form View */}
          {viewMode === "checkout" && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#32190D]/10">
                <button
                  type="button"
                  onClick={() => setViewMode("bag")}
                  className="text-xs font-semibold text-[#8C6219] hover:underline"
                >
                  ← Back to Bag Items
                </button>
                <span className="text-xs font-mono font-semibold text-[#32190D]">
                  Total: {siteSettings.currencySymbol} {total.toLocaleString()}
                </span>
              </div>

              {orderError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <span>{orderError}</span>
                </div>
              )}

              <form onSubmit={handleOnlineOrderSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#32190D] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#32190D] mb-1">
                    Email Address (For Receipt) *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="eleanor@example.com"
                    className="w-full rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#32190D] mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="w-full rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#32190D] mb-1">
                    Delivery Address & Street Details *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House / Apartment #, Street, Phase / Area, City..."
                    className="w-full rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#32190D] mb-1">
                    Special Instructions / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Ring bell twice, candle requested"
                    className="w-full rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#32190D] py-3 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-[#D6A64B]" />
                        <span>Processing Artisanal Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Place Order ({siteSettings.currencySymbol} {total.toLocaleString()})</span>
                        <ArrowRight size={14} className="text-[#D6A64B]" />
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-[#806E5D] mt-2">
                    Payment collected in Cash on Delivery upon fresh handoff.
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* Standard Bag Items View */}
          {viewMode === "bag" && (
            <>
              {/* Free delivery notification */}
              {subtotal > 0 && (
                <div className="bg-[#F1EADD] px-6 py-2.5 text-xs flex items-center justify-between border-b border-[#32190D]/10 text-[#6F5A4B] shrink-0">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[#B88632]" />
                    {freeDeliveryDiff > 0 ? (
                      <>
                        Add{" "}
                        <strong className="text-[#32190D]">
                          {siteSettings.currencySymbol} {freeDeliveryDiff.toLocaleString()}
                        </strong>{" "}
                        more for complimentary delivery
                      </>
                    ) : (
                      <strong className="text-emerald-800">
                        Complimentary Luxury Delivery Unlocked
                      </strong>
                    )}
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#32190D]/10">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <div className="w-16 h-16 rounded-full border border-[#D6A64B]/40 bg-[#FAF6EE] grid place-items-center text-[#B88632] mb-4">
                      <ShoppingBag size={24} />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-[#32190D]">
                      Your bag is empty
                    </h3>
                    <p className="text-xs text-[#806E5D] max-w-xs mt-1.5 mb-6">
                      Discover our handcrafted cakes, brownies, and pastries baked fresh each morning.
                    </p>
                    <Link
                      href="/menu"
                      onClick={closeCart}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#32190D] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#432314] transition-colors"
                    >
                      <span>Explore Bakery Menu</span>
                      <ArrowRight size={13} className="text-[#D6A64B]" />
                    </Link>
                  </div>
                ) : (
                  items.map((item) => {
                    const itemPrice = item.product.salePrice ?? item.product.price;
                    return (
                      <div key={item.product.id} className="py-4 flex gap-4 items-start">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#FAF6EE] border border-[#32190D]/10 shrink-0">
                          <ImagePlaceholder
                            src={item.product.mainImage}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-serif text-sm font-medium leading-snug text-[#32190D] truncate">
                              {item.product.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              aria-label={`Remove ${item.product.name}`}
                              className="text-[#806E5D] hover:text-red-700 transition-colors p-0.5 cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="text-xs text-[#806E5D] mt-0.5 font-mono">
                            {siteSettings.currencySymbol} {itemPrice.toLocaleString()}
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-[#806E5D] mt-0.5 italic">
                              &quot;{item.notes}&quot;
                            </p>
                          )}

                          {/* Quantity selector */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-[#32190D]/15 rounded bg-white">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity - 1)
                                }
                                aria-label="Decrease quantity"
                                className="w-6 h-6 grid place-items-center hover:bg-[#FAF6EE] text-[#32190D] cursor-pointer"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-7 text-center text-xs font-medium font-mono">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity + 1)
                                }
                                aria-label="Increase quantity"
                                className="w-6 h-6 grid place-items-center hover:bg-[#FAF6EE] text-[#32190D] cursor-pointer"
                              >
                                <Plus size={11} />
                              </button>
                            </div>

                            <span className="text-xs font-semibold text-[#32190D]">
                              {siteSettings.currencySymbol}{" "}
                              {(itemPrice * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer & Checkout Area */}
              {items.length > 0 && (
                <div className="p-6 border-t border-[#32190D]/10 bg-[#FAF6EE] space-y-4 shrink-0">
                  {/* Pricing breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#806E5D]">
                      <span>Subtotal</span>
                      <span className="font-mono">
                        {siteSettings.currencySymbol} {subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#806E5D]">
                      <span>Estimated Delivery</span>
                      <span className="font-mono">
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-700 font-semibold">FREE</span>
                        ) : (
                          `${siteSettings.currencySymbol} ${deliveryFee.toLocaleString()}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-serif font-medium text-[#32190D] pt-2 border-t border-[#32190D]/10">
                      <span>Total</span>
                      <span className="text-[#8C6219] font-mono font-bold">
                        {siteSettings.currencySymbol} {total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("checkout")}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#32190D] py-3.5 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm cursor-pointer"
                    >
                      <span>Proceed to Online Checkout</span>
                      <ArrowRight size={14} className="text-[#D6A64B]" />
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsAppOrder}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 text-xs font-semibold text-white hover:bg-[#20ba5a] transition-colors shadow-2xs cursor-pointer"
                    >
                      <MessageCircle size={15} />
                      <span>Order via WhatsApp Concierge</span>
                    </button>

                    <p className="text-[10px] text-center text-[#806E5D]">
                      Freshly prepared to order · Luxury packaging included.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
