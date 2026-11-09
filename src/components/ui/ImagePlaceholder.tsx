"use client";

import { useState } from "react";

type ImagePlaceholderProps = {
  src?: string | null;
  alt?: string;
  label?: string;
  className?: string;
  number?: string;
};

export default function ImagePlaceholder({
  src,
  alt = "KRUMBISTRY Image",
  label = "Bakery Creation",
  className = "",
  number = "KR / 01",
}: ImagePlaceholderProps) {
  const [hasError, setHasError] = useState(false);

  if (src && !hasError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt || label}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div
      className={`image-placeholder ${className}`}
      role="img"
      aria-label={`${label} image placeholder`}
    >
      <span className="image-placeholder__number">{number}</span>
      <span className="image-placeholder__label">{label}</span>
      <span className="image-placeholder__hint">KRUMBISTRY</span>
    </div>
  );
}
