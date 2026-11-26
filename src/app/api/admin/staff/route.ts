import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPin } from "@/lib/posAuth";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const staff = await db.staff.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            orders: true,
            registerSessions: true,
          },
        },
      },
    });

    const devices = await db.device.findMany({
      orderBy: { deviceCode: "asc" },
    });

    return NextResponse.json({ success: true, staff, devices });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, pin, role, pinLength } = await request.json();

    if (!name || !pin) {
      return NextResponse.json(
        { success: false, error: "Name and numeric PIN are required" },
        { status: 400 }
      );
    }

    const cleanPin = String(pin).trim();
    const expectedLen = pinLength === 6 ? 6 : 4;

    if (!/^\d+$/.test(cleanPin)) {
      return NextResponse.json(
        { success: false, error: "PIN must consist of numbers only" },
        { status: 400 }
      );
    }

    if (cleanPin.length !== 4 && cleanPin.length !== 6) {
      return NextResponse.json(
        { success: false, error: "PIN must be either 4 or 6 digits" },
        { status: 400 }
      );
    }

    if (pinLength && cleanPin.length !== expectedLen) {
      return NextResponse.json(
        { success: false, error: `PIN must be exactly ${expectedLen} digits as selected` },
        { status: 400 }
      );
    }

    const pinHash = await hashPin(cleanPin);

    const newStaff = await db.staff.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        pinHash,
        role: role || "CASHIER",
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create staff member" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, isActive, active, role, pin, pinLength } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    const newActiveState = typeof active === "boolean" ? active : isActive;
    if (typeof newActiveState === "boolean") updateData.active = newActiveState;
    if (role) updateData.role = role;

    if (pin) {
      const cleanPin = String(pin).trim();
      const expectedLen = pinLength === 6 ? 6 : pinLength === 4 ? 4 : null;

      if (!/^\d+$/.test(cleanPin)) {
        return NextResponse.json(
          { success: false, error: "PIN must consist of numbers only" },
          { status: 400 }
        );
      }

      if (cleanPin.length !== 4 && cleanPin.length !== 6) {
        return NextResponse.json(
          { success: false, error: "PIN must be exactly 4 or 6 numeric digits" },
          { status: 400 }
        );
      }

      if (expectedLen && cleanPin.length !== expectedLen) {
        return NextResponse.json(
          { success: false, error: `PIN must be exactly ${expectedLen} digits as selected` },
          { status: 400 }
        );
      }

      updateData.pinHash = await hashPin(cleanPin);
    }

    const updated = await db.staff.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
      } catch {
        // Body was empty or non-JSON
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required" }, { status: 400 });
    }

    const existingStaff = await db.staff.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existingStaff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    // 1. Resolve foreign key constraint with PosRegisterSession:
    // PosRegisterSession has onDelete: Restrict, so clean up sessions or unlink them
    const sessions = await db.posRegisterSession.findMany({
      where: { staffId: id },
      select: { id: true },
    });

    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length > 0) {
      // Unlink any orders referencing these sessions
      await db.order.updateMany({
        where: { registerSessionId: { in: sessionIds } },
        data: { registerSessionId: null },
      });

      // Delete cash movements attached to these sessions
      await db.registerCashMovement.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      // Delete the register sessions
      await db.posRegisterSession.deleteMany({
        where: { id: { in: sessionIds } },
      });
    }

    // 2. Safely delete the staff member (Order, StockMovement, AuditLog all use onDelete: SetNull)
    await db.staff.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Staff member "${existingStaff.name}" has been deleted successfully.`,
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/staff error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
