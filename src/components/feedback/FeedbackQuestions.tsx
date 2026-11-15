"use client";

import React from "react";
import { Sparkles, ThumbsUp, Smile, Meh, RefreshCw } from "lucide-react";
import { FeedbackRating } from "@/lib/validations";

interface QuestionConfig {
  id: "overallExperience" | "foodQuality" | "serviceExperience";
  title: string;
  subtitle: string;
}

const QUESTIONS: QuestionConfig[] = [
  {
    id: "overallExperience",
    title: "1. How was your overall experience with KRUMBISTRY?",
    subtitle: "Your overall impression of our bakery, atmosphere, and service",
  },
  {
    id: "foodQuality",
    title: "2. How would you rate the quality and freshness of our food?",
    subtitle: "Flavour balance, artisanal texture, freshness, and presentation",
  },
  {
    id: "serviceExperience",
    title: "3. How was your experience with our ordering and customer service?",
    subtitle: "Order ease, attentiveness, packaging, and staff communication",
  },
];

interface OptionConfig {
  value: FeedbackRating;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string;
}

const OPTIONS: OptionConfig[] = [
  { value: "Excellent", label: "Excellent", icon: Sparkles, tone: "text-[#D6A64B]" },
  { value: "Very Good", label: "Very Good", icon: ThumbsUp, tone: "text-[#2A7E4B]" },
  { value: "Good", label: "Good", icon: Smile, tone: "text-[#8C6219]" },
  { value: "Average", label: "Average", icon: Meh, tone: "text-[#B45309]" },
  { value: "Needs Improvement", label: "Needs Improvement", icon: RefreshCw, tone: "text-[#B91C1C]" },
];

interface FeedbackQuestionsProps {
  values: {
    overallExperience: FeedbackRating | "";
    foodQuality: FeedbackRating | "";
    serviceExperience: FeedbackRating | "";
  };
  errors?: Partial<Record<"overallExperience" | "foodQuality" | "serviceExperience", string>>;
  onChange: (field: "overallExperience" | "foodQuality" | "serviceExperience", value: FeedbackRating) => void;
}

export default function FeedbackQuestions({
  values,
  errors,
  onChange,
}: FeedbackQuestionsProps) {
  return (
    <div className="space-y-6">
      {QUESTIONS.map((q) => {
        const selectedValue = values[q.id];
        const errorMessage = errors?.[q.id];

        return (
          <div
            key={q.id}
            className={`p-4 rounded-xl border transition-all ${
              errorMessage
                ? "border-red-400/80 bg-red-50/40"
                : "border-[#32190D]/10 bg-white/70 hover:border-[#D6A64B]/40"
            }`}
          >
            <div className="mb-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-serif text-[15px] font-semibold text-[#32190D] leading-snug">
                  {q.title} <span className="text-[#D6A64B]">*</span>
                </h4>
              </div>
              <p className="text-xs text-[#806E5D] mt-0.5">{q.subtitle}</p>
            </div>

            {/* Accessible Radio Group */}
            <div
              role="radiogroup"
              aria-label={q.title}
              className="grid grid-cols-2 sm:grid-cols-5 gap-2"
            >
              {OPTIONS.map((opt) => {
                const isSelected = selectedValue === opt.value;
                const IconComponent = opt.icon;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => onChange(q.id, opt.value)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        onChange(q.id, opt.value);
                      }
                    }}
                    className={`group relative flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#D6A64B] ${
                      opt.value === "Needs Improvement" ? "col-span-2 sm:col-span-1" : ""
                    } ${
                      isSelected
                        ? "bg-[#32190D] text-[#F8F3E9] border-[#32190D] shadow-md shadow-[#32190D]/15 scale-[1.02]"
                        : "bg-[#F8F3E9]/60 text-[#32190D] border-[#32190D]/10 hover:border-[#D6A64B] hover:bg-[#F8F3E9]"
                    }`}
                  >
                    <IconComponent
                      size={18}
                      className={`mb-1 transition-transform group-hover:scale-110 ${
                        isSelected ? "text-[#D6A64B]" : opt.tone
                      }`}
                    />
                    <span className="text-xs font-medium tracking-tight">
                      {opt.label}
                    </span>

                    {/* Subtle dot indicator when selected */}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#D6A64B] rounded-full border-2 border-[#F8F3E9]" />
                    )}
                  </button>
                );
              })}
            </div>

            {errorMessage && (
              <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                <span>⚠</span> {errorMessage}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
