import { db } from "@/lib/db";
import { siteSettings as defaultSettings } from "@/config/site";
import { SiteSettings } from "@/types";

const SETTINGS_CACHE_TTL_MS = 60 * 1000;
let cachedSettings: { data: SiteSettings; expiresAt: number } | null = null;

export function invalidateSettingsCache() {
  cachedSettings = null;
}

export async function getSettings(): Promise<SiteSettings> {
  const now = Date.now();
  if (cachedSettings && cachedSettings.expiresAt > now) {
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
      cachedSettings = {
        data: result,
        expiresAt: now + SETTINGS_CACHE_TTL_MS,
      };
      return result;
    }
  } catch (error) {
    console.warn("Database getSettings fallback:", error);
  }

  cachedSettings = {
    data: defaultSettings,
    expiresAt: now + SETTINGS_CACHE_TTL_MS,
  };
  return defaultSettings;
}

export async function updateSettings(data: Record<string, string | number>): Promise<SiteSettings> {
  invalidateSettingsCache();
  try {
    for (const [key, value] of Object.entries(data)) {
      await db.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
  } catch (error) {
    console.warn("Database updateSettings fallback:", error);
  }

  return getSettings();
}
