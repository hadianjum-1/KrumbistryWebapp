import Image from "next/image";
import { LockKeyhole } from "lucide-react";

export default function AdminLocked() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F3E9] px-6">
      <div className="max-w-lg text-center">
        <Image
          src="/logo.png"
          alt="KRUMBISTRY"
          width={160}
          height={70}
          className="mx-auto mb-12 object-contain"
        />

        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-[#32190D] text-[#D6A64B]">
          <LockKeyhole size={28} />
        </div>

        <h1 className="font-serif text-4xl text-[#32190D]">
          Admin Panel Locked
        </h1>

        <p className="mt-5 text-base leading-8 text-[#6B5145]">
          Access to the KRUMBISTRY administration panel has been temporarily
          restricted by the developer. The panel will be made available
          before the official launch.
        </p>

        <p className="mt-10 text-xs tracking-[0.25em] text-[#D6A64B]">
          KRUMBISTRY BAKE SHOP
        </p>
      </div>
    </main>
  );
}