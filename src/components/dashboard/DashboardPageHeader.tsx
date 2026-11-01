"use client";

import Link from "next/link";
import LearningNotificationBell from "./LearningNotificationBell";
import type { Ref } from "react";
import { ArrowRight, ChartNoAxesColumn, FilePlus2, History, Inbox, MessageSquarePlus, Settings, ShieldCheck, Sparkles, Users, type LucideIcon } from "lucide-react";

type HeaderAction = { label: string; href: string; icon: LucideIcon };
type HeaderInfo = { title: string; subtitle: string; actions?: HeaderAction[] };

const infoByPath: Record<string, HeaderInfo> = {
 "/dashboard/teacher/students": {title:"Sınıflarım ve Öğrenciler",subtitle:"Yetkili öğrencilerini ara ve gelişim profillerini aç."},
 "/dashboard/principal/students": {title:"Öğrenci Dizini",subtitle:"Okulunun öğrencilerini sınıf ve okul numarasıyla bul."},
 "/dashboard/principal/data": {title:"Okul Verisi ve Sonuç Düzeltme",subtitle:"Sonuçları incele, eşleşmeyen kayıtları bul ve gerekçeli düzeltme yap."},
 "/dashboard/student/reports": {title:"Dönem Raporlarım",subtitle:"Kendi dönem gelişimini incele; PDF veya CSV raporunu indir."},
 "/dashboard/teacher/reports": {title:"Sınıf Dönem Raporları",subtitle:"Yetkili sınıflarını kademe ve alana göre analiz et."},
 "/dashboard/principal/reports": {title:"Okul Dönem Raporları",subtitle:"Okulun dönem gelişimini karşılaştır ve raporla."},
 "/dashboard/notifications": {title:"Gelişim Bildirimleri",subtitle:"Görevleri, görüşmeleri ve deneme sonuçlarını takip et; bildirim tercihlerini düzenle."},
 "/dashboard/student/plan": {title: "Haftalık Çalışma Planım", subtitle: "Çalışma günlerini, konu tekrarlarını ve öğretmen geri bildirimlerini düzenle."},
 "/dashboard/student/progress": { title: "Gelişim ve Çalışma Planım", subtitle: "Hedeflerini, çalışma görevlerini ve gelişimini takip et." },
 "/dashboard/teacher/progress": { title: "Sınıf Analizi ve Öğrenci Takibi", subtitle: "Yetkili sınıflarının gelişimini incele ve destek görevleri oluştur." },
 "/dashboard/principal/progress": { title: "Okul Analizi ve Takip", subtitle: "Okulunun gelişimini, veri kapsamını ve destek süreçlerini incele." },
  "/dashboard/student": {
    title: "Genel Bakış",
    subtitle: "Deneme sonuçların, çalışma durumun ve hedeflerin tek yerde.",
    actions: [{ label: "Deneme ekle", href: "/dashboard/student/add-exam", icon: FilePlus2 }],
  },
  "/dashboard/student/add-exam": {
    title: "Deneme Ekle",
    subtitle: "Deneme sonuçlarını girerek gelişimini takip et.",
    actions: [{ label: "Deneme geçmişi", href: "/dashboard/student/history", icon: History }],
  },
  "/dashboard/student/subjects": {
    title: "Konu Takip Çizelgesi",
    subtitle: "Konularını ve soru ilerlemeni düzenli takip et.",
    actions: [{ label: "Analizi gör", href: "/dashboard/student/analysis", icon: ChartNoAxesColumn }],
  },
  "/dashboard/student/analysis": {
    title: "Detaylı Analiz",
    subtitle: "Ders bazlı istatistiklerini ve gelişim eğilimlerini incele.",
    actions: [{ label: "Deneme geçmişi", href: "/dashboard/student/history", icon: History }],
  },
  "/dashboard/community": {
    title: "Topluluk & Forum",
    subtitle: "Sorularını sor, deneyimlerini paylaş ve diğer öğrencilerle iletişim kur.",
    actions: [{ label: "Yeni konu aç", href: "/dashboard/community/new", icon: MessageSquarePlus }],
  },
  "/dashboard/community/new": {
    title: "Yeni Konu Aç",
    subtitle: "Toplulukla paylaşmak istediğin konuyu oluştur.",
    actions: [{ label: "Foruma dön", href: "/dashboard/community", icon: Users }],
  },
  "/dashboard/student/history": {
    title: "Deneme Geçmişi",
    subtitle: "Denemelerini görüntüle, düzenle ve net gelişimini takip et.",
    actions: [{ label: "Deneme ekle", href: "/dashboard/student/add-exam", icon: FilePlus2 }],
  },
  "/dashboard/assistant": {
    title: "YKS Asistanı",
    subtitle: "Çalışma sürecin ve sınav konuların hakkında destek al.",
    actions: [{ label: "Topluluk", href: "/dashboard/community", icon: Users }],
  },
  "/dashboard/changelog": {
    title: "Yenilikler",
    subtitle: "Puaniz’e eklenen özellikler, iyileştirmeler ve sürüm notları.",
    actions: [{ label: "Profil ayarları", href: "/dashboard/settings", icon: Settings }],
  },
  "/dashboard/student/school-exams": {
    title: "Okul Sınavları",
    subtitle: "Okuluna katıl, sınav sonuçlarını ve sınıf sıralamanı görüntüle.",
    actions: [{ label: "Deneme geçmişi", href: "/dashboard/student/history", icon: History }],
  },
  "/dashboard/principal": {
    title: "Okul Yönetimi",
    subtitle: "Sınıfları, öğretmen atamalarını ve okul sınavlarını yönet.",
    actions: [{ label: "Profil ayarları", href: "/dashboard/settings", icon: Settings }],
  },
  "/dashboard/teacher": {
    title: "Öğretmen Paneli",
    subtitle: "Sınıflarını ve öğrencilerinin gelişimini görüntüle.",
    actions: [{ label: "Profil ayarları", href: "/dashboard/settings", icon: Settings }],
  },
  "/dashboard/admin": {
    title: "Sistem & Okul Yönetimi",
    subtitle: "Okulları, yetkili hesaplarını ve kurum yapılarını yönet.",
    actions: [{ label: "İletişim mesajları", href: "/dashboard/admin/messages", icon: Inbox }],
  },
  "/dashboard/admin/messages": {
    title: "Gelen İletişim Mesajları",
    subtitle: "İletişim formundan gelen talepleri incele ve yönet.",
    actions: [{ label: "Sistem yönetimi", href: "/dashboard/admin", icon: ShieldCheck }],
  },
  "/dashboard/admin/community": {
    title: "Forum Yönetimi",
    subtitle: "Bildirimleri incele, konuları ve kategorileri yönet.",
    actions: [{ label: "Foruma git", href: "/dashboard/community", icon: Users }],
  },
  "/dashboard/settings": {
    title: "Profil ve Ayarlar",
    subtitle: "Profilini, hesap tercihlerini ve güvenlik ayarlarını yönet.",
    actions: [{ label: "Genel bakış", href: "/dashboard", icon: Sparkles }],
  },
};

function getHeaderInfo(pathname: string): HeaderInfo {
  if(pathname.startsWith('/dashboard/principal/data/'))return {title:"Sonuç Düzeltme ve Geçmiş",subtitle:"Önceki değerleri koruyarak sınav sonucunu düzelt.",actions:[{label:"Veri listesine dön",href:"/dashboard/principal/data",icon:History}]};
  if (/^\/dashboard\/(teacher|principal)\/students\//.test(pathname)) {
    const role=pathname.split('/')[2];
    return {title:"Öğrenci Gelişim Profili",subtitle:"Denemeleri, görüşmeleri ve destek planının sonucunu takip et.",actions:[{label:"Analize dön",href:`/dashboard/${role}/progress`,icon:ChartNoAxesColumn}]};
  }
  if (pathname.startsWith("/dashboard/community/") && pathname !== "/dashboard/community/new") {
    return { title: "Topluluk Konusu", subtitle: "Gönderiyi görüntüle ve konuşmaya katıl.", actions: [{ label: "Foruma dön", href: "/dashboard/community", icon: Users }] };
  }
  return infoByPath[pathname] ?? { title: "Puaniz", subtitle: "Öğrenme ve sınav yönetim alanı." };
}

export default function DashboardPageHeader({ pathname, actionsRef }: { pathname: string; actionsRef?: Ref<HTMLDivElement> }) {
  const info = getHeaderInfo(pathname);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-[var(--border)] bg-[var(--bg)]/90 px-4 py-3 backdrop-blur-xl md:px-6 lg:px-8">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-col justify-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold tracking-tight text-[var(--text)] sm:text-xl">{info.title}</h1>
          <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)] sm:text-sm">{info.subtitle}</p>
        </div>
        <div ref={actionsRef} className="flex shrink-0 flex-wrap items-center gap-2">
          <LearningNotificationBell/>
          {pathname !== "/dashboard/assistant" && info.actions?.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} className={pathname.startsWith("/dashboard/student") ? `student-button ${href === "/dashboard/student/add-exam" ? "student-button-primary" : ""}` : "inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--text)] shadow-sm transition hover:border-[var(--link)]/40 hover:bg-[var(--surface-2)] sm:px-4 sm:text-sm"}>
                <Icon size={15} className={pathname.startsWith("/dashboard/student") && href === "/dashboard/student/add-exam" ? "text-white" : "text-[var(--link)]"} />
                <span>{label}</span>
                <ArrowRight size={13} className="text-[var(--text-subtle)]" />
              </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
