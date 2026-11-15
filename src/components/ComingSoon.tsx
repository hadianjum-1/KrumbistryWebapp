import Image from "next/image";

export default function ComingSoon() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F3E9] px-6 text-center">
      <div className="max-w-xl">
        <Image
          src="/logo.png"
          alt="KRUMBISTRY Bake Shop"
          width={180}
          height={80}
          className="mx-auto mb-12 object-contain"
          priority
        />

        <p className="mb-5 text-xs tracking-[0.35em] text-[#D6A64B]">
          KRUMBISTRY BAKE SHOP
        </p>

        <h1 className="font-serif text-5xl leading-tight text-[#32190D] md:text-7xl">
          Something Sweet Is Coming Soon.
        </h1>

        <p className="mx-auto mt-7 max-w-md text-base leading-8 text-[#6B5145]">
          We're preparing something special for you. Freshly baked delights,
          handcrafted treats, and a little luxury in every bite.
          Our doors will be opening soon!
        </p>

        <div className="mx-auto mt-10 h-px w-20 bg-[#D6A64B]" />

        <p className="mt-8 text-sm tracking-widest text-[#32190D]">
          LUXURY IN EVERY BITE.
        </p>

        <p className="mt-12 text-xs text-[#8B766A]">
          Thank you for your patience. We can't wait to welcome you!
        </p>
      </div>
    </main>
  );
}