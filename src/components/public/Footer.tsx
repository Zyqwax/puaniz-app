import React from "react";
import Link from "next/link";
import PuanizLogo from "@/components/PuanizLogo";

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--footer-bg)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <PuanizLogo variant="auto" width={130} height={36} />
            </Link>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-sm">
              YKS hazırlık sürecini profesyonelce analizlerle yönetin. Gelişiminizi takip edin, hedeflerinize ulaşın.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Sayfalar</h3>
            <div className="space-y-2.5">
              <Link href="/" className="block text-sm text-[var(--text-muted)] hover:text-[var(--link)] font-medium transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/about" className="block text-sm text-[var(--text-muted)] hover:text-[var(--link)] font-medium transition-colors">
                Hakkında
              </Link>
              <Link href="/pricing" className="block text-sm text-[var(--text-muted)] hover:text-[var(--link)] font-medium transition-colors">
                Fiyatlandırma
              </Link>
              <Link href="/contact" className="block text-sm text-[var(--text-muted)] hover:text-[var(--link)] font-medium transition-colors">
                İletişim
              </Link>
            </div>
          </div>

          {/* Access */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Erişim</h3>
            <div className="space-y-2.5">
              <Link href="/auth" className="block text-sm text-[var(--text-muted)] hover:text-[var(--link)] font-medium transition-colors">
                Giriş Yap
              </Link>
              <Link href="/dashboard" className="block text-sm text-[var(--text-muted)] hover:text-[var(--link)] font-medium transition-colors">
                Panel
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Puaniz. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Öğrenciler için, öğrenciler tarafından
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
