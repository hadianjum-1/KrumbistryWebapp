import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDeviceCode = searchParams.get("deviceCode") || "POS-01";
    const deviceCode = rawDeviceCode.trim() || "POS-01";

    let device = await db.device.findUnique({
      where: { deviceCode },
    });

    if (!device) {
      device = await db.device.findFirst({
        where: {
          OR: [
            { deviceCode: { equals: deviceCode, mode: "insensitive" } },
            { status: "AUTHORIZED" },
          ],
        },
      });
    }

    if (!device) {
      // Auto-provision so terminal can cache offline data
      device = await db.device.create({
        data: {
          deviceCode,
          name: deviceCode.toUpperCase().includes("POS") ? deviceCode : `Terminal ${deviceCode}`,
          branch: "Main Bakery",
          status: "AUTHORIZED",
          allowOffline: true,
          secretTokenHash: "auto-provisioned",
        },
      });
    }

    if (device.status === "REVOKED") {
      return NextResponse.json(
        { success: false, error: "Terminal is revoked by bakery management." },
        { status: 403 }
      );
    }

    // Active staff credentials for secure offline verification
    const activeStaff = await db.staff.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        role: true,
        pinHash: true,
        maxOfflineHours: true,
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      device: {
        id: device.id,
        deviceCode: device.deviceCode,
        name: device.name,
        branch: device.branch,
        allowOffline: device.allowOffline,
      },
      staff: activeStaff,
    });
  } catch (error) {
    console.error("Offline pack error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate offline credentials package." },
      { status: 500 }
    );
  }
}
