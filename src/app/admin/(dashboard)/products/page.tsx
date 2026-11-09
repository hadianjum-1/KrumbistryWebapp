"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Star,
  Flame,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  salePrice: number | null;
  mainImage: string;
  category?: Category;
  categoryId: string;
  published: boolean;
  available: boolean;
  featured: boolean;
  bestseller: boolean;
  servings: string | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success) {
        setProducts(Array.isArray(prodData.data) ? prodData.data : []);
      }
      if (catData.success) {
        setCategories(Array.isArray(catData.data) ? catData.data : []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load products";
      setActionError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    Promise.all([fetch("/api/admin/products"), fetch("/api/admin/categories")])
      .then(async ([prodRes, catRes]) => {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        if (!ignore) {
          if (prodData.success) setProducts(Array.isArray(prodData.data) ? prodData.data : []);
          if (catData.success) setCategories(Array.isArray(catData.data) ? catData.data : []);
        }
      })
      .catch((err) => {
        if (!ignore) setActionError(err instanceof Error ? err.message : "Failed to load products");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingId(id);
    setActionError(null);

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete product");
      }
      // Remove from local list
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting product";
      setActionError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    const newAvailable = !product.available;
    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, available: newAvailable } : p))
    );

    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: newAvailable }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Update failed");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating product";
      setActionError(msg);
      // Revert optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, available: product.available } : p))
      );
    }
  };

  const list = Array.isArray(products) ? products : [];
  const filteredProducts = list.filter((prod) => {
    const matchesSearch =
      (prod.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.sku ?? "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "ALL" || prod.categoryId === selectedCategory;

    let matchesStatus = true;
    if (selectedStatus === "PUBLISHED") matchesStatus = prod.published;
    else if (selectedStatus === "DRAFT") matchesStatus = !prod.published;
    else if (selectedStatus === "FEATURED") matchesStatus = prod.featured;
    else if (selectedStatus === "BESTSELLER") matchesStatus = prod.bestseller;
    else if (selectedStatus === "AVAILABLE") matchesStatus = prod.available;
    else if (selectedStatus === "UNAVAILABLE") matchesStatus = !prod.available;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
            Products Management
          </h1>
          <p className="text-xs text-[#32190D]/70 mt-1">
            Manage your bakery catalog, prices, photos, and availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchProducts}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className="text-[#D6A64B]" />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#32190D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm"
          >
            <Plus size={16} className="text-[#D6A64B]" />
            <span>Create New Product</span>
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#32190D]/10 rounded-2xl p-4 shadow-xs space-y-3 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#32190D]/40 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-10 pr-4 py-2 text-xs text-[#32190D] placeholder:text-[#32190D]/40 focus:border-[#D6A64B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D6A64B]/20 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter products by category"
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter products by status"
            className="rounded-lg border border-[#32190D]/15 bg-white px-3 py-2 text-xs font-medium text-[#32190D] focus:border-[#D6A64B] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Draft / Hidden</option>
            <option value="FEATURED">Featured</option>
            <option value="BESTSELLER">Bestsellers</option>
            <option value="AVAILABLE">Available Now</option>
            <option value="UNAVAILABLE">Sold Out</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#32190D]/10 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#32190D]/60 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
            <span>Loading product inventory...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-[#32190D]">No products found</p>
            <p className="text-xs text-[#32190D]/60 mt-1">
              Try adjusting your search criteria or create a new product.
            </p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-1.5 mt-4 rounded-lg bg-[#32190D] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#432314] transition-colors"
            >
              <Plus size={14} className="text-[#D6A64B]" />
              <span>Create Product</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F3E9]/50 border-b border-[#32190D]/10 text-[#32190D]/70 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-center">Tags</th>
                  <th className="py-3 px-4 text-center">Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#32190D]/5">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#F8F3E9]/30 transition-colors">
                    {/* Item Thumbnail & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F8F3E9] shrink-0 border border-[#32190D]/10">
                          <ImagePlaceholder
                            src={prod.mainImage}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#32190D]">
                            {prod.name}
                          </div>
                          <div className="text-[11px] text-[#32190D]/60 font-mono">
                            {prod.sku || `slug: ${prod.slug}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-[#32190D]/80">
                      {prod.category?.name || "Uncategorized"}
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#32190D]">
                        Rs. {Number(prod.price).toLocaleString()}
                      </span>
                      {prod.salePrice && (
                        <span className="ml-1.5 text-[11px] line-through text-[#32190D]/40">
                          Rs. {Number(prod.salePrice).toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Available Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(prod)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer border ${
                          prod.available
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }`}
                        title="Click to toggle availability"
                      >
                        {prod.available ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Tags (Featured / Bestseller) */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {prod.featured && (
                          <span
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold"
                            title="Featured on homepage"
                          >
                            <Star size={10} className="fill-amber-500 text-amber-500" />
                            <span>Featured</span>
                          </span>
                        )}
                        {prod.bestseller && (
                          <span
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold"
                            title="Bestseller flag"
                          >
                            <Flame size={10} className="text-rose-500" />
                            <span>Bestseller</span>
                          </span>
                        )}
                        {!prod.featured && !prod.bestseller && (
                          <span className="text-[#32190D]/30">—</span>
                        )}
                      </div>
                    </td>

                    {/* Published Status */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          prod.published
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200"
                        }`}
                      >
                        {prod.published ? "Published" : "Draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/menu/${prod.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-[#F8F3E9] text-[#32190D]/60 hover:text-[#32190D] transition-colors"
                          title="Preview public product page"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link
                          href={`/admin/products/${prod.id}/edit`}
                          className="p-1.5 rounded-md hover:bg-[#F8F3E9] text-[#32190D]/70 hover:text-[#32190D] transition-colors"
                          title="Edit product"
                        >
                          <Edit2 size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(prod.id, prod.name)}
                          disabled={deletingId === prod.id}
                          className="p-1.5 rounded-md hover:bg-red-50 text-[#32190D]/40 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete product"
                        >
                          {deletingId === prod.id ? (
                            <Loader2 size={15} className="animate-spin text-red-600" />
                          ) : (
                            <Trash2 size={15} />
                          )}
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
    </div>
  );
}

