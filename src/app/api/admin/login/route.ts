import { NextRequest, NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import { setAdminSessionCookie, verifyPassword } from "@/lib/auth";
import {
  checkAccountLock,
  recordFailedLogin,
  recordSuccessfulLogin,
} from "@/lib/adminSecurity";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = adminLoginSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email and password." },
        { status: 400 }
      );
    }

    const { email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if the account is currently locked due to 3 failed attempts
    const lockStatus = await checkAccountLock(normalizedEmail);
    if (lockStatus.locked) {
      return NextResponse.json(
        {
          success: false,
          error: `Account is temporarily locked due to 3 consecutive failed attempts. Please try again in ${lockStatus.remainingMinutes || 5} minute(s) or reset your password.`,
          locked: true,
          remainingSeconds: lockStatus.remainingSeconds,
          remainingMinutes: lockStatus.remainingMinutes,
        },
        { status: 423 } // 423 Locked
      );
    }

    let adminRecord = null;

    try {
      adminRecord = await db.admin.findUnique({
        where: { email: normalizedEmail },
      });
    } catch (e) {
      console.warn("Admin lookup database fallback:", e);
    }

    // 2. If database admin is found:
    if (adminRecord) {
      if (!adminRecord.active) {
        return NextResponse.json(
          { success: false, error: "This administrator account is disabled." },
          { status: 403 }
        );
      }

      const isValidPassword = await verifyPassword(password, adminRecord.passwordHash);
      if (!isValidPassword) {
        const failResult = await recordFailedLogin(normalizedEmail);
        if (failResult.locked) {
          return NextResponse.json(
            {
              success: false,
              error: "Account locked! You entered an incorrect password 3 times. For your security, this account is locked for 5 minutes. You can reset your password now.",
              locked: true,
              remainingSeconds: failResult.remainingSeconds,
              remainingMinutes: failResult.remainingMinutes,
            },
            { status: 423 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: `Invalid email or password. You have ${failResult.attemptsLeft} attempt(s) remaining before a 5-minute lockout.`,
            attemptsLeft: failResult.attemptsLeft,
          },
          { status: 401 }
        );
      }

      // Password is correct - reset failed attempts
      await recordSuccessfulLogin(normalizedEmail);

      // Update last login
      try {
        await db.admin.update({
          where: { id: adminRecord.id },
          data: { lastLoginAt: new Date() },
        });
      } catch {}

      await setAdminSessionCookie({
        adminId: adminRecord.id,
        email: adminRecord.email,
        name: adminRecord.name,
        role: adminRecord.role,
      });

      return NextResponse.json({
        success: true,
        admin: {
          id: adminRecord.id,
          email: adminRecord.email,
          name: adminRecord.name,
          role: adminRecord.role,
        },
      });
    }

    // 3. Default bootstrap admin fallback for initial setup before seed
    const defaultEmail = (process.env.ADMIN_EMAIL || "admin@krumbistry.com").toLowerCase();
    const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD || "Krumbistry@2026!";

    if (normalizedEmail === defaultEmail && password === defaultPassword) {
      await recordSuccessfulLogin(normalizedEmail);

      await setAdminSessionCookie({
        adminId: "bootstrap-superadmin",
        email: defaultEmail,
        name: "KRUMBISTRY Master Administrator",
        role: "SUPER_ADMIN",
      });

      return NextResponse.json({
        success: true,
        admin: {
          id: "bootstrap-superadmin",
          email: defaultEmail,
          name: "KRUMBISTRY Master Administrator",
          role: "SUPER_ADMIN",
        },
      });
    }

    // Failed login attempt for unknown or bootstrap
    const failResult = await recordFailedLogin(normalizedEmail);
    if (failResult.locked) {
      return NextResponse.json(
        {
          success: false,
          error: "Account locked! You entered an incorrect password 3 times. For your security, this account is locked for 5 minutes. You can reset your password now.",
          locked: true,
          remainingSeconds: failResult.remainingSeconds,
          remainingMinutes: failResult.remainingMinutes,
        },
        { status: 423 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Invalid email or password. You have ${failResult.attemptsLeft} attempt(s) remaining before a 5-minute lockout.`,
        attemptsLeft: failResult.attemptsLeft,
      },
      { status: 401 }
    );
  } catch (error: unknown) {
    console.error("POST /api/admin/login error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication service error." },
      { status: 500 }
    );
  }
}
