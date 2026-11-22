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
    const { name, email, pin, role } = await request.json();

    if (!name || !pin || pin.length < 4 || pin.length > 6) {
      return NextResponse.json(
        { success: false, error: "Name and a 4-6 digit numeric PIN are required" },
        { status: 400 }
      );
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { success: false, error: "PIN must consist of numbers only" },
        { status: 400 }
      );
    }

    const pinHash = await hashPin(pin);

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
    const { id, isActive, active, role, pin } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: "Staff ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    const newActiveState = typeof active === "boolean" ? active : isActive;
    if (typeof newActiveState === "boolean") updateData.active = newActiveState;
    if (role) updateData.role = role;
    if (pin) {
      if (!/^\d{4,6}$/.test(pin)) {
        return NextResponse.json(
          { success: false, error: "PIN must be 4-6 numeric digits" },
          { status: 400 }
        );
      }
      updateData.pinHash = await hashPin(pin);
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
