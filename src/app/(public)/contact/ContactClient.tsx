"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { submitContactMessage } from "@/server/actions/contact";
import { CONTACT_TYPE_LABELS } from "@/lib/contact";
import {
  Mail,
  Building2,
  Bug,
  Lightbulb,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  MapPin,
  ArrowRight,
} from "lucide-react";

type ContactType = "general" | "school" | "bug" | "suggestion";

const TYPES: { key: ContactType; label: string; icon: typeof Mail; hint: string }[] = [
  { key: "school", label: "Okul & Kurum", icon: Building2, hint: "Demo, kurumsal kurulum ve fiyatlandırma" },
  { key: "general", label: "Görüş & Soru", icon: MessageSquare, hint: "Platform hakkında her türlü soru" },
  { key: "bug", label: "Hata Bildirimi", icon: Bug, hint: "Karşılaştığınız teknik sorunlar" },
  { key: "suggestion", label: "Öneri", icon: Lightbulb, hint: "Yeni özellik ve geliştirme fikirleri" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Okulumuz için kurumsal kurulum ne kadar sürer?",
    a: "Okul kaydı, müdür ve öğretmen hesaplarının açılması ve sınıf yapısının oluşturulması genellikle 1 iş günü içinde tamamlanır. İlk deneme yüklemesinde ekibimiz sizinle birlikte çalışır.",
  },
  {
    q: "Öğrenci verileri KVKK kapsamında nasıl korunuyor?",
    a: "Veriler şifreli bağlantı üzerinden taşınır ve PostgreSQL üzerinde saklanır. Erişim yalnızca yetkili okul personeline ve öğrencinin kendisine açıktır; üçüncü taraflarla paylaşılmaz.",
  },
  {
    q: "Mevcut deneme sonuçlarımızı toplu aktarabilir miyiz?",
    a: "Evet. CSV şablonunu indirip doldurduktan sonra tek seferde tüm sınıfların sonuçlarını yükleyebilirsiniz. Sonuçlar okul numarasıyla öğrencilere otomatik eşleşir.",
  },
  {
    q: "Hata bildirimi ne kadar sürede yanıtlanır?",
    a: "Kritik hatalar aynı gün, diğer bildirimler en geç 2 iş günü içinde değerlendirilir. Bildiriminizde tarayıcı ve adım bilgisi paylaşırsanız çözüm süresi kısalır.",
  },
];

const FIELDS_BY_TYPE: Record<ContactType, { organization: boolean; phone: boolean }> = {
  school: { organization: true, phone: true },
  general: { organization: false, phone: false },
  bug: { organization: false, phone: false },
  suggestion: { organization: false, phone: false },
};

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-subtle)] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/15 transition";

export default function ContactClient() {
  const { showToast } = useToast();

  const [type, setType] = useState<ContactType>("school");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const flags = FIELDS_BY_TYPE[type];

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.name.trim().length < 2) return setError("Lütfen adınızı girin.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      return setError("Geçerli bir e-posta adresi girin.");
    if (form.subject.trim().length < 3) return setError("Lütfen bir konu yazın.");
    if (form.message.trim().length < 10)
      return setError("Mesajınız en az 10 karakter olmalı. Biraz daha detay verin.");

    setSending(true);
    const res = await submitContactMessage({ ...form, type });
    setSending(false);

    if (!res.success) {
      setError(res.error || "Mesaj gönderilemedi.");
      showToast(res.error || "Mesaj gönderilemedi.", "error");
      return;
    }

    setSent(true);
    showToast("Mesajınız iletildi. Teşekkürler!", "success");
  };

  return (
    <div className="pt-28 sm:pt-36 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--brand-soft)] text-[var(--link)] text-xs font-bold mb-5">
            <MessageSquare size={14} />
            İletişim & Destek
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-[var(--text)] tracking-tight mb-4">
            Size nasıl yardımcı olabiliriz?
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Kurumunuz için demo talep edin, bir hata bildirin ya da aklınızdaki her fikri paylaşın.
            Mesajların tamamı ekibimize doğrudan ulaşır.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-xs font-medium text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} className="text-[var(--brand)]" /> Ortalama yanıt: 2 iş günü
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" /> KVKK uyumlu veri işleme
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} className="text-[var(--text-muted)]" /> Türkiye
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── Form ─────────────────────────────────────────────── */}
          <div className="lg:col-span-8">
            {sent ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm text-center space-y-5">
                <span className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={40} />
                </span>
                <h2 className="text-2xl font-black text-[var(--text)]">Mesajınız bize ulaştı</h2>
                <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                  <strong className="text-[var(--text)]">{form.email}</strong> adresine bir onay
                  e-postası gönderdik. Ekibimiz en geç 2 iş günü içinde dönüş yapacak.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSent(false);
                      setForm({ name: "", email: "", phone: "", organization: "", subject: "", message: "" });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-3)] transition cursor-pointer"
                  >
                    Yeni mesaj gönder
                  </button>
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold hover:opacity-90 transition"
                  >
                    Puaniz&apos;i Keşfet <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6"
                noValidate
              >
                {/* Type selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                    Konu türü
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TYPES.map((t) => {
                      const Icon = t.icon;
                      const active = type === t.key;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setType(t.key)}
                          aria-pressed={active}
                          className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                            active
                              ? "bg-[var(--brand)] text-white border-[var(--brand)] shadow-md"
                              : "bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--border-strong)]"
                          }`}
                        >
                          <Icon size={17} />
                          <span className="text-center leading-tight">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-2">
                    {TYPES.find((t) => t.key === type)?.hint}
                  </p>
                </div>

                <div className="h-px bg-[var(--border)]" />

                {/* Contact fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="c-name" className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                      Ad Soyad <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="c-name"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Adınız ve soyadınız"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="c-email" className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                      E-posta <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="ornek@okul.edu.tr"
                      className={inputClass}
                    />
                  </div>

                  {flags.organization && (
                    <div>
                      <label htmlFor="c-org" className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                        Okul / Kurum adı
                      </label>
                      <input
                        id="c-org"
                        autoComplete="organization"
                        value={form.organization}
                        onChange={set("organization")}
                        placeholder="Örn: Atatürk Anadolu Lisesi"
                        className={inputClass}
                      />
                    </div>
                  )}

                  {flags.phone && (
                    <div>
                      <label htmlFor="c-phone" className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                        Telefon
                      </label>
                      <input
                        id="c-phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={set("phone")}
                        placeholder="0 (5xx) xxx xx xx"
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label htmlFor="c-subject" className="block text-xs font-semibold text-[var(--text)] mb-1.5">
                      Konu <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="c-subject"
                      required
                      value={form.subject}
                      onChange={set("subject")}
                      placeholder={
                        type === "school"
                          ? "Örn: 600 öğrenci için kurumsal demo talebi"
                          : type === "bug"
                          ? "Örn: Deneme yüklerken sayfa yenileniyor"
                          : "Kısa bir başlık"
                      }
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="c-message" className="block text-xs font-semibold text-[var(--text)]">
                        Mesajınız <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-[var(--text-subtle)] tabular-nums">
                        {form.message.length}/5000
                      </span>
                    </div>
                    <textarea
                      id="c-message"
                      required
                      rows={6}
                      maxLength={5000}
                      value={form.message}
                      onChange={set("message")}
                      placeholder={
                        type === "bug"
                          ? "Sorunu adım adım anlatın: hangi sayfada, ne yaptınız, ne bekliyordunuz, ne oldu? Mümkünse hata mesajını ekleyin."
                          : "Bize iletmek istediklerinizi buraya yazın."
                      }
                      className={`${inputClass} resize-y min-h-32`}
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs font-medium flex items-start gap-2"
                  >
                    <span className="mt-0.5">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <p className="text-[11px] text-[var(--text-subtle)] leading-relaxed max-w-sm">
                    Gönderdiğiniz bilgiler yalnızca talebinizi yanıtlamak için kullanılır.{" "}
                    <span className="text-[var(--text-muted)]">
                      {CONTACT_TYPE_LABELS[type]} olarak kaydedilir.
                    </span>
                  </p>
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--brand)] text-white text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                  >
                    <Send size={16} />
                    {sending ? "Gönderiliyor..." : "Mesajı Gönder"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <aside className="lg:col-span-4 space-y-5">
            {/* School CTA card */}
            <div className="p-6 rounded-3xl bg-[var(--hero-to)] border border-white/10 text-white shadow-lg space-y-4">
              <span className="inline-flex p-2.5 rounded-xl bg-white/10">
                <Building2 size={20} className="text-[#FFB020]" />
              </span>
              <h2 className="text-lg font-black leading-snug">
                Okullar & Kurs Merkezleri İçin Puaniz
              </h2>
              <p className="text-xs text-white/75 leading-relaxed">
                Tüm sınıfların deneme sonuçlarını tek panelden yönetin. Kurulum, veri aktarımı ve
                eğitim bizden; öğrenci takibi sizden.
              </p>
              <ul className="space-y-2 text-[11px] text-white/85">
                {[
                  "Ücretsiz demo ve pilot dönem",
                  "CSV ile toplu sonuç aktarımı",
                  "Müdür / öğretmen yetki yönetimi",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setType("school");
                  setForm((f) => ({ ...f, subject: "Kurumsal demo talebi" }));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  document.getElementById("c-name")?.focus();
                }}
                className="w-full py-2.5 rounded-xl bg-[#FFB020] text-[#0F2A5C] text-xs font-black hover:bg-[#ffc04d] transition cursor-pointer"
              >
                Demo Talebi Oluştur
              </button>
            </div>

            {/* Direct channels */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Doğrudan iletişim
              </h3>
              <a
                href="mailto:iletisim@puaniz.com.tr"
                className="flex items-start gap-3 group"
              >
                <span className="p-2 rounded-xl bg-[var(--brand-soft)] text-[var(--link)]">
                  <Mail size={16} />
                </span>
                <span>
                  <span className="block text-xs font-bold text-[var(--text)] group-hover:text-[var(--link)] transition">
                    iletisim@puaniz.com.tr
                  </span>
                  <span className="text-[11px] text-[var(--text-subtle)]">Genel ve kurumsal talepler</span>
                </span>
              </a>
              <a href="mailto:destek@puaniz.com.tr" className="flex items-start gap-3 group">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <ShieldCheck size={16} />
                </span>
                <span>
                  <span className="block text-xs font-bold text-[var(--text)] group-hover:text-[var(--link)] transition">
                    destek@puaniz.com.tr
                  </span>
                  <span className="text-[11px] text-[var(--text-subtle)]">Teknik destek ve hata bildirimi</span>
                </span>
              </a>
            </div>

            {/* FAQ */}
            <div className="p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
                Sık sorulanlar
              </h3>
              {FAQ.map((item, i) => {
                const open = openFaq === i;
                return (
                  <div key={item.q} className="border-b border-[var(--border)] last:border-0">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : i)}
                      aria-expanded={open}
                      className="w-full flex items-start justify-between gap-2 py-3 text-left text-xs font-semibold text-[var(--text)] cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        size={15}
                        className={`shrink-0 mt-0.5 text-[var(--text-subtle)] transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {open && (
                      <p className="pb-3 text-[11px] leading-relaxed text-[var(--text-muted)]">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
