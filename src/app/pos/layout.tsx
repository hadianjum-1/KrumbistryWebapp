import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import POSLayout from "@/components/pos/POSLayout";

export const viewport: Viewport = {
  themeColor: "#32190D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents accidental pinch-zoom during fast counter cashiering
};

export const metadata: Metadata = {
  title: "KRUMBISTRY POS — Multi-Device Bakery Terminal",
  description: "Point of Sale and Inventory Management for KRUMBISTRY Bake Shop",
  manifest: "/pos-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KRUMBISTRY POS",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function POSRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <POSLayout>{children}</POSLayout>;
}
