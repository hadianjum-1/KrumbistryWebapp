"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface Category {
  id: string;
  name: string;
}

export interface ProductFormValues {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  salePrice?: number | null;
  sku?: string;
  categoryId: string;
  mainImage: string;
  gallery: string[];
  ingredients: string;
  allergens: string;
  size?: string;
  weight?: string;
  servings?: string;
  preparationTime?: string;
  featured: boolean;
  bestseller: boolean;
  available: boolean;
  published: boolean;
  sortOrder: number;
}

interface ProductFormProps {
  initialValues?: Partial<ProductFormValues>;
  isEdit?: boolean;
  productId?: string;
}

export default function ProductForm({
  initialValues,
  isEdit = false,
  productId,
}: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState<ProductFormValues>({
    name: initialValues?.name || "",
    slug: initialValues?.slug || "",
    shortDescription: initialValues?.shortDescription || "",
    description: initialValues?.description || "",
    price: initialValues?.price ?? 0,
    salePrice: initialValues?.salePrice ?? null,
    sku: initialValues?.sku || "",
    categoryId: initialValues?.categoryId || "",
    mainImage: initialValues?.mainImage || "",
    gallery: initialValues?.gallery || [],
    ingredients: Array.isArray(initialValues?.ingredients)
      ? (initialValues.ingredients as unknown as string[]).join(", ")
      : initialValues?.ingredients || "",
    allergens: Array.isArray(initialValues?.allergens)
      ? (initialValues.allergens as unknown as string[]).join(", ")
      : initialValues?.allergens || "",
    size: initialValues?.size || "",
    weight: initialValues?.weight || "",
    servings: initialValues?.servings || "",
    preparationTime: initialValues?.preparationTime || "",
    featured: initialValues?.featured ?? false,
    bestseller: initialValues?.bestseller ?? false,
    available: initialValues?.available ?? true,
    published: initialValues?.published ?? true,
    sortOrder: initialValues?.sortOrder ?? 0,
  });

  useEffect(() => {
    // Load active categories for selection dropdown
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setCategories(data.data);
          // Default to first category if not set
          if (!form.categoryId && data.data.length > 0) {
            setForm((prev) => ({ ...prev, categoryId: data.data[0].id }));
          }
        }
      })
      .catch((err) => console.error("Error loading categories:", err));
  }, [form.categoryId]);

  const generateSlug = (nameStr: string) => {
    return nameStr
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (nameVal: string) => {
    setForm((prev) => ({
      ...prev,
      name: nameVal,
      slug: isEdit ? prev.slug : generateSlug(nameVal),
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.name.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }
    if (!form.categoryId) {
      setErrorMessage("Please select a product category.");
      return;
    }
    if (form.price < 0) {
      setErrorMessage("Price cannot be negative.");
      return;
    }

    setIsSaving(true);

    try {
      const url = isEdit
        ? `/api/admin/products/${productId}`
        : "/api/admin/products";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const detailMsg = data.details
          ? Object.entries(data.details)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join("; ")
          : "";
        throw new Error(
          detailMsg ? `${data.error}: ${detailMsg}` : data.error || "Failed to save product"
        );
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving product";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg border border-[#32190D]/10 bg-white hover:bg-[#F8F3E9] text-[#32190D] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
              {isEdit ? "Edit Product" : "Create New Product"}
            </h1>
            <p className="text-xs text-[#32190D]/70 mt-0.5">
              {isEdit
                ? `Updating "${form.name || "Product"}" in the catalog`
                : "Add a handcrafted artisanal delight to your bakery catalog"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="rounded-lg border border-[#32190D]/15 bg-white px-4 py-2 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9] transition-colors shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#32190D] px-5 py-2 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin text-[#D6A64B]" />
            ) : (
              <Save size={14} className="text-[#D6A64B]" />
            )}
            <span>{isEdit ? "Save Changes" : "Publish Product"}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-semibold">Unable to save product</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Details, Descriptions, Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Core Information */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Product Identity
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Valrhona Dark Chocolate Ganache Cake"
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="valrhona-dark-chocolate-cake"
                  className="mt-1.5 w-full font-mono text-xs rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2.5 text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  SKU (Stock Keeping Unit)
                </label>
                <input
                  type="text"
                  value={form.sku || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sku: e.target.value }))
                  }
                  placeholder="KRM-CAKE-001"
                  className="mt-1.5 w-full font-mono text-xs rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2.5 text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Short Tagline / Summary
              </label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, shortDescription: e.target.value }))
                }
                placeholder="A rich triple-layer 70% dark chocolate masterpiece finished with 24k gold leaf."
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Detailed Description
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe flavor notes, textures, artisanal techniques, and presentation..."
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Card 2: Bakery Specifications */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Artisanal Specifications & Dietary
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  Ingredients
                </label>
                <textarea
                  rows={3}
                  value={form.ingredients}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, ingredients: e.target.value }))
                  }
                  placeholder="Organic French butter, Madagascar bourbon vanilla, Valrhona 70% dark chocolate..."
                  className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  Allergens
                </label>
                <textarea
                  rows={3}
                  value={form.allergens}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, allergens: e.target.value }))
                  }
                  placeholder="Contains Dairy, Eggs, Gluten. Made in a facility handling tree nuts."
                  className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  Size
                </label>
                <input
                  type="text"
                  value={form.size || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, size: e.target.value }))
                  }
                  placeholder="8 inches / Box of 6"
                  className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  Weight
                </label>
                <input
                  type="text"
                  value={form.weight || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, weight: e.target.value }))
                  }
                  placeholder="1.4 kg"
                  className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  Servings
                </label>
                <input
                  type="text"
                  value={form.servings || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, servings: e.target.value }))
                  }
                  placeholder="8-12 slices"
                  className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  Prep Time
                </label>
                <input
                  type="text"
                  value={form.preparationTime || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      preparationTime: e.target.value,
                    }))
                  }
                  placeholder="24 hours advance"
                  className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Product Photography */}
          {/* Card 3: Visual Imagery */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
                Product Photography
              </h2>
              <p className="text-xs text-[#806E5D] mt-0.5">
                Upload the primary showcase picture and optional gallery angles.
              </p>
            </div>

            <div>
              <ImageUpload
                label="Primary Showcase Image (Main Cover Picture) *"
                value={form.mainImage}
                onChange={(url) =>
                  setForm((prev) => ({ ...prev, mainImage: url as string }))
                }
                folder="krumbistry/products"
              />
              <p className="text-[11px] text-[#806E5D] mt-1.5">
                The primary picture displayed first on product listings and as the main image in the product showcase.
              </p>
            </div>

            <div className="pt-4 border-t border-[#32190D]/10">
              <ImageUpload
                label="Additional Gallery Photos (Up to 4 images)"
                value={form.gallery}
                onChange={(urls) =>
                  setForm((prev) => ({ ...prev, gallery: urls as string[] }))
                }
                multiple
                maxFiles={4}
                folder="krumbistry/products/gallery"
              />
              <p className="text-[11px] text-[#806E5D] mt-1.5">
                Additional views, interior slices, or packaging shots shown in the gallery thumbnails.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Pricing, Category, Toggles, Sort */}
        <div className="space-y-6">
          {/* Card: Pricing */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Pricing (PKR) & Category
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Category *
              </label>
              <select
                required
                value={form.categoryId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoryId: e.target.value }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Price (PKR / Rs.) *
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-[#8C6219]">
                  Rs.
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="e.g. 2500"
                  className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-11 pr-3.5 py-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Sale / Promotional Price (PKR / Rs.)
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-[#8C6219]">
                  Rs.
                </span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={form.salePrice ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      salePrice: e.target.value ? parseFloat(e.target.value) : null,
                    }))
                  }
                  placeholder="Optional discounted price in PKR (e.g. 2200)"
                  className="w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 pl-11 pr-3.5 py-2.5 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                Display Sort Order
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="mt-1.5 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3.5 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
              />
              <p className="text-[11px] text-[#32190D]/50 mt-1">
                Lower numbers display first in listings.
              </p>
            </div>
          </div>

          {/* Card: Visibility & Badges */}
          <div className="bg-white border border-[#32190D]/10 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#8C6219]">
              Visibility & Flags
            </h2>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, published: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-[#32190D]/20 text-[#D6A64B] focus:ring-[#D6A64B]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#32190D]">
                    Published in Storefront
                  </span>
                  <p className="text-[11px] text-[#32190D]/60">
                    Visible to customers on the menu and search.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, available: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-[#32190D]/20 text-[#D6A64B] focus:ring-[#D6A64B]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#32190D]">
                    Currently In Stock
                  </span>
                  <p className="text-[11px] text-[#32190D]/60">
                    If unchecked, item will show &quot;Sold Out&quot;.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, featured: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-[#32190D]/20 text-[#D6A64B] focus:ring-[#D6A64B]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#32190D]">
                    Featured on Homepage
                  </span>
                  <p className="text-[11px] text-[#32190D]/60">
                    Spotlighted in the homepage signature selections.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.bestseller}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bestseller: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-[#32190D]/20 text-[#D6A64B] focus:ring-[#D6A64B]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#32190D]">
                    Bestseller Badge
                  </span>
                  <p className="text-[11px] text-[#32190D]/60">
                    Displays luxury gold &quot;Bestseller&quot; pill tag.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

