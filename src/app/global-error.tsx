"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F3E9] text-[#32190D] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-serif font-medium mb-3">Something went wrong</h1>
          <p className="text-xs text-[#806E5D] mb-6">
            A critical error occurred. Please refresh the page to continue.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-3 bg-[#32190D] text-[#F8F3E9] text-xs font-bold rounded-sm uppercase tracking-wider"
          >
            Refresh
          </button>
        </div>
      </body>
    </html>
  );
}

