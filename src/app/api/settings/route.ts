import { NextResponse } from "next/server";
import { getSettings } from "@/services/settingsService";

export async function GET() {
  try {
    const settings = await getSettings();

    return NextResponse.json(
      {
        success: true,
        data: {
          bakeryName: settings.bakeryName,
          tagline: settings.tagline,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          whatsappNumber: settings.whatsappNumber,
          address: settings.address,
          openingHours: settings.openingHours,
          currency: settings.currency,
          currencySymbol: settings.currencySymbol,
          deliveryFee: settings.deliveryFee,
          freeDeliveryThreshold: settings.freeDeliveryThreshold,
          minimumOrderAmount: settings.minimumOrderAmount,
          instagramUrl: settings.instagramUrl,
          facebookUrl: settings.facebookUrl,
          tiktokUrl: settings.tiktokUrl,
          announcementText: settings.announcementText,
          announcementSubtext: settings.announcementSubtext,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve store settings." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
