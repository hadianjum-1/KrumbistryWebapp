import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPin, setPosSessionCookie, logAudit } from "@/lib/posAuth";
import { z } from "zod";

const loginSchema = z.object({
  pin: z.string().min(4, "PIN must be at least 4 digits").max(8),
  deviceCode: z.string().default("POS BRANCH 1"),
  staffId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid PIN format." },
        { status: 400 }
      );
    }

    const { pin, deviceCode, staffId } = parsed.data;

    // 1. Verify Device Status
    const cleanCode = (deviceCode || "").trim();
    let device = await db.device.findUnique({
      where: { deviceCode: cleanCode },
    });

    if (!device) {
      // Fallback: check case-insensitive or default authorized device
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
      return NextResponse.json(
        {
          success: false,
          error: `Device ${deviceCode} is not registered. Please register this device first.`,
        },
        { status: 403 }
      );
    }

    if (device.status === "REVOKED") {
      return NextResponse.json(
        {
          success: false,
          error: `Device ${deviceCode} has been revoked by management. Contact owner.`,
        },
        { status: 403 }
      );
    }

    // 2. Lookup Staff
    let staffMember = null;
    if (staffId) {
      staffMember = await db.staff.findUnique({
        where: { id: staffId },
      });
    } else {
      // If staffId not preselected, check all active staff
      const activeStaff = await db.staff.findMany({
        where: { active: true },
      });

      for (const s of activeStaff) {
        const matches = await verifyPin(pin, s.pinHash);
        if (matches) {
          staffMember = s;
          break;
        }
      }
    }

    if (staffId && staffMember) {
      const matches = await verifyPin(pin, staffMember.pinHash);
      if (!matches) {
        staffMember = null;
      }
    }

    if (!staffMember || !staffMember.active) {
      await logAudit({
        action: "POS_LOGIN_FAILED",
        entity: "Staff",
        deviceId: device.id,
        details: { deviceCode, attemptedStaffId: staffId || "unknown" },
      });

      return NextResponse.json(
        { success: false, error: "Invalid Staff PIN." },
        { status: 401 }
      );
    }

    // 3. Set Session Cookie
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
      details: { deviceCode, role: staffMember.role },
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
