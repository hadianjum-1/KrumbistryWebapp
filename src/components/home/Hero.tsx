
import Link from "next/link";
import {
  ArrowUpRight,
  CakeSlice,
  Cookie,
  Donut,
  Croissant,
} from "lucide-react";

export default function Hero() {
  return (
    <section className="hero-section" id="home">
      {/* Decorative bakery illustrations */}
      <div className="hero-decoration hero-decoration-one">
        <CakeSlice />
      </div>

      <div className="hero-decoration hero-decoration-two">
        <Donut />
      </div>

      <div className="hero-decoration hero-decoration-three">
        <Cookie />
      </div>

      <div className="hero-decoration hero-decoration-four">
        <Croissant />
      </div>

      {/* Hero Content */}
      <div className="hero-content">
        <div className="hero-brand">
          <h1>KRUMBISTRY</h1>
          <span>BAKESHOP</span>
        </div>

        <div className="hero-copy">
          <p className="hero-tagline">
            Luxury in every bite
          </p>

          <p className="hero-description">
            Cakes, pastries, donuts, cupcakes and more, baked
            fresh in Peshawar — for your table, your celebrations
            and your café counter.
          </p>

          <div className="hero-actions">
            <Link href="/contact" className="hero-button hero-button-primary">
              Place an order
              <ArrowUpRight size={17} />
            </Link>

            <Link href="/menu" className="hero-button hero-button-outline">
              See the menu
            </Link>
          </div>
        </div>
      </div>

      {/* Scalloped bottom border */}
      <div className="hero-bottom-border">
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="
              M0 18
              Q27 0 54 18
              T108 18
              T162 18
              T216 18
              T270 18
              T324 18
              T378 18
              T432 18
              T486 18
              T540 18
              T594 18
              T648 18
              T702 18
              T756 18
              T810 18
              T864 18
              T918 18
              T972 18
              T1026 18
              T1080 18
              T1134 18
              T1188 18
              T1242 18
              T1296 18
              T1350 18
              T1404 18
              T1458 18
              V40 H0 Z
            "
            fill="#F8F3E9"
          />
        </svg>
      </div>
    </section>
  );
}

// old version

// import Link from "next/link";
// import { ArrowRight, ArrowUpRight, Heart, Star } from "lucide-react";
// import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

// export default function Hero() {
//   return (
//     <section className="hero-section bg-foreground" id="home">
//       <div className="hero-orbit hero-orbit-one" />
//       <div className="hero-orbit hero-orbit-two" />

//       <div className="site-container hero-grid ">
//         <div className="hero-copy">
//           <p className="eyebrow"><span className="eyebrow-line" /> THE ART OF SOMETHING SWEET</p>
//           <h1>Make life a little <em>sweeter.</em></h1>
//           <p className="hero-description">
//             Thoughtfully crafted cakes, delicate pastries, and irresistible little treats.
//             Made with passion, finished with a touch of luxury.
//           </p>
//           <div className="hero-actions">
//             <Link className="button button-dark" href="/menu">Discover our menu <ArrowUpRight size={16} /></Link>
//             <Link className="text-link" href="/about">Our story <ArrowRight size={16} /></Link>
//           </div>
//           <div className="hero-footnote">
//             <span className="hero-footnote-icon"><Star size={15} /></span>
//             <span>
//               <strong>Luxury in every bite</strong>
//               <small>Thoughtful details. Beautifully baked.</small>
//             </span>
//           </div>
//         </div>

//         <div className="hero-visual-wrap">
//           <div className="hero-image-frame">
//             <ImagePlaceholder
//               src="/hero-image.jpg"
//               alt="KRUMBISTRY Signature Artisanal Cake"
//               label="Your signature cake photography"
//               className="hero-image"
//               number="KRUMBISTRY · SIGNATURE"
//             />
//           </div>
//           <div className="hero-stamp">
//             <span>BAKED WITH</span><Heart size={20} strokeWidth={1.2} /><span>LOVE & CARE</span>
//           </div>
//           <div className="hero-side-note">A DELICIOUS STORY<br />IN EVERY DETAIL</div>
//         </div>
//       </div>

//       <div className="site-container hero-bottom">
//         <span>SCROLL TO DISCOVER</span><span className="scroll-line" /><span>01 — 06</span>
//       </div>
//     </section>
//   );
// }