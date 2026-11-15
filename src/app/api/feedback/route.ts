import { NextRequest, NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/validations";
import { sendFeedbackEmails } from "@/lib/email";

// In-memory rate limiter: maximum 5 feedback submissions per 15 minutes per IP
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(identifier: string): boolean {
  const now = Date.now();

  // Periodic cleanup of expired entries if map grows
  if (rateLimitMap.size > 500) {
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 1. IP identification for basic spam protection
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You have submitted multiple feedbacks recently. Please try again in a few minutes.",
        },
        { status: 429 }
      );
    }

    // 2. Parse and validate payload
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    const validated = feedbackSchema.safeParse(body);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || "Invalid feedback data provided.";

      return NextResponse.json(
        {
          success: false,
          error: firstErrorMessage,
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validated.data;

    // 3. Silent honeypot drop (bot prevention)
    if (data.honeypot && data.honeypot.trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: "Your feedback has been successfully submitted.",
      });
    }

    // 4. Send emails via Nodemailer utility
    try {
      await sendFeedbackEmails({
        fullName: data.fullName,
        email: data.email,
        overallExperience: data.overallExperience,
        foodQuality: data.foodQuality,
        serviceExperience: data.serviceExperience,
        comments: data.comments || null,
      });
    } catch (emailError) {
      // Log on server, but do not expose SMTP credentials or technical stack traces to the customer
      console.error("Feedback email dispatch error:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Your feedback has been successfully submitted. We appreciate your time and will use your suggestions to improve your experience.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("POST /api/feedback unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to submit feedback at this moment. Please check your connection and try again.",
      },
      { status: 500 }
    );
  }
}
