import React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <GraduationCap size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">Puaniz</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              YKS hazırlık sürecini profesyonel analizlerle yönetin. Gelişiminizi takip edin, hedeflerinize ulaşın.
            </p>
          </div>

          {/* Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Sayfalar</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-slate-400 hover:text-white transition-colors">
                Ana Sayfa
              </Link>
              <Link href="/about" className="block text-sm text-slate-400 hover:text-white transition-colors">
                Hakkında
              </Link>
              <Link href="/pricing" className="block text-sm text-slate-400 hover:text-white transition-colors">
                Fiyatlandırma
              </Link>
              <Link href="/contact" className="block text-sm text-slate-400 hover:text-white transition-colors">
                İletişim
              </Link>
            </div>
          </div>

          {/* Access */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Erişim</h3>
            <div className="space-y-2">
              <Link href="/auth" className="block text-sm text-slate-400 hover:text-white transition-colors">
                Giriş Yap
              </Link>
              <Link href="/dashboard" className="block text-sm text-slate-400 hover:text-white transition-colors">
                Panel
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Puaniz. Tüm hakları saklıdır.
          </p>
          <p className="text-xs text-slate-600">
            Öğrenciler için, öğrenciler tarafından 💜
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
