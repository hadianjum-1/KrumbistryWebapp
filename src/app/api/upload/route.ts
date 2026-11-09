import { NextRequest, NextResponse } from "next/server";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let fileDataUri = "";
    const folder = "krumbistry/custom-orders";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No image file provided" },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: "File exceeds 5MB size limit" },
          { status: 400 }
        );
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "Please upload a JPG, PNG, or WEBP image." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      fileDataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    } else {
      const json = await request.json();
      if (!json.file) {
        return NextResponse.json(
          { success: false, error: "No image data provided" },
          { status: 400 }
        );
      }
      fileDataUri = json.file;
    }

    const upload = await uploadImageToCloudinary(fileDataUri, folder);

    return NextResponse.json({
      success: true,
      url: upload.secureUrl,
      publicId: upload.publicId,
    });
  } catch (error: unknown) {
    console.error("POST /api/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload reference photo." },
      { status: 500 }
    );
  }
}

