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
  },
  twitter: {
    card: "summary_large_image",
    title: "Puaniz | YKS Analiz ve Takip Platformu",
    description: "YKS sürecinizi verilerle yönetin.",
  },
};

const features = [
  {
    icon: BarChart3,
    title: "Detaylı Analiz",
    description:
      "Her denemenizi ders bazında analiz edin, net grafiklerinizi takip edin ve zayıf noktalarınızı keşfedin.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Brain,
    title: "AI Asistan",
    description:
      "Yapay zeka destekli asistanla sorularınıza anında cevap alın, çalışma stratejileri geliştirin.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: TrendingUp,
    title: "Gelişim Takibi",
    description:
      "Haftalık, aylık ve genel gelişim grafiklerinizi görün. Hedeflerinize ne kadar yaklaştığınızı bilin.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Users,
    title: "Topluluk",
    description:
      "Diğer öğrencilerle soru-cevap paylaşımları yapın, deneyimlerden faydalanın ve birlikte çalışın.",
    gradient: "from-orange-500 to-amber-500",
  },
];

const stats = [
  { value: "Ücretsiz", label: "Tüm Özellikler" },
  { value: "7/24", label: "AI Asistan" },
  { value: "∞", label: "Deneme Kaydı" },
  { value: "Anlık", label: "Analiz Sonuçları" },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-[100px] animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[150px]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-8 backdrop-blur-sm">
            <Sparkles size={14} />
            <span>YKS 2026&apos;ya Hazır Mısın?</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-6">
            YKS Sürecini{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Profesyonelce
            </span>{" "}
            Yönet
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Deneme sınavlarını analiz et, gelişimini takip et ve AI destekli
            asistanla hedeflerine ulaş.{" "}
            <span className="text-slate-300">Tamamen ücretsiz.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth"
              className="group flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-900/30 hover:shadow-purple-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GraduationCap size={20} />
              Hemen Başla
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
            >
              Daha Fazla Bilgi
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Neden Puaniz?
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              YKS hazırlığını bir üst seviyeye taşımak için ihtiyacın olan her
              şey tek bir platformda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600/50 transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <feature.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative p-10 sm:p-14 rounded-3xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/20 overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px]" />
            </div>

            <Target size={40} className="text-purple-400 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Hedeflerine Bir Adım Daha Yaklaş
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-8">
              Binlerce öğrenci ile birlikte YKS hazırlığını veriye dayalı olarak
              yönet. Kayıt ol, deneme sonuçlarını gir ve analizlerine hemen
              başla.
            </p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-xl shadow-purple-900/30 hover:shadow-purple-900/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Ücretsiz Kayıt Ol
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
