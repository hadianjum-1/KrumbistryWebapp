import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit } from "@/lib/posAuth";
import { z } from "zod";

export async function GET() {
  try {
    await requirePosSession(["OWNER", "MANAGER"]);

    const conflicts = await db.inventoryConflict.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        device: { select: { deviceCode: true, name: true, branch: true } },
      },
    });

    return NextResponse.json({ success: true, conflicts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}

const resolveConflictSchema = z.object({
  conflictId: z.string(),
  status: z.enum(["RESOLVED", "IGNORED"]),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await requirePosSession(["OWNER", "MANAGER"]);
    const body = await request.json();
    const parsed = resolveConflictSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid payload." }, { status: 400 });
    }

    const { conflictId, status, notes } = parsed.data;

    const conflict = await db.inventoryConflict.update({
      where: { id: conflictId },
      data: {
        status,
        notes: notes ? `Resolved: ${notes}` : undefined,
        resolvedAt: new Date(),
      },
    });

    await logAudit({
      action: "INVENTORY_CONFLICT_RESOLVED",
      entity: "InventoryConflict",
      entityId: conflictId,
      staffId: session.staffId,
      details: { status, notes },
    });

    return NextResponse.json({ success: true, conflict });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
