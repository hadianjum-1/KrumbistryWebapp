import { NextResponse } from "next/server";
import { getPosSession } from "@/lib/posAuth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getPosSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // Fetch fresh staff and device status
  const staff = await db.staff.findUnique({
    where: { id: session.staffId },
    select: { id: true, name: true, role: true, email: true, active: true },
  });

  const device = await db.device.findUnique({
    where: { deviceCode: session.deviceCode },
    select: { id: true, deviceCode: true, name: true, branch: true, status: true, allowOffline: true },
  });

  if (!staff || !staff.active || !device || device.status === "REVOKED") {
    return NextResponse.json({ authenticated: false, error: "Access revoked" }, { status: 403 });
  }

  return NextResponse.json({
    authenticated: true,
    staff,
    device,
  });
}
