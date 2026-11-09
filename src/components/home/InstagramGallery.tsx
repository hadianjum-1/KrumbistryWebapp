import Image from "next/image";
import SectionEyebrow from "@/components/ui/SectionEyebrow";
import InstagramIcon from "@/components/ui/InstagramIcon";

const gallery = [
  { src: "/instagram/Bakery Flatlay.jpg", alt: "A flatlay of freshly baked treats" },
  { src: "/instagram/Flaky Croissant Honeycomb.jpg", alt: "A flaky croissant showing its honeycomb layers" },
  { src: "/instagram/Luxury Packaging Box.jpg", alt: "A beautifully packaged KRUMBISTRY gift box" },
  { src: "/instagram/Molten Lava Cake Cut.jpg", alt: "A chocolate lava cake with a molten centre" },
  { src: "/instagram/Pistachio Raspberry Tartlet.jpg", alt: "A pistachio and raspberry tartlet" },
];

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
          {gallery.map((photo) => (
            <a
              href="#contact"
              className="instagram-tile"
              key={photo.src}
              aria-label={`Instagram photo: ${photo.alt}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
              <span className="instagram-overlay"><InstagramIcon size={22} /></span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
