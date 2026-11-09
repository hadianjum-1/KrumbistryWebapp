import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { deleteCategory, getCategoryById, updateCategory } from "@/services/categoryService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) {
    return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: category });
}

async function handleUpdate(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await request.json();
    const validated = categorySchema.partial().safeParse(json);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors)
        .map(([k, v]) => `${k}: ${v?.join(", ")}`)
        .join("; ");
      return NextResponse.json(
        {
          success: false,
          error: errorMsg || "Validation failed",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const updated = await updateCategory(id, validated.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PUT/PATCH /api/admin/categories/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update category";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export const PATCH = handleUpdate;
export const PUT = handleUpdate;

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteCategory(id);
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
