import React from "react";
import type { Metadata } from "next";
import { Mail, Building2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "İletişim | Puaniz",
  description:
    "Puaniz ile iletişime geçin. Okullar, kurumlar ve iş birlikleri için bizimle iletişime geçebilirsiniz.",
  openGraph: {
    title: "İletişim | Puaniz",
    description:
      "Puaniz ile iletişime geçin. Okullar ve kurumlar için iş birliği fırsatları.",
    url: "https://www.puaniz.com.tr/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="pt-28 sm:pt-36 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-black text-[var(--text)] mb-5 tracking-tight">
            İletişim
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            Bir okulun veya kurumun temsilcisi misiniz? Birlikte çalışmak için
            bizimle iletişime geçin.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Okullar İçin */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center mb-6 text-[var(--link)] shadow-sm border border-[var(--border)]">
                <Building2 size={24} />
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] mb-3">
                Okullar İçin
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                Okulunuzdaki öğrencilerin gelişimini takip etmek, deneme
                sonuçlarını toplu analiz etmek ve kurumsal dashboard erişimi için
                bizimle iletişime geçin.
              </p>
            </div>
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[var(--accent-soft)] text-[#FFB020] font-bold text-xs tracking-wide">
                Yakında
              </span>
            </div>
          </div>

          {/* Genel İletişim */}
          <div className="p-8 sm:p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#2F6BFF] flex items-center justify-center mb-6 text-white shadow-sm shadow-[#2F6BFF]/20">
                <Mail size={24} />
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] mb-3">
                Genel İletişim
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                Geri bildirim, öneriler veya sorularınız için bize
                ulaşabilirsiniz. Her türlü geri bildirimi memnuniyetle
                karşılıyoruz.
              </p>
            </div>
            <div>
              <a
                href="mailto:iletisim@puaniz.com.tr"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--link)] hover:text-[#4A80FF] font-bold transition-colors"
              >
                iletisim@puaniz.com.tr
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="text-center p-6 rounded-2xl bg-[var(--accent-soft)] border border-[rgba(255,176,32,0.4)]">
          <p className="text-sm text-[var(--text)] font-medium">
            İletişim formu yakında aktif olacaktır. Şimdilik yukarıdaki
            e-posta adresi üzerinden ulaşabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
