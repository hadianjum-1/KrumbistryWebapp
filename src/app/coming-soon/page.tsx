"use client";

import { FormEvent, useState } from "react";

export default function ComingSoonPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/owner-preview/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to access preview.");
        return;
      }

      window.location.replace("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F3E9] px-5 py-12 text-[#32190D]">
      <div className="w-full max-w-xl text-center">
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-[#A77B32]">
          KRUMBISTRY Bake Shop
        </p>

        <h1 className="font-serif text-5xl sm:text-7xl">
          Something Sweet
          <br />
          Is Coming.
        </h1>

        <p className="mx-auto mt-6 max-w-md text-base leading-7 text-[#765C4C]">
          We are preparing something special for you.
          Our website will be opening soon.
          Thank you for your patience.
        </p>

        <div className="mx-auto mt-12 max-w-sm border-t border-[#D6C7AE] pt-8">
          <h2 className="font-serif text-2xl">
            Are you the owner?
          </h2>

          <p className="mt-2 text-sm text-[#765C4C]">
            Enter your private access password to preview the website.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter preview password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-[#D6C7AE] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#A77B32]"
            />

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-md bg-[#32190D] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#4A2818] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Preview Website"}
            </button>
          </form>

          <p className="mt-5 text-xs text-[#927B68]">
            Private owner access only.
          </p>
        </div>
      </div>
    </main>
  );
}