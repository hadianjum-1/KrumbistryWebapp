import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { updateSiteSettingsSchema } from "@/lib/validations";
import { getSettings, updateSettings } from "@/services/settingsService";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  return NextResponse.json({ success: true, data: settings });
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const json = await request.json();
    const validated = updateSiteSettingsSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await updateSettings(validated.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error("PATCH /api/admin/settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

