import { ArrowUpRight } from "lucide-react";
import { products } from "@/data/home";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

export default function FeaturedProducts() {
  return (
    <section className="section featured-section" id="featured">
      <div className="site-container">
        <div className="section-heading section-heading-row">
          <div>
            <SectionEyebrow>THE CROWD PLEASERS</SectionEyebrow>
            <h2>Made to be <em>loved.</em></h2>
          </div>
          <a className="button button-outline" href="#menu">View the menu <ArrowUpRight size={16} /></a>
        </div>

        <div className="product-grid">
          {products.map((product, index) => (
            <article className="product-card" key={product.name}>
              <a href="#contact" className="product-image-link" aria-label={`Ask about ${product.name}`}>
                <ImagePlaceholder
                  label={`${product.name} photography`}
                  className={`product-image ${product.tone}`}
                  number={`0${index + 1}`}
                />
                <span className="product-tag">{product.tag}</span>
                <span className="product-quick-view"><ArrowUpRight size={18} /></span>
              </a>
              <div className="product-info">
                <div><h3>{product.name}</h3><p>{product.description}</p></div>
                <a href="#contact" className="product-order" aria-label={`Inquire about ${product.name}`}>
                  <ArrowUpRight size={18} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
