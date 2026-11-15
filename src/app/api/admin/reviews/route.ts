import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getReviewSummary, listReviews } from "@/services/reviewService";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const summaryOnly = searchParams.get("summary") === "true";
  const status = (searchParams.get("status") || "ALL") as "ALL" | "PENDING" | "APPROVED" | "REJECTED";
  const search = searchParams.get("search") || undefined;
  const rating = searchParams.get("rating");
  const sort = (searchParams.get("sort") || "newest") as "newest" | "oldest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  if (summaryOnly) {
    const summary = await getReviewSummary();
    return NextResponse.json({
      success: true,
      data: {
        pendingCount: summary.pending,
        summary,
      },
    });
  }

  const result = await listReviews({
    status,
    search,
    rating: rating ? Number(rating) : undefined,
    sort,
    page,
    limit,
  });

  return NextResponse.json({
    success: true,
    data: result.reviews,
    reviews: result.reviews,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
    summary: result.summary,
  });
}
