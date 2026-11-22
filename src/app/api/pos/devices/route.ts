import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit } from "@/lib/posAuth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function GET() {
  try {
    const session = await requirePosSession(["OWNER", "MANAGER"]);

    const devices = await db.device.findMany({
      orderBy: { registeredAt: "asc" },
      include: {
        _count: {
          select: { orders: true, registerSessions: true },
        },
      },
    });

    return NextResponse.json({ success: true, devices });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}

const registerDeviceSchema = z.object({
  deviceCode: z.string().min(3).max(20),
  name: z.string().min(3).max(100),
  branch: z.string().default("Main Bakery"),
  allowOffline: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePosSession(["OWNER"]);

    const body = await request.json();
    const parsed = registerDeviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid device data provided." },
        { status: 400 }
      );
    }

    const { deviceCode, name, branch, allowOffline } = parsed.data;

    // Check duplicate
    const existing = await db.device.findUnique({
      where: { deviceCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Device code ${deviceCode} is already in use.` },
        { status: 400 }
      );
    }

    const secretTokenHash = await bcrypt.hash(`device-${deviceCode}-${Date.now()}`, 10);

    const device = await db.device.create({
      data: {
        deviceCode,
        name,
        branch,
        allowOffline,
        status: "AUTHORIZED",
        secretTokenHash,
      },
    });

    await logAudit({
      action: "DEVICE_REGISTERED",
      entity: "Device",
      entityId: device.id,
      staffId: session.staffId,
      details: { deviceCode, name },
    });

    return NextResponse.json({ success: true, device }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
