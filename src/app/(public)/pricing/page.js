import Link from "next/link";
import {
  Check,
  X,
  GraduationCap,
  Building2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "Fiyatlandırma | Puaniz",
  description:
    "Puaniz fiyatlandırma planları. Öğrenciler için ücretsiz ve premium paketler, okullar için toplu kullanım fırsatları.",
  openGraph: {
    title: "Fiyatlandırma | Puaniz",
    description: "Öğrenciler ve okullar için esnek fiyatlandırma planları.",
    url: "https://www.puaniz.com.tr/pricing",
  },
};

const studentPlans = [
  {
    name: "Ücretsiz",
    price: "0",
    period: "sonsuza dek",
    description: "YKS hazırlığına hemen başla",
    gradient: "from-slate-600 to-slate-700",
    borderColor: "border-slate-700/50",
    features: [
      { text: "Sınırsız deneme kaydı", included: true },
      { text: "Temel net analizi", included: true },
      { text: "Gelişim grafikleri", included: true },
      { text: "Soru-Cevap topluluğu", included: true },
      { text: "AI Asistan (günde 5 soru)", included: true },
      { text: "Detaylı ders bazlı analiz", included: false },
      { text: "PDF rapor oluşturma", included: false },
      { text: "Hedef puan takibi", included: false },
      { text: "Öncelikli destek", included: false },
    ],
    cta: "Ücretsiz Başla",
    ctaStyle: "bg-white/5 border border-white/10 text-white hover:bg-white/10",
    popular: false,
  },
  {
    name: "Premium",
    price: "49",
    period: "aylık",
    description: "Tam güçle hazırlan",
    gradient: "from-purple-600 to-pink-600",
    borderColor: "border-purple-500/30",
    features: [
      { text: "Sınırsız deneme kaydı", included: true },
      { text: "Temel net analizi", included: true },
      { text: "Gelişim grafikleri", included: true },
      { text: "Soru-Cevap topluluğu", included: true },
      { text: "AI Asistan (sınırsız)", included: true },
      { text: "Detaylı ders bazlı analiz", included: true },
      { text: "PDF rapor oluşturma", included: true },
      { text: "Hedef puan takibi", included: true },
      { text: "Öncelikli destek", included: true },
    ],
    cta: "Premium'a Geç",
    ctaStyle:
      "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-900/30",
    popular: true,
  },
];

const schoolPlans = [
  {
    name: "Başlangıç",
    students: "50'ye kadar",
    pricePerStudent: "29",
    description: "Küçük okullar ve dershaneler için",
    features: [
      "Tüm Premium özellikler",
      "Öğrenci paneli",
      "Toplu deneme sonucu girişi",
      "Temel raporlama",
    ],
  },
  {
    name: "Kurumsal",
    students: "51-200",
    pricePerStudent: "19",
    description: "Orta ölçekli okullar için",
    features: [
      "Tüm Başlangıç özellikleri",
      "Sınıf bazlı analiz",
      "Öğretmen paneli",
      "Gelişmiş raporlama",
      "API erişimi",
    ],
    popular: true,
  },
  {
    name: "Özel",
    students: "200+",
    pricePerStudent: "Teklif",
    description: "Büyük kurumlar için özel çözüm",
    features: [
      "Tüm Kurumsal özellikler",
      "Özel entegrasyon",
      "Dedicated destek",
      "SLA garantisi",
      "Özel eğitim",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="pt-28 sm:pt-36 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6">
            <Sparkles size={14} />
            <span>Demo Fiyatlandırma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            Fiyatlandırma
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            İhtiyacına uygun planı seç. Bireysel kullanıcıdan okullara kadar
            herkes için esnek seçenekler.
          </p>
        </div>

        {/* Student Plans */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Öğrenci Planları</h2>
              <p className="text-sm text-slate-400">Bireysel kullanım için</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {studentPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 sm:p-8 rounded-2xl bg-slate-800/40 border ${plan.borderColor} hover:bg-slate-800/60 transition-all ${
                  plan.popular ? "ring-1 ring-purple-500/30" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-semibold text-white shadow-lg">
                    Popüler
                  </div>
                )}

                <h3 className="text-lg font-bold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-500 mb-5">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-400 text-sm">
                    ₺ / {plan.period}
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check
                          size={16}
                          className="text-emerald-400 shrink-0"
                        />
                      ) : (
                        <X size={16} className="text-slate-600 shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? "text-slate-300" : "text-slate-600"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/auth"
                  className={`block w-full text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* School Plans */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Okul Paketleri</h2>
              <p className="text-sm text-slate-400">
                Toplu kullanım için kişi başı ücretlendirme
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schoolPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 sm:p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 transition-all ${
                  plan.popular ? "ring-1 ring-blue-500/30" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-xs font-semibold text-white shadow-lg">
                    En Çok Tercih Edilen
                  </div>
                )}

                <h3 className="text-lg font-bold text-white mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {plan.description}
                </p>

                <div className="mb-2">
                  <span className="text-sm text-slate-400">
                    {plan.students} öğrenci
                  </span>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                  {plan.pricePerStudent === "Teklif" ? (
                    <span className="text-2xl font-extrabold text-white">
                      Teklif Alın
                    </span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-white">
                        {plan.pricePerStudent}
                      </span>
                      <span className="text-slate-400 text-sm">
                        ₺ / öğrenci / ay
                      </span>
                    </>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check size={16} className="text-blue-400 shrink-0" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  className={`block w-full text-center px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-900/30"
                      : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  İletişime Geç
                  <ArrowRight size={14} className="inline ml-1" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-12 text-center p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/10">
          <p className="text-slate-400 text-sm">
            ⚠️ Bu fiyatlandırma demo amaçlıdır. Ödeme sistemi henüz aktif
            değildir. Tüm özellikler şu an ücretsiz olarak sunulmaktadır.
          </p>
        </div>
      </div>
    </div>
  );
}
