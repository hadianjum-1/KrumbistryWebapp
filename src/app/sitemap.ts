import { MetadataRoute } from "next";
import { initialProducts } from "@/data/mockCatalog";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://krumbistry.com";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/menu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/custom-orders`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
  ];

  let productSlugs: string[] = [];

  try {
    const dbProducts = await db.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    if (dbProducts.length > 0) {
      productSlugs = dbProducts.map((p) => p.slug);
    }
  } catch {
    // Database fallback to mock catalog
    productSlugs = initialProducts.filter((p) => p.published).map((p) => p.slug);
  }

  if (productSlugs.length === 0) {
    productSlugs = initialProducts.map((p) => p.slug);
  }

  const productRoutes: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${baseUrl}/menu/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}

