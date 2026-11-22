"use client";

import React from "react";
import { Printer, X } from "lucide-react";

export interface ReceiptData {
  orderNumber?: string;
  receiptNumber: string;
  createdAt: string;
  cashierName: string;
  deviceCode: string;
  branch?: string;
  customerName?: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string;
  }>;
  subtotal: number;
  discount: number;
  discountReason?: string;
  tax: number;
  total: number;
  paymentMethod: string;
  amountReceived?: number;
  change?: number;
  isOffline?: boolean;
}

interface ThermalReceiptProps {
  receipt: ReceiptData;
  onClose?: () => void;
  autoPrint?: boolean;
}

export default function ThermalReceipt({
  receipt,
  onClose,
  autoPrint = false,
}: ThermalReceiptProps) {
  React.useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(receipt.createdAt).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Action Header (Hidden during actual print) */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#32190D] px-6 py-4 text-[#F8F3E9] print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-[#D6A64B]" />
            <span className="font-serif text-lg font-medium">Thermal Receipt</span>
            {receipt.isOffline && (
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                Offline
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-[#D6A64B] px-3.5 py-1.5 text-xs font-semibold text-[#32190D] hover:bg-[#c4953c] transition-colors"
            >
              <Printer size={14} /> Print (80mm)
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* 80mm Printable Area */}
        <div className="overflow-y-auto p-6 text-black print:m-0 print:p-0">
          <div
            id="krumbistry-receipt"
            className="receipt-container mx-auto font-mono text-[13px] leading-tight text-black max-w-[320px] bg-white p-4"
          >
            {/* Bakery Brand Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <h2 className="text-xl font-bold tracking-wider font-serif uppercase">
                KRUMBISTRY
              </h2>
              <p className="text-[11px] font-sans font-semibold tracking-widest text-gray-700 uppercase">
                Bake Shop · Luxury in Every Bite
              </p>
              <p className="text-[10px] text-gray-600 mt-1">
                {receipt.branch || "Prime Tower's, Warsak Rd, Peshawar"}
              </p>
              <p className="text-[10px] text-gray-600">
                Tel: +92 304 9491501 · hello@krumbistry.com
              </p>
            </div>

            {/* Receipt Meta */}
            <div className="py-2.5 text-[11px] border-b border-dashed border-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Receipt: <strong>{receipt.receiptNumber}</strong></span>
                <span>{receipt.deviceCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Date: {formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier: {receipt.cashierName}</span>
                {receipt.isOffline && <span className="font-bold">[OFFLINE SALE]</span>}
              </div>
              {receipt.customerName && receipt.customerName !== "Walk-in Customer" && (
                <div className="flex justify-between">
                  <span>Customer: {receipt.customerName}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-2.5 border-b border-dashed border-gray-400">
              <div className="grid grid-cols-[1fr_36px_56px_60px] font-bold text-[11px] pb-1 border-b border-gray-300">
                <span>Item</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Price</span>
                <span className="text-right">Total</span>
              </div>

              <div className="divide-y divide-gray-100 py-1 space-y-1">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="pt-1">
                    <div className="grid grid-cols-[1fr_36px_56px_60px] text-[12px]">
                      <span className="font-medium truncate pr-1">{item.name}</span>
                      <span className="text-center">{item.quantity}</span>
                      <span className="text-right">{item.unitPrice.toLocaleString()}</span>
                      <span className="text-right font-semibold">{item.totalPrice.toLocaleString()}</span>
                    </div>
                    {item.notes && (
                      <p className="text-[10px] text-gray-500 italic pl-1">
                        * {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Totals */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[12px] space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {receipt.subtotal.toLocaleString()}</span>
              </div>

              {receipt.discount > 0 && (
                <div className="flex justify-between text-red-700">
                  <span>Discount {receipt.discountReason ? `(${receipt.discountReason})` : ""}:</span>
                  <span>- Rs. {receipt.discount.toLocaleString()}</span>
                </div>
              )}

              {receipt.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>Rs. {receipt.tax.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-300">
                <span>GRAND TOTAL:</span>
                <span>Rs. {receipt.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="py-2.5 border-b border-dashed border-gray-400 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-semibold">{receipt.paymentMethod.replace(/_/g, " ")}</span>
              </div>

              {receipt.paymentMethod === "CASH" && receipt.amountReceived !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span>Rs. {receipt.amountReceived.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change Returned:</span>
                    <span>Rs. {(receipt.change ?? 0).toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Message */}
            <div className="pt-3 text-center text-[10px] text-gray-700 space-y-1">
              <p className="font-serif italic text-[11px]">
                Thank you for visiting KRUMBISTRY!
              </p>
              <p>Handcrafted Artisanal Perfection</p>
              <p className="text-[9px] text-gray-500">
                Returns accepted within 2 hours with this receipt.
              </p>
              <p className="font-mono text-[9px] text-gray-400 pt-1">
                www.krumbistry.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
