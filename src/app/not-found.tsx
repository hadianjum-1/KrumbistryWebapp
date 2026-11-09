import Link from "next/link";
import { ArrowRight, CakeSlice } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#F8F3E9] text-[#32190D] flex items-center justify-center py-20">
        <div className="site-container text-center max-w-lg">
          <div className="w-16 h-16 rounded-full border border-[#D6A64B] text-[#B88632] grid place-items-center mx-auto mb-6">
            <CakeSlice size={32} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#98743A]">
            404 — TREAT NOT FOUND
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-medium mt-2 mb-4">
            A little lost in the kitchen.
          </h1>
          <p className="text-sm text-[#806E5D] leading-relaxed mb-8">
            The page or confection you are looking for has either vanished or moved to a sweeter spot.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/" className="button button-dark">
              Return Home
            </Link>
            <Link href="/menu" className="button button-outline">
              Explore Menu <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

