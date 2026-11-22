import { NextResponse } from "next/server";
import { clearPosSessionCookie, getPosSession, logAudit } from "@/lib/posAuth";

export async function POST() {
  const session = await getPosSession();
  if (session) {
    await logAudit({
      action: "POS_LOGOUT",
      entity: "Staff",
      entityId: session.staffId,
      staffId: session.staffId,
      details: { deviceCode: session.deviceCode },
    });
  }

  await clearPosSessionCookie();
  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
