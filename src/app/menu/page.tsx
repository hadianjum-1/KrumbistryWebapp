"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Filter,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import { initialCategories, initialProducts } from "@/data/mockCatalog";
import { siteSettings } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { getProductOrderWhatsAppUrl } from "@/lib/whatsapp";
import { Category, Product } from "@/types";

type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("category") || "all";
    }
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const { addToCart } = useCart();

  // Sync live products and categories from database API
  useEffect(() => {
    let ignore = false;
    Promise.all([fetch("/api/products"), fetch("/api/categories")])
      .then(async ([prodRes, catRes]) => {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        if (!ignore) {
          if (prodData.success && Array.isArray(prodData.data) && prodData.data.length > 0) {
            setProducts(prodData.data);
          }
          if (catData.success && Array.isArray(catData.data) && catData.data.length > 0) {
            setCategories(catData.data);
          }
        }
      })
      .catch((err) => console.warn("Live catalog fetch fallback:", err));
    return () => {
      ignore = true;
    };
  }, []);

  const handleQuickAdd = (product: Product) => {
    addToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1800);
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === "all" ||
          product.categoryId === selectedCategory ||
          product.category?.slug === selectedCategory ||
          product.category?.id === selectedCategory;

        const matchesSearch =
          searchQuery.trim() === "" ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.ingredients.some((ing) =>
            ing.toLowerCase().includes(searchQuery.toLowerCase())
          );

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") {
          const priceA = a.salePrice ?? a.price;
          const priceB = b.salePrice ?? b.price;
          return priceA - priceB;
        }
        if (sortBy === "price-desc") {
          const priceA = a.salePrice ?? a.price;
          const priceB = b.salePrice ?? b.price;
          return priceB - priceA;
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Default "featured"
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.sortOrder - b.sortOrder;
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8F3E9] text-[#32190D]">
        {/* Banner Section */}
        <section className="page-hero relative overflow-hidden border-b border-[#32190D]/10 bg-[#FAF6EE] py-16 md:py-24">
          <div className="site-container">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D6A64B]/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#98743A] mb-6">
                <Sparkles size={13} className="text-[#B88632]" />
                THE ARTISANAL COLLECTION
              </div>
              <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.05] tracking-tight">
                Our Signature{" "}
                <em className="text-[#D6A64B] font-display italic font-normal">
                  Menu.
                </em>
              </h1>
              <p className="mt-6 text-base md:text-lg leading-relaxed text-[#806E5D] max-w-2xl">
                Every creation is freshly baked with French butter, single-origin Belgian chocolate,
                and pure Madagascar bourbon vanilla. Select a category below or search for your favorite treat.
              </p>
            </div>
          </div>
        </section>

        {/* Filter and Controls Bar */}
        <section className="sticky top-[88px] z-10 bg-[#F8F3E9]/95 backdrop-blur-md border-b border-[#32190D]/10 py-4">
          <div className="site-container">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === "all"
                      ? "bg-[#32190D] text-[#F8F3E9]"
                      : "bg-[#F1EADD] text-[#6F5A4B] hover:bg-[#E6DEC9]"
                  }`}
                >
                  All Treats ({products.length})
                </button>

                {categories.map((category) => {
                  const count = products.filter(
                    (p) => p.categoryId === category.id || p.category?.slug === category.slug
                  ).length;
                  const isSelected =
                    selectedCategory === category.id || selectedCategory === category.slug;

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.slug || category.id)}
                      className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-colors shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-[#32190D] text-[#F8F3E9]"
                          : "bg-[#F1EADD] text-[#6F5A4B] hover:bg-[#E6DEC9]"
                      }`}
                    >
                      {category.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search & Sort Row */}
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <Search
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#806E5D] pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search cakes, flavor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#FAF6EE] border border-[#32190D]/15 rounded-full py-2 pl-9 pr-8 text-xs text-[#32190D] placeholder:text-[#806E5D] outline-none focus:border-[#B88632] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#806E5D] hover:text-[#32190D]"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Sort products by"
                    className="appearance-none bg-[#FAF6EE] border border-[#32190D]/15 rounded-full py-2 pl-4 pr-9 text-xs font-medium text-[#32190D] outline-none focus:border-[#B88632] cursor-pointer"
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest Creations</option>
                  </select>
                  <Filter
                    size={12}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#806E5D] pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Catalog Grid */}
        <section className="section py-12 md:py-16">
          <div className="site-container">
            {filteredProducts.length === 0 ? (
              <div className="py-20 text-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full border border-[#D6A64B]/40 bg-[#FAF6EE] grid place-items-center text-[#B88632] mx-auto mb-4">
                  <Sparkles size={24} />
                </div>
                <h3 className="font-serif text-2xl font-medium text-[#32190D]">
                  No delicacies found
                </h3>
                <p className="mt-2 text-sm text-[#806E5D]">
                  We couldn&apos;t find any items matching your selected criteria.
                  Try searching for a different keyword or view all treats.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="button button-dark button-small"
                  >
                    Reset Filters
                  </button>
                  <Link href="/custom-orders" className="button button-outline button-small">
                    Request Custom Order
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {filteredProducts.map((product) => {
                  const currentPrice = product.salePrice ?? product.price;
                  const isAdded = addedProductId === product.id;

                  return (
                    <article
                      key={product.id}
                      className="group flex flex-col bg-white border border-[#32190D]/10 rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                      {/* Product Card Image Link */}
                      <Link
                        href={`/menu/${product.slug}`}
                        className="relative block aspect-4/3 overflow-hidden bg-[#FAF6EE]"
                        aria-label={`View details for ${product.name}`}
                      >
                        <ImagePlaceholder
                          src={product.mainImage}
                          label={product.name}
                          className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                            product.tone || "product-one"
                          }`}
                          number={product.sku || undefined}
                        />

                        {product.bestseller && (
                          <span className="absolute top-3 left-3 bg-[#D6A64B] text-[#32190D] text-[9px] font-bold tracking-widest px-2.5 py-1 uppercase shadow-xs">
                            Bestseller
                          </span>
                        )}

                        {product.tag && !product.bestseller && (
                          <span className="absolute top-3 left-3 bg-[#F8F3E9] text-[#32190D] text-[9px] font-bold tracking-widest px-2.5 py-1 uppercase shadow-xs">
                            {product.tag}
                          </span>
                        )}

                        <span className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#F8F3E9] text-[#32190D] grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <ArrowUpRight size={16} />
                        </span>
                      </Link>

                      {/* Product Info */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-[#98743A] font-semibold uppercase tracking-wider mb-1.5">
                            <span>{product.size || "Artisanal"}</span>
                            {product.available ? (
                              <span className="text-emerald-700">Freshly Baked</span>
                            ) : (
                              <span className="text-amber-700">Sold Out</span>
                            )}
                          </div>

                          <h2 className="font-serif text-lg font-medium leading-snug group-hover:text-[#B88632] transition-colors">
                            <Link href={`/menu/${product.slug}`}>{product.name}</Link>
                          </h2>

                          <p className="mt-2 text-xs text-[#806E5D] line-clamp-2 leading-relaxed">
                            {product.shortDescription}
                          </p>
                        </div>

                        {/* Price & Action Row */}
                        <div className="mt-5 pt-4 border-t border-[#32190D]/8 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-[#32190D]">
                              {siteSettings.currencySymbol} {currentPrice.toLocaleString()}
                            </span>
                            {product.salePrice && (
                              <span className="ml-2 text-xs text-[#806E5D] line-through">
                                {siteSettings.currencySymbol} {product.price.toLocaleString()}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* WhatsApp Direct */}
                            <a
                              href={getProductOrderWhatsAppUrl(product, 1)}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Order ${product.name} on WhatsApp`}
                              className="w-8 h-8 rounded-full border border-[#32190D]/15 hover:border-[#25D366] hover:bg-[#25D366]/10 text-[#806E5D] hover:text-[#25D366] grid place-items-center transition-colors"
                              title="Order via WhatsApp"
                            >
                              <MessageCircle size={15} />
                            </a>

                            {/* Quick Add Button */}
                            <button
                              type="button"
                              onClick={() => handleQuickAdd(product)}
                              disabled={!product.available}
                              aria-label={`Add ${product.name} to bag`}
                              className={`w-8 h-8 rounded-full grid place-items-center transition-all ${
                                isAdded
                                  ? "bg-emerald-700 text-white"
                                  : product.available
                                  ? "bg-[#32190D] text-[#F8F3E9] hover:bg-[#B88632]"
                                  : "bg-[#32190D]/20 text-[#32190D]/40 cursor-not-allowed"
                              }`}
                              title={product.available ? "Add to bag" : "Item Sold Out"}
                            >
                              {isAdded ? <Check size={14} /> : <Plus size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Custom Order CTA Strip */}
        <section className="bg-[#FAF6EE] border-t border-[#32190D]/10 py-16">
          <div className="site-container flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#98743A]">
                CELEBRATIONS & BESPOKE CREATIONS
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-medium mt-1">
                Looking for something made just for you?
              </h2>
              <p className="text-xs md:text-sm text-[#806E5D] mt-2 max-w-xl">
                From multi-tiered wedding centrepieces to branded dessert tables, our pastry artists create custom cakes tailored to your celebration.
              </p>
            </div>
            <Link
              href="/custom-orders"
              className="button button-dark text-xs py-3.5 px-6 whitespace-nowrap flex items-center gap-2"
            >
              <span>Design a Custom Cake</span>
              <ArrowRight size={14} className="text-[#D6A64B]" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
