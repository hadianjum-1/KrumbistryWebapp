import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import SmoothScrollProvider from "@/components/animations/SmoothScrollProvider";

export const metadata: Metadata = {
  title: "KRUMBISTRY Bake Shop | Luxury in Every Bite",
  description:
    "Thoughtfully crafted cakes, pastries, brownies, cupcakes and sweet treats. Luxury in every bite at KRUMBISTRY Bake Shop.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <CartProvider>
          <SmoothScrollProvider>
            {children}
            <CartDrawer />
          </SmoothScrollProvider>
        </CartProvider>
      </body>
    </html>
  );
}
