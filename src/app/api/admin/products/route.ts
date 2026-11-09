import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validations";
import { createProduct, getProducts } from "@/services/productService";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;

  const products = await getProducts({
    publishedOnly: false,
    search,
    categoryId,
  });

  return NextResponse.json({
    success: true,
    data: products,
  });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const validated = productSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const d = validated.data;

    // Verify category exists or fallback to first active category
    let categoryId = d.categoryId;
    const categoryExists = await db.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      const fallbackCat = await db.category.findFirst({ where: { active: true } });
      if (fallbackCat) {
        categoryId = fallbackCat.id;
      }
    }

    // Ensure unique slug
    let slug = d.slug;
    const existingSlug = await db.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Ensure unique sku
    let sku = d.sku;
    const existingSku = await db.product.findUnique({ where: { sku } });
    if (existingSku) {
      sku = `${sku}-${Math.floor(10 + Math.random() * 90)}`;
    }

    const newProduct = await createProduct({
      ...d,
      categoryId,
      slug,
      sku,
    });
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/admin/products error:", error);
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
