import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    admin: {
      id: session.adminId,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}

