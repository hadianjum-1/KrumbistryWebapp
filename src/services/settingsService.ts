import { db } from "@/lib/db";
import { siteSettings as defaultSettings } from "@/config/site";
import { SiteSettings } from "@/types";

let cachedSettings: { data: SiteSettings; expiresAt: number } | null = null;

export async function getSettings(forceRefresh = false): Promise<SiteSettings> {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && cachedSettings.expiresAt > now) {
    return cachedSettings.data;
  }

  try {
    const records = await db.siteSetting.findMany();
    if (records.length > 0) {
      const settingsMap: Record<string, string | number> = { ...defaultSettings };
      for (const rec of records) {
        if (rec.key === "deliveryFee" || rec.key === "freeDeliveryThreshold" || rec.key === "minimumOrderAmount") {
          settingsMap[rec.key] = Number(rec.value) || 0;
        } else {
          settingsMap[rec.key] = rec.value;
        }
      }
      const result = settingsMap as unknown as SiteSettings;
      cachedSettings = { data: result, expiresAt: now + 30000 }; // Cache for 30 seconds
      return result;
    }
  } catch (error) {
    console.warn("Database getSettings fallback:", error);
  }

  return defaultSettings;
}

export async function updateSettings(data: Record<string, string | number>): Promise<SiteSettings> {
  cachedSettings = null; // Invalidate cache
  await Promise.all(
    Object.entries(data).map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return getSettings(true);
}
