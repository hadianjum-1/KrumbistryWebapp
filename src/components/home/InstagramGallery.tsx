import { gallery } from "@/data/home";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import InstagramIcon from "@/components/ui/InstagramIcon";

export default function InstagramGallery() {
  return (
    <section className="section instagram-section" id="instagram">
      <div className="site-container">
        <div className="section-heading centered">
          <SectionEyebrow>A LITTLE MORE SWEETNESS</SectionEyebrow>
          <h2>Follow the <em>crumbs.</em></h2>
          <p>Fresh from our kitchen and straight to your feed.</p>
          <a className="instagram-handle" href="#contact">
            <InstagramIcon size={16} /> @krumbistry
          </a>
        </div>

        <div className="instagram-grid">
          {gallery.map((tone, index) => (
            <a
              href="#contact"
              className="instagram-tile"
              key={tone}
              aria-label={`Instagram photo ${index + 1}`}
            >
              <ImagePlaceholder label="Instagram photo" className={tone} number={`0${index + 1}`} />
              <span className="instagram-overlay"><InstagramIcon size={22} /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
