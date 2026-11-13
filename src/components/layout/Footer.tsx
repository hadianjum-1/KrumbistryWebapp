"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Clock3,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Truck,
} from "lucide-react";

import { FaTiktok, FaFacebookF } from "react-icons/fa";
import InstagramIcon from "@/components/ui/InstagramIcon";

import { siteSettings } from "@/config/site";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const currentYear = 2026;

  const whatsappUrl = getWhatsAppUrl(
    `Hello ${siteSettings.bakeryName}! I'd like to get in touch.`
  );

  async function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setNewsletterError(null);

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Subscription failed");
      }

      setSubmitted(true);
      setEmail("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error subscribing to newsletter";
      setNewsletterError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <footer className="site-footer" id="contact">
      <div className="site-container">
        <div className="footer-main">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link href="/" className="footer-logo-img" aria-label="KRUMBISTRY home">
              <Image
                src="/logo.png"
                alt="KRUMBISTRY Bake Shop"
                width={130}
                height={85}
                className="footer-logo-image"
                style={{ width: "auto", height: "auto", maxHeight: "72px" }}
              />
            </Link>
            <p>Thoughtfully made treats for life&apos;s sweetest moments.</p>
            <div className="footer-socials">
  <a
    className="footer-social"
    href={siteSettings.instagramUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Follow on Instagram"
  >
    <InstagramIcon size={16} /> Instagram
  </a>

  <a
    className="footer-social"
    href={siteSettings.facebookUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Follow on Facebook"
  >
    <FaFacebookF size={16} /> Facebook
  </a>

  <a
    className="footer-social"
    href={siteSettings.tiktokUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Follow on TikTok"
  >
    <FaTiktok size={16} /> TikTok
  </a>

  <a
    className="footer-social"
    href={whatsappUrl}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chat on WhatsApp"
  >
    <MessageCircle size={16} /> WhatsApp
  </a>
</div>
          </div>

          {/* Explore Links */}
          <div className="footer-column">
            <h3>Explore</h3>
            <Link href="/">Home</Link>
            <Link href="/about">Our Story</Link>
            <Link href="/menu">Our Menu</Link>
            <Link href="/custom-orders">Custom Orders</Link>
            <Link href="/contact">Contact Us</Link>
          </div>

          {/* Contact Column */}
          <div className="footer-column">
            <h3>Say hello</h3>
            <a href={`mailto:${siteSettings.contactEmail}`}>
              <Mail size={15} /> {siteSettings.contactEmail}
            </a>
            <a href={`tel:${siteSettings.contactPhone.replace(/\s/g, "")}`}>
              <Phone size={15} /> {siteSettings.contactPhone}
            </a>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={15} /> WhatsApp Us
            </a>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(siteSettings.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-address"
            >
              <MapPin size={15} className="shrink-0 mt-0.5" />
              <span>{siteSettings.address}</span>
            </a>
          </div>

          {/* Hours Column */}
          <div className="footer-column footer-hours">
            <h3>Come by</h3>
            <p><Clock3 size={15} /> Business hours</p>
            <span>{siteSettings.openingHours}</span>
            <p><Truck size={15} /> Pickup &amp; delivery</p>
            <span>Freshly dispatched across the city</span>
          </div>

          {/* Newsletter Column */}
          <div className="footer-newsletter">
            <h3>A sweeter inbox.</h3>
            <p>Sign up for new treats, special moments, and little surprises.</p>
            {submitted ? (
              <p className="newsletter-success">
                🎉 Welcome to our confectionery circle! You&apos;re subscribed.
              </p>
            ) : (
              <form className="newsletter-form" onSubmit={handleSubscribe}>
                <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  placeholder="Your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
                <button type="submit" disabled={isSubmitting} aria-label="Subscribe">
                  {isSubmitting ? (
                    <span className="newsletter-loading" />
                  ) : (
                    <ArrowUpRight size={19} />
                  )}
                </button>
              </form>
            )}
            {newsletterError && (
              <p className="text-xs text-rose-400 mt-2 font-medium">
                {newsletterError}
              </p>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {currentYear} KRUMBISTRY Bake Shop. All rights reserved.</span>
          <span>MADE WITH <Heart size={12} fill="currentColor" /> AND A LITTLE FLOUR.</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-[#e0c17e] hover:underline cursor-pointer bg-transparent border-0 text-[8px] tracking-[0.06em]"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
