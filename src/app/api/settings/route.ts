import { NextResponse } from "next/server";
import { getSettings } from "@/services/settingsService";

export async function GET() {
  try {
    const settings = await getSettings();

    return NextResponse.json(
      {
        success: true,
        data: {
          deliveryFee: settings.deliveryFee,
          freeDeliveryThreshold: settings.freeDeliveryThreshold,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve checkout settings." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
