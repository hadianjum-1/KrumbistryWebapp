import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetCode } from "@/lib/adminSecurity";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const email = typeof json.email === "string" ? json.email.toLowerCase().trim() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid administrator email address." },
        { status: 400 }
      );
    }

    const result = await createPasswordResetCode(email);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Unable to process password reset." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${email}. The code expires in 10 minutes.`,
      expiresAt: result.expiresAt,
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/forgot-password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reset code. Please try again." },
      { status: 500 }
    );
  }
}

