import Link from "next/link";
import {
  BarChart3,
  Brain,
  Users,
  TrendingUp,
  ArrowRight,
  Target,
  Sparkles,
  GraduationCap,
} from "lucide-react";

export const metadata = {
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
        url: "/puaniz-og-image-1200x630.png",
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
    images: ["/puaniz-og-image-1200x630.png"],
  },
};

const features = [
  {
    icon: BarChart3,
    title: "Detaylı Analiz",
    description:
      "Her denemenizi ders bazında analiz edin, net grafiklerinizi takip edin ve zayıf noktalarınızı keşfedin.",
    isBlueBg: false,
  },
  {
    icon: Brain,
    title: "AI Asistan",
    description:
      "Yapay zeka destekli asistanla sorularınıza anında cevap alın, çalışma stratejileri geliştirin.",
    isBlueBg: true,
  },
  {
    icon: TrendingUp,
    title: "Gelişim Takibi",
    description:
      "Haftalık, aylık ve genel gelişim grafiklerinizi görün.",
    isNavyBg: true,
  },
  {
    icon: Users,
    title: "Topluluk",
    description:
      "Diğer öğrencilerle soru-cevap paylaşımları yapın,",
    isWhiteBg: true,
  },
];

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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#0F2A5C]/[0.08] shadow-sm text-xs font-bold text-[#0F2A5C] mb-8">
                <span className="w-2 h-2 rounded-full bg-[#FFB020]" />
                <span>YKS 2026&apos;ya hazır mısın?</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl sm:text-6xl font-black text-[#0F2A5C] leading-[1.08] tracking-tight mb-6">
                YKS sürecini{" "}
                <span className="text-[#2F6BFF] underline decoration-[#FFB020] decoration-wavy underline-offset-8">
                  profesyonelce
                </span>{" "}
                yönet
              </h1>

              <p className="text-base sm:text-lg text-[#4A5B7A] max-w-lg mb-10 leading-relaxed font-normal">
                Deneme sınavlarını analiz et, gelişimini takip et ve AI destekli asistanla hedeflerine ulaş. Tamamen ücretsiz.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-[#2F6BFF] hover:bg-[#2558d4] shadow-md shadow-[#2F6BFF]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Hemen Başla →
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center px-7 py-3.5 rounded-xl text-sm font-bold text-[#0F2A5C] bg-white border border-[#0F2A5C]/15 hover:bg-[#F4F7FC] transition-all shadow-sm"
                >
                  Daha Fazla Bilgi
                </Link>
              </div>
            </div>

            {/* Right Graphic Preview (Matching PDF page 2) */}
            <div className="lg:col-span-6 relative">
              <div className="p-8 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-[#0F2A5C] text-sm">Deneme gelişimi</h3>
                  <span className="text-[11px] font-semibold text-[#4A5B7A] px-2.5 py-1 rounded-full bg-[#F4F7FC]">
                    Örnek görünüm
                  </span>
                </div>

                {/* Bars Chart Preview */}
                <div className="h-44 flex items-end justify-between gap-3 px-4 pb-2 border-b border-[#0F2A5C]/[0.08] mb-6">
                  {[
                    { label: "D1", h: "45%", color: "bg-[#2F6BFF]/25" },
                    { label: "D2", h: "60%", color: "bg-[#2F6BFF]/35" },
                    { label: "D3", h: "55%", color: "bg-[#FFB020]" },
                    { label: "D4", h: "75%", color: "bg-[#2F6BFF]/45" },
                    { label: "D5", h: "82%", color: "bg-[#2F6BFF]/55" },
                    { label: "D6", h: "95%", color: "bg-[#2F6BFF]" },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div
                        style={{ height: bar.h }}
                        className={`w-full rounded-t-xl transition-all ${bar.color}`}
                      />
                      <span className="text-[10px] font-semibold text-[#4A5B7A]">{bar.label}</span>
                    </div>
                  ))}
                </div>

                {/* Subject Bars */}
                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-[#0F2A5C]">Matematik · Türev</span>
                      <span className="text-[10px] bg-[#FFB020] text-[#0F2A5C] font-bold px-2 py-0.5 rounded-full">
                        Eksik konu
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F4F7FC] overflow-hidden">
                      <div className="w-[45%] h-full bg-[#FFB020] rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                      <span className="text-[#0F2A5C]">Türkçe · Paragraf</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F4F7FC] overflow-hidden">
                      <div className="w-[85%] h-full bg-[#2F6BFF] rounded-full" />
                    </div>
                  </div>
                </div>

                {/* AI Floating Card */}
                <div className="absolute -bottom-6 -left-6 max-w-xs p-4 rounded-2xl bg-[#0F2A5C] text-white shadow-2xl border border-white/10 hidden sm:block">
                  <p className="text-[10px] font-bold text-[#FFB020] uppercase tracking-wider mb-1">
                    AI Asistan
                  </p>
                  <p className="text-xs text-white/90 leading-snug font-medium">
                    Türev&apos;de zorlandığın soru tiplerini birlikte çözelim mi?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar (Navy background banner from PDF page 2) */}
      <section className="py-10 bg-[#0F2A5C] text-white">
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

      {/* Features (Neden puaniz?) */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-[#0F2A5C] mb-4 tracking-tight">
              Neden <span className="text-[#2F6BFF]">puaniz</span>?
            </h2>
            <p className="text-[#4A5B7A] max-w-xl mx-auto text-base">
              YKS hazırlığını bir üst seviyeye taşımak için ihtiyacın olan her şey tek bir platformda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Detaylı Analiz Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                {/* Visual bar glyph */}
                <div className="flex items-end gap-1.5 h-12 mb-6">
                  <div className="w-3.5 h-6 rounded-md bg-[#7FB0FF]" />
                  <div className="w-3.5 h-4 rounded-md bg-[#FFB020]" />
                  <div className="w-3.5 h-9 rounded-md bg-[#2F6BFF]/40" />
                  <div className="w-3.5 h-12 rounded-md bg-[#2F6BFF]" />
                </div>
                <h3 className="text-2xl font-black text-[#0F2A5C] mb-3">
                  Detaylı Analiz
                </h3>
                <p className="text-sm text-[#4A5B7A] leading-relaxed">
                  Her denemenizi ders bazında analiz edin, net grafiklerinizi takip edin ve zayıf noktalarınızı keşfedin.
                </p>
              </div>
            </div>

            {/* AI Asistan Card (Blue Background as in PDF) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#2F6BFF] text-white shadow-lg shadow-[#2F6BFF]/25 flex flex-col justify-between min-h-[260px]">
              <div>
                <div className="inline-block px-4 py-2 rounded-2xl bg-white text-[#0F2A5C] font-bold text-xs mb-8 shadow-sm">
                  Bu soruyu nasıl çözerim?
                </div>
                <h3 className="text-2xl font-black text-white mb-3">
                  AI Asistan
                </h3>
                <p className="text-sm text-white/85 leading-relaxed">
                  Yapay zeka destekli asistanla sorularınıza anında cevap alın, çalışma stratejileri geliştirin.
                </p>
              </div>
            </div>

            {/* Gelişim Takibi Card (Navy Background with chart line) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-[#0F2A5C] text-white shadow-lg shadow-[#0F2A5C]/20 flex flex-col justify-between min-h-[260px]">
              <div>
                {/* Stylized wave line in amber */}
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
                <h3 className="text-2xl font-black text-white mb-3">
                  Gelişim Takibi
                </h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Haftalık, aylık ve genel gelişim grafiklerinizi görün.
                </p>
              </div>
            </div>

            {/* Topluluk Card (Circles graphic) */}
            <div className="p-8 sm:p-10 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm flex flex-col justify-between min-h-[260px]">
              <div>
                {/* 4 Brand circles */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-9 h-9 rounded-full bg-[#2F6BFF]" />
                  <div className="w-9 h-9 rounded-full bg-[#FFB020]" />
                  <div className="w-9 h-9 rounded-full bg-[#0F2A5C]" />
                  <div className="w-9 h-9 rounded-full bg-[#7FB0FF]" />
                </div>
                <h3 className="text-2xl font-black text-[#0F2A5C] mb-3">
                  Topluluk
                </h3>
                <p className="text-sm text-[#4A5B7A] leading-relaxed">
                  Diğer öğrencilerle soru-cevap paylaşımları yapın,
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section (Navy card with subtle bars on right) */}
      <section className="py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-10 sm:p-16 rounded-3xl bg-[#0F2A5C] text-white text-center shadow-2xl overflow-hidden">
            {/* Background Bars */}
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
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold text-[#0F2A5C] bg-[#FFB020] hover:bg-[#f5a71a] shadow-lg shadow-[#FFB020]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Ücretsiz Kayıt Ol →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
