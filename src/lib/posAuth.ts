import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { StaffRole } from "@prisma/client";

const POS_COOKIE_NAME = "krumbistry_pos_session";
const POS_SESSION_DURATION = 60 * 60 * 12; // 12 hours shift duration

export interface PosStaffSession {
  staffId: string;
  name: string;
  role: StaffRole;
  deviceCode: string;
  expiresAt: number;
}

function getSecretKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    return "krumbistry-pos-default-secret-key-32b";
  }
  return secret;
}

/**
 * Sign POS token using HMAC-SHA256
 */
export function signPosToken(payload: object): string {
  const secret = getSecretKey();
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(base64Payload)
    .digest("base64url");

  return `${base64Payload}.${signature}`;
}

/**
 * Verify HMAC-SHA256 token
 */
export function verifyPosToken<T>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const secret = getSecretKey();

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(base64Payload)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(base64Payload, "base64url").toString("utf-8")
    );

    return payload as T;
  } catch {
    return null;
  }
}

/**
 * Set HTTP-Only POS session cookie
 */
export async function setPosSessionCookie(session: Omit<PosStaffSession, "expiresAt">) {
  const expiresAt = Math.floor(Date.now() / 1000) + POS_SESSION_DURATION;
  const payload: PosStaffSession = { ...session, expiresAt };
  const token = signPosToken(payload);

  const cookieStore = await cookies();
  cookieStore.set(POS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: POS_SESSION_DURATION,
  });

  return token;
}

/**
 * Clear POS session cookie
 */
export async function clearPosSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(POS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Get current POS Staff Session
 */
export async function getPosSession(): Promise<PosStaffSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(POS_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifyPosToken<PosStaffSession>(token);
    if (!session) return null;

    if (session.expiresAt < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Require valid POS session or throw
 */
export async function requirePosSession(allowedRoles?: StaffRole[]): Promise<PosStaffSession> {
  const session = await getPosSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

/**
 * Role-Based Permissions Map
 */
export const POS_PERMISSIONS = {
  USE_POS: ["OWNER", "MANAGER", "CASHIER"] as StaffRole[],
  COMPLETE_SALES: ["OWNER", "MANAGER", "CASHIER"] as StaffRole[],
  APPLY_DISCOUNT: ["OWNER", "MANAGER"] as StaffRole[],
  VIEW_ALL_SALES: ["OWNER", "MANAGER"] as StaffRole[],
  VIEW_REPORTS: ["OWNER", "MANAGER"] as StaffRole[],
  ADJUST_INVENTORY: ["OWNER", "MANAGER"] as StaffRole[],
  REFUND_SALES: ["OWNER", "MANAGER"] as StaffRole[],
  MANAGE_STAFF: ["OWNER"] as StaffRole[],
  REGISTER_DEVICE: ["OWNER", "MANAGER"] as StaffRole[],
  RESOLVE_CONFLICTS: ["OWNER", "MANAGER"] as StaffRole[],
};

export function canStaffPerform(role: StaffRole, action: keyof typeof POS_PERMISSIONS): boolean {
  return POS_PERMISSIONS[action].includes(role);
}

/**
 * Audit Logger
 */
export async function logAudit({
  action,
  entity,
  entityId,
  staffId,
  deviceId,
  details,
}: {
  action: string;
  entity: string;
  entityId?: string;
  staffId?: string;
  deviceId?: string;
  details?: Record<string, unknown> | string;
}) {
  try {
    const detailsStr = typeof details === "object" ? JSON.stringify(details) : details;
    await db.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        staffId,
        deviceId,
        details: detailsStr,
      },
    });
  } catch (err) {
    console.warn("Audit log creation non-fatal error:", err);
  }
}

/**
 * Hash PIN
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin.trim(), 10);
}

/**
 * Verify PIN
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin.trim(), hash);
}
