import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getCategories } from "@/services/categoryService";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

export default async function Categories() {
  const categories = await getCategories(true);

  return (
    <section className="section categories-section" id="menu">
      <div className="site-container">
        <div className="section-heading centered">
          <SectionEyebrow>FIND YOUR LITTLE JOY</SectionEyebrow>
          <h2>Something lovely <em>for everyone.</em></h2>
          <p>From celebration centrepieces to everyday indulgences, find a new favorite.</p>
        </div>

        <div className="category-grid">
          {categories.map((category, index) => (
            <Link
              href={`/menu?category=${category.slug}`}
              className="category-card"
              key={category.id}
            >
              <ImagePlaceholder
                src={category.image}
                label={`${category.name} photography`}
                className={`category-image ${category.tone || "cake"}`}
                number={`0${index + 1}`}
              />
              <span className="category-meta">
                <span>
                  <strong>{category.name}</strong>
                  <small>{category.description || "Freshly baked collection"}</small>
                </span>
                <span className="round-arrow">
                  <ArrowUpRight size={17} />
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="center-action">
          <Link className="text-link" href="/menu">
            Explore all treats <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
