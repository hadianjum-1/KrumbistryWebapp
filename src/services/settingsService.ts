import { db } from "@/lib/db";
import { siteSettings as defaultSettings } from "@/config/site";
import { SiteSettings } from "@/types";

export async function getSettings(): Promise<SiteSettings> {
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
      return settingsMap as unknown as SiteSettings;
    }
  } catch (error) {
    console.warn("Database getSettings fallback:", error);
  }

  return defaultSettings;
}

export async function updateSettings(data: Record<string, string | number>): Promise<SiteSettings> {
  await Promise.all(
    Object.entries(data).map(([key, value]) =>
      db.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  return getSettings();
}
