"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

interface ReviewProduct {
  id: string;
  name: string;
  slug: string;
  mainImage: string;
}

interface Review {
  id: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  product: ReviewProduct;
}

interface ReviewSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
}

const statusOptions = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

type StatusFilter = (typeof statusOptions)[number];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 0,
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchReviews = useCallback(
    async (nextPage = 1, shouldSetPage = false) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({
          status: statusFilter,
          sort: sortBy,
          page: String(nextPage),
          limit: "10",
        });

        if (searchQuery.trim()) params.set("search", searchQuery.trim());
        if (ratingFilter !== "ALL") params.set("rating", ratingFilter);

        const res = await fetch(`/api/admin/reviews?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to load reviews");
        }

        const list = Array.isArray(json.reviews) ? json.reviews : [];
        setReviews(list);
        setTotalPages(Math.max(1, Number(json.totalPages || 1)));
        setSummary(
          json.summary && typeof json.summary === "object"
            ? {
                total: Number(json.summary.total || 0),
                pending: Number(json.summary.pending || 0),
                approved: Number(json.summary.approved || 0),
                rejected: Number(json.summary.rejected || 0),
                averageRating: Number(json.summary.averageRating || 0),
              }
            : {
                total: 0,
                pending: 0,
                approved: 0,
                rejected: 0,
                averageRating: 0,
              }
        );

        if (shouldSetPage) {
          setPage(nextPage);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error loading reviews";
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [ratingFilter, searchQuery, sortBy, statusFilter]
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchReviews(1, true);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [fetchReviews, ratingFilter, searchQuery, sortBy, statusFilter]);

  const handlePageChange = (nextPage: number) => {
    const safeNextPage = Math.min(Math.max(1, nextPage), totalPages);
    setPage(safeNextPage);
    fetchReviews(safeNextPage);
  };

  const displaySummary = useMemo(
    () => [
      {
        label: "Total Reviews",
        value: summary.total,
        accent: "text-[#32190D]",
      },
      {
        label: "Pending Reviews",
        value: summary.pending,
        accent: "text-amber-700",
      },
      {
        label: "Approved Reviews",
        value: summary.approved,
        accent: "text-emerald-700",
      },
      {
        label: "Average Rating",
        value: `${summary.averageRating.toFixed(1)} / 5`,
        accent: "text-[#B88632]",
      },
    ],
    [summary]
  );

  const updateReviewStatus = async (id: string, nextStatus: "APPROVED" | "REJECTED") => {
    setIsActionLoading(true);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Review action failed");
      }

      setReviews((prev) =>
        prev.map((review) =>
          review.id === id ? { ...review, status: nextStatus } : review
        )
      );

      if (selectedReview?.id === id) {
        setSelectedReview({ ...selectedReview, status: nextStatus });
      }

      fetchReviews(page, true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Review action failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm("Delete this review permanently?")) return;

    setIsActionLoading(true);

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete review");
      }

      setReviews((prev) => prev.filter((review) => review.id !== id));
      if (selectedReview?.id === id) setSelectedReview(null);
      fetchReviews(page, true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Review deletion failed");
    } finally {
      setIsActionLoading(false);
    }
  };

  const getBadge = (status: Review["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REJECTED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-zinc-100 text-zinc-600 border-zinc-200";
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-1 text-[#D6A64B]">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={`${rating}-${index}`}
          size={14}
          fill={index < rating ? "currentColor" : "transparent"}
          className={index < rating ? "text-[#D6A64B]" : "text-[#D6A64B]/35"}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
            Reviews Management
          </h1>
          <p className="text-xs text-[#32190D]/70 mt-1">
            Moderate customer feedback, approve standout experiences, and keep storefront quality high.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchReviews(page)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#32190D]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} className="text-[#D6A64B]" />
          <span>Refresh</span>
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {displaySummary.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[#32190D]/10 bg-white p-4 shadow-xs"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#806E5D]">
              {card.label}
            </div>
            <div className={`mt-3 text-2xl font-serif font-semibold ${card.accent}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#32190D]/10 rounded-2xl p-4 shadow-xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#32190D]/40 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer or product name..."
            className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-10 pr-4 py-2 text-xs text-[#32190D] placeholder:text-[#32190D]/40 focus:border-[#D6A64B] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All Reviews" : status}
              </option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-[#32190D]/10 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#32190D]/60 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
            <span>Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-sm text-[#32190D]/60">
            No reviews match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#32190D]/10 text-left text-xs">
              <thead className="bg-[#FAF6EE] text-[#32190D]/70">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Rating</th>
                  <th className="px-4 py-3 font-semibold">Review</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#32190D]/10">
                {reviews.map((review) => (
                  <tr key={review.id} className="align-top hover:bg-[#F8F3E9]/40">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#32190D]">{review.customerName}</div>
                      <div className="text-[11px] text-[#806E5D]">{review.customerEmail}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={review.product.mainImage || "/logo.png"}
                          alt={review.product.name}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 rounded-md object-cover border border-[#32190D]/10"
                        />
                        <div>
                          <div className="font-medium text-[#32190D]">{review.product.name}</div>
                          <div className="text-[11px] text-[#806E5D]">{review.product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">{renderStars(review.rating)}</td>
                    <td className="px-4 py-4 max-w-[260px]">
                      <div className="line-clamp-3 text-[#806E5D]">{review.comment}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getBadge(review.status)}`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#806E5D]">
                      {new Date(review.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReview(review)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#32190D]/15 bg-white px-2 py-1 text-[10px] font-semibold text-[#32190D] hover:bg-[#F8F3E9]"
                        >
                          <Eye size={12} /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReviewStatus(review.id, "APPROVED")}
                          disabled={review.status === "APPROVED" || isActionLoading}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                        >
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateReviewStatus(review.id, "REJECTED")}
                          disabled={review.status === "REJECTED" || isActionLoading}
                          className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white disabled:opacity-50"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteReview(review.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-[#32190D]/10 bg-white p-3 shadow-xs">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1 || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-semibold text-[#32190D] disabled:opacity-50"
          >
            <ArrowLeft size={13} /> Prev
          </button>

          <div className="text-xs text-[#32190D]/70">
            Page {page} of {totalPages}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="inline-flex items-center gap-1 rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-semibold text-[#32190D] disabled:opacity-50"
          >
            Next <ArrowRight size={13} />
          </button>
        </div>
      )}

      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#32190D]/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-[#32190D]/10 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#32190D]/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#F8F3E9] p-2 text-[#B88632]">
                  <MessageSquareText size={18} />
                </div>
                <div>
                  <div className="font-serif text-xl text-[#32190D]">Review details</div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#806E5D]">
                    Moderation review
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-full border border-[#32190D]/10 p-2 text-[#32190D] hover:bg-[#F8F3E9]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex gap-4 border-b border-[#32190D]/10 pb-4">
                <Image
                  src={selectedReview.product.mainImage || "/logo.png"}
                  alt={selectedReview.product.name}
                  width={80}
                  height={80}
                  unoptimized
                  className="h-20 w-20 rounded-lg object-cover border border-[#32190D]/10"
                />
                <div className="flex-1">
                  <div className="font-serif text-xl text-[#32190D]">{selectedReview.product.name}</div>
                  <div className="mt-1 text-xs text-[#806E5D]">
                    Submitted on {new Date(selectedReview.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {renderStars(selectedReview.rating)}
                    <span className="text-xs font-semibold text-[#32190D]">{selectedReview.rating}/5</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.15em] text-[#806E5D]">Customer Name</div>
                  <div className="mt-1 font-medium text-[#32190D]">{selectedReview.customerName}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.15em] text-[#806E5D]">Customer Email</div>
                  <div className="mt-1 font-medium text-[#32190D]">{selectedReview.customerEmail}</div>
                </div>
              </div>

              <div>
                <div className="text-[11px] uppercase tracking-[0.15em] text-[#806E5D]">Review</div>
                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-[#32190D]/10 bg-[#FAF6EE] p-3 text-sm text-[#32190D]">
                  {selectedReview.comment}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[#32190D]/10 bg-[#FAF6EE] p-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.15em] text-[#806E5D]">Current status</div>
                  <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getBadge(selectedReview.status)}`}>
                    {selectedReview.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateReviewStatus(selectedReview.id, "APPROVED")}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-[10px] font-semibold text-white"
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReviewStatus(selectedReview.id, "REJECTED")}
                    className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-3 py-2 text-[10px] font-semibold text-white"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
