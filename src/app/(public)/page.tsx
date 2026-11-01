import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import LandingNetCalculator from "@/components/landing/LandingNetCalculator";
import { School, CheckCircle2, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Puaniz | YKS Analiz ve Takip Platformu",
  description:
    "YKS sürecinizi profesyonel analizlerle yönetin. Deneme sınavlarınızı takip edin, gelişiminizi görün ve hedeflerinize ulaşın. Ücretsiz başlayın!",
  keywords: [
    "YKS",
    "TYT",
    "AYT",
    "YKS Takip",
    "Deneme Analizi",
    "YKS Puan Hesaplama",
    "Sınav Takip",
    "YKS 2026",
    "Net Takip",
  ],
  openGraph: {
    title: "Puaniz | YKS Analiz ve Takip Platformu",
    description:
      "YKS hazırlık sürecinde netlerinizi ve gelişiminizi profesyonel grafiklerle takip edin.",
    url: "https://www.puaniz.com.tr",
    siteName: "Puaniz",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Puaniz | YKS Analiz ve Takip Platformu",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Puaniz | YKS Analiz ve Takip Platformu",
    description: "YKS sürecinizi verilerle yönetin.",
    images: ["/og-image.png"],
  },
};

const stats = [
  { value: "Ücretsiz", label: "Tüm özellikler" },
  { value: "7/24", label: "AI asistan" },
  { value: "∞", label: "Deneme kaydı" },
  { value: "Anlık", label: "Analiz sonuçları" },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm text-xs font-bold text-[var(--text)] mb-8">
                <span className="w-2 h-2 rounded-full bg-[#FFB020]" />
                <span>YKS 2026&apos;ya hazır mısın?</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-6xl font-black text-[var(--text)] leading-[1.08] tracking-tight mb-6">
                YKS sürecini{" "}
                <span className="text-[var(--link)] underline decoration-[#FFB020] decoration-wavy underline-offset-8">
                  profesyonelce
                </span>{" "}
                yönet
              </h1>

              <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-lg mb-10 leading-relaxed font-normal">
                Deneme sınavlarını analiz et, gelişimini takip et ve AI destekli asistanla hedeflerine ulaş. Tamamen ücretsiz.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-[#2F6BFF] hover:bg-[#4A80FF] shadow-md shadow-[#2F6BFF]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Hemen Başla →
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center px-7 py-3.5 rounded-xl text-sm font-bold text-[var(--text)] bg-[var(--surface-2)] border border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all shadow-sm"
                >
                  Daha Fazla Bilgi
                </Link>
              </div>
            </div>

            {/* Right Graphic Preview */}
            <div className="lg:col-span-6 relative">
              <div className="p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-[var(--text)] text-sm">Deneme gelişimi</h3>
                  <span className="text-[11px] font-semibold text-[var(--text-muted)] px-2.5 py-1 rounded-full bg-[var(--surface-2)]">
                    Örnek görünüm
                  </span>
                </div>

                {/* Bars Chart Preview */}
                <div className="h-44 flex items-end justify-between gap-3 px-4 pb-2 border-b border-[var(--border)] mb-6">
                  {[
                    { label: "D1", h: "45%", color: "bg-[#2A4A8C]" },
                    { label: "D2", h: "60%", color: "bg-[#2A4A8C]" },
                    { label: "D3", h: "55%", color: "bg-[#FFB020]" },
                    { label: "D4", h: "75%", color: "bg-[#5B8CFF]" },
                    { label: "D5", h: "82%", color: "bg-[#5B8CFF]" },
                    { label: "D6", h: "95%", color: "bg-[#2F6BFF]" },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        style={{ height: bar.h }}
                        className={`w-full rounded-t-xl transition-all ${bar.color}`}
                      />
                      <span className="text-[10px] font-semibold text-[var(--text-muted)]">{bar.label}</span>
                    </div>
                  ))}
                </div>

                {/* Subject Bars */}
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-[var(--text)]">Matematik · Türev</span>
                      <span className="text-[10px] bg-[#FFB020] text-[#0F2A5C] font-bold px-2 py-0.5 rounded-full">
                        Eksik konu
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
                      <div className="w-[45%] h-full bg-[#FFB020] rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-[var(--text)]">Türkçe · Paragraf</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
                      <div className="w-[85%] h-full bg-[#4A80FF] rounded-full" />
                    </div>
                  </div>
                </div>

                {/* AI Floating Card */}
                <div className="absolute -bottom-6 -left-6 max-w-xs p-4 rounded-2xl bg-[#2F6BFF] text-white shadow-2xl border border-white/10 hidden sm:block">
                  <p className="text-[10px] font-bold text-[#FFB020] uppercase tracking-wider mb-1">
                    AI Asistan
                  </p>
                  <p className="text-xs text-white leading-snug font-medium">
                    Türev&apos;de zorlandığın soru tiplerini birlikte çözelim mi?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 bg-[var(--hero-to)] text-white border-y border-[var(--border-strong)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-black mb-1 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Net & Rank Calculator Simulation */}
      <section className="py-16 sm:py-20 bg-[var(--surface-2)]/50 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <LandingNetCalculator />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-[var(--text)] mb-4 tracking-tight">
              Neden <span className="text-[#2F6BFF]">puaniz</span>?
            </h2>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto text-base">
              YKS hazırlığını bir üst seviyeye taşımak için ihtiyacın olan her şey tek bir platformda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Detaylı Analiz Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                <div className="flex items-end gap-1.5 h-12 mb-6">
                  <div className="w-3.5 h-6 rounded-md bg-[#7FB0FF]" />
                  <div className="w-3.5 h-4 rounded-md bg-[#FFB020]" />
                  <div className="w-3.5 h-9 rounded-md bg-[#2F6BFF]/40" />
                  <div className="w-3.5 h-12 rounded-md bg-[#2F6BFF]" />
                </div>
                <h3 className="text-2xl font-black text-[var(--text)] mb-3">
                  Detaylı Analiz
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Her denemenizi ders bazında analiz edin, net grafiklerinizi takip edin ve zayıf noktalarınızı keşfedin.
                </p>
              </div>
            </div>

            {/* AI Asistan Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#2F6BFF] text-white shadow-lg shadow-[#2F6BFF]/25 flex flex-col justify-between min-h-[260px]">
              <div>
                <div className="inline-block px-4 py-2 rounded-2xl bg-white text-[#0F2A5C] font-bold text-xs mb-8 shadow-sm">
                  Bu soruyu nasıl çözerim?
                </div>
                <h3 className="text-2xl font-black text-white mb-3">
                  AI Asistan
                </h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  Yapay zeka destekli asistanla sorularınıza anında cevap alın, çalışma stratejileri geliştirin.
                </p>
              </div>
            </div>

            {/* Gelişim Takibi Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[var(--surface-3)] text-[var(--text)] border border-[var(--border)] shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                <div className="h-12 flex items-center mb-6">
                  <svg className="w-40 h-8" viewBox="0 0 160 32" fill="none">
                    <path
                      d="M2 24 C 20 20, 30 28, 50 18 C 70 8, 90 20, 110 10 C 130 2, 140 12, 158 4"
                      stroke="#FFB020"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-[var(--text)] mb-3">
                  Gelişim Takibi
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Haftalık, aylık ve genel gelişim grafiklerinizi görün.
                </p>
              </div>
            </div>

            {/* Topluluk Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 rounded-full bg-[#2F6BFF]" />
                  <div className="w-9 h-9 rounded-full bg-[#FFB020]" />
                  <div className="w-9 h-9 rounded-full bg-[#0F2A5C] border border-[var(--border-strong)]" />
                  <div className="w-9 h-9 rounded-full bg-[#7FB0FF]" />
                </div>
                <h3 className="text-2xl font-black text-[var(--text)] mb-3">
                  Topluluk
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  Diğer öğrencilerle soru-cevap paylaşımları yapın, yalnız çalışmayın.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional / School Showcase Section */}
      <section className="py-20 sm:py-24 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface-2)] border border-[var(--border)] shadow-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                  <School size={16} />
                  <span>Okullar & Dershaneler İçin Puaniz</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[var(--text)] tracking-tight">
                  Tüm Okulun Deneme Başarısını Tek Panelden Yönetin
                </h2>
                <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed">
                  Puaniz kurumsal altyapısı ile okul yöneticileri ve öğretmenler; sınıfları oluşturabilir, tek tıkla toplu CSV deneme sonucu yükleyebilir ve sınıflar arası başarı karşılaştırmalarını anlık takip edebilir.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-[var(--text)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Öğrenci numarasıyla otomatik sınav ve karne eşleştirme</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--text)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Sınıflar arası TYT / AYT net karşılaştırma grafikleri</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--text)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Öğretmenlere özel koçluk notları ve öğrenci takibi</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-[var(--text)]">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>Toplu CSV deneme sonucu yükleme ve karne indirme</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 p-6 rounded-2xl bg-[var(--surface-3)]/40 border border-[var(--border)] space-y-4">
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text)]">12-A Şubesi (TYT Ort.)</span>
                    <span className="font-bold text-emerald-500">88.4 Net</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className="w-[88%] h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text)]">12-B Şubesi (TYT Ort.)</span>
                    <span className="font-bold text-[#2F6BFF]">82.1 Net</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className="w-[82%] h-full bg-[#2F6BFF] rounded-full" />
                  </div>
                </div>
                <Link
                  href="/auth"
                  className="w-full py-3 px-4 rounded-xl bg-[#2F6BFF] hover:bg-[#4A80FF] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
                >
                  <span>Kurumunuzu Ekleyin & Keşfedin</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-10 sm:p-16 rounded-3xl bg-[var(--hero-to)] text-white text-center shadow-2xl border border-[var(--border-strong)] overflow-hidden">
            <div className="absolute right-6 bottom-0 flex items-end gap-3 opacity-15 pointer-events-none">
              <div className="w-7 h-20 bg-white rounded-t-lg" />
              <div className="w-7 h-32 bg-white rounded-t-lg" />
              <div className="w-7 h-48 bg-white rounded-t-lg" />
              <div className="w-7 h-64 bg-white rounded-t-lg" />
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 tracking-tight">
              Hedeflerine bir adım daha yaklaş
            </h2>
            <p className="text-white/80 max-w-lg mx-auto mb-8 text-base">
              Binlerce öğrenci ile birlikte YKS hazırlığını veriye dayalı olarak
              yönet. Kayıt ol, deneme sonuçlarını gir ve analizlerine hemen başla.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-[#0F2A5C] bg-[#FFB020] hover:bg-[#FFC24D] shadow-lg shadow-[#FFB020]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Ücretsiz Kayıt Ol →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
