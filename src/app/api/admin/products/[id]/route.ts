import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validations";
import { deleteProduct, getProductById, updateProduct } from "@/services/productService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: product });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const json = await request.json();
    const validated = productSchema.partial().safeParse(json);

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

    const data = { ...validated.data };

    // Check slug collision
    if (data.slug) {
      const existingSlug = await db.product.findUnique({ where: { slug: data.slug } });
      if (existingSlug && existingSlug.id !== id) {
        data.slug = `${data.slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    // Check sku collision
    if (data.sku) {
      const existingSku = await db.product.findUnique({ where: { sku: data.sku } });
      if (existingSku && existingSku.id !== id) {
        data.sku = `${data.sku}-${Math.floor(10 + Math.random() * 90)}`;
      }
    }

    const updated = await updateProduct(id, data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/products/[id] error:", error);
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// PUT is a full-document alias for PATCH (admin product form uses PUT method)
export const PUT = PATCH;

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteProduct(id);
    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/products/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
