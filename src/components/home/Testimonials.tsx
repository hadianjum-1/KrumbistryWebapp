import { Check, ChevronLeft, ChevronRight, Star } from "lucide-react";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

export default function Testimonials() {
  return (
    <section className="section testimonial-section">
      <div className="site-container testimonial-grid">
        <div className="testimonial-intro">
          <SectionEyebrow>KIND WORDS</SectionEyebrow>
          <h2>Don't just take<br />our <em>word for it.</em></h2>
          <p>We love being part of your sweetest moments. Here's what our customers have to say.</p>
          <div className="testimonial-controls">
            <button aria-label="Previous testimonial" disabled><ChevronLeft /></button>
            <button aria-label="Next testimonial" disabled><ChevronRight /></button>
          </div>
        </div>

        <article className="testimonial-card">
          <div className="quote-mark">“</div>
          <div className="stars" aria-label="Five stars">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} size={15} fill="currentColor" />
            ))}
          </div>
          <blockquote>
            Every detail was just beautiful. The cake looked incredible, tasted even better,
            and made our celebration feel extra special.
          </blockquote>
          <div className="reviewer">
            <span className="reviewer-avatar">KR</span>
            <span><strong>Customer name</strong><small>KRUMBISTRY customer</small></span>
            <span className="review-verified"><Check size={13} /> VERIFIED</span>
          </div>
          <p className="review-note">Replace this sample with an approved customer review.</p>
        </article>
      </div>
    </section>
  );
}
