import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-PlayfairDisplay",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-CormorantGaramond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KRUMBISTRY Bake Shop | Luxury in Every Bite",
  description:
    "Thoughtfully crafted cakes, pastries, brownies, cupcakes and sweet treats. Luxury in every bite at KRUMBISTRY Bake Shop.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${playfair.variable} ${cormorant.variable}`}>
        {children}
      </body>
    </html>
  );
}
