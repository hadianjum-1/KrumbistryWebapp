"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageCircle,
  Minus,
  Plus,
  Scale,
  Share2,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import { Product } from "@/types";
import { siteSettings } from "@/config/site";
import { useCart } from "@/context/CartContext";
import { getProductOrderWhatsAppUrl } from "@/lib/whatsapp";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailView({
  product,
  relatedProducts,
}: ProductDetailViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { addToCart } = useCart();

  const currentPrice = product.salePrice ?? product.price;

  // Assemble complete image showcase: primary showcase image ALWAYS at index 0, followed by gallery images
  const images = Array.from(
    new Set(
      [
        product.mainImage,
        ...(Array.isArray(product.gallery) ? product.gallery : []),
      ].filter((img): img is string => typeof img === "string" && img.trim().length > 0)
    )
  );

  const activeImage = images[selectedImageIndex] || product.mainImage || null;

  const handleAddToCart = () => {
    addToCart(product, quantity, specialNotes);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const whatsAppUrl = getProductOrderWhatsAppUrl(
    product,
    quantity,
    specialNotes
  );

  return (
    <div className="site-container py-10 md:py-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs text-[#806E5D] mb-8 flex items-center gap-2">
        <Link href="/" className="hover:text-[#32190D]">Home</Link>
        <span>/</span>
        <Link href="/menu" className="hover:text-[#32190D]">Menu</Link>
        <span>/</span>
        <span className="text-[#32190D] font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left: Gallery & Visuals */}
        <div className="space-y-4">
          <div className="relative aspect-square border border-[#32190D]/10 bg-[#FAF6EE] rounded-sm overflow-hidden group">
            <ImagePlaceholder
              key={activeImage || "empty"}
              src={activeImage}
              alt={product.name}
              label={`${product.name} — View ${selectedImageIndex + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${product.tone || "product-one"}`}
              number={product.sku}
            />

            {product.tag && (
              <span className="absolute top-4 left-4 bg-[#F8F3E9] text-[#32190D] text-xs font-bold tracking-widest px-3 py-1.5 uppercase shadow-xs">
                {product.tag}
              </span>
            )}

            {/* Subtle View Indicator Badge */}
            {images.length > 1 && (
              <span className="absolute top-4 right-4 bg-[#32190D]/80 backdrop-blur-xs text-[#F8F3E9] text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full uppercase">
                {selectedImageIndex === 0 ? "Primary Showcase" : `Photo ${selectedImageIndex + 1} of ${images.length}`}
              </span>
            )}

            {/* Previous / Next Arrow Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#32190D] shadow-md grid place-items-center transition-all hover:scale-110 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#32190D] shadow-md grid place-items-center transition-all hover:scale-110 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`relative w-20 h-20 rounded-xs overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    selectedImageIndex === index
                      ? "border-[#D6A64B] scale-102 ring-2 ring-[#D6A64B]/30"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  title={index === 0 ? "Primary Showcase Image" : `Additional View ${index}`}
                >
                  <ImagePlaceholder
                    src={img}
                    alt={`${product.name} preview ${index + 1}`}
                    label={`View ${index + 1}`}
                    className={`w-full h-full object-cover ${product.tone || "product-one"}`}
                    number={`0${index + 1}`}
                  />
                  {index === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-[#32190D]/85 text-[#F8F3E9] text-[8px] font-bold text-center py-0.5 uppercase tracking-wider">
                      Primary
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Value Promise Strip under image */}
          <div className="p-4 bg-[#FAF6EE] border border-[#32190D]/10 rounded-sm grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#B88632] shrink-0" />
              <span>Baked Fresh Every Day</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Sparkles size={16} className="text-[#B88632] shrink-0" />
              <span>Artisanal European Butter</span>
            </div>
          </div>
        </div>

        {/* Right: Product Details & Purchase Actions */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="inline-block px-3 py-1 bg-[#F1EADD] text-[#98743A] text-xs font-bold uppercase tracking-widest rounded-full">
                {product.size || "Artisanal Selection"}
              </span>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-xs text-[#806E5D] hover:text-[#32190D] transition-colors cursor-pointer"
                title="Share product link"
              >
                <Share2 size={14} />
                {copiedLink ? "Link Copied!" : "Share"}
              </button>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl font-medium tracking-tight text-[#32190D]">
              {product.name}
            </h1>

            {/* Price Row */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-3xl font-semibold text-[#98743A]">
                {siteSettings.currencySymbol} {currentPrice.toLocaleString()}
              </span>
              {product.salePrice && (
                <span className="text-lg text-[#806E5D] line-through">
                  {siteSettings.currencySymbol} {product.price.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium ml-2">
                {product.available ? "Freshly In Stock" : "Pre-Order Only"}
              </span>
            </div>
          </div>

          {/* Short & Long Description */}
          <div className="prose prose-sm text-[#806E5D] leading-relaxed border-t border-[#32190D]/10 pt-5">
            <p className="font-medium text-[#32190D] text-sm mb-2">
              {product.shortDescription}
            </p>
            <p className="text-sm">
              {product.description}
            </p>
          </div>

          {/* Specifications Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 border-y border-[#32190D]/10">
            {product.weight && (
              <div className="flex items-center gap-2 text-xs text-[#6F5A4B]">
                <Scale size={16} className="text-[#B88632] shrink-0" />
                <div>
                  <span className="block text-[10px] text-[#806E5D] uppercase">Weight</span>
                  <strong>{product.weight}</strong>
                </div>
              </div>
            )}
            {product.servings && (
              <div className="flex items-center gap-2 text-xs text-[#6F5A4B]">
                <Users size={16} className="text-[#B88632] shrink-0" />
                <div>
                  <span className="block text-[10px] text-[#806E5D] uppercase">Servings</span>
                  <strong>{product.servings}</strong>
                </div>
              </div>
            )}
            {product.preparationTime && (
              <div className="flex items-center gap-2 text-xs text-[#6F5A4B]">
                <Clock size={16} className="text-[#B88632] shrink-0" />
                <div>
                  <span className="block text-[10px] text-[#806E5D] uppercase">Notice</span>
                  <strong>{product.preparationTime}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Ingredients & Allergens Box */}
          <div className="space-y-4 bg-[#FAF6EE] p-5 border border-[#32190D]/10 rounded-sm">
            <div>
              <h3 className="font-serif text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#B88632]" /> Premium Ingredients
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {product.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="px-2.5 py-1 bg-white border border-[#32190D]/10 text-xs rounded-full text-[#6F5A4B]"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>

            {product.allergens.length > 0 && (
              <div className="pt-3 border-t border-[#32190D]/10">
                <h4 className="text-xs font-semibold text-[#8C3A27] flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle size={13} /> Allergen Advisory
                </h4>
                <p className="text-xs text-[#806E5D]">
                  Contains: {product.allergens.join(", ")}. Prepared in a kitchen handling nuts and dairy.
                </p>
              </div>
            )}
          </div>

          {/* Custom Notes / Message on Cake */}
          <div>
            <label htmlFor="special-instructions" className="block text-xs font-semibold text-[#32190D] mb-1.5">
              Cake Message or Special Instructions (Optional)
            </label>
            <input
              id="special-instructions"
              type="text"
              placeholder="e.g. Happy 30th Birthday Sarah! / Eggless request"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#32190D]/15 rounded-sm text-xs outline-none focus:border-[#D6A64B]"
            />
          </div>

          {/* Purchase Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center border border-[#32190D]/20 rounded-sm bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-12 grid place-items-center hover:bg-[#32190D]/5 transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-semibold text-sm">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-12 grid place-items-center hover:bg-[#32190D]/5 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-1 button text-xs py-3.5 flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  isAdded
                    ? "bg-emerald-700 text-white"
                    : "button-dark"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check size={16} /> Added to Your Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add to Bag — {siteSettings.currencySymbol}{" "}
                    {(currentPrice * quantity).toLocaleString()}
                  </>
                )}
              </button>
            </div>

            {/* Direct WhatsApp Order CTA */}
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full button button-outline flex items-center justify-center gap-2 text-xs py-3.5 hover:bg-[#FAF6EE]"
            >
              <MessageCircle size={17} className="text-[#25D366]" />
              Order Instantly on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="mt-24 pt-16 border-t border-[#32190D]/10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#98743A] font-semibold">
                PAIR WITH SOMETHING SWEET
              </span>
              <h2 className="font-serif text-2xl md:text-4xl font-medium mt-1">
                You might also adore
              </h2>
            </div>
            <Link href="/menu" className="text-xs font-semibold text-[#B88632] hover:underline flex items-center gap-1">
              View Entire Menu <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => {
              const relPrice = rel.salePrice ?? rel.price;
              return (
                <Link
                  key={rel.id}
                  href={`/menu/${rel.slug}`}
                  className="group block bg-white border border-[#32190D]/10 rounded-sm overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="aspect-4/3 relative overflow-hidden bg-[#FAF6EE]">
                    <ImagePlaceholder
                      src={rel.mainImage}
                      alt={rel.name}
                      label={rel.name}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                        rel.tone || "product-one"
                      }`}
                      number={rel.sku}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-base font-medium group-hover:text-[#B88632] transition-colors">
                      {rel.name}
                    </h3>
                    <p className="text-xs text-[#806E5D] mt-1 line-clamp-1">
                      {rel.shortDescription}
                    </p>
                    <div className="mt-3 font-semibold text-xs text-[#32190D]">
                      {siteSettings.currencySymbol} {relPrice.toLocaleString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
