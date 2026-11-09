import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    let fileDataUri = "";
    let folder = "krumbistry/products";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const customFolder = formData.get("folder") as string | null;
      if (customFolder) folder = customFolder;

      if (!file) {
        return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ success: false, error: "File exceeds 8MB maximum size limit" }, { status: 400 });
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: "Unsupported image format. Please upload JPG, PNG, or WEBP." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      fileDataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    } else {
      const json = await request.json();
      if (!json.file) {
        return NextResponse.json({ success: false, error: "No image data provided" }, { status: 400 });
      }
      fileDataUri = json.file;
      if (json.folder) folder = json.folder;
    }

    const upload = await uploadImageToCloudinary(fileDataUri, folder);

    // Save index in UploadedAsset asynchronously (does not block client upload response)
    db.uploadedAsset
      .create({
        data: {
          publicId: upload.publicId,
          secureUrl: upload.secureUrl,
          format: upload.format,
          width: upload.width,
          height: upload.height,
          bytes: upload.bytes,
          folder,
        },
      })
      .catch((e) => {
        console.warn("UploadedAsset record creation fallback:", e);
      });

    return NextResponse.json({
      success: true,
      url: upload.secureUrl,
      publicId: upload.publicId,
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/upload error:", error);
    const message = error instanceof Error ? error.message : "Image upload failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

