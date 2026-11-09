"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error cleanly
    console.error("App boundary error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] bg-[#F8F3E9] text-[#32190D] flex items-center justify-center py-20 px-6">
      <div className="max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-700 grid place-items-center mx-auto mb-5">
          <AlertCircle size={28} />
        </div>
        <h1 className="font-serif text-3xl font-medium mb-3">Something went wrong</h1>
        <p className="text-xs text-[#806E5D] leading-relaxed mb-6">
          We encountered a minor hiccup while preparing this page. Please try refreshing or return to the main menu.
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="button button-dark text-xs flex items-center gap-2"
          >
            <RefreshCw size={14} /> Try Again
          </button>
          <Link href="/" className="button button-outline text-xs">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

