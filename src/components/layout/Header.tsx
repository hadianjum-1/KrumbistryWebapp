"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
import { useCart } from "@/context/CartContext";
import { siteSettings } from "@/config/site";
import { getWhatsAppUrl } from "@/lib/whatsapp";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();

  const generalWhatsAppUrl = getWhatsAppUrl(
    `Hello ${siteSettings.bakeryName}! I have a question about your bakery.`
  );

  return (
    <>
      <div className="announcement-bar">
        <div className="site-container announcement-inner">
          <p>
            <Sparkles size={13} />
            {siteSettings.announcementText}
          </p>

          <span className="announcement-note">
            {siteSettings.announcementSubtext}
          </span>

          <div className="announcement-socials">
            <a
              href={siteSettings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <InstagramIcon size={14} />
            </a>
            <a
              href={generalWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Us"
            >
              <MessageCircle size={14} />
            </a>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="site-container header-inner">
          <Link
            href="/"
            className="brand-lockup font-heading text-3xl tracking-wider"
            aria-label="KRUMBISTRY home"
            onClick={() => setIsMenuOpen(false)}
          >
            {/* <Image
              src="/krumbistry-logo-transparent.png"
              alt="KRUMBISTRY Bake Shop"
              width={55}
              height={45}
              priority
              className="brand-logo bg-[#32190D] rounded-full p-[8px] "
              style={{ width: "auto", height: "auto" }}
            /> */}

            KRUMBISTRY
          </Link>

          <nav className="desktop-nav " aria-label="Main navigation">
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  className={`${isActive ? "active" : ""} text-[19px] `}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="header-icon relative cursor-pointer bg-transparent border-0 p-0 text-[#32190D] hover:text-[#B88632] transition-colors"
              onClick={openCart}
              aria-label={`View bag (${totalItems} items)`}
            >
              <ShoppingBag size={20} strokeWidth={1.7} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D6A64B] text-[#32190D] font-bold text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {totalItems}
                </span>
              )}
            </button>

            <Link className="button button-dark button-small" href="/menu">
              Explore Menu <ArrowUpRight size={15} />
            </Link>

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
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={isActive ? "text-[#A67C34] font-semibold" : ""}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                  <ArrowUpRight size={16} />
                </Link>
              );
            })}

            <button
              type="button"
              className="w-full text-left py-3 border-b border-[#32190D]/10 text-sm flex items-center justify-between"
              onClick={() => {
                setIsMenuOpen(false);
                openCart();
              }}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={16} /> Your Bag
              </span>
              <span className="bg-[#D6A64B] text-[#32190D] font-bold text-xs px-2 py-0.5 rounded-full">
                {totalItems}
              </span>
            </button>

            <Link
              className="button button-dark"
              href="/menu"
              onClick={() => setIsMenuOpen(false)}
            >
              Explore Menu <ArrowRight size={16} />
            </Link>
          </nav>
        )}
      </header>
    </>
  );
}
