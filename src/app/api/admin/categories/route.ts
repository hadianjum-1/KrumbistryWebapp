import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { categorySchema } from "@/lib/validations";
import { createCategory, getCategories } from "@/services/categoryService";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const categories = await getCategories(false);
  return NextResponse.json({ success: true, data: categories });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const validated = categorySchema.safeParse(json);

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

    const category = await createCategory(validated.data);
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/categories error:", error);
    const message = error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
