import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPin, setPosSessionCookie, logAudit } from "@/lib/posAuth";
import { z } from "zod";

const loginSchema = z.object({
  pin: z.string().min(4, "PIN must be at least 4 digits").max(8),
  deviceCode: z.string().default("POS-01"),
  staffId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN format. Must be 4-6 numeric digits." },
        { status: 400 }
      );
    }

    const { pin, deviceCode, staffId } = parsed.data;

    // 1. Verify / Auto-Provision Device
    const cleanCode = (deviceCode || "").trim() || "POS-01";
    let device = await db.device.findUnique({
      where: { deviceCode: cleanCode },
    });

    if (!device) {
      // Fallback: check case-insensitive or any authorized device
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
      // Auto-provision terminal as AUTHORIZED so operations are never blocked
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

    if (device.status === "REVOKED") {
      return NextResponse.json(
        {
          success: false,
          error: `Terminal "${deviceCode}" has been revoked by management. Please contact bakery administrator.`,
        },
        { status: 403 }
      );
    }

    // 2. Lookup Staff (by staffId if pre-selected, otherwise match across all active staff)
    let staffMember = null;
    if (staffId) {
      staffMember = await db.staff.findUnique({
        where: { id: staffId },
      });
      if (staffMember) {
        const matches = await verifyPin(pin.trim(), staffMember.pinHash);
        if (!matches) {
          staffMember = null;
        }
      }
    } else {
      const activeStaff = await db.staff.findMany({
        where: { active: true },
      });

      for (const s of activeStaff) {
        const matches = await verifyPin(pin.trim(), s.pinHash);
        if (matches) {
          staffMember = s;
          break;
        }
      }
    }

    if (!staffMember || !staffMember.active) {
      await logAudit({
        action: "POS_LOGIN_FAILED",
        entity: "Staff",
        deviceId: device.id,
        details: { deviceCode: cleanCode, attemptedStaffId: staffId || "unknown" },
      });

      return NextResponse.json(
        { success: false, error: "Incorrect PIN. Please try again." },
        { status: 401 }
      );
    }

    // 3. Set Session Cookie for App
    await setPosSessionCookie({
      staffId: staffMember.id,
      name: staffMember.name,
      role: staffMember.role,
      deviceCode: device.deviceCode,
    });

    await logAudit({
      action: "POS_LOGIN_SUCCESS",
      entity: "Staff",
      entityId: staffMember.id,
      staffId: staffMember.id,
      deviceId: device.id,
      details: { deviceCode: device.deviceCode, role: staffMember.role },
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: staffMember.id,
        name: staffMember.name,
        role: staffMember.role,
        email: staffMember.email,
      },
      device: {
        id: device.id,
        deviceCode: device.deviceCode,
        name: device.name,
        branch: device.branch,
        allowOffline: device.allowOffline,
      },
    });
  } catch (error) {
    console.error("POS Login Error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during authentication." },
      { status: 500 }
    );
  }
}
