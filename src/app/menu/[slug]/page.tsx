import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetailView from "@/components/products/ProductDetailView";
import { initialProducts } from "@/data/mockCatalog";
import { siteSettings } from "@/config/site";
import { getProductBySlug, getProducts } from "@/services/productService";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return initialProducts.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | KRUMBISTRY Bake Shop",
      description: "The requested bakery item could not be found.",
    };
  }

  const currentPrice = product.salePrice ?? product.price;

  return {
    title: `${product.name} | KRUMBISTRY Bake Shop`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} — Luxury in Every Bite`,
      description: product.description,
      type: "website",
      locale: "en_US",
      siteName: siteSettings.bakeryName,
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription,
    },
    other: {
      "product:price:amount": currentPrice.toString(),
      "product:price:currency": siteSettings.currency,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts({ publishedOnly: true });
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.featured))
    .slice(0, 4);

  // Structured Data (JSON-LD) for Search Engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: siteSettings.bakeryName,
    },
    offers: {
      "@type": "Offer",
      price: product.salePrice ?? product.price,
      priceCurrency: siteSettings.currency,
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="min-h-screen bg-[#F8F3E9]">
        <ProductDetailView product={product} relatedProducts={relatedProducts} />
      </main>
      <Footer />
    </>
  );
}
