import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Check,
  X,
  GraduationCap,
  Building2,
} from "lucide-react";

export const metadata: Metadata = {
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
    popular: false,
  },
  {
    name: "Premium",
    price: "49",
    period: "aylık",
    description: "Tam güçle hazırlan",
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
    popular: true,
  },
];

const schoolPlans = [
  {
    name: "Başlangıç",
    students: "50'ye kadar öğrenci",
    pricePerStudent: "29",
    description: "Küçük okullar ve dershaneler için",
    features: [
      "Tüm Premium özellikler",
      "Öğrenci paneli",
      "Toplu deneme sonucu girişi",
      "Temel raporlama",
    ],
    popular: false,
  },
  {
    name: "Kurumsal",
    students: "51-200 öğrenci",
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
    students: "200+ öğrenci",
    pricePerStudent: "Teklif Alın",
    description: "Büyük kurumlar için özel çözüm",
    features: [
      "Tüm Kurumsal özellikler",
      "Özel entegrasyon",
      "Dedicated destek",
      "SLA garantisi",
      "Özel eğitim",
    ],
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="pt-28 sm:pt-36 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[rgba(255,176,32,0.4)] text-[var(--accent-text)] text-xs font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#FFB020]" />
            <span>Demo Fiyatlandırma</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[var(--text)] mb-5 tracking-tight">
            Fiyatlandırma
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed">
            İhtiyacına uygun planı seç. Bireysel kullanıcıdan okullara kadar
            herkes için esnek seçenekler.
          </p>
        </div>

        {/* Student Plans */}
        <div className="mb-24">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-[#2F6BFF] text-white flex items-center justify-center shadow-md shadow-[#2F6BFF]/20">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text)]">Öğrenci Planları</h2>
              <p className="text-sm text-[var(--text-muted)]">Bireysel kullanım için</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {studentPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 sm:p-10 rounded-3xl transition-all flex flex-col justify-between ${
                  plan.popular
                    ? "bg-[var(--surface-3)] text-[var(--text)] shadow-xl border-2 border-[#2F6BFF]"
                    : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-5 py-1 rounded-full bg-[#FFB020] text-xs font-bold text-[#0F2A5C] shadow-md uppercase tracking-wider">
                    Popüler
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                  <p className="text-sm mb-6 text-[var(--text-muted)]">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1.5 mb-8">
                    <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                    <span className="text-sm font-medium text-[var(--text-muted)]">
                      ₺ / {plan.period}
                    </span>
                  </div>

                  <div className="space-y-3.5 mb-10">
                    {plan.features.map((feature) => (
                      <div key={feature.text} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check
                            size={16}
                            className={`shrink-0 ${plan.popular ? "text-[#FFB020]" : "text-[var(--link)]"}`}
                          />
                        ) : (
                          <X
                            size={16}
                            className="shrink-0 text-[var(--text-subtle)] opacity-50"
                          />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            feature.included
                              ? "text-[var(--text)]"
                              : "text-[var(--text-subtle)]"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/auth"
                  className={`block w-full text-center py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${
                    plan.popular
                      ? "bg-[#FFB020] text-[#0F2A5C] hover:bg-[#FFC24D] shadow-lg shadow-[#FFB020]/25"
                      : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)] border border-[var(--border-strong)]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* School Plans */}
        <div>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-[#FFB020] text-[#0F2A5C] flex items-center justify-center shadow-md shadow-[#FFB020]/20">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text)]">Okul Paketleri</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Toplu kullanım için kişi başı ücretlendirme
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {schoolPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 sm:p-9 rounded-3xl transition-all flex flex-col justify-between ${
                  plan.popular
                    ? "bg-[var(--surface-3)] text-[var(--text)] shadow-xl border-2 border-[#2F6BFF]"
                    : "bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#FFB020] text-xs font-bold text-[#0F2A5C] shadow-md uppercase tracking-wider whitespace-nowrap">
                    En Çok Tercih Edilen
                  </div>
                )}

                <div>
                  <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                  <p className="text-xs mb-3 text-[var(--text-muted)]">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">
                      {plan.students}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-8">
                    {plan.pricePerStudent === "Teklif Alın" ? (
                      <span className="text-3xl font-black tracking-tight">
                        Teklif Alın
                      </span>
                    ) : (
                      <>
                        <span className="text-4xl font-black tracking-tight">
                          {plan.pricePerStudent}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-muted)]">
                          ₺ / öğrenci / ay
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-3 mb-10">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-3">
                        <Check
                          size={16}
                          className={`shrink-0 ${plan.popular ? "text-[#FFB020]" : "text-[var(--link)]"}`}
                        />
                        <span className="text-sm font-medium text-[var(--text)]">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/contact"
                  className={`block w-full text-center py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] ${
                    plan.popular
                      ? "bg-[#FFB020] text-[#0F2A5C] hover:bg-[#FFC24D] shadow-lg shadow-[#FFB020]/25"
                      : "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)] border border-[var(--border-strong)]"
                  }`}
                >
                  İletişime Geç →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-16 text-center p-6 rounded-2xl bg-[var(--accent-soft)] border border-[rgba(255,176,32,0.4)]">
          <p className="text-sm text-[var(--text)] font-medium">
            Bu fiyatlandırma demo amaçlıdır. Ödeme sistemi henüz aktif
            değildir. Tüm özellikler şu an ücretsiz olarak sunulmaktadır.
          </p>
        </div>
      </div>
    </div>
  );
}
