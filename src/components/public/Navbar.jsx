"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, GraduationCap } from "lucide-react";

import PuanizLogo from "@/components/PuanizLogo";

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/about", label: "Hakkında" },
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/contact", label: "İletişim" },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#F4F7FC]/90 backdrop-blur-md border-b border-[#0F2A5C]/[0.06] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center group transition-transform hover:scale-[1.02]">
            <PuanizLogo variant="horizontal" width={135} height={38} priority />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "text-[#0F2A5C] bg-[#0F2A5C]/[0.05]"
                      : "text-[#4A5B7A] hover:text-[#0F2A5C] hover:bg-[#0F2A5C]/[0.03]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="hidden sm:inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0F2A5C] hover:bg-[#1a3d7d] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Giriş Yap
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? "max-h-80 border-t border-[#0F2A5C]/10" : "max-h-0"
        }`}
      >
        <div className="bg-[#F4F7FC]/98 backdrop-blur-xl px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "text-[#0F2A5C] bg-[#0F2A5C]/[0.08]"
                    : "text-[#4A5B7A] hover:text-[#0F2A5C] hover:bg-[#0F2A5C]/[0.04]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/auth"
            onClick={() => setIsMenuOpen(false)}
            className="block px-4 py-3 rounded-xl text-sm font-bold text-center text-white bg-[#0F2A5C] hover:bg-[#1a3d7d] transition-all"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
