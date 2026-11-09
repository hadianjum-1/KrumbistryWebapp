"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin on client
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Smooth page entrance transition on route navigation
      gsap.fromTo(
        containerRef.current,
        { opacity: 0.94, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
          clearProps: "transform,opacity",
        }
      );

      // 2. Hero Section Animations (Home, About, Menu, Custom Orders, Contact)
      const heroSection = document.querySelector(".hero-section, .page-hero");
      if (heroSection) {
        const heroBadge = heroSection.querySelectorAll(".eyebrow, [data-hero-eyebrow], .inline-flex.rounded-full");
        const heroTitle = heroSection.querySelectorAll("h1");
        const heroDesc = heroSection.querySelectorAll(".hero-description, [data-hero-desc], p.mt-6, p.mt-8");
        const heroActions = heroSection.querySelectorAll(".hero-actions, [data-hero-actions]");
        const heroVisual = heroSection.querySelectorAll(".hero-visual-wrap, [data-hero-visual]");
        const heroFootnote = heroSection.querySelectorAll(".hero-footnote, [data-hero-footnote]");

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (heroBadge.length) {
          tl.fromTo(
            heroBadge,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.65 },
            0.05
          );
        }

        if (heroTitle.length) {
          tl.fromTo(
            heroTitle,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.85 },
            0.15
          );
        }

        if (heroDesc.length) {
          tl.fromTo(
            heroDesc,
            { opacity: 0, y: 22 },
            { opacity: 1, y: 0, duration: 0.75 },
            0.3
          );
        }

        if (heroActions.length) {
          tl.fromTo(
            heroActions,
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: 0.65 },
            0.45
          );
        }

        if (heroVisual.length) {
          tl.fromTo(
            heroVisual,
            { opacity: 0, scale: 0.94, y: 28 },
            { opacity: 1, scale: 1, y: 0, duration: 1.0, ease: "expo.out" },
            0.25
          );
        }

        if (heroFootnote.length) {
          tl.fromTo(
            heroFootnote,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.6 },
            0.6
          );
        }

        // Hero decorative badges and stamps floating animation
        const floatingElements = heroSection.querySelectorAll(".hero-orbit, .hero-stamp, [data-gsap='float']");
        if (floatingElements.length) {
          gsap.to(floatingElements, {
            y: "-=7",
            rotation: "+=1.5",
            duration: 3.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
      }

      // 3. Section Headings Reveal on Scroll
      const sectionHeadings = document.querySelectorAll(
        ".section-heading, [data-gsap='heading']"
      );
      sectionHeadings.forEach((heading) => {
        gsap.fromTo(
          heading,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: heading,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 4. Staggered Product Cards
      const productGrids = document.querySelectorAll(
        ".product-grid, [data-gsap='product-grid']"
      );
      productGrids.forEach((grid) => {
        const cards = grid.querySelectorAll(".product-card, article");
        if (cards.length) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 36 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.08,
              ease: "power2.out",
              scrollTrigger: {
                trigger: grid,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });

      // 5. Staggered Category Cards
      const categoryGrids = document.querySelectorAll(".category-grid");
      categoryGrids.forEach((grid) => {
        const cards = grid.querySelectorAll(".category-card");
        if (cards.length) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 32, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
              stagger: 0.07,
              ease: "power2.out",
              scrollTrigger: {
                trigger: grid,
                start: "top 86%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });

      // 6. Promise Strip Items
      const promiseGrid = document.querySelector(".promise-grid");
      if (promiseGrid) {
        const items = promiseGrid.querySelectorAll(".promise-item");
        if (items.length) {
          gsap.fromTo(
            items,
            { opacity: 0, y: 22 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.07,
              ease: "power2.out",
              scrollTrigger: {
                trigger: promiseGrid,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }

      // 7. Story Grid (Image & Copy)
      const storyGrids = document.querySelectorAll(".story-grid");
      storyGrids.forEach((grid) => {
        const img = grid.querySelector(".story-image-wrap, .story-image");
        const copy = grid.querySelector(".story-copy");

        if (img) {
          gsap.fromTo(
            img,
            { opacity: 0, x: -30, scale: 0.96 },
            {
              opacity: 1,
              x: 0,
              scale: 1,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: grid,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }

        if (copy) {
          gsap.fromTo(
            copy,
            { opacity: 0, x: 30 },
            {
              opacity: 1,
              x: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: grid,
                start: "top 82%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      });

      // 8. Custom Orders Process Strip (01, 02, 03, 04 steps)
      const processGrid = document.querySelector(".grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4");
      if (processGrid) {
        const stepItems = processGrid.children;
        if (stepItems.length) {
          gsap.fromTo(
            stepItems,
            { opacity: 0, y: 25 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: processGrid,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }

      // 9. Testimonials Cards Stagger
      const testimonialGrid = document.querySelector(".testimonial-grid");
      if (testimonialGrid) {
        const cards = testimonialGrid.querySelectorAll(".testimonial-card");
        if (cards.length) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 28, scale: 0.96 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.75,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: {
                trigger: testimonialGrid,
                start: "top 85%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }

      // 10. Instagram Gallery Stagger
      const instagramGrid = document.querySelector(".instagram-grid");
      if (instagramGrid) {
        const tiles = instagramGrid.querySelectorAll(".instagram-tile");
        if (tiles.length) {
          gsap.fromTo(
            tiles,
            { opacity: 0, scale: 0.92, y: 18 },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              duration: 0.55,
              stagger: 0.05,
              ease: "power2.out",
              scrollTrigger: {
                trigger: instagramGrid,
                start: "top 88%",
                toggleActions: "play none none none",
              },
            }
          );
        }
      }

      // 11. Product Detail Page Animations
      const productDetailContainer = document.querySelector(".site-container.py-10");
      if (productDetailContainer) {
        const detailCols = productDetailContainer.querySelectorAll(".grid.grid-cols-1.lg\\:grid-cols-2 > div");
        if (detailCols.length >= 2) {
          gsap.fromTo(
            detailCols[0],
            { opacity: 0, x: -25 },
            { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }
          );
          gsap.fromTo(
            detailCols[1],
            { opacity: 0, x: 25 },
            { opacity: 1, x: 0, duration: 0.8, ease: "power2.out" }
          );
        }
      }

      // 12. Admin Dashboard Stat Cards Stagger
      const adminStatGrid = document.querySelector(".grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4");
      if (adminStatGrid) {
        const statCards = adminStatGrid.children;
        if (statCards.length) {
          gsap.fromTo(
            statCards,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.06,
              ease: "power2.out",
            }
          );
        }
      }

      // 13. Form Cards Smooth Reveal (Contact, Custom Order, Settings)
      const formCards = document.querySelectorAll(
        "form.space-y-6, form.space-y-8, .bg-white.border.rounded-2xl"
      );
      formCards.forEach((formCard) => {
        gsap.fromTo(
          formCard,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: {
              trigger: formCard,
              start: "top 92%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      // 14. Declarative GSAP data attributes (`[data-gsap='fade-up']`, `[data-gsap='fade-in']`)
      const fadeUpElements = document.querySelectorAll("[data-gsap='fade-up']");
      fadeUpElements.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      const fadeInElements = document.querySelectorAll("[data-gsap='fade-in']");
      fadeInElements.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.75,
            ease: "power1.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    }, containerRef);

    // Refresh ScrollTrigger calculations after DOM paint
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    return () => {
      clearTimeout(timer);
      ctx.revert(); // clean up all GSAP tweens and triggers
    };
  }, [pathname]);

  return <div ref={containerRef}>{children}</div>;
}
