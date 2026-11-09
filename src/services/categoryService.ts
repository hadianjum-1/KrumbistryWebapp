import { Category as PrismaCategory, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { initialCategories } from "@/data/mockCatalog";
import { Category } from "@/types";

// In-memory cache for high performance & instant navigation (<1ms response)
const CATEGORY_CACHE_TTL_MS = 60 * 1000; // 60 seconds
let categoriesCache: { [key: string]: { data: Category[]; expiresAt: number } } = {};
let categoryByIdCache: { [id: string]: { data: Category | null; expiresAt: number } } = {};

export function invalidateCategoriesCache() {
  categoriesCache = {};
  categoryByIdCache = {};
}

export async function getCategories(activeOnly = true): Promise<Category[]> {
  const cacheKey = `active_${activeOnly}`;
  const now = Date.now();
  const cached = categoriesCache[cacheKey];

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const categories = await db.category.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { sortOrder: "asc" },
    });

    if (categories.length > 0) {
      const mapped = categories.map((c: PrismaCategory) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        active: c.active,
        sortOrder: c.sortOrder,
      }));

      categoriesCache[cacheKey] = {
        data: mapped,
        expiresAt: now + CATEGORY_CACHE_TTL_MS,
      };

      return mapped;
    }
  } catch (error) {
    console.warn("Database getCategories fallback:", error);
  }

  const fallback = initialCategories.filter((c) => (activeOnly ? c.active : true));
  categoriesCache[cacheKey] = {
    data: fallback,
    expiresAt: now + CATEGORY_CACHE_TTL_MS,
  };
  return fallback;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const now = Date.now();
  const cached = categoryByIdCache[id];
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const c = await db.category.findUnique({ where: { id } });
    if (c) {
      const mapped: Category = {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        active: c.active,
        sortOrder: c.sortOrder,
      };

      categoryByIdCache[id] = {
        data: mapped,
        expiresAt: now + CATEGORY_CACHE_TTL_MS,
      };

      return mapped;
    }
  } catch (error) {
    console.warn("Database getCategoryById fallback:", error);
  }

  const mock = initialCategories.find((c) => c.id === id) || null;
  categoryByIdCache[id] = {
    data: mock,
    expiresAt: now + CATEGORY_CACHE_TTL_MS,
  };
  return mock;
}

export async function createCategory(data: Prisma.CategoryCreateInput): Promise<Category> {
  invalidateCategoriesCache();
  const c = await db.category.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image,
      active: data.active ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    active: c.active,
    sortOrder: c.sortOrder,
  };
}

export async function updateCategory(
  id: string,
  data: Prisma.CategoryUpdateInput
): Promise<Category> {
  invalidateCategoriesCache();
  const c = await db.category.update({
    where: { id },
    data,
  });

  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    active: c.active,
    sortOrder: c.sortOrder,
  };
}

export async function deleteCategory(id: string): Promise<boolean> {
  invalidateCategoriesCache();
  await db.category.delete({ where: { id } });
  return true;
}
