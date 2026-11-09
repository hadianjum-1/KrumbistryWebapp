import { NextRequest, NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import { sendNewsletterWelcomeEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = newsletterSchema.safeParse(json);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const subscriberEmail = validated.data.email.toLowerCase();
    let isNewSubscriber = true;

    try {
      const existing = await db.newsletterSubscriber.findUnique({
        where: { email: subscriberEmail },
      });
      isNewSubscriber = !existing || !existing.active;

      await db.newsletterSubscriber.upsert({
        where: { email: subscriberEmail },
        update: { active: true },
        create: { email: subscriberEmail, active: true },
      });
    } catch (e) {
      console.warn("Newsletter subscriber database fallback:", e);
    }

    // Send welcome confirmation email to the subscriber (fire-and-forget)
    if (isNewSubscriber) {
      sendNewsletterWelcomeEmail(subscriberEmail).catch((err) =>
        console.error("Newsletter welcome email failed:", err)
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscribed to KRUMBISTRY newsletter successfully.",
    });
  } catch (error: unknown) {
    console.error("POST /api/newsletter error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process newsletter subscription." },
      { status: 500 }
    );
  }
}
