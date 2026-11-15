"use client";

import React, { useState } from "react";
import { MessageSquareQuote } from "lucide-react";
import FeedbackModal from "./FeedbackModal";

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Trigger Button: Docked on right for desktop, floating pill on mobile */}
      <div className="fixed right-0 top-[58%] -translate-y-1/2 z-40 hidden md:block">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Share Feedback with KRUMBISTRY"
          className="group relative flex items-center gap-2.5 pl-3 pr-2.5 py-4 rounded-l-2xl bg-[#32190D] text-[#F8F3E9] border-y border-l border-[#D6A64B]/50 shadow-2xl shadow-[#32190D]/30 hover:-translate-x-1.5 transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#D6A64B]"
        >
          {/* Subtle gold accent indicator */}
          <div className="w-7 h-7 rounded-full bg-[#D6A64B]/20 border border-[#D6A64B]/60 flex items-center justify-center text-[#D6A64B] group-hover:scale-110 group-hover:bg-[#D6A64B] group-hover:text-[#32190D] transition-all duration-300">
            <MessageSquareQuote size={15} />
          </div>

          {/* Vertical Label */}
          <span className="[writing-mode:vertical-rl] rotate-180 font-sans text-xs font-semibold tracking-widest uppercase text-[#F8F3E9] group-hover:text-[#D6A64B] transition-colors py-1 select-none">
            Share Feedback
          </span>

          {/* Tiny pulsing gold dot */}
          <span className="w-1.5 h-1.5 rounded-full bg-[#D6A64B] animate-pulse" />
        </button>
      </div>

      {/* Mobile Floating Trigger Button */}
      <div className="fixed bottom-5 right-4 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label="Share Feedback with KRUMBISTRY"
          className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#32190D] text-[#F8F3E9] border border-[#D6A64B]/60 shadow-xl shadow-[#32190D]/30 active:scale-95 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#D6A64B]"
        >
          <div className="w-5 h-5 rounded-full bg-[#D6A64B]/20 flex items-center justify-center text-[#D6A64B]">
            <MessageSquareQuote size={13} />
          </div>
          <span className="font-sans text-xs font-semibold tracking-wider uppercase text-[#F8F3E9]">
            Share Feedback
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D6A64B] animate-pulse" />
        </button>
      </div>

      {/* The Feedback Modal */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
