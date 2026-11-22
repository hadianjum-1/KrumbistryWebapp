import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit } from "@/lib/posAuth";
import { z } from "zod";

// GET current active register session for current device
export async function GET(request: NextRequest) {
  try {
    const session = await requirePosSession();
    const { searchParams } = new URL(request.url);
    const deviceCode = searchParams.get("deviceCode") || session.deviceCode;

    const device = await db.device.findUnique({
      where: { deviceCode },
    });

    if (!device) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 });
    }

    const activeSession = await db.posRegisterSession.findFirst({
      where: {
        deviceId: device.id,
        status: "OPEN",
      },
      include: {
        staff: { select: { id: true, name: true, role: true } },
        cashMovements: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { openedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      hasActiveSession: !!activeSession,
      session: activeSession
        ? {
            id: activeSession.id,
            openedAt: activeSession.openedAt.toISOString(),
            openingCash: Number(activeSession.openingCash),
            cashSalesTotal: Number(activeSession.cashSalesTotal),
            cardSalesTotal: Number(activeSession.cardSalesTotal),
            otherSalesTotal: Number(activeSession.otherSalesTotal),
            cashInTotal: Number(activeSession.cashInTotal),
            cashOutTotal: Number(activeSession.cashOutTotal),
            cashSalesCount: activeSession.cashSalesCount,
            expectedCash:
              Number(activeSession.openingCash) +
              Number(activeSession.cashSalesTotal) +
              Number(activeSession.cashInTotal) -
              Number(activeSession.cashOutTotal),
            staff: activeSession.staff,
            cashMovements: activeSession.cashMovements.map((m) => ({
              id: m.id,
              type: m.type,
              amount: Number(m.amount),
              reason: m.reason,
              createdAt: m.createdAt.toISOString(),
            })),
          }
        : null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}

const openRegisterSchema = z.object({
  deviceCode: z.string(),
  openingCash: z.number().min(0, "Opening float cannot be negative"),
  notes: z.string().optional(),
});

// POST open register
export async function POST(request: NextRequest) {
  try {
    const session = await requirePosSession();
    const body = await request.json();
    const parsed = openRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid opening float." }, { status: 400 });
    }

    const { deviceCode, openingCash, notes } = parsed.data;

    const device = await db.device.findUnique({
      where: { deviceCode },
    });

    if (!device) {
      return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 });
    }

    // Check if session already open
    const existing = await db.posRegisterSession.findFirst({
      where: { deviceId: device.id, status: "OPEN" },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A register session is already open on this device. Close it first." },
        { status: 400 }
      );
    }

    const newSession = await db.posRegisterSession.create({
      data: {
        deviceId: device.id,
        staffId: session.staffId,
        openingCash,
        notes,
        status: "OPEN",
      },
    });

    await logAudit({
      action: "REGISTER_OPEN",
      entity: "PosRegisterSession",
      entityId: newSession.id,
      staffId: session.staffId,
      deviceId: device.id,
      details: { openingCash },
    });

    return NextResponse.json({ success: true, session: newSession }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
