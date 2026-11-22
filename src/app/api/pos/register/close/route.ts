import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit } from "@/lib/posAuth";
import { z } from "zod";

const closeRegisterSchema = z.object({
  sessionId: z.string(),
  closingCash: z.number().min(0, "Counted cash cannot be negative"),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePosSession();
    const body = await request.json();
    const parsed = closeRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid closing payload." }, { status: 400 });
    }

    const { sessionId, closingCash, notes } = parsed.data;

    const registerSession = await db.posRegisterSession.findUnique({
      where: { id: sessionId },
    });

    if (!registerSession || registerSession.status !== "OPEN") {
      return NextResponse.json({ success: false, error: "Session is not active or not found." }, { status: 400 });
    }

    const expectedCash =
      Number(registerSession.openingCash) +
      Number(registerSession.cashSalesTotal) +
      Number(registerSession.cashInTotal) -
      Number(registerSession.cashOutTotal);

    const cashDifference = closingCash - expectedCash;

    const closed = await db.posRegisterSession.update({
      where: { id: sessionId },
      data: {
        closedAt: new Date(),
        closingCash,
        expectedCash,
        cashDifference,
        status: "CLOSED",
        notes: notes ? `${registerSession.notes || ""}\nClosing note: ${notes}` : registerSession.notes,
      },
    });

    await logAudit({
      action: "REGISTER_CLOSE",
      entity: "PosRegisterSession",
      entityId: sessionId,
      staffId: session.staffId,
      deviceId: registerSession.deviceId,
      details: {
        openingCash: Number(registerSession.openingCash),
        closingCash,
        expectedCash,
        cashDifference,
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        id: closed.id,
        closedAt: closed.closedAt?.toISOString(),
        openingCash: Number(closed.openingCash),
        closingCash: Number(closed.closingCash),
        expectedCash: Number(closed.expectedCash),
        cashDifference: Number(closed.cashDifference),
        cashSalesTotal: Number(closed.cashSalesTotal),
        cardSalesTotal: Number(closed.cardSalesTotal),
        otherSalesTotal: Number(closed.otherSalesTotal),
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
