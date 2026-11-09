"use client";

import { useState, type ChangeEvent } from "react";
import { Loader2, UploadCloud, X } from "lucide-react";

interface ImageUploadProps {
  value: string | string[];
  onChange: (url: string | string[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
  folder?: string;
}

export default function ImageUpload({
  value,
  onChange,
  multiple = false,
  maxFiles = 4,
  label = "Upload Image",
  folder = "krumbistry/products",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const images: string[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (multiple && images.length + files.length > maxFiles) {
      setErrorMessage(`Maximum ${maxFiles} images allowed.`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 8MB.`);
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Upload failed");
        }

        return data.url as string;
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      if (multiple) {
        onChange([...images, ...uploadedUrls]);
      } else {
        onChange(uploadedUrls[0]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be re-selected if deleted
      e.target.value = "";
    }
  };

  const handleRemove = (indexToRemove: number) => {
    if (multiple) {
      const updated = images.filter((_, i) => i !== indexToRemove);
      onChange(updated);
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#32190D]">
          {label}
        </label>
      )}

      {/* Upload Zone */}
      {(!multiple && images.length === 0) || (multiple && images.length < maxFiles) ? (
        <div className="relative border-2 border-dashed border-[#D6A64B]/50 hover:border-[#D6A64B] bg-[#FAF6EE] rounded-sm p-6 text-center transition-colors cursor-pointer group">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={multiple}
            disabled={isUploading}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            title="Upload image file"
          />

          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
            {isUploading ? (
              <>
                <Loader2 size={24} className="text-[#B88632] animate-spin" />
                <span className="text-xs font-medium text-[#32190D]">
                  Uploading to Cloudinary...
                </span>
              </>
            ) : (
              <>
                <UploadCloud size={24} className="text-[#B88632] group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-[#32190D]">
                  Click or drag image to upload
                </span>
                <span className="text-[10px] text-[#806E5D]">
                  Supports JPG, PNG, WEBP (Max 8MB)
                </span>
              </>
            )}
          </div>
        </div>
      ) : null}

      {errorMessage && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded-xs">
          {errorMessage}
        </p>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-1">
          {images.map((src, index) => (
            <div
              key={index}
              className="relative w-24 h-24 rounded-sm border border-[#32190D]/15 overflow-hidden group bg-white shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Uploaded asset ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 w-5 h-5 bg-[#32190D]/80 hover:bg-red-700 text-white rounded-full grid place-items-center transition-colors cursor-pointer"
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

