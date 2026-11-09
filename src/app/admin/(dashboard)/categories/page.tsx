"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  Save,
  Sparkles,
} from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  sortOrder: number;
  _count?: {
    products: number;
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const fetchCategories = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/categories");
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load categories");
      }
      setCategories(Array.isArray(json.data) ? json.data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error loading categories";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/categories")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) setCategories(Array.isArray(json.data) ? json.data : []);
      })
      .catch((err) => {
        if (!ignore) setErrorMessage(err instanceof Error ? err.message : "Error loading categories");
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("");
    setActive(true);
    setSortOrder(categories.length * 10);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setActive(cat.active);
    setSortOrder(cat.sortOrder);
    setFormError(null);
    setIsModalOpen(true);
  };

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          image,
          active,
          sortOrder,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save category");
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving category";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to delete category");
      }
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting category";
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#32190D]/10">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#32190D]">
            Categories Management
          </h1>
          <p className="text-xs text-[#32190D]/70 mt-1">
            Organize cakes, brownies, pastries, and treats into elegant collections.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#32190D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#432314] transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} className="text-[#D6A64B]" />
          <span>New Category</span>
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white border border-[#32190D]/10 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-[#32190D]/60 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="animate-spin text-[#D6A64B]" />
            <span>Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-16 text-center">
            <FolderTree size={32} className="mx-auto text-[#32190D]/20 mb-2" />
            <p className="text-sm font-semibold text-[#32190D]">No categories created yet</p>
            <p className="text-xs text-[#32190D]/60 mt-1">
              Create your first bakery category to group your products.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 mt-4 rounded-lg bg-[#32190D] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#432314]"
            >
              <Plus size={14} className="text-[#D6A64B]" />
              <span>Create Category</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F3E9]/50 border-b border-[#32190D]/10 text-[#32190D]/70 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Collection</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Order</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#32190D]/5">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#F8F3E9]/30 transition-colors">
                    {/* Image & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F8F3E9] shrink-0 border border-[#32190D]/10">
                          {cat.image ? (
                            <ImagePlaceholder
                              src={cat.image}
                              alt={cat.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#D6A64B]">
                              <Sparkles size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#32190D]">
                            {cat.name}
                          </div>
                          {cat._count?.products !== undefined && (
                            <div className="text-[11px] text-[#32190D]/60">
                              {cat._count.products} products
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#32190D]/70">
                      {cat.slug}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-[#32190D]/70">
                      {cat.description || "—"}
                    </td>

                    {/* Sort Order */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-[#32190D]/80">
                      {cat.sortOrder}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          cat.active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200"
                        }`}
                      >
                        {cat.active ? (
                          <>
                            <CheckCircle2 size={11} />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={11} />
                            <span>Hidden</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-md hover:bg-[#F8F3E9] text-[#32190D]/70 hover:text-[#32190D] transition-colors"
                          title="Edit category"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-[#32190D]/40 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 size={15} />
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#32190D]/10 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#32190D]/10">
              <h2 className="font-serif text-lg font-bold text-[#32190D]">
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#32190D]/50 hover:text-[#32190D]"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Signature Cakes"
                  className="mt-1 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="signature-cakes"
                  className="mt-1 w-full font-mono text-xs rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Artisanal layered cakes crafted for celebratory moments..."
                  className="mt-1 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <ImageUpload
                  label="Category Cover Image"
                  value={image}
                  onChange={(url) => setImage(url as string)}
                  folder="krumbistry/categories"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="mt-1 w-full rounded-lg border border-[#32190D]/15 bg-[#F8F3E9]/30 px-3 py-2 text-xs text-[#32190D] focus:border-[#D6A64B] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      className="rounded border-[#32190D]/20 text-[#D6A64B] focus:ring-[#D6A64B]"
                    />
                    <span className="text-xs font-semibold text-[#32190D]">
                      Active in Menu
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#32190D]/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[#32190D]/15 px-3 py-1.5 text-xs font-semibold text-[#32190D] hover:bg-[#F8F3E9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#32190D] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#432314] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin text-[#D6A64B]" />
                  ) : (
                    <Save size={13} className="text-[#D6A64B]" />
                  )}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

