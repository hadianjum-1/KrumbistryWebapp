import { NextResponse } from "next/server";
import { getCategories } from "@/services/categoryService";

export async function GET() {
  try {
    const categories = await getCategories(true);
    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error: unknown) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories." },
      { status: 500 }
    );
  }
}
