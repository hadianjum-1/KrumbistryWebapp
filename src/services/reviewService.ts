import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ReviewFilters {
  productId?: string;
  status?: ReviewStatus | "ALL";
  search?: string;
  rating?: number;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
}

export async function getReviewSummary(productId?: string) {
  const baseWhere: Prisma.ReviewWhereInput = productId ? { productId } : {};

  const [statusCounts, averageRating] = await Promise.all([
    db.review.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: { _all: true },
    }),
    db.review.aggregate({
      where: { ...baseWhere, status: "APPROVED" },
      _avg: { rating: true },
    }),
  ]);

  let pending = 0;
  let approved = 0;
  let rejected = 0;

  for (const item of statusCounts) {
    if (item.status === "PENDING") pending = item._count._all;
    else if (item.status === "APPROVED") approved = item._count._all;
    else if (item.status === "REJECTED") rejected = item._count._all;
  }

  const total = pending + approved + rejected;

  return {
    total,
    pending,
    approved,
    rejected,
    averageRating: Number(averageRating._avg.rating ?? 0),
  };
}

export async function listReviews(filters: ReviewFilters = {}) {
  const page = Math.max(1, Number(filters.page ?? 1));
  const limit = Math.max(1, Math.min(100, Number(filters.limit ?? 10)));
  const sort = filters.sort === "oldest" ? "asc" : "desc";

  const where: Prisma.ReviewWhereInput = {
    ...(filters.productId ? { productId: filters.productId } : {}),
    ...(filters.status && filters.status !== "ALL" ? { status: filters.status } : {}),
    ...(filters.rating ? { rating: filters.rating } : {}),
    ...(filters.search
      ? {
          OR: [
            { customerName: { contains: filters.search, mode: "insensitive" } },
            { customerEmail: { contains: filters.search, mode: "insensitive" } },
            { comment: { contains: filters.search, mode: "insensitive" } },
            { product: { name: { contains: filters.search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [reviews, total, summary] = await Promise.all([
    db.review.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            mainImage: true,
          },
        },
      },
      orderBy: { createdAt: sort },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.review.count({ where }),
    getReviewSummary(),
  ]);

  return {
    reviews,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    summary,
  };
}

export async function getApprovedReviewsForProduct(productId: string) {
  const [reviews, summary] = await Promise.all([
    db.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
    }),
    getReviewSummary(productId),
  ]);

  return {
    reviews,
    totalReviews: summary.approved,
    averageRating: summary.averageRating,
    pendingReviews: summary.pending,
  };
}

export async function createProductReview(input: {
  productId: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
}) {
  return db.review.create({
    data: {
      productId: input.productId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      rating: input.rating,
      comment: input.comment,
      status: "PENDING",
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          mainImage: true,
        },
      },
    },
  });
}

export async function updateReviewStatus(id: string, status: ReviewStatus) {
  return db.review.update({
    where: { id },
    data: { status },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          mainImage: true,
        },
      },
    },
  });
}

export async function deleteReview(id: string) {
  return db.review.delete({ where: { id } });
}
