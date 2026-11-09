import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { initialProducts, initialCategories } from "@/data/mockCatalog";
import { Product } from "@/types";

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: { category: true };
}>;

// In-memory cache for ultra-fast storefront page loads (<1ms)
const PRODUCT_CACHE_TTL_MS = 60 * 1000; // 60 seconds
let productsQueryCache: { [key: string]: { data: Product[]; expiresAt: number } } = {};
let productSlugCache: { [slug: string]: { data: Product | null; expiresAt: number } } = {};
let productIdCache: { [id: string]: { data: Product | null; expiresAt: number } } = {};

export function invalidateProductsCache() {
  productsQueryCache = {};
  productSlugCache = {};
  productIdCache = {};
}

function mapPrismaProductToDomain(p: ProductWithCategory): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    shortDescription: p.shortDescription,
    description: p.description,
    price: Number(p.price),
    salePrice: p.salePrice ? Number(p.salePrice) : null,
    sku: p.sku,
    categoryId: p.categoryId,
    category: p.category
      ? {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
          description: p.category.description,
          active: p.category.active,
          sortOrder: p.category.sortOrder,
        }
      : undefined,
    mainImage: p.mainImage,
    gallery: p.gallery || [],
    ingredients: p.ingredients || [],
    allergens: p.allergens || [],
    size: p.size,
    weight: p.weight,
    servings: p.servings,
    preparationTime: p.preparationTime,
    featured: p.featured,
    bestseller: p.bestseller,
    available: p.available,
    published: p.published,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export async function getProducts(options?: {
  categoryId?: string;
  categorySlug?: string;
  featured?: boolean;
  bestseller?: boolean;
  publishedOnly?: boolean;
  search?: string;
}): Promise<Product[]> {
  const cacheKey = JSON.stringify(options || {});
  const now = Date.now();
  const cached = productsQueryCache[cacheKey];

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const where: Prisma.ProductWhereInput = {};

    if (options?.publishedOnly !== false) {
      where.published = true;
    }
    if (options?.featured !== undefined) {
      where.featured = options.featured;
    }
    if (options?.bestseller !== undefined) {
      where.bestseller = options.bestseller;
    }
    if (options?.categoryId) {
      where.categoryId = options.categoryId;
    }
    if (options?.categorySlug) {
      where.category = { slug: options.categorySlug };
    }
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { shortDescription: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const products = await db.product.findMany({
      where,
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (products.length > 0) {
      const mapped = products.map(mapPrismaProductToDomain);
      productsQueryCache[cacheKey] = {
        data: mapped,
        expiresAt: now + PRODUCT_CACHE_TTL_MS,
      };
      return mapped;
    }
  } catch (error) {
    console.warn("Database product query fallback:", error);
  }

  // Graceful fallback to initial catalog
  const fallback = initialProducts.filter((p) => {
    if (options?.publishedOnly !== false && !p.published) return false;
    if (options?.featured !== undefined && p.featured !== options.featured) return false;
    if (options?.bestseller !== undefined && p.bestseller !== options.bestseller) return false;
    if (options?.categoryId && p.categoryId !== options.categoryId) return false;
    if (options?.categorySlug) {
      const cat = initialCategories.find((c) => c.slug === options.categorySlug);
      if (!cat || p.categoryId !== cat.id) return false;
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q);
    }
    return true;
  });

  productsQueryCache[cacheKey] = {
    data: fallback,
    expiresAt: now + PRODUCT_CACHE_TTL_MS,
  };
  return fallback;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const now = Date.now();
  const cached = productSlugCache[slug];
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const p = await db.product.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (p) {
      const mapped = mapPrismaProductToDomain(p);
      productSlugCache[slug] = {
        data: mapped,
        expiresAt: now + PRODUCT_CACHE_TTL_MS,
      };
      return mapped;
    }
  } catch (error) {
    console.warn("Database getProductBySlug fallback:", error);
  }

  const mock = initialProducts.find((p) => p.slug === slug) || null;
  productSlugCache[slug] = {
    data: mock,
    expiresAt: now + PRODUCT_CACHE_TTL_MS,
  };
  return mock;
}

export async function getProductById(id: string): Promise<Product | null> {
  const now = Date.now();
  const cached = productIdCache[id];
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const p = await db.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (p) {
      const mapped = mapPrismaProductToDomain(p);
      productIdCache[id] = {
        data: mapped,
        expiresAt: now + PRODUCT_CACHE_TTL_MS,
      };
      return mapped;
    }
  } catch (error) {
    console.warn("Database getProductById fallback:", error);
  }

  const mock = initialProducts.find((p) => p.id === id) || null;
  productIdCache[id] = {
    data: mock,
    expiresAt: now + PRODUCT_CACHE_TTL_MS,
  };
  return mock;
}

export async function createProduct(data: Prisma.ProductUncheckedCreateInput): Promise<Product> {
  invalidateProductsCache();
  const p = await db.product.create({
    data: {
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription,
      description: data.description,
      price: data.price,
      salePrice: data.salePrice,
      sku: data.sku,
      categoryId: data.categoryId,
      mainImage: data.mainImage,
      gallery: data.gallery || [],
      ingredients: data.ingredients || [],
      allergens: data.allergens || [],
      size: data.size,
      weight: data.weight,
      servings: data.servings,
      preparationTime: data.preparationTime,
      featured: data.featured ?? false,
      bestseller: data.bestseller ?? false,
      available: data.available ?? true,
      published: data.published ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
    include: { category: true },
  });

  return mapPrismaProductToDomain(p);
}

export async function updateProduct(
  id: string,
  data: Prisma.ProductUncheckedUpdateInput
): Promise<Product> {
  invalidateProductsCache();
  const p = await db.product.update({
    where: { id },
    data,
    include: { category: true },
  });

  return mapPrismaProductToDomain(p);
}

export async function deleteProduct(id: string): Promise<boolean> {
  invalidateProductsCache();
  await db.product.delete({ where: { id } });
  return true;
}
