
"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CakeSlice,
  ChefHat,
  Clock3,
  Search,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

type Category = "All" | "Cakes" | "Pastries" | "Brownies" | "Donuts" | "Cupcakes";

type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "All">;
  description: string;
  price: number;
  tag?: string;
  imageLabel: string;
};

const categories: Category[] = [
  "All",
  "Cakes",
  "Pastries",
  "Brownies",
  "Donuts",
  "Cupcakes",
];

const products: Product[] = [
  {
    id: 1,
    name: "Classic Chocolate Cake",
    category: "Cakes",
    description: "Rich chocolate layers finished with silky chocolate ganache.",
    price: 2800,
    tag: "Bestseller",
    imageLabel: "Chocolate cake",
  },
  {
    id: 2,
    name: "Vanilla Berry Cake",
    category: "Cakes",
    description: "Soft vanilla sponge with a light cream and berry filling.",
    price: 3200,
    imageLabel: "Vanilla berry cake",
  },
  {
    id: 3,
    name: "Butter Croissant",
    category: "Pastries",
    description: "Golden, flaky layers with a delicate buttery centre.",
    price: 350,
    imageLabel: "Butter croissant",
  },
  {
    id: 4,
    name: "Fudge Brownie",
    category: "Brownies",
    description: "A dense, fudgy chocolate brownie with a crackly top.",
    price: 450,
    tag: "Customer favourite",
    imageLabel: "Chocolate brownie",
  },
  {
    id: 5,
    name: "Velvet Glaze Donut",
    category: "Donuts",
    description: "A soft, freshly made donut with a smooth chocolate glaze.",
    price: 300,
    imageLabel: "Chocolate donut",
  },
  {
    id: 6,
    name: "Vanilla Cloud Cupcake",
    category: "Cupcakes",
    description: "A tender vanilla cupcake topped with whipped buttercream.",
    price: 280,
    imageLabel: "Vanilla cupcake",
  },
  {
    id: 7,
    name: "Caramel Crunch Cake",
    category: "Cakes",
    description: "Creamy caramel notes layered with a satisfying crunch.",
    price: 3500,
    tag: "Signature",
    imageLabel: "Caramel cake",
  },
  {
    id: 8,
    name: "Double Chocolate Brownie",
    category: "Brownies",
    description: "Deep cocoa flavour with generous chocolate pieces.",
    price: 500,
    imageLabel: "Double chocolate brownie",
  },
];

const formatPrice = (price: number) =>
  `Rs. ${price.toLocaleString("en-PK")}`;

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <>
    <Header/>
    <main className="min-h-screen bg-[#F8F3E9] text-[#32190D]">
      <section className="relative overflow-hidden border-b border-[#32190D]/10 bg-[#F0E8DA]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
          <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#D6A64B]/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                <Sparkles size={14} className="text-[#B88632]" />
                Fresh from our kitchen
              </div>

              <p className="mb-4 text-sm uppercase tracking-[0.25em] text-[#8C6B4B]">
                The KRUMBISTRY collection
              </p>

              <h1 className="max-w-2xl font-serif text-5xl leading-[1.08] md:text-7xl">
                A menu made for
                <span className="italic text-[#B88632]"> sweet moments.</span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-[#6F5A4B]">
                From everyday treats to celebration centrepieces, discover
                handcrafted favourites made to make every moment special.
              </p>

              <a
                href="#our-menu"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#32190D] px-7 py-4 text-sm font-semibold text-amber-50 transition hover:bg-[#4A2918]"
              >
                Explore the menu <ArrowRight size={17} />
              </a>
            </div>

            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[2rem] border border-[#D6A64B]/30 bg-[#E7D8C3] p-8 md:min-h-[420px]">
              <div className="absolute -right-12 -top-12 h-52 w-52 rounded-full border border-[#B88632]/30" />
              <div className="absolute -bottom-16 -left-12 h-64 w-64 rounded-full border border-[#B88632]/30" />
              <div className="relative text-center">
                <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-[#F8F3E9] text-[#B88632] shadow-lg">
                  <CakeSlice size={42} strokeWidth={1.2} />
                </div>
                <p className="font-serif text-4xl italic">Made with love.</p>
                <p className="mt-3 text-xs uppercase tracking-[0.25em] text-[#8C6B4B]">
                  Baked fresh · Served with joy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="our-menu" className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#B88632]">
              Find your favourite
            </p>
            <h2 className="font-serif text-4xl md:text-5xl">
              Explore our menu
            </h2>
            <p className="mt-3 text-sm leading-7 text-[#6F5A4B]">
              A little something for every kind of craving.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 rounded-full border border-[#32190D]/15 bg-white/60 px-5 py-3 md:max-w-xs">
            <Search size={17} className="shrink-0 text-[#8C6B4B]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search treats..."
              aria-label="Search menu"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#9A897D]"
            />
          </div>
        </div>

        <div className="mb-10 flex gap-2 overflow-x-auto pb-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full border px-5 py-3 text-sm font-semibold transition ${
                activeCategory === category
                  ? "border-[#32190D] bg-[#32190D] text-white"
                  : "border-[#32190D]/15 bg-white/50 text-[#6F5A4B] hover:border-[#B88632] hover:text-[#32190D]"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-[1.5rem] border border-[#32190D]/10 bg-white/60 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(50,25,13,0.09)]"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#EDE2D2]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E8D5B9] via-[#F1E8DA] to-[#DCC5A5]" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#B88632]/30 bg-[#F8F3E9]/70 text-[#9B7027] transition duration-500 group-hover:scale-110">
                    <CakeSlice size={34} strokeWidth={1.2} />
                  </div>

                  {product.tag && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#32190D] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                      {product.tag}
                    </span>
                  )}

                  <span className="absolute bottom-4 left-4 text-xs font-medium text-[#6F5A4B]">
                    {product.imageLabel} · Image placeholder
                  </span>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B88632]">
                      {product.category}
                    </span>
                    <span className="text-sm font-bold">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl">{product.name}</h3>
                  <p className="mt-2 min-h-[48px] text-sm leading-6 text-[#786455]">
                    {product.description}
                  </p>

                  <Link
                    href="/contact"
                    className="mt-5 inline-flex items-center gap-2 border-b border-[#B88632] pb-1 text-sm font-semibold transition hover:gap-3"
                  >
                    Enquire to order <ArrowUpRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#32190D]/20 py-20 text-center">
            <Search size={30} className="mx-auto mb-4 text-[#B88632]" />
            <h3 className="font-serif text-2xl">No treats found</h3>
            <p className="mt-2 text-sm text-[#786455]">
              Try another search or choose a different category.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
              className="mt-5 text-sm font-semibold underline underline-offset-4"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className="bg-[#32190D] text-[#F8F3E9]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10 md:py-20">
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#D6A64B]">
              <ChefHat size={16} />
              Made for your moments
            </div>
            <h2 className="max-w-2xl font-serif text-4xl leading-tight md:text-5xl">
              Have something special in mind?
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65">
              Tell us about your celebration and let&apos;s create something
              memorable together.
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#D6A64B] px-7 py-4 text-sm font-bold text-[#32190D] transition hover:bg-[#E5BD73]"
          >
            Request a custom order <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <div className="flex flex-col items-center justify-between gap-4 text-center text-xs text-[#8C7767] sm:flex-row sm:text-left">
          <p>Prices and availability are subject to confirmation.</p>
          <Link href="/" className="inline-flex items-center gap-2 hover:text-[#B88632]">
            Back to home <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>
    </main>
    <Footer/>
    </>
  );
}
