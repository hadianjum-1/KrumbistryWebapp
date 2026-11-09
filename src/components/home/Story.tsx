import Link from "next/link";
import { ArrowUpRight, CakeSlice } from "lucide-react";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

export default function Story() {
  return (
    <section className="story-section" id="story">
      <div className="site-container story-grid">
        <div className="story-visual">
          <ImagePlaceholder
            src="/story-image.jpg"
            alt="Artisanal baker handcrafting desserts at KRUMBISTRY"
            label="Baker preparing a beautiful dessert"
            className="story-image"
            number="THE ART OF BAKING"
          />
          <div className="story-image-caption"><span>MADE BY HAND</span><span>SHARED WITH LOVE</span></div>
          <div className="story-mini-seal"><CakeSlice size={27} /><span>EST.</span><strong>KR</strong></div>
        </div>

        <div className="story-copy">
          <SectionEyebrow>A NOTE FROM OUR KITCHEN</SectionEyebrow>
          <h2>A little sweetness.<br /><em>A lot of heart.</em></h2>
          <p>
            At KRUMBISTRY, we believe the sweetest memories are made when people come together.
            That&apos;s why every creation begins with a little imagination, thoughtful ingredients,
            and the joy of making something wonderful.
          </p>
          <p>
            From the first whisk to the final finishing touch, we put care into the details —
            so you can focus on the moments that matter.
          </p>
          <Link className="button button-dark" href="/about">Get to know us <ArrowUpRight size={16} /></Link>
          <div className="story-signature">With love, <span>Team KRUMBISTRY</span></div>
        </div>
      </div>
    </section>
  );
}
