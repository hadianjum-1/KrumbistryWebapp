import Link from "next/link";
import { ArrowRight, ArrowUpRight, Heart, Star } from "lucide-react";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

export default function Hero() {
  return (
    <section className="hero-section" id="home">
      <div className="hero-orbit hero-orbit-one" />
      <div className="hero-orbit hero-orbit-two" />

      <div className="site-container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-line" /> THE ART OF SOMETHING SWEET</p>
          <h1>Make life a little <em>sweeter.</em></h1>
          <p className="hero-description">
            Thoughtfully crafted cakes, delicate pastries, and irresistible little treats.
            Made with passion, finished with a touch of luxury.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/menu">Discover our menu <ArrowUpRight size={16} /></Link>
            <Link className="text-link" href="/about">Our story <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-footnote">
            <span className="hero-footnote-icon"><Star size={15} /></span>
            <span>
              <strong>A little luxury in every bite</strong>
              <small>Thoughtful details. Beautifully baked.</small>
            </span>
          </div>
        </div>

        <div className="hero-visual-wrap">
          <div className="hero-image-frame">
            <ImagePlaceholder
              src="/hero-image.jpg"
              alt="KRUMBISTRY Signature Artisanal Cake"
              label="Your signature cake photography"
              className="hero-image"
              number="KRUMBISTRY · SIGNATURE"
            />
          </div>
          <div className="hero-stamp">
            <span>BAKED WITH</span><Heart size={20} strokeWidth={1.2} /><span>LOVE & CARE</span>
          </div>
          <div className="hero-side-note">A DELICIOUS STORY<br />IN EVERY DETAIL</div>
        </div>
      </div>

      <div className="site-container hero-bottom">
        <span>SCROLL TO DISCOVER</span><span className="scroll-line" /><span>01 — 06</span>
      </div>
    </section>
  );
}
