import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary using server environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

/**
 * Upload an image buffer or base64 data URI to Cloudinary securely on the server
 */
export async function uploadImageToCloudinary(
  fileDataUri: string,
  folder = "krumbistry/products"
): Promise<UploadResult> {
  const isConfigured =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (!isConfigured) {
    // Graceful fallback for local development before Cloudinary credentials are provided
    const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return {
      publicId: `${folder}/${mockId}`,
      secureUrl: fileDataUri.startsWith("data:")
        ? fileDataUri
        : `/images/placeholder-product.jpg`,
      format: "jpg",
    };
  }

  const result = await cloudinary.uploader.upload(fileDataUri, {
    folder,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Generate an optimized and transformed Cloudinary image URL
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options?: {
    width?: number;
    height?: number;
    crop?: "fill" | "scale" | "fit" | "thumb";
    quality?: "auto" | number;
  }
): string {
  if (!publicIdOrUrl) return "/images/placeholder-cake-1.jpg";

  // If already a full URL or local path, return as is
  if (publicIdOrUrl.startsWith("http") || publicIdOrUrl.startsWith("/")) {
    return publicIdOrUrl;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "krumbistry";
  const width = options?.width ? `w_${options.width},` : "";
  const height = options?.height ? `h_${options.height},` : "";
  const crop = options?.crop ? `c_${options.crop},` : "c_fill,";
  const quality = options?.quality ? `q_${options.quality},` : "q_auto,";

  return `https://res.cloudinary.com/${cloudName}/image/upload/${crop}${width}${height}${quality}f_auto/${publicIdOrUrl}`;
}

/**
 * Delete asset from Cloudinary
 */
export async function deleteCloudinaryAsset(publicId: string): Promise<boolean> {
  const isConfigured =
    Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
    Boolean(process.env.CLOUDINARY_API_KEY) &&
    Boolean(process.env.CLOUDINARY_API_SECRET);

  if (!isConfigured || publicId.startsWith("mock-")) {
    return true;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

