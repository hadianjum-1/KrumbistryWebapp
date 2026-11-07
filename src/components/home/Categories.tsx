import { ArrowRight, ArrowUpRight } from "lucide-react";
import { categories } from "@/data/home";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

export default function Categories() {
  return (
    <section className="section categories-section" id="menu">
      <div className="site-container">
        <div className="section-heading centered">
          <SectionEyebrow>FIND YOUR LITTLE JOY</SectionEyebrow>
          <h2>Something lovely <em>for everyone.</em></h2>
          <p>From celebration centrepieces to everyday indulgences, find a new favorite.</p>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <a href="#featured" className="category-card" key={category.name}>
              <ImagePlaceholder
                label={`${category.name} photography`}
                className={`category-image ${category.tone}`}
                number={category.mark}
              />
              <span className="category-meta">
                <span><strong>{category.name}</strong><small>{category.detail}</small></span>
                <span className="round-arrow"><ArrowUpRight size={17} /></span>
              </span>
            </a>
          ))}
        </div>

        <div className="center-action">
          <a className="text-link" href="#featured">Explore all treats <ArrowRight size={16} /></a>
        </div>
      </div>
    </section>
  );
}
