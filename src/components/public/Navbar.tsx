"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Laptop } from "lucide-react";
import Image from "next/image";
import PuanizLogo from "@/components/PuanizLogo";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

interface NavLinkItem {
  href: string;
  label: string;
}

const navLinks: NavLinkItem[] = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/about", label: "Hakkında" },
  { href: "/pricing", label: "Fiyatlandırma" },
  { href: "/contact", label: "İletişim" },
];

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, userProfile, loading } = useAuth();
  const avatarUrl = userProfile?.avatarUrl || userProfile?.photoURL || user?.image || null;
  const profileName = userProfile?.name || user?.name || "Profilim";
  const initials = profileName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "P";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--border)] shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center group transition-transform hover:scale-[1.02]">
            <PuanizLogo variant="auto" width={135} height={38} priority />
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
                      ? "text-[var(--text)] bg-[var(--surface-3)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA + Theme Toggle + Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick theme button */}
            <button
              onClick={toggleTheme}
              aria-label="Temayı Değiştir"
              title={`Tema: ${theme === "light" ? "Açık" : theme === "dark" ? "Koyu" : "Sistem"}`}
              className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] border border-[var(--border)] transition-colors cursor-pointer"
            >
              {theme === "light" ? <Sun size={17} /> : theme === "dark" ? <Moon size={17} /> : <Laptop size={17} />}
            </button>

            {loading ? (
              <div className="hidden sm:block h-10 w-28 animate-pulse rounded-xl bg-[var(--surface-2)]" aria-label="Hesap yükleniyor" />
            ) : user ? (
              <Link
                href="/dashboard"
                aria-label="Profilim, panele git"
                className="hidden sm:inline-flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1.5 pl-1.5 pr-4 text-sm font-bold text-[var(--text)] shadow-sm transition hover:border-[var(--link)]/40 hover:bg-[var(--surface-2)]"
              >
                <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#2F6BFF] text-xs font-extrabold text-white">
                  {initials}
                  {avatarUrl && <Image src={avatarUrl} alt="" fill unoptimized onError={(event) => { event.currentTarget.style.display = "none"; }} className="object-cover" />}
                </span>
                <span className="max-w-32 truncate">{profileName}</span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className="hidden sm:inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#2F6BFF] hover:bg-[#4A80FF] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Giriş Yap
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menü"
              className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--surface-2)] transition-colors"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMenuOpen ? "max-h-96 border-t border-[var(--border)]" : "max-h-0"
        }`}
      >
        <div className="bg-[var(--bg)]/98 backdrop-blur-xl px-4 py-4 space-y-1 shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "text-[var(--text)] bg-[var(--surface-3)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2">
            {loading ? (
              <div className="h-11 animate-pulse rounded-xl bg-[var(--surface-2)]" aria-label="Hesap yükleniyor" />
            ) : user ? (
              <Link
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-bold text-[var(--text)]"
              >
                <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#2F6BFF] text-xs font-extrabold text-white">
                  {initials}
                  {avatarUrl && <Image src={avatarUrl} alt="" fill unoptimized onError={(event) => { event.currentTarget.style.display = "none"; }} className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1 truncate">{profileName}</span>
                <span className="text-xs font-semibold text-[var(--link)]">Panele git</span>
              </Link>
            ) : (
              <Link
                href="/auth"
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#2F6BFF]"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
