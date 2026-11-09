import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "krumbistry_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface AdminSession {
  adminId: string;
  email: string;
  role: string;
  name: string;
  expiresAt: number;
}

function getSecretKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    // Deterministic fallback for dev only; production requires AUTH_SECRET in env
    return "krumbistry-default-development-secret-key-32b";
  }
  return secret;
}

/**
 * Sign data payload with HMAC-SHA256
 */
export function signToken(payload: object): string {
  const secret = getSecretKey();
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(base64Payload)
    .digest("base64url");

  return `${base64Payload}.${signature}`;
}

/**
 * Verify and unpack HMAC-SHA256 signed token
 */
export function verifyToken<T>(token: string): T | null {
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
 * Password hash verification
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash password with bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Create admin session cookie
 */
export async function setAdminSessionCookie(session: Omit<AdminSession, "expiresAt">) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload: AdminSession = { ...session, expiresAt };
  const token = signToken(payload);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  return token;
}

/**
 * Clear session cookie on logout
 */
export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Retrieve verified admin session from HTTP-only cookie
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifyToken<AdminSession>(token);
    if (!session) return null;

    if (session.expiresAt < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Guard utility for Route Handlers and Server Actions
 */
export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
