import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { getStorageStats } from "@/services/storageService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Verify administrative authentication
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Admin privileges required." },
      { status: 401 }
    );
  }

  try {
    // 2. Check if client explicitly requests a forced refresh
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    // 3. Fetch unified stats via storage service (handles provider calls, caching, & throttling)
    const stats = await getStorageStats(forceRefresh);

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: unknown) {
    console.error("GET /api/admin/system/storage error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve system storage metrics.",
      },
      { status: 500 }
    );
  }
}
