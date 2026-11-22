import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const requestOrigin = new URL(request.url).origin;

    if (origin !== requestOrigin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 }
      );
    }

    const { password } = await request.json();

    const expectedPassword = process.env.OWNER_PREVIEW_PASSWORD;
    const jwtSecret = process.env.OWNER_PREVIEW_JWT_SECRET;

    if (!expectedPassword || !jwtSecret) {
      return NextResponse.json(
        { error: "Preview access is not configured." },
        { status: 500 }
      );
    }

    if (
      typeof password !== "string" ||
      password.length > 256
    ) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 400 }
      );
    }

    const submitted = Buffer.from(password);
    const expected = Buffer.from(expectedPassword);

    const valid =
      submitted.length === expected.length &&
      timingSafeEqual(submitted, expected);

    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect preview password." },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new SignJWT({
      scope: "krumbistry-owner-preview",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(secret);

    const response = NextResponse.json({ success: true });

    response.cookies.set("krumbistry_owner_preview", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to verify preview access." },
      { status: 500 }
    );
  }
}