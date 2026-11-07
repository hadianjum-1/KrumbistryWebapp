
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

import { navigation } from "@/data/home";
import InstagramIcon from "@/components/ui/InstagramIcon";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="announcement-bar">
        <div className="site-container announcement-inner">
          <p>
            <Sparkles size={13} />
            A little sweetness, delivered with love.
          </p>

          <span className="announcement-note">
            HANDCRAFTED WITH PASSION · BAKED FRESH
          </span>

          <div className="announcement-socials">
            <a href="#instagram" aria-label="Instagram">
              <InstagramIcon size={14} />
            </a>
            <a href="#contact" aria-label="Contact">
              <MessageCircle size={14} />
            </a>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="site-container header-inner">
          <Link
            href="#home"
            className="brand-lockup"
            aria-label="KRUMBISTRY home"
            onClick={() => setIsMenuOpen(false)}
          >
            <Image
              src="/logo.png"
              alt="KRUMBISTRY Bake Shop"
              width={100}
              height={65}
              priority
              className="brand-logo"
            />
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map((item, index) => (
              <a
                className={index === 0 ? "active" : ""}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <a className="header-icon" href="#menu" aria-label="Explore menu">
              <ShoppingBag size={18} strokeWidth={1.7} />
            </a>

            <a className="button button-dark button-small" href="/menu">
              Explore Menu <ArrowUpRight size={15} />
            </a>

            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav
            className="mobile-nav"
            id="mobile-navigation"
            aria-label="Mobile navigation"
          >
            {navigation.map((item) => (
              <a
                href={item.href}
                key={item.label}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
                <ArrowUpRight size={16} />
              </a>
            ))}

            <a
              className="button button-dark"
              href="#menu"
              onClick={() => setIsMenuOpen(false)}
            >
              Explore Menu <ArrowRight size={16} />
            </a>
          </nav>
        )}
      </header>
    </>
  );
}
