"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import ProductForm, { type ProductFormValues } from "@/components/admin/ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const productId = params?.id as string;
  const [initialValues, setInitialValues] = useState<ProductFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    fetch(`/api/admin/products/${productId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.data) {
          throw new Error(json.error || "Failed to load product details");
        }
        const p = json.data;
        setInitialValues({
          name: p.name,
          slug: p.slug,
          shortDescription: p.shortDescription || "",
          description: p.description || "",
          price: Number(p.price),
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          sku: p.sku || "",
          categoryId: p.categoryId,
          mainImage: p.mainImage || "",
          gallery: Array.isArray(p.gallery) ? p.gallery : [],
          ingredients: Array.isArray(p.ingredients) ? p.ingredients.join(", ") : p.ingredients || "",
          allergens: Array.isArray(p.allergens) ? p.allergens.join(", ") : p.allergens || "",
          size: p.size || "",
          weight: p.weight || "",
          servings: p.servings || "",
          preparationTime: p.preparationTime || "",
          featured: p.featured ?? false,
          bestseller: p.bestseller ?? false,
          available: p.available ?? true,
          published: p.published ?? true,
          sortOrder: p.sortOrder ?? 0,
        });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error loading product";
        setError(msg);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [productId]);

  if (isLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
        <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
        <span className="text-xs text-[#32190D]/60">Loading product configuration...</span>
      </div>
    );
  }

  if (error || !initialValues) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 flex items-start gap-3">
        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold text-base">Product Not Found</h2>
          <p className="text-xs text-red-700 mt-1">
            {error || "Could not retrieve the requested product details."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProductForm
      isEdit={true}
      productId={productId}
      initialValues={initialValues}
    />
  );
}

