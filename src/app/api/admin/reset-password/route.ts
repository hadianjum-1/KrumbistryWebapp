import { NextRequest, NextResponse } from "next/server";
import { verifyAndResetPassword } from "@/lib/adminSecurity";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const email = typeof json.email === "string" ? json.email.toLowerCase().trim() : "";
    const code = typeof json.code === "string" ? json.code.trim() : "";
    const newPassword = typeof json.newPassword === "string" ? json.newPassword : "";

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Please provide the complete 6-digit verification code." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const result = await verifyAndResetPassword(email, code, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Password reset failed." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated and your account is unlocked! You can now log in.",
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/reset-password error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during password reset." },
      { status: 500 }
    );
  }
}

