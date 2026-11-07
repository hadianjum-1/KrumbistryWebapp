import { ArrowUpRight } from "lucide-react";
import ImagePlaceholder from "@/components/ui/ImagePlaceholder";

export default function CustomOrder() {
  return (
    <section className="custom-section" id="custom-orders">
      <div className="custom-decoration custom-decoration-left">✳</div>
      <div className="site-container custom-inner">
        <div>
          <p className="eyebrow eyebrow-light">FOR THE MOMENTS THAT MATTER</p>
          <h2>Your moment.<br /><em>Made sweeter.</em></h2>
          <p>
            Birthdays, weddings, anniversaries, or just because. Tell us what you're
            dreaming of and let's make something beautiful.
          </p>
          <a className="button button-gold" href="#contact">
            Create something special <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="custom-art">
          <ImagePlaceholder
            label="Custom celebration cake photography"
            className="custom-image"
            number="MADE JUST FOR YOU"
          />
          <span className="custom-art-note">A ONE-OF-A-KIND<br />KIND OF SWEET</span>
        </div>
      </div>
      <div className="custom-decoration custom-decoration-right">✳</div>
    </section>
  );
}
