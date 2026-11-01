import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Check, GraduationCap } from "lucide-react";
import PremiumPlanButton from "./PremiumPlanButton";

export const metadata: Metadata = {
  title: "Planlar | Puaniz",
  description: "Puaniz bireysel öğrenci planı ve okul erişimi hakkında bilgi.",
  openGraph: { title: "Planlar | Puaniz", description: "Öğrenci ve kurum kullanımını ayrı inceleyin.", url: "https://www.puaniz.com.tr/pricing" },
};

const freeFeatures = ["Deneme kaydı ve temel net analizi", "Gelişim grafikleri ve deneme geçmişi", "Topluluk ve konu ilerleme takibi", "Hedef ve çalışma profili"];
const premiumFeatures = ["Ders bazlı detaylı analiz", "Kişisel PDF raporları", "Etkileşimli AI asistanı"];

export default function PricingPage() {
  return <main className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
    <header className="mx-auto mb-12 max-w-2xl text-center"><p className="text-sm font-bold uppercase tracking-widest text-[var(--link)]">Planlar</p><h1 className="mt-3 text-4xl font-black text-[var(--text)] sm:text-5xl">Puaniz’i ihtiyacına göre kullan</h1><p className="mt-4 text-base leading-7 text-[var(--text-muted)]">Öğrenci ve okullar için kullanım modelleri ayrıdır.</p></header>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-9"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[var(--surface-2)] p-3 text-[var(--text-muted)]"><GraduationCap size={24}/></span><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Bireysel öğrenci</p><h2 className="text-2xl font-black text-[var(--text)]">Ücretsiz</h2></div></div><p className="mt-6 text-4xl font-black text-[var(--text)]">0 TL <span className="text-base font-semibold text-[var(--text-muted)]">/ sürekli</span></p><ul className="my-7 flex-1 space-y-3">{freeFeatures.map(text=><li key={text} className="flex gap-3 text-sm text-[var(--text)]"><Check size={17} className="mt-0.5 shrink-0 text-emerald-600"/>{text}</li>)}</ul><Link href="/auth" className="block rounded-xl border border-[var(--border-strong)] px-5 py-3.5 text-center text-sm font-extrabold text-[var(--text)] transition hover:bg-[var(--surface-3)]">Ücretsiz hesabı kullan</Link></section>
      <section className="flex flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-9"><div className="flex items-center gap-3"><span className="rounded-2xl bg-blue-500/10 p-3 text-blue-600"><GraduationCap size={24}/></span><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--link)]">Bireysel öğrenci</p><h2 className="text-2xl font-black text-[var(--text)]">Premium</h2></div></div><p className="mt-6 text-lg font-bold text-[var(--text)]">Daha derin analiz ve kişisel destek</p><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Güncel üyelik seçeneklerini ve hesabına uygun koşulları giriş yaptıktan sonra Aboneliğim sayfasında görebilirsin.</p><ul className="my-7 flex-1 space-y-3">{premiumFeatures.map(text=><li key={text} className="flex gap-3 text-sm text-[var(--text)]"><Check size={17} className="mt-0.5 shrink-0 text-blue-600"/>{text}</li>)}</ul><PremiumPlanButton/></section>
    </div>
    <section className="mt-7 rounded-3xl border border-[var(--border)] bg-[var(--surface-2)] p-7 sm:p-9"><div className="flex items-center gap-3"><span className="rounded-2xl bg-amber-500/10 p-3 text-amber-700"><Building2 size={24}/></span><div><p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Okul / kurum</p><h2 className="text-2xl font-black text-[var(--text)]">Kurumsal kullanım</h2></div></div><p className="mt-6 text-lg font-bold text-[var(--text)]">Bireysel Premium’dan ayrı</p><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">Okul hesapları öğrenci, öğretmen ve yönetici rollerini; okul verilerini ve kurumsal yönetim akışlarını kullanır. Kişi başı ücret ve kurum lisansı ayrı koşullarla belirlenir. Mevcut okul çalışma alanı atanmış okul üyeliğine göre erişim verir.</p><Link href="/contact" className="mt-6 inline-block rounded-xl border border-[var(--border-strong)] px-5 py-3 text-center text-sm font-bold text-[var(--text)] transition hover:bg-[var(--surface-3)]">Kurumlar için iletişime geç</Link></section>
  </main>;
}
