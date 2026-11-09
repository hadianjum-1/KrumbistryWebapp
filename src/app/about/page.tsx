import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  CakeSlice,
  CheckCircle2,
  Clock,
  Heart,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

export const metadata: Metadata = {
  title: "Our Story & Craftsmanship | KRUMBISTRY Bake Shop",
  description:
    "Discover the artisanal heritage, premium ingredients, and passionate craftsmanship behind KRUMBISTRY Bake Shop. Luxury in every bite.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="bg-[#F8F3E9] text-[#32190D]">
        {/* Hero Section */}
        <section className="page-hero relative overflow-hidden border-b border-[#32190D]/10 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="site-container">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D6A64B]/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#98743A] mb-6">
                <Sparkles size={13} className="text-[#B88632]" />
                THE ARTISANAL PHILOSOPHY
              </div>

              <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.05] tracking-tight">
                Where flour and imagination become{" "}
                <em className="text-[#D6A64B] font-display italic font-normal">
                  pure luxury.
                </em>
              </h1>

              <p className="mt-8 text-base md:text-lg leading-relaxed text-[#806E5D] max-w-2xl">
                Founded with a vision to redefine dessert culture, KRUMBISTRY Bake Shop
                marries timeless French pastry precision with contemporary flavor pairings.
                Every cake, pastry, and chocolate is a handcrafted celebration of texture,
                balance, and indulgence.
              </p>
            </div>
          </div>
        </section>

        {/* Brand Story Section */}
        <section className="section">
          <div className="site-container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
              <div className="relative">
                <div className="p-3 border border-[#D6A64B]/50 rounded-sm bg-[#FAF6EE]">
                  <div className="relative h-[460px] overflow-hidden rounded-sm">
                    <Image
                      src="/about-images/about-kitchen.jpg"
                      alt="Pastry chef tempering chocolate in the KRUMBISTRY kitchen"
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-[#32190D] text-[#F8F3E9] border-2 border-[#D6A64B] flex flex-col items-center justify-center p-3 text-center shadow-xl">
                  <span className="font-serif text-2xl font-bold text-[#D6A64B]">100%</span>
                  <span className="text-[9px] tracking-widest uppercase">Freshly Baked</span>
                </div>
              </div>

              <div className="space-y-6">
                <SectionEyebrow>OUR HERITAGE</SectionEyebrow>
                <h2 className="font-serif text-3xl md:text-5xl font-medium leading-tight">
                  Born from a reverence for{" "}
                  <em className="text-[#D6A64B] font-display italic font-normal">
                    honest ingredients.
                  </em>
                </h2>

                <p className="text-sm md:text-base leading-relaxed text-[#806E5D]">
                  KRUMBISTRY began in a small boutique kitchen with one unwavering belief:
                  luxury cannot be simulated. It exists in the aroma of slow-browned butter,
                  the satisfying crackle of a fresh mille-feuille, and the silkiness of
                  single-origin chocolate melting on the palate.
                </p>

                <p className="text-sm md:text-base leading-relaxed text-[#806E5D]">
                  We consciously avoid artificial extracts, synthetic stabilizers, and mass-production shortcuts.
                  Instead, we grant our sourdoughs 24 hours to ferment, laminate our croissants with 82% European
                  cultured butter, and infuse our creams with genuine Madagascar bourbon vanilla pods.
                </p>

                <div className="pt-4 grid grid-cols-2 gap-4 border-t border-[#32190D]/10">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#B88632] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-sm font-serif">Zero Shortcuts</strong>
                      <small className="text-xs text-[#806E5D]">Small batches crafted daily</small>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-[#B88632] shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-sm font-serif">Single-Origin Cacao</strong>
                      <small className="text-xs text-[#806E5D]">Callebaut & Valrhona</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our 4 Core Pillars */}
        <section className="py-20 bg-[#F1EADD] border-y border-[#32190D]/10">
          <div className="site-container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <SectionEyebrow>OUR VALUES</SectionEyebrow>
              <h2 className="font-serif text-3xl md:text-5xl font-medium mt-3 mb-4">
                The standards we{" "}
                <em className="text-[#D6A64B] font-display italic font-normal">
                  never compromise.
                </em>
              </h2>
              <p className="text-sm text-[#806E5D] leading-relaxed">
                Every dessert leaving our pastry kitchen represents an unyielding devotion to culinary craftsmanship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="p-8 bg-[#F8F3E9] border border-[#32190D]/10 rounded-sm">
                <div className="w-12 h-12 rounded-full border border-[#D6A64B] grid place-items-center text-[#B88632] mb-6">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="font-serif text-xl font-medium mb-3">Purest Ingredients</h3>
                <p className="text-xs text-[#806E5D] leading-relaxed">
                  We source only grass-fed European cultured butter, organic unbleached flour, and whole Madagascar vanilla beans.
                </p>
              </div>

              <div className="p-8 bg-[#F8F3E9] border border-[#32190D]/10 rounded-sm">
                <div className="w-12 h-12 rounded-full border border-[#D6A64B] grid place-items-center text-[#B88632] mb-6">
                  <Clock size={22} />
                </div>
                <h3 className="font-serif text-xl font-medium mb-3">Slow Fermentation</h3>
                <p className="text-xs text-[#806E5D] leading-relaxed">
                  Time is our secret ingredient. Our brioche donuts and croissants undergo cold fermentation to unlock deeper flavor complexity.
                </p>
              </div>

              <div className="p-8 bg-[#F8F3E9] border border-[#32190D]/10 rounded-sm">
                <div className="w-12 h-12 rounded-full border border-[#D6A64B] grid place-items-center text-[#B88632] mb-6">
                  <Award size={22} />
                </div>
                <h3 className="font-serif text-xl font-medium mb-3">Bespoke Artistry</h3>
                <p className="text-xs text-[#806E5D] leading-relaxed">
                  From wedding centrepieces to intimate anniversary cakes, our cake designers sculpt edible dreams tailored to your celebration.
                </p>
              </div>

              <div className="p-8 bg-[#F8F3E9] border border-[#32190D]/10 rounded-sm">
                <div className="w-12 h-12 rounded-full border border-[#D6A64B] grid place-items-center text-[#B88632] mb-6">
                  <Heart size={22} />
                </div>
                <h3 className="font-serif text-xl font-medium mb-3">Thoughtful Details</h3>
                <p className="text-xs text-[#806E5D] leading-relaxed">
                  Hand-painted chocolate truffles, edible 24k gold leaf, and bespoke presentation boxes made for unforgettable gifting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Master Craftsmanship & Kitchen Feature */}
        <section className="section">
          <div className="site-container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
              <div>
                <SectionEyebrow>OUR ATELIER</SectionEyebrow>
                <h2 className="font-serif text-3xl md:text-5xl font-medium mt-3 mb-6">
                  Precision in every whisk,{" "}
                  <em className="text-[#D6A64B] font-display italic font-normal">
                    elegance in every crumb.
                  </em>
                </h2>

                <p className="text-sm md:text-base text-[#806E5D] leading-relaxed mb-6">
                  Our temperature-controlled pastry kitchen is dedicated to micro-precision:
                  tempering chocolates to the exact degree for a glassy snap, rolling puff pastry
                  to millimeter uniformity, and piping silky Swiss buttercream with artistic restraint.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border border-[#32190D]/10 bg-[#FAF6EE] rounded-sm">
                    <CakeSlice className="text-[#B88632] shrink-0" size={24} />
                    <div>
                      <strong className="block text-sm font-serif">Signature Multi-Layer Cakes</strong>
                      <p className="text-xs text-[#806E5D]">Moist, aromatic layers balanced with light-as-air fillings</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border border-[#32190D]/10 bg-[#FAF6EE] rounded-sm">
                    <UtensilsCrossed className="text-[#B88632] shrink-0" size={24} />
                    <div>
                      <strong className="block text-sm font-serif">French Viennoiserie & Tarts</strong>
                      <p className="text-xs text-[#806E5D]">Golden butter-crusted pastries baked fresh every dawn</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative h-64 overflow-hidden rounded-sm">
                  <Image
                    src="/about-images/atelier-cake.jpg"
                    alt="Pastry chef finishing a layered cake"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative h-64 overflow-hidden rounded-sm">
                  <Image
                    src="/about-images/atelier-buttercream.jpg"
                    alt="Pastry chef piping buttercream flowers"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative col-span-2 h-64 overflow-hidden rounded-sm">
                  <Image
                    src="/about-images/atelier-croissants.jpg"
                    alt="Freshly baked artisan croissants"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="bg-[#32190D] text-[#F8F3E9] py-20 border-t border-[#D6A64B]/30">
          <div className="site-container text-center max-w-2xl mx-auto">
            <span className="text-[#D6A64B] font-serif text-sm uppercase tracking-[0.25em] font-semibold">
              EXPERIENCE THE TASTE
            </span>
            <h2 className="font-serif text-4xl md:text-6xl font-medium mt-4 mb-6">
              Taste the difference of{" "}
              <em className="text-[#D6A64B] font-display italic font-normal">
                authentic luxury.
              </em>
            </h2>
            <p className="text-sm md:text-base text-[#D2C1AD] leading-relaxed mb-8">
              Explore our catalogue of signature desserts or collaborate directly with our pastry chefs
              for your next celebration.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/menu" className="button button-gold">
                Explore the Menu <ArrowUpRight size={16} />
              </Link>
              <Link href="/custom-orders" className="button button-outline text-[#F8F3E9] border-[#D6A64B]">
                Request a Custom Cake <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
