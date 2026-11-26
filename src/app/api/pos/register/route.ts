import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit } from "@/lib/posAuth";
import { z } from "zod";

// Helper to reliably find or provision device
async function getOrProvisionDevice(deviceCode: string) {
  const cleanCode = (deviceCode || "").trim() || "POS-01";
  let device = await db.device.findUnique({
    where: { deviceCode: cleanCode },
  });

  if (!device) {
    device = await db.device.findFirst({
      where: {
        OR: [
          { deviceCode: { equals: cleanCode, mode: "insensitive" } },
          { status: "AUTHORIZED" },
        ],
      },
    });
  }

  if (!device) {
    device = await db.device.create({
      data: {
        deviceCode: cleanCode,
        name: cleanCode.toUpperCase().includes("POS") ? cleanCode : `Terminal ${cleanCode}`,
        branch: "Main Bakery",
        status: "AUTHORIZED",
        allowOffline: true,
        secretTokenHash: "auto-provisioned",
      },
    });
  }

  return device;
}

// GET current active register session for current device
export async function GET(request: NextRequest) {
  try {
    let session = null;
    try {
      session = await requirePosSession();
    } catch {
      // Allow read-only register status check
    }

    const { searchParams } = new URL(request.url);
    const rawDeviceCode = searchParams.get("deviceCode") || session?.deviceCode || "POS-01";
    const device = await getOrProvisionDevice(rawDeviceCode);

    let activeSession = await db.posRegisterSession.findFirst({
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

    // Fallback: check any open register session across the shop
    if (!activeSession) {
      activeSession = await db.posRegisterSession.findFirst({
        where: { status: "OPEN" },
        include: {
          staff: { select: { id: true, name: true, role: true } },
          cashMovements: { orderBy: { createdAt: "desc" } },
        },
        orderBy: { openedAt: "desc" },
      });
    }

    return NextResponse.json({
      success: true,
      hasActiveSession: !!activeSession,
      session: activeSession
        ? {
            id: activeSession.id,
            deviceId: activeSession.deviceId,
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
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

const openRegisterSchema = z.object({
  deviceCode: z.string().default("POS-01"),
  openingCash: z.number().min(0, "Opening float cannot be negative"),
  notes: z.string().optional(),
  staffId: z.string().optional(),
});

// POST open register shift
export async function POST(request: NextRequest) {
  try {
    let session = null;
    try {
      session = await requirePosSession();
    } catch {
      // Handled via staffId fallback
    }

    const body = await request.json();
    const parsed = openRegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid opening float." }, { status: 400 });
    }

    const { deviceCode, openingCash, notes, staffId: customStaffId } = parsed.data;
    const device = await getOrProvisionDevice(deviceCode);

    // Resolve staff member
    let staffId = session?.staffId || customStaffId;
    if (!staffId) {
      const firstActiveStaff = await db.staff.findFirst({
        where: { active: true },
        select: { id: true },
      });
      staffId = firstActiveStaff?.id || "master";
    }

    // Check if session already open on this device
    const existing = await db.posRegisterSession.findFirst({
      where: { deviceId: device.id, status: "OPEN" },
      include: {
        staff: { select: { id: true, name: true, role: true } },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Register shift is already open.",
        session: existing,
      });
    }

    const newSession = await db.posRegisterSession.create({
      data: {
        deviceId: device.id,
        staffId,
        openingCash,
        notes,
        status: "OPEN",
      },
      include: {
        staff: { select: { id: true, name: true, role: true } },
      },
    });

    await logAudit({
      action: "REGISTER_OPEN",
      entity: "PosRegisterSession",
      entityId: newSession.id,
      staffId,
      deviceId: device.id,
      details: { openingCash, notes },
    });

    return NextResponse.json({ success: true, session: newSession }, { status: 201 });
  } catch (err: unknown) {
    console.error("Open register error:", err);
    const msg = err instanceof Error ? err.message : "Failed to open register.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
