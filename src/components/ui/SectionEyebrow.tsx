import type { ReactNode } from "react";

export default function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="section-eyebrow">
      <span />
      {children}
      <span />
    </p>
  );
}
