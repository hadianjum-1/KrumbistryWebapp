import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/services/productService";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: unknown) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch product." },
      { status: 500 }
    );
  }
}
