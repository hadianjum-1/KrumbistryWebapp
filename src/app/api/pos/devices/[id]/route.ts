import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit } from "@/lib/posAuth";
import { z } from "zod";

const updateDeviceSchema = z.object({
  name: z.string().min(2).optional(),
  branch: z.string().optional(),
  status: z.enum(["AUTHORIZED", "PENDING", "REVOKED"]).optional(),
  allowOffline: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePosSession(["OWNER", "MANAGER"]);
    const { id } = await params;

    const body = await request.json();
    const parsed = updateDeviceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update payload" },
        { status: 400 }
      );
    }

    const updated = await db.device.update({
      where: { id },
      data: parsed.data,
    });

    await logAudit({
      action: parsed.data.status === "REVOKED" ? "DEVICE_REVOKED" : "DEVICE_UPDATED",
      entity: "Device",
      entityId: id,
      staffId: session.staffId,
      details: parsed.data,
    });

    return NextResponse.json({ success: true, device: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
