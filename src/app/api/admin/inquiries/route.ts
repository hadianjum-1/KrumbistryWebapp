import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getInquiries } from "@/services/inquiryService";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const result = await getInquiries({ status, search, page, limit });
  return NextResponse.json({
    success: true,
    data: result.inquiries,
    inquiries: result.inquiries,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages,
  });
}

