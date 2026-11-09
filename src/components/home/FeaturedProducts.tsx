import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getProducts } from "@/services/productService";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import { siteSettings } from "@/config/site";
import { Product } from "@/types";

export default async function FeaturedProducts() {
  const allFeatured = await getProducts({ featured: true });
  const featured: Product[] = (allFeatured.length > 0 ? allFeatured : []).slice(0, 4);

  return (
    <section className="section featured-section" id="featured">
      <div className="site-container">
        <div className="section-heading section-heading-row">
          <div>
            <SectionEyebrow>THE CROWD PLEASERS</SectionEyebrow>
            <h2>Made to be <em>loved.</em></h2>
          </div>
          <Link className="button button-outline" href="/menu">
            View the menu <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="product-grid">
          {featured.map((product: Product, index: number) => {
            const price = product.salePrice ?? product.price;

            return (
              <article className="product-card" key={product.id}>
                <Link
                  href={`/menu/${product.slug}`}
                  className="product-image-link"
                  aria-label={`View ${product.name} details`}
                >
                  <ImagePlaceholder
                    src={product.mainImage}
                    label={`${product.name} photography`}
                    className={`product-image ${product.tone || "product-one"}`}
                    number={`0${index + 1}`}
                  />
                  {product.bestseller && (
                    <span className="product-tag">Bestseller</span>
                  )}
                  {product.tag && !product.bestseller && (
                    <span className="product-tag">{product.tag}</span>
                  )}
                  <span className="product-quick-view">
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
                <div className="product-info">
                  <div>
                    <h3>
                      <Link href={`/menu/${product.slug}`}>{product.name}</Link>
                    </h3>
                    <p>{product.shortDescription}</p>
                    <span className="block mt-1 font-semibold text-xs text-[#32190D]">
                      {siteSettings.currencySymbol} {price.toLocaleString()}
                    </span>
                  </div>
                  <Link
                    href={`/menu/${product.slug}`}
                    className="product-order"
                    aria-label={`Order ${product.name}`}
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
