import { NextRequest, NextResponse } from "next/server";
import { inquirySchema } from "@/lib/validations";
import { createInquiry } from "@/services/inquiryService";
import { sendInquiryEmails } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validated = inquirySchema.safeParse(json);

    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const errorMsg = Object.entries(fieldErrors)
        .map(([k, v]) => `${k}: ${v?.join(", ")}`)
        .join("; ");
      return NextResponse.json(
        {
          success: false,
          error: errorMsg || "Validation error",
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    // Silent honeypot drop
    if (validated.data.honeypot) {
      return NextResponse.json({ success: true, message: "Enquiry submitted" });
    }

    const result = await createInquiry({
      name: validated.data.name,
      email: validated.data.email,
      phone: validated.data.phone || undefined,
      subject: validated.data.subject,
      message: validated.data.message,
    });

    // Send transactional emails asynchronously
    sendInquiryEmails({
      name: validated.data.name,
      email: validated.data.email,
      phone: validated.data.phone,
      subject: validated.data.subject,
      message: validated.data.message,
    }).catch((err) => console.error("Email send failed:", err));

    return NextResponse.json(
      {
        success: true,
        message: "Enquiry submitted successfully",
        data: result.inquiry,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/inquiries error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit inquiry." },
      { status: 500 }
    );
  }
}
