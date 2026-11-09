"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Cake,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Loader2,
} from "lucide-react";

interface AdminSessionInfo {
  adminId: string;
  email: string;
  role: string;
  name: string;
}

interface AdminLayoutShellProps {
  session: AdminSessionInfo;
  children: React.ReactNode;
}

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: Package,
    exact: false,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
    exact: false,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
    exact: false,
  },
  {
    label: "Custom Orders",
    href: "/admin/custom-orders",
    icon: Cake,
    exact: false,
  },
  {
    label: "Inquiries",
    href: "/admin/inquiries",
    icon: MessageSquare,
    exact: false,
  },
  {
    label: "Store Settings",
    href: "/admin/settings",
    icon: Settings,
    exact: false,
  },
];

export default function AdminLayoutShell({ session, children }: AdminLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isNavActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#32190D] flex flex-col md:flex-row selection:bg-[#D6A64B]/30 selection:text-[#32190D]">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between border-b border-[#32190D]/10 bg-white px-4 py-3 sticky top-0 z-40">
        <Link
          href="/admin"
          className="flex items-center gap-2.5"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Image
            src="/logo.png"
            alt="KRUMBISTRY Logo"
            width={38}
            height={38}
            className="h-9 w-auto object-contain"
            style={{ width: "auto", height: "auto", maxHeight: "36px" }}
            priority
          />
          <div>
            <span className="font-serif font-bold text-base tracking-wide text-[#32190D]">
              KRUMBISTRY
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-[#D6A64B] font-semibold -mt-0.5">
              Admin Portal
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-[#32190D] hover:bg-[#F8F3E9] transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Desktop Fixed & Mobile Slide) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#1B0F08] text-white flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-3 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="p-1 rounded-xl bg-white/10 border border-[#D6A64B]/40 flex items-center justify-center shrink-0 group-hover:border-[#D6A64B] transition-colors">
              <Image
                src="/logo.png"
                alt="KRUMBISTRY Logo"
                width={42}
                height={42}
                className="h-10 w-auto object-contain"
                style={{ width: "auto", height: "auto", maxHeight: "40px" }}
                priority
              />
            </div>
            <div>
              <div className="font-serif text-lg font-bold tracking-wider text-white">
                KRUMBISTRY
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#D6A64B] font-semibold">
                Bake Shop Administration
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-white/70 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Management Modules
          </div>

          {navItems.map((item) => {
            const active = isNavActive(item.href, item.exact);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#D6A64B] text-[#1B0F08] font-semibold shadow-sm"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={active ? "text-[#1B0F08]" : "text-[#D6A64B]"}
                  />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight size={16} className="text-[#1B0F08]/70" />}
              </Link>
            );
          })}

          <div className="pt-6 px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            Storefront
          </div>

          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-3">
              <ExternalLink size={18} className="text-[#D6A64B]" />
              <span>Live Storefront</span>
            </div>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">
              New Tab
            </span>
          </Link>
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#D6A64B]/20 border border-[#D6A64B]/40 flex items-center justify-center text-[#D6A64B] text-xs font-bold">
              <Shield size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {session.name || "Administrator"}
              </p>
              <p className="text-[11px] text-white/60 truncate font-mono">
                {session.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-medium text-white/90 hover:bg-red-950/40 hover:border-red-800 hover:text-red-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoggingOut ? (
              <Loader2 size={14} className="animate-spin text-[#D6A64B]" />
            ) : (
              <LogOut size={14} className="text-red-400" />
            )}
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content View */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}

