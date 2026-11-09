"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

type AuthMode = "login" | "forgot_request" | "forgot_verify";

export default function AdminLoginPage() {
  const router = useRouter();

  // Mode state
  const [mode, setMode] = useState<AuthMode>("login");

  // Login form state
  const [email, setEmail] = useState("admin@krumbistry.com");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemainingMinutes, setLockRemainingMinutes] = useState<number | null>(null);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("admin@krumbistry.com");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // --- 1. Handle Standard Login ---
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 423 || data.locked) {
          setIsLocked(true);
          setLockRemainingMinutes(data.remainingMinutes || 5);
        }
        throw new Error(data.error || "Invalid administrator credentials");
      }

      // Successful login - redirect to dashboard overview
      setIsLocked(false);
      router.push("/admin");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Request Password Reset Code ---
  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);
    setResetLoading(true);

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send reset code");
      }

      setResetSuccess(data.message);
      setMode("forgot_verify");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not send verification code";
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  // --- 3. Verify Code and Reset Password ---
  const handleVerifyAndReset = async (e: FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (newPassword.length < 8) {
      setResetError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match. Please re-enter.");
      return;
    }

    setResetLoading(true);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reset password");
      }

      // Reset state and transition back to login
      setIsLocked(false);
      setPassword("");
      setResetSuccess("Password successfully updated and account unlocked! You can now log in.");
      setMode("login");
      setEmail(resetEmail);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed";
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F3E9] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#D6A64B]/30 selection:text-[#32190D]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-2xl bg-white shadow-md border border-[#32190D]/10 ring-4 ring-[#D6A64B]/20 inline-flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="KRUMBISTRY Logo"
              width={72}
              height={72}
              className="h-16 w-auto object-contain"
              style={{ width: "auto", height: "auto" }}
              priority
            />
          </div>
        </div>

        <h1 className="font-serif text-3xl font-semibold tracking-wide text-[#32190D]">
          KRUMBISTRY
        </h1>
        <p className="text-xs uppercase tracking-[0.25em] text-[#D6A64B] font-semibold mt-1">
          Bake Shop · Administration Portal
        </p>
        <p className="text-sm text-[#32190D]/70 mt-2">
          {mode === "login"
            ? "Secure portal for bakery management and order fulfillment"
            : "Administrator Security & Credentials Recovery"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white border border-[#32190D]/10 rounded-2xl shadow-xl p-8 sm:p-10">
          {/* ========================================================= */}
          {/* VIEW 1: STANDARD ADMIN LOGIN                              */}
          {/* ========================================================= */}
          {mode === "login" && (
            <>
              {/* Account Lockout Alert */}
              {isLocked && (
                <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-900 animate-in fade-in space-y-2">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert size={18} className="shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-amber-950">Account Temporarily Locked</p>
                      <p className="mt-0.5 text-amber-800 leading-relaxed">
                        Too many incorrect password attempts (3 failed tries). For security, this account is locked for{" "}
                        <strong>{lockRemainingMinutes || 5} minutes</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-amber-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot_request");
                        setResetError(null);
                        setResetSuccess(null);
                      }}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#8C6219] hover:text-[#52370B] hover:underline cursor-pointer"
                    >
                      <KeyRound size={13} />
                      <span>Reset Password & Unlock Account Immediately →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* General Login Error */}
              {errorMessage && !isLocked && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 animate-in fade-in">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <p className="font-medium">Authentication Failed</p>
                    <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Password Reset Success Alert */}
              {resetSuccess && (
                <div className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 animate-in fade-in">
                  <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-xs">{resetSuccess}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]"
                  >
                    Admin Email Address
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#32190D]/40">
                      <Mail size={16} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@krumbistry.com"
                      className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-10 pr-4 py-2.5 text-sm text-[#32190D] placeholder:text-[#32190D]/40 focus:border-[#D6A64B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A64B]/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setResetError(null);
                        setResetSuccess(null);
                        setMode("forgot_request");
                      }}
                      className="text-xs font-semibold text-[#8C6219] hover:text-[#32190D] transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#32190D]/40">
                      <Lock size={16} />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-10 pr-4 py-2.5 text-sm text-[#32190D] placeholder:text-[#32190D]/40 focus:border-[#D6A64B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A64B]/20 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#32190D] px-4 py-3 text-sm font-semibold tracking-wide text-white hover:bg-[#432314] active:bg-[#201008] transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-[#D6A64B]" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Admin Dashboard</span>
                        <ArrowRight size={16} className="text-[#D6A64B]" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Demo Credentials Info Box */}
              <div className="mt-8 pt-6 border-t border-[#32190D]/10">
                <div className="rounded-xl bg-[#F8F3E9] p-4 text-xs text-[#32190D]/80 space-y-1.5 border border-[#D6A64B]/30">
                  <div className="flex items-center gap-1.5 font-semibold text-[#32190D]">
                    <ShieldCheck size={14} className="text-[#D6A64B]" />
                    <span>Admin Security Standard</span>
                  </div>
                  <p className="text-[11px] text-[#705F52]">
                    Accounts auto-lock for 5 minutes upon 3 failed attempts. Reset verification codes are dispatched to <strong>admin@krumbistry.com</strong>.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: REQUEST PASSWORD RESET CODE                       */}
          {/* ========================================================= */}
          {mode === "forgot_request" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="pb-2 border-b border-[#32190D]/10">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setResetError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#806E5D] hover:text-[#32190D] transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft size={14} />
                  <span>Back to login</span>
                </button>
                <h2 className="font-serif text-xl font-bold text-[#32190D]">
                  Reset Administrator Password
                </h2>
                <p className="text-xs text-[#806E5D] mt-1 leading-relaxed">
                  Enter your administrator email below. We will send a secure 6-digit one-time code to authorize resetting your credentials.
                </p>
              </div>

              {resetError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <span>{resetError}</span>
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label
                    htmlFor="resetEmail"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]"
                  >
                    Admin Email Address
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#32190D]/40">
                      <Mail size={16} />
                    </div>
                    <input
                      id="resetEmail"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="admin@krumbistry.com"
                      className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-10 pr-4 py-2.5 text-sm text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#32190D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#432314] transition-colors disabled:opacity-70 cursor-pointer shadow-md"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#D6A64B]" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send 6-Digit Verification Code</span>
                      <ArrowRight size={16} className="text-[#D6A64B]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: ENTER CODE & SET NEW PASSWORD                     */}
          {/* ========================================================= */}
          {mode === "forgot_verify" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="pb-2 border-b border-[#32190D]/10">
                <button
                  type="button"
                  onClick={() => setMode("forgot_request")}
                  className="inline-flex items-center gap-1.5 text-xs text-[#806E5D] hover:text-[#32190D] transition-colors cursor-pointer mb-2"
                >
                  <ArrowLeft size={14} />
                  <span>Change email</span>
                </button>
                <h2 className="font-serif text-xl font-bold text-[#32190D]">
                  Enter Verification Code
                </h2>
                <p className="text-xs text-[#806E5D] mt-1 leading-relaxed">
                  A 6-digit code was dispatched to <strong>{resetEmail}</strong> (expires in 10 minutes).
                </p>
              </div>

              {resetError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <form onSubmit={handleVerifyAndReset} className="space-y-4">
                <div>
                  <label
                    htmlFor="resetCode"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]"
                  >
                    6-Digit Security Code *
                  </label>
                  <input
                    id="resetCode"
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="mt-2 w-full text-center font-mono text-xl tracking-[0.4em] font-bold rounded-lg border border-[#32190D]/20 bg-[#F8F3E9]/50 py-3 text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]"
                  >
                    New Password * (Min 8 characters)
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="mt-2 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2.5 text-sm text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]"
                  >
                    Confirm New Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="mt-2 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2.5 text-sm text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#32190D] px-4 py-3 text-sm font-semibold text-white hover:bg-[#432314] transition-colors disabled:opacity-70 cursor-pointer shadow-md"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#D6A64B]" />
                      <span>Updating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password & Unlock Account</span>
                      <KeyRound size={16} className="text-[#D6A64B]" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={resetLoading}
                    className="inline-flex items-center gap-1.5 text-xs text-[#806E5D] hover:text-[#32190D] transition-colors cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Did not receive code? Resend code</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-xs font-medium text-[#32190D]/60 hover:text-[#32190D] transition-colors"
          >
            ← Return to KRUMBISTRY Public Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
