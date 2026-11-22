import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit, hashPin } from "@/lib/posAuth";
import { z } from "zod";

const updateStaffSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().nullable(),
  pin: z.string().min(4).max(8).optional(),
  role: z.enum(["OWNER", "MANAGER", "CASHIER"]).optional(),
  active: z.boolean().optional(),
  maxOfflineHours: z.number().int().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePosSession(["OWNER"]);
    const { id } = await params;

    const body = await request.json();
    const parsed = updateStaffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid staff update data." },
        { status: 400 }
      );
    }

    const dataToUpdate: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.pin) {
      dataToUpdate.pinHash = await hashPin(parsed.data.pin);
      delete dataToUpdate.pin;
    }

    const updated = await db.staff.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    });

    await logAudit({
      action: "STAFF_UPDATED",
      entity: "Staff",
      entityId: id,
      staffId: session.staffId,
      details: { updatedFields: Object.keys(parsed.data) },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
