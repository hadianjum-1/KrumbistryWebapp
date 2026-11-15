
"use client";

import { useState, useEffect } from "react";
import { Check, ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import SectionEyebrow from "@/components/ui/SectionEyebrow";

const testimonials = [
  {
    name: "Sarah Ahmed",
    role: "Happy Customer",
    initials: "SA",
    rating: 5,
    review:
      "Every detail was just beautiful. The cake looked incredible, tasted even better, and made our celebration feel extra special.",
  },
  {
    name: "Ayesha Khan",
    role: "Birthday Celebration",
    initials: "AK",
    rating: 5,
    review:
      "Absolutely loved the cupcakes! They were fresh, beautifully presented, and honestly some of the best treats I've ever had.",
  },
  {
    name: "Hamza Malik",
    role: "Regular Customer",
    initials: "HM",
    rating: 5,
    review:
      "The brownies were unbelievably delicious. You can genuinely taste the quality and care in every bite. Highly recommended!",
  },
  {
    name: "Fatima Noor",
    role: "Custom Order",
    initials: "FN",
    rating: 5,
    review:
      "I ordered a custom cake and it turned out better than I imagined. Beautiful design, amazing taste, and wonderful service.",
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[activeIndex];

  return (
    <section className="section testimonial-section">
      <div className="site-container testimonial-grid">
        <div className="testimonial-intro">
          <SectionEyebrow>KIND WORDS</SectionEyebrow>

          <h2>
            Don't just take
            <br />
            our <em>word for it.</em>
          </h2>

          <p>
            We love being part of your sweetest moments. Here's what our
            customers have to say.
          </p>

          <div className="testimonial-controls">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous testimonial"
            >
              <ChevronLeft />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next testimonial"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="testimonial-pagination">
            <span>
              {String(activeIndex + 1).padStart(2, "0")}
            </span>
            <div className="testimonial-progress">
              <div
                style={{
                  width: `${((activeIndex + 1) / testimonials.length) * 100}%`,
                }}
              />
            </div>
            <span>
              {String(testimonials.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        <article className="testimonial-card" key={activeIndex}>
          <div className="quote-mark">“</div>

          <div className="stars" aria-label={`${testimonial.rating} stars`}>
            {Array.from({ length: testimonial.rating }, (_, index) => (
              <Star key={index} size={15} fill="currentColor" />
            ))}
          </div>

          <blockquote>{testimonial.review}</blockquote>

          <div className="reviewer">
            <span className="reviewer-avatar">
              {testimonial.initials}
            </span>

            <span>
              <strong>{testimonial.name}</strong>
              <small>{testimonial.role}</small>
            </span>

            <span className="review-verified">
              <Check size={13} /> VERIFIED
            </span>
          </div>

          <p className="review-note">
            Made with love, enjoyed with every bite.
          </p>
        </article>
      </div>
    </section>
  );
}
