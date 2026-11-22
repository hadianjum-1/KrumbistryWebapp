import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePosSession, logAudit } from "@/lib/posAuth";
import { z } from "zod";

const movementSchema = z.object({
  sessionId: z.string(),
  type: z.enum(["CASH_IN", "CASH_OUT"]),
  amount: z.number().positive("Amount must be greater than zero"),
  reason: z.string().min(2, "Reason is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requirePosSession();
    const body = await request.json();
    const parsed = movementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid movement payload." }, { status: 400 });
    }

    const { sessionId, type, amount, reason } = parsed.data;

    const registerSession = await db.posRegisterSession.findUnique({
      where: { id: sessionId },
    });

    if (!registerSession || registerSession.status !== "OPEN") {
      return NextResponse.json({ success: false, error: "Session is not active." }, { status: 400 });
    }

    // Atomic transaction
    const movement = await db.$transaction(async (tx) => {
      const mov = await tx.registerCashMovement.create({
        data: {
          sessionId,
          type,
          amount,
          reason,
        },
      });

      if (type === "CASH_IN") {
        await tx.posRegisterSession.update({
          where: { id: sessionId },
          data: { cashInTotal: { increment: amount } },
        });
      } else {
        await tx.posRegisterSession.update({
          where: { id: sessionId },
          data: { cashOutTotal: { increment: amount } },
        });
      }

      return mov;
    });

    await logAudit({
      action: type === "CASH_IN" ? "REGISTER_CASH_IN" : "REGISTER_CASH_OUT",
      entity: "RegisterCashMovement",
      entityId: movement.id,
      staffId: session.staffId,
      deviceId: registerSession.deviceId,
      details: { amount, reason },
    });

    return NextResponse.json({ success: true, movement }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return NextResponse.json({ success: false, error: msg }, { status: 401 });
  }
}
