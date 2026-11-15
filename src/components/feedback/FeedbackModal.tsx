"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Loader2, Sparkles, Shield, AlertCircle } from "lucide-react";
import FeedbackQuestions from "./FeedbackQuestions";
import FeedbackSuccess from "./FeedbackSuccess";
import { FeedbackRating } from "@/lib/validations";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  overallExperience: FeedbackRating | "";
  foodQuality: FeedbackRating | "";
  serviceExperience: FeedbackRating | "";
  fullName: string;
  email: string;
  comments: string;
  honeypot: string;
}

const INITIAL_FORM_STATE: FormState = {
  overallExperience: "",
  foodQuality: "",
  serviceExperience: "",
  fullName: "",
  email: "",
  comments: "",
  honeypot: "",
};

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Close on ESC key and prevent body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRatingChange = (
    field: "overallExperience" | "foodQuality" | "serviceExperience",
    value: FeedbackRating
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    setSubmitError(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.overallExperience) {
      newErrors.overallExperience = "Please select your overall experience rating";
    }
    if (!form.foodQuality) {
      newErrors.foodQuality = "Please rate the quality and freshness of our food";
    }
    if (!form.serviceExperience) {
      newErrors.serviceExperience = "Please rate your customer service experience";
    }

    if (!form.fullName.trim()) {
      newErrors.fullName = "Please enter your full name";
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Please enter your email address";
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (form.comments.length > 1000) {
      newErrors.comments = "Comments cannot exceed 1,000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          overallExperience: form.overallExperience,
          foodQuality: form.foodQuality,
          serviceExperience: form.serviceExperience,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          comments: form.comments.trim(),
          honeypot: form.honeypot,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error || "We were unable to record your feedback. Please try again."
        );
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setIsSubmitted(false);
      setForm(INITIAL_FORM_STATE);
      setErrors({});
      setSubmitError(null);
    }, 250);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#32190D]/60 backdrop-blur-sm transition-all duration-300 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleModalClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl bg-[#F8F3E9] text-[#32190D] border border-[#D6A64B]/40 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Bar */}
        <div className="relative bg-[#32190D] text-[#F8F3E9] px-6 py-6 border-b border-[#D6A64B]/30">
          {/* Close Button */}
          <button
            type="button"
            onClick={handleModalClose}
            aria-label="Close feedback form"
            className="absolute top-5 right-5 p-2 rounded-full text-[#F8F3E9]/80 hover:text-[#D6A64B] hover:bg-white/10 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#D6A64B]"
          >
            <X size={20} />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6A64B]/20 text-[#D6A64B] text-[11px] font-semibold tracking-widest uppercase mb-2">
            <Sparkles size={12} className="text-[#D6A64B]" />
            GUEST EXPERIENCE
          </div>

          <h2
            id="feedback-heading"
            className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#F8F3E9]"
          >
            We&apos;d Love Your Feedback
          </h2>

          <p className="text-xs sm:text-sm text-[#D2C1AD] mt-1 max-w-lg leading-relaxed">
            Your experience matters to us. Help us make every bite even better.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 max-h-[75vh] overflow-y-auto">
          {isSubmitted ? (
            <FeedbackSuccess
              onClose={handleModalClose}
              customerName={form.fullName.trim()}
            />
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {submitError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in"
                >
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                  <div className="leading-relaxed">{submitError}</div>
                </div>
              )}

              {/* Honeypot field (hidden from screen reader & real users) */}
              <div className="sr-only" aria-hidden="true">
                <label htmlFor="fb-honeypot">Leave blank</label>
                <input
                  id="fb-honeypot"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.honeypot}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, honeypot: e.target.value }))
                  }
                />
              </div>

              {/* Section 1: The Three Rating Questions */}
              <div>
                <FeedbackQuestions
                  values={{
                    overallExperience: form.overallExperience,
                    foodQuality: form.foodQuality,
                    serviceExperience: form.serviceExperience,
                  }}
                  errors={{
                    overallExperience: errors.overallExperience,
                    foodQuality: errors.foodQuality,
                    serviceExperience: errors.serviceExperience,
                  }}
                  onChange={handleRatingChange}
                />
              </div>

              {/* Section 2: Customer Details & Comments */}
              <div className="p-4 sm:p-5 rounded-xl border border-[#32190D]/10 bg-white/70 space-y-4">
                <div className="border-b border-[#32190D]/10 pb-2 mb-3">
                  <h4 className="font-serif text-base font-semibold text-[#32190D]">
                    Customer Details &amp; Suggestions
                  </h4>
                  <p className="text-xs text-[#806E5D]">
                    Please share your name and email so we can follow up with you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fb-fullname"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#32190D] mb-1.5"
                    >
                      Full Name <span className="text-[#D6A64B]">*</span>
                    </label>
                    <input
                      id="fb-fullname"
                      type="text"
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, fullName: e.target.value }));
                        if (errors.fullName) {
                          setErrors((prev) => {
                            const u = { ...prev };
                            delete u.fullName;
                            return u;
                          });
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#32190D] bg-white outline-none transition-all placeholder:text-[#806E5D]/60 focus:border-[#D6A64B] focus:ring-2 focus:ring-[#D6A64B]/20 ${
                        errors.fullName ? "border-red-400 bg-red-50/20" : "border-[#32190D]/20"
                      }`}
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-red-600 font-medium">
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label
                      htmlFor="fb-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#32190D] mb-1.5"
                    >
                      Email Address <span className="text-[#D6A64B]">*</span>
                    </label>
                    <input
                      id="fb-email"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, email: e.target.value }));
                        if (errors.email) {
                          setErrors((prev) => {
                            const u = { ...prev };
                            delete u.email;
                            return u;
                          });
                        }
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#32190D] bg-white outline-none transition-all placeholder:text-[#806E5D]/60 focus:border-[#D6A64B] focus:ring-2 focus:ring-[#D6A64B]/20 ${
                        errors.email ? "border-red-400 bg-red-50/20" : "border-[#32190D]/20"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600 font-medium">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Additional Comments */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="fb-comments"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]"
                    >
                      Additional Comments / Suggestions{" "}
                      <span className="text-[#806E5D] font-normal lowercase">(optional)</span>
                    </label>
                    <span
                      className={`text-[11px] ${
                        form.comments.length > 950 ? "text-amber-600 font-bold" : "text-[#806E5D]"
                      }`}
                    >
                      {form.comments.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="fb-comments"
                    rows={3}
                    maxLength={1000}
                    placeholder="Tell us what we can improve..."
                    value={form.comments}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, comments: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#32190D]/20 text-sm text-[#32190D] bg-white outline-none transition-all placeholder:text-[#806E5D]/60 focus:border-[#D6A64B] focus:ring-2 focus:ring-[#D6A64B]/20 resize-y min-h-[80px]"
                  />
                  {errors.comments && (
                    <p className="mt-1 text-xs text-red-600 font-medium">
                      {errors.comments}
                    </p>
                  )}
                </div>

                {/* Privacy note */}
                <div className="flex items-start gap-2 pt-1">
                  <Shield size={14} className="text-[#D6A64B] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#806E5D] leading-tight">
                    Your information will only be used to respond to your feedback and improve our service.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#32190D]/20 text-[#32190D] text-xs font-semibold hover:bg-[#32190D]/5 transition-colors duration-150 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-[#32190D] text-[#F8F3E9] text-xs font-semibold uppercase tracking-wider hover:bg-[#D6A64B] hover:text-[#32190D] transition-all duration-200 shadow-md shadow-[#32190D]/10 disabled:opacity-60 disabled:cursor-not-allowed outline-none focus-visible:ring-2 focus-visible:ring-[#D6A64B]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin text-[#D6A64B]" />
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
