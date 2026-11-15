"use client";

import React from "react";
import { CheckCircle2, Sparkles, HeartHandshake } from "lucide-react";

interface FeedbackSuccessProps {
  onClose: () => void;
  customerName?: string;
}

export default function FeedbackSuccess({ onClose, customerName }: FeedbackSuccessProps) {
  return (
    <div className="py-8 px-4 sm:px-6 text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Decorative Gold & Espresso Badge */}
      <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#D6A64B]/20 animate-ping opacity-30" />
        <div className="relative w-16 h-16 rounded-full bg-[#32190D] border-2 border-[#D6A64B] flex items-center justify-center text-[#D6A64B] shadow-lg shadow-[#32190D]/15">
          <CheckCircle2 size={32} className="text-[#D6A64B]" />
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6A64B]/15 text-[#8C6219] text-xs font-semibold tracking-wider uppercase mb-3">
        <Sparkles size={12} className="text-[#D6A64B]" />
        We Appreciate You
      </div>

      <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#32190D] mb-3">
        Thank You for Your Feedback!
      </h3>

      {customerName && (
        <p className="text-sm font-semibold text-[#8C6219] mb-2">
          Dear {customerName},
        </p>
      )}

      <p className="text-sm text-[#806E5D] max-w-md mx-auto leading-relaxed mb-6">
        Your feedback has been successfully submitted. We appreciate your time and will use your suggestions to improve your experience.
      </p>

      {/* Confirmation email reminder card */}
      <div className="bg-[#FAF6EE] border border-[#D6A64B]/30 rounded-xl p-4 max-w-sm mx-auto mb-8 text-left flex items-start gap-3">
        <HeartHandshake className="text-[#D6A64B] shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-xs font-semibold text-[#32190D]">
            Confirmation Email Sent
          </p>
          <p className="text-[11px] text-[#806E5D] mt-0.5 leading-normal">
            A confirmation has been sent to your email address. Our team reviews every note with genuine care.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-[#32190D] text-[#F8F3E9] text-sm font-medium hover:bg-[#D6A64B] hover:text-[#32190D] transition-colors duration-200 shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[#D6A64B]"
      >
        Close &amp; Return to Shop
      </button>
    </div>
  );
}
