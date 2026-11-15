import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations";
import { getApprovedReviewsForProduct } from "@/services/reviewService";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  const result = await getApprovedReviewsForProduct(product.id);

  return NextResponse.json({
    success: true,
    data: {
      productId: product.id,
      productName: product.name,
      reviews: result.reviews,
      totalReviews: result.totalReviews,
      averageRating: result.averageRating,
      pendingReviews: result.pendingReviews,
    },
  });
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
  }

  try {
    const json = await request.json();
    const validated = reviewSchema.safeParse(json);

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

    const review = await db.review.create({
      data: {
        productId: product.id,
        customerName: validated.data.customerName,
        customerEmail: validated.data.customerEmail,
        rating: validated.data.rating,
        comment: validated.data.comment,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for sharing your experience! Your review has been submitted and is awaiting approval. We appreciate your love for KRUMBISTRY.",
        data: review,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/products/[slug]/reviews error:", error);
    const message = error instanceof Error ? error.message : "Failed to submit review";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
