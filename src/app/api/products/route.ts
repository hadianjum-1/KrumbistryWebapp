import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/services/productService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId") || undefined;
    const categorySlug = searchParams.get("categorySlug") || undefined;
    const featuredParam = searchParams.get("featured");
    const bestsellerParam = searchParams.get("bestseller");
    const search = searchParams.get("search") || undefined;

    const featured = featuredParam !== null ? featuredParam === "true" : undefined;
    const bestseller = bestsellerParam !== null ? bestsellerParam === "true" : undefined;

    const products = await getProducts({
      categoryId,
      categorySlug,
      featured,
      bestseller,
      search,
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error: unknown) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve products." },
      { status: 500 }
    );
  }
}
