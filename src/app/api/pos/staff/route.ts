import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit, hashPin } from "@/lib/posAuth";
import { z } from "zod";

export async function GET() {
  try {
    await requirePosSession(["OWNER", "MANAGER"]);

    const staff = await db.staff.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        maxOfflineHours: true,
        createdAt: true,
        _count: {
          select: { orders: true, registerSessions: true },
        },
      },
    });

    return NextResponse.json({ success: true, staff });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}

const createStaffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional().or(z.literal("")),
  pin: z.string().min(4).max(8),
  role: z.enum(["OWNER", "MANAGER", "CASHIER"]),
  maxOfflineHours: z.number().int().min(1).max(720).default(72),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePosSession(["OWNER"]);

    const body = await request.json();
    const parsed = createStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid staff inputs." },
        { status: 400 }
      );
    }

    const { name, email, pin, role, maxOfflineHours } = parsed.data;
    const pinHash = await hashPin(pin);

    const staff = await db.staff.create({
      data: {
        name,
        email: email && email.length > 0 ? email : null,
        pinHash,
        role,
        maxOfflineHours,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    await logAudit({
      action: "STAFF_CREATED",
      entity: "Staff",
      entityId: staff.id,
      staffId: session.staffId,
      details: { name: staff.name, role: staff.role },
    });

    return NextResponse.json({ success: true, staff }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
