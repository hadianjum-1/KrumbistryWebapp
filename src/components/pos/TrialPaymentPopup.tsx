
"use client";

import { useEffect, useState } from "react";
import {
  X,
  ArrowUpRight,
  CreditCard,
  Check,
  AlertCircle,
} from "lucide-react";


interface TrialPaymentPopupProps {
  isOwner: boolean;
  trialEndDate?: string;
  paymentUrl?: string;
  paymentCompleted?: boolean;
  onPaymentClick?: () => void;
}

export default function TrialPaymentPopup({
  isOwner,
  trialEndDate,
  paymentUrl,
  paymentCompleted = false,
  onPaymentClick,
}: TrialPaymentPopupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const updateTime = () => setCurrentTime(Date.now());

    updateTime();

    const interval = setInterval(updateTime, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!isOwner || paymentCompleted) return null;

  const endDate = trialEndDate
    ? new Date(trialEndDate)
    : new Date();

  const isExpired =
    currentTime > 0 && currentTime >= endDate.getTime();

  // Allow dismissal before expiration only.
  // Once expired, the popup cannot be removed.
  if (!isExpired && !isOpen) return null;

  const features = [
    "POS API integration",
    "Product and inventory synchronization",
    "Offline transaction support",
    "Multi-device synchronization",
    "Receipt printing configuration",
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="trial-title"
        className="relative w-full max-w-[460px] overflow-hidden rounded-xl border border-[#30343B] bg-[#181A1F] text-[#EDEFF2] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#30343B] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#3A3F48] bg-[#22252B]">
              <CreditCard size={15} className="text-[#B7BEC9]" />
            </div>

            <span className="text-sm font-semibold tracking-tight">
              Billing & Subscription
            </span>
          </div>

          {/* Close button only before expiration */}
          {!isExpired && (
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close dialog"
              className="rounded-md p-1.5 text-[#858B96] transition hover:bg-[#292D34] hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-6">

          {/* Status */}
          <div className="mb-5 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                isExpired ? "bg-red-400" : "bg-amber-400"
              }`}
            />

            <span className="text-xs font-medium text-[#A5ABB5]">
              {isExpired ? "TRIAL EXPIRED" : "TRIAL ENDING"}
            </span>
          </div>

          {/* Heading */}
          <h2
            id="trial-title"
            className="text-[23px] font-semibold tracking-tight text-white"
          >
            {isExpired
              ? "Your free trial has ended"
              : "Your trial ends today"}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#9BA1AC]">
            {isExpired
              ? "Your 3-day POS trial has expired. Complete the integration payment to continue using your POS service."
              : "Your 3-day POS trial is coming to an end. Complete the integration payment to continue with your POS service."}
          </p>

          {/* Pricing */}
          <div className="mt-6 rounded-lg border border-[#343943] bg-[#202329] p-5">
            <p className="text-xs font-medium text-[#9299A5]">
              ONE-TIME INTEGRATION FEE
            </p>

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[34px] font-semibold tracking-tight text-white">
                $139
              </span>

              <span className="text-sm text-[#9299A5]">
                USD
              </span>
            </div>

            <p className="mt-1 text-xs text-[#858C97]">
              POS API Integration & Implementation
            </p>
          </div>

          {/* Included services */}
          <div className="mt-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#9299A5]">
              Included in your package
            </h3>

            <div className="space-y-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 text-[13px] text-[#D1D5DC]"
                >
                  <Check
                    size={15}
                    className="shrink-0 text-emerald-400"
                  />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Payment CTA */}
        {paymentUrl ? (
  <a
    href={paymentUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-[#17191D] transition hover:bg-[#E5E7EB]"
  >
    Make Payment
    <ArrowUpRight size={16} />
  </a>
) : (
  <button
    onClick={onPaymentClick}
    className="mt-7 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-[#17191D] transition hover:bg-[#E5E7EB]"
  >Make Payment
    <ArrowUpRight size={16} />
  </button>
)}

          {/* Footer */}
          <div className="mt-4 flex items-start gap-2 rounded-md border border-[#343943] bg-[#202329]/70 p-3">
            <AlertCircle
              size={15}
              className="mt-0.5 shrink-0 text-[#9299A5]"
            />

            <p className="text-xs leading-5 text-[#9299A5]">
              This is a one-time integration fee. Additional
              hosting, third-party services and maintenance
              may be charged separately.
            </p>
          </div>

          {/* Dismiss only before expiration */}
          {!isExpired && (
            <button
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full text-center text-xs text-[#858C97] transition hover:text-white"
            >
              Remind me later
            </button>
          )}

          {isExpired && (
            <p className="mt-5 text-center text-xs text-red-400">
              Payment required to dismiss this notification.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
