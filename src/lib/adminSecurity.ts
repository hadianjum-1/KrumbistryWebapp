import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  sendAdminPasswordResetCodeEmail,
  sendAdminPasswordResetConfirmationEmail,
} from "@/lib/email";

// Security Constraints
export const MAX_FAILED_ATTEMPTS = 3;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
export const RESET_CODE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null; // Unix timestamp ms
}

interface ResetCodeState {
  codeHash: string;
  expiresAt: number; // Unix timestamp ms
}

// In-memory security caches for sub-millisecond defense
const lockoutCache = new Map<string, LockoutState>();
const resetCodeCache = new Map<string, ResetCodeState>();

function normalize(email: string): string {
  return email.toLowerCase().trim();
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

/**
 * Retrieve current lockout state from memory or persistent store
 */
async function getLockoutState(email: string): Promise<LockoutState> {
  const norm = normalize(email);
  if (lockoutCache.has(norm)) {
    return lockoutCache.get(norm)!;
  }

  try {
    const key = `auth_sec_lock_${norm}`;
    const record = await db.siteSetting.findUnique({ where: { key } });
    if (record) {
      const parsed = JSON.parse(record.value) as LockoutState;
      lockoutCache.set(norm, parsed);
      return parsed;
    }
  } catch (err) {
    console.warn("getLockoutState persistent fallback:", err);
  }

  const initial: LockoutState = { failedAttempts: 0, lockedUntil: null };
  lockoutCache.set(norm, initial);
  return initial;
}

/**
 * Save lockout state to memory and persistent store
 */
async function saveLockoutState(email: string, state: LockoutState): Promise<void> {
  const norm = normalize(email);
  lockoutCache.set(norm, state);

  try {
    const key = `auth_sec_lock_${norm}`;
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: JSON.stringify(state) },
      update: { value: JSON.stringify(state) },
    });
  } catch (err) {
    console.warn("saveLockoutState persistent fallback:", err);
  }
}

/**
 * Check if the given email account is currently locked
 */
export async function checkAccountLock(email: string): Promise<{
  locked: boolean;
  remainingMinutes?: number;
  remainingSeconds?: number;
}> {
  const state = await getLockoutState(email);
  const now = Date.now();

  if (state.lockedUntil && state.lockedUntil > now) {
    const diffMs = state.lockedUntil - now;
    const remainingSeconds = Math.ceil(diffMs / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    return {
      locked: true,
      remainingMinutes,
      remainingSeconds,
    };
  }

  // If lockout duration has expired, automatically unlock
  if (state.lockedUntil && state.lockedUntil <= now) {
    await saveLockoutState(email, { failedAttempts: 0, lockedUntil: null });
  }

  return { locked: false };
}

/**
 * Record a failed password attempt.
 * Locks account for 5 minutes when 3 failed attempts are reached.
 */
export async function recordFailedLogin(email: string): Promise<{
  locked: boolean;
  remainingMinutes?: number;
  remainingSeconds?: number;
  attemptsLeft: number;
}> {
  const state = await getLockoutState(email);
  const now = Date.now();

  // If already locked, calculate remaining
  if (state.lockedUntil && state.lockedUntil > now) {
    const diffMs = state.lockedUntil - now;
    const remainingSeconds = Math.ceil(diffMs / 1000);
    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return {
      locked: true,
      remainingMinutes,
      remainingSeconds,
      attemptsLeft: 0,
    };
  }

  const nextAttempts = state.failedAttempts + 1;

  if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    await saveLockoutState(email, {
      failedAttempts: nextAttempts,
      lockedUntil,
    });

    return {
      locked: true,
      remainingMinutes: 5,
      remainingSeconds: 300,
      attemptsLeft: 0,
    };
  }

  await saveLockoutState(email, {
    failedAttempts: nextAttempts,
    lockedUntil: null,
  });

  return {
    locked: false,
    attemptsLeft: MAX_FAILED_ATTEMPTS - nextAttempts,
  };
}

/**
 * Clear lockout state and reset failed attempts on successful login
 */
export async function recordSuccessfulLogin(email: string): Promise<void> {
  await saveLockoutState(email, { failedAttempts: 0, lockedUntil: null });
}

/**
 * Generate a 6-digit OTP verification code and dispatch it to the admin email
 */
export async function createPasswordResetCode(email: string): Promise<{
  success: boolean;
  code?: string;
  expiresAt?: Date;
  error?: string;
}> {
  const norm = normalize(email);

  // Verify that an admin exists with this email
  let adminExists = false;
  try {
    const admin = await db.admin.findUnique({ where: { email: norm } });
    if (admin) adminExists = true;
  } catch (e) {
    console.warn("createPasswordResetCode admin lookup fallback:", e);
  }

  const defaultAdmin = (process.env.ADMIN_EMAIL || "admin@krumbistry.com").toLowerCase();
  if (norm === defaultAdmin) {
    adminExists = true;
  }

  if (!adminExists) {
    return {
      success: false,
      error: "No administrator account found with this email address.",
    };
  }

  // Generate cryptographically secure 6-digit numeric code
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = hashCode(code);
  const now = Date.now();
  const expiresAtMs = now + RESET_CODE_EXPIRATION_MS;
  const expiresAt = new Date(expiresAtMs);

  const resetState: ResetCodeState = {
    codeHash,
    expiresAt: expiresAtMs,
  };

  resetCodeCache.set(norm, resetState);

  try {
    const key = `auth_sec_reset_${norm}`;
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: JSON.stringify(resetState) },
      update: { value: JSON.stringify(resetState) },
    });
  } catch (err) {
    console.warn("createPasswordResetCode persistent fallback:", err);
  }

  // Send the code to admin email
  await sendAdminPasswordResetCodeEmail({
    to: norm,
    code,
    expiresMinutes: 10,
  });

  return {
    success: true,
    code, // Returned for dev simulation if needed
    expiresAt,
  };
}

/**
 * Validate the 6-digit OTP code, update the admin password, unlock the account, and notify
 */
export async function verifyAndResetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const norm = normalize(email);

  if (!code || code.trim().length !== 6) {
    return { success: false, error: "Please enter the complete 6-digit verification code." };
  }

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters long." };
  }

  // Retrieve stored reset state
  let resetState = resetCodeCache.get(norm);
  if (!resetState) {
    try {
      const key = `auth_sec_reset_${norm}`;
      const record = await db.siteSetting.findUnique({ where: { key } });
      if (record) {
        resetState = JSON.parse(record.value) as ResetCodeState;
      }
    } catch {}
  }

  if (!resetState) {
    return {
      success: false,
      error: "No active password reset request found. Please request a new code.",
    };
  }

  // Check code expiration
  const now = Date.now();
  if (now > resetState.expiresAt) {
    resetCodeCache.delete(norm);
    return {
      success: false,
      error: "Verification code has expired. Please request a new code.",
    };
  }

  // Compare code hash securely
  const inputHash = hashCode(code);
  if (inputHash !== resetState.codeHash) {
    return {
      success: false,
      error: "Invalid verification code. Please check your email and try again.",
    };
  }

  // Code is verified! Hash the new password with bcrypt
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Update in database
  try {
    const existingAdmin = await db.admin.findUnique({ where: { email: norm } });
    if (existingAdmin) {
      await db.admin.update({
        where: { id: existingAdmin.id },
        data: { passwordHash },
      });
    } else {
      // If admin record did not exist yet in DB (e.g. bootstrap admin), create it
      await db.admin.create({
        data: {
          email: norm,
          name: "KRUMBISTRY Master Administrator",
          passwordHash,
          role: "SUPER_ADMIN",
          active: true,
        },
      });
    }
  } catch (err: unknown) {
    console.error("Database password update error:", err);
    return {
      success: false,
      error: "Failed to update password in database. Please try again.",
    };
  }

  // Clear reset code and reset lockout
  resetCodeCache.delete(norm);
  try {
    await db.siteSetting.deleteMany({
      where: {
        key: { in: [`auth_sec_reset_${norm}`, `auth_sec_lock_${norm}`] },
      },
    });
  } catch {}

  await recordSuccessfulLogin(norm);

  // Send confirmation email to admin
  await sendAdminPasswordResetConfirmationEmail({ to: norm });

  return { success: true };
}

