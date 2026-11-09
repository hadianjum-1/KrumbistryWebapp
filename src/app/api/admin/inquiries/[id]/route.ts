import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateInquiryStatusSchema } from "@/lib/validations";
import { deleteInquiry, getInquiryById, updateInquiryStatus } from "@/services/inquiryService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const inq = await getInquiryById(id);
  if (!inq) {
    return NextResponse.json({ success: false, error: "Inquiry not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: inq });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await request.json();
    const validated = updateInquiryStatusSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateInquiryStatus(id, validated.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/inquiries/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update inquiry" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteInquiry(id);
    return NextResponse.json({ success: true, message: "Inquiry deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/inquiries/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete inquiry" },
      { status: 500 }
    );
  }
}
