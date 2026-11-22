import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const products = await db.product.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            sortOrder: true,
          },
        },
      },
    });

    const categories = await db.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    const serializedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      sku: p.sku,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      mainImage: p.mainImage,
      available: p.available,
      trackInventory: p.trackInventory,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      isLowStock: p.trackInventory && p.stockQuantity <= p.lowStockThreshold,
    }));

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        products: serializedProducts,
        categories,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/pos/products error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load POS products." },
      { status: 500 }
    );
  }
}
