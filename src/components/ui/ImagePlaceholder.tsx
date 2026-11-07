type ImagePlaceholderProps = {
  label: string;
  className?: string;
  number?: string;
};

export default function ImagePlaceholder({
  label,
  className = "",
  number = "KR / 01",
}: ImagePlaceholderProps) {
  return (
    <div
      className={`image-placeholder ${className}`}
      role="img"
      aria-label={`${label} image placeholder`}
    >
      <span className="image-placeholder__number">{number}</span>
      <span className="image-placeholder__label">{label}</span>
      <span className="image-placeholder__hint">YOUR IMAGE HERE</span>
    </div>
  );
}
