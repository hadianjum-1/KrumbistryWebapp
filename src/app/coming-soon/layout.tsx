import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coming Soon | KRUMBISTRY Bake Shop",
  description: "Something sweet is coming soon.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}