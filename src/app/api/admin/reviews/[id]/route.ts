import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteReview, updateReviewStatus } from "@/services/reviewService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const review = await db.review.findUnique({
    where: { id },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          mainImage: true,
        },
      },
    },
  });

  if (!review) {
    return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: review });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const status = String(body.status || body.action || "").toUpperCase();
    const normalizedStatus = status === "APPROVE" ? "APPROVED" : status === "REJECT" ? "REJECTED" : status;

    if (!["PENDING", "APPROVED", "REJECTED"].includes(normalizedStatus)) {
      return NextResponse.json({ success: false, error: "Invalid review status" }, { status: 400 });
    }

    const updated = await updateReviewStatus(id, normalizedStatus as "PENDING" | "APPROVED" | "REJECTED");
    return NextResponse.json({ success: true, data: updated, message: `Review ${normalizedStatus.toLowerCase()}` });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/reviews/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update review";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteReview(id);
    return NextResponse.json({ success: true, message: "Review deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/reviews/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete review" }, { status: 500 });
  }
}
