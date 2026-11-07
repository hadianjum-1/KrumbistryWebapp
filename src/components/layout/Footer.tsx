"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CakeSlice,
  Clock3,
  Heart,
  Mail,
  MapPin,
  Phone,
  Truck,
} from "lucide-react";
import InstagramIcon from "@/components/ui/InstagramIcon";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  function handleSubscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    // UI demo only: connect this form to an API/email platform before launch.
    setSubmitted(true);
  }

  return (
    <footer className="site-footer" id="contact">
      <div className="site-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Link href="#home" className="footer-logo">
              <span className="footer-seal"><CakeSlice size={27} /></span>
              <span><strong>KRUMBISTRY</strong><small>BAKE SHOP</small></span>
            </Link>
            <p>Thoughtfully made treats for life's sweetest moments.</p>
            <a className="footer-social" href="#instagram">
              <InstagramIcon size={17} /> Follow our journey <ArrowUpRight size={14} />
            </a>
          </div>

          <div className="footer-column">
            <h3>Explore</h3>
            <a href="#home">Home</a>
            <a href="#story">Our Story</a>
            <a href="/menu">Our Menu</a>
            <a href="#custom-orders">Custom Orders</a>
          </div>

          <div className="footer-column">
            <h3>Say hello</h3>
            <a href="mailto:hello@krumbistry.com"><Mail size={15} /> hello@krumbistry.com</a>
            <a href="tel:+920000000000"><Phone size={15} /> Add business phone</a>
            <a href="#contact"><MapPin size={15} /> Add bakery location</a>
          </div>

          <div className="footer-column footer-hours">
            <h3>Come by</h3>
            <p><Clock3 size={15} /> Business hours</p>
            <span>Update opening days &amp; times</span>
            <p><Truck size={15} /> Pickup &amp; delivery</p>
            <span>Ask us about availability</span>
          </div>

          <div className="footer-newsletter">
            <h3>A sweeter inbox.</h3>
            <p>Sign up for new treats, special moments, and little surprises.</p>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <label className="sr-only" htmlFor="newsletter-email">Your email address</label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button type="submit" aria-label="Subscribe"><ArrowUpRight size={19} /></button>
            </form>
            {submitted && (
              <p className="newsletter-success">
                Thanks! Connect this form to your email service to receive subscriptions.
              </p>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {currentYear ?? ""} KRUMBISTRY Bake Shop. All rights reserved.</span>
          <span>MADE WITH <Heart size={12} fill="currentColor" /> AND A LITTLE FLOUR.</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
