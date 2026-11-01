"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, ArrowRight, BookOpen, Building2, Camera, Check,
  CircleCheck, GraduationCap, KeyRound, Loader2, LogOut, Mail, Moon, Save, School,
  Shield, ShieldCheck, Sun, Trash2, UserRound, Users, X,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { deleteAccount, getUserProfile, replaceProfileAvatar, updateUserProfile } from "@/server/actions/profile";
import { uploadProfileImage } from "@/services/cloudinaryService";
import type { UserProfile, UserRole } from "@/types";

const grades = ["9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf - SAY", "12. Sınıf - EA", "12. Sınıf - SÖZ", "12. Sınıf - DİL", "Mezun - SAY", "Mezun - EA", "Mezun - SÖZ", "Mezun - DİL"];
const fields = ["SAY", "EA", "SÖZ", "DİL", "GENEL"];
const inputClass = "w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-3.5 text-[15px] text-[var(--text)] outline-none transition focus:border-[var(--link)] focus:ring-2 focus:ring-[var(--link)]/15";

type FormState = {
  name: string; avatarUrl: string; grade: string; field: string; bio: string;
  targetUniversity: string; targetDepartment: string; targetRanking: string;
  goalTyt: string; goalAyt: string;
};

const emptyForm: FormState = { name: "", avatarUrl: "", grade: "", field: "", bio: "", targetUniversity: "", targetDepartment: "", targetRanking: "", goalTyt: "", goalAyt: "" };

const roleCopy: Record<UserRole, { label: string; subtitle: string; icon: typeof UserRound; color: string; scope: string; links: { label: string; href: string; detail: string }[] }> = {
  student: {
    label: "Öğrenci", subtitle: "Öğrenme profilin ve sınav hedeflerin", icon: GraduationCap, color: "text-blue-500 bg-blue-500/10", scope: "Kendi profilini, denemelerini, çalışma planını ve konu ilerlemeni yönetebilirsin.",
    links: [{ label: "Deneme geçmişim", href: "/dashboard/student/history", detail: "Deneme sonuçları ve gelişim" }, { label: "Konu takibim", href: "/dashboard/student/subjects", detail: "Konu ve soru ilerlemesi" }, { label: "Okul sonuçlarım", href: "/dashboard/student/school-exams", detail: "Okul sınavları ve sınıf sıralaması" }],
  },
  teacher: {
    label: "Öğretmen", subtitle: "Öğretmen profili ve sınıf erişimleri", icon: BookOpen, color: "text-violet-500 bg-violet-500/10", scope: "Atandığın sınıfları ve öğrencilerini görüntüleyebilir, öğrencilere gelişim notu bırakabilirsin.",
    links: [{ label: "Sınıflarım", href: "/dashboard/teacher", detail: "Atanmış sınıflar ve öğrenci gelişimi" }],
  },
  principal: {
    label: "Okul yöneticisi", subtitle: "Okul ve ekip yönetimi", icon: Building2, color: "text-emerald-500 bg-emerald-500/10", scope: "Okulunun sınıflarını, öğretmenlerini, öğrencilerini ve okul sınavlarını yönetebilirsin.",
    links: [{ label: "Okul yönetimi", href: "/dashboard/principal", detail: "Sınıflar, öğrenciler ve öğretmen atamaları" }],
  },
  superadmin: {
    label: "Yönetici", subtitle: "Uygulama ve okul operasyonları", icon: ShieldCheck, color: "text-amber-500 bg-amber-500/10", scope: "Uygulama yönetimi, okul verileri ve iletişim kayıtlarına erişimin var. Yönetici işlemleri sunucu tarafında ayrıca doğrulanır.",
    links: [{ label: "Uygulama yönetimi", href: "/dashboard/admin", detail: "Okul ve uygulama yönetim araçları" }, { label: "İletişim kutusu", href: "/dashboard/admin/messages", detail: "İletişim kayıtlarını inceleme" }],
  },
};

function SectionHeading({ eyebrow, title, detail, icon: Icon }: { eyebrow: string; title: string; detail: string; icon: typeof UserRound }) {
  return <div className="mb-5 flex items-start gap-3"><div className="rounded-xl bg-[var(--brand-soft)] p-2.5 text-[var(--link)]"><Icon size={18} /></div><div><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[var(--link)]">{eyebrow}</p><h2 className="mt-1 text-xl font-extrabold text-[var(--text)]">{title}</h2><p className="mt-1 text-[15px] leading-6 text-[var(--text-muted)]">{detail}</p></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-[13px] font-bold text-[var(--text-muted)]">{label}</span>{children}</label>;
}

export default function SettingsClient() {
  const router = useRouter();
  const { user, userProfile, reloadUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetMessage, setPasswordResetMessage] = useState("");
  const [passwordResetError, setPasswordResetError] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    getUserProfile().then((profile) => {
      if (!active) return;
      setForm(toForm(profile, userProfile, user?.name ?? ""));
      setLoading(false);
    }).catch(() => {
      if (active) { setForm(toForm(userProfile, userProfile, user?.name ?? "")); setLoading(false); }
    });
    return () => { active = false; };
  }, [user?.id, userProfile]);

  const role: UserRole = userProfile?.isSuperAdmin ? "superadmin" : ((userProfile?.role as UserRole) || "student");
  const roleInfo = roleCopy[role] ?? roleCopy.student;
  const RoleIcon = roleInfo.icon;
  const avatar = form.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "Puaniz")}&background=2F6BFF&color=fff&bold=true`;
  const membership = userProfile?.schoolMembership;
  const joined = useMemo(() => userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" }) : "Bilgi yok", [userProfile?.createdAt]);

  function change(key: keyof FormState, value: string) { setForm((current) => ({ ...current, [key]: value })); }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true); setMessage("");
    try {
      const student = role === "student";
      const result = await updateUserProfile({
        field: student ? form.field || undefined : undefined,
        grade: student ? form.grade || undefined : undefined,
        bio: form.bio || undefined,
        avatarUrl: form.avatarUrl || undefined,
        targetUniversity: student ? form.targetUniversity || undefined : undefined,
        targetDepartment: student ? form.targetDepartment || undefined : undefined,
        targetRanking: student ? (form.targetRanking ? Number(form.targetRanking) : null) : undefined,
        goals: student ? { tyt: Number(form.goalTyt || 0), ayt: Number(form.goalAyt || 0) } : undefined,
      });
      if (!result.success) throw new Error(result.error || "Profil güncellenemedi.");
      if (form.name.trim() && (form.name !== user.name || form.avatarUrl !== user.image)) {
        await authClient.updateUser({ name: form.name.trim(), image: form.avatarUrl || null });
      }
      await reloadUserProfile();
      setMessage("Profil bilgilerin kaydedildi.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kaydetme sırasında bir hata oluştu."); }
    finally { setSaving(false); }
  }

  async function uploadAvatar(file?: File) {
    if (!file) return;
    setSaving(true); setMessage("");
    try {
      const previousAvatarUrl = form.avatarUrl || userProfile?.avatarUrl || user?.image || null;
      const url = await uploadProfileImage(file);
      if (!url) throw new Error("Fotoğraf yüklenemedi.");
      const result = await replaceProfileAvatar({ avatarUrl: url, previousAvatarUrl });
      if (!result.success) throw new Error(result.error || "Fotoğraf kaydedilemedi.");
      change("avatarUrl", url);
      await reloadUserProfile();
      setMessage(result.warning || "Profil fotoğrafı kaydedildi.");
    }
    catch (error) { setMessage(error instanceof Error ? error.message : "Fotoğraf yüklenemedi. Dosya boyutunu veya bağlantını kontrol et."); }
    finally { setSaving(false); }
  }

  async function removeAccount() {
    if (confirmText !== "ONAYLIYORUM") return;
    setDeleting(true);
    try { const result = await deleteAccount(); if (!result.success) throw new Error(result.error || "Hesap silinemedi."); await authClient.signOut(); router.push("/auth"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Hesap silinemedi."); setDeleting(false); }
  }

  async function signOut() {
    await authClient.signOut();
    router.push("/auth");
    router.refresh();
  }

  async function sendPasswordReset() {
    if (!user?.email) return;
    setPasswordResetLoading(true);
    setPasswordResetMessage("");
    setPasswordResetError(false);
    try {
      const { error } = await authClient.requestPasswordReset({
        email: user.email,
        redirectTo: "/auth/reset-password",
      });
      if (error) throw new Error(error.message || "Sıfırlama e-postası gönderilemedi.");
      setPasswordResetMessage("Sıfırlama bağlantısını e-postana gönderdik.");
    } catch (error) {
      setPasswordResetError(true);
      setPasswordResetMessage(error instanceof Error ? error.message : "Sıfırlama e-postası gönderilemedi.");
    } finally {
      setPasswordResetLoading(false);
    }
  }

  function closeDeleteModal() {
    setShowDelete(false);
    setConfirmText("");
  }

  if (loading) return <div className="mx-auto flex min-h-[55vh] max-w-5xl items-center justify-center gap-3 text-[15px] font-semibold text-[var(--text-muted)]"><Loader2 className="animate-spin text-[var(--link)]" /> Profil bilgileri yükleniyor...</div>;

  return <div className="mx-auto max-w-6xl space-y-6 pb-24">
    <header className="relative border-b border-[var(--border)] pb-7 pt-2">
      <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 pr-5"><div className="relative h-12 w-12 overflow-hidden rounded-full"><Image src={avatar} alt="Profil fotoğrafı" fill unoptimized className="object-cover" /></div><div className="min-w-0"><p className="max-w-52 truncate text-[15px] font-extrabold text-[var(--text)]">{form.name || "Kullanıcı"}</p><p className="max-w-52 truncate text-[13px] text-[var(--text-muted)]">{user?.email}</p></div><span className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${roleInfo.color}`}><RoleIcon size={12} />{roleInfo.label}</span></div>
      </div>
      <div className="relative mt-7 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-5 md:grid-cols-4"><Meta label="Hesap türü" value={roleInfo.label} icon={Shield} /><Meta label="E-posta" value={user?.emailVerified ? "Doğrulandı" : "Doğrulanmadı"} icon={Mail} /><Meta label="Katılım" value={joined} icon={Activity} /><Meta label="Kurum" value={membership?.schoolName || (role === "student" ? "Bağlı değil" : "—")} icon={School} /></div>
    </header>

    {message && <div role="status" className="flex items-center gap-2 rounded-2xl border border-[var(--link)]/20 bg-[var(--brand-soft)] px-4 py-3.5 text-[15px] font-semibold text-[var(--link)]"><CircleCheck size={17} />{message}</div>}

    <div className="divide-y divide-[var(--border)]">
        <section className="py-8 md:py-10">
          <SectionHeading eyebrow="Kimlik" title="Kişisel profil" detail="Hesabında ve topluluk alanlarında görünen bilgileri güncelle." icon={UserRound} />
          <form onSubmit={saveProfile} className="space-y-6">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-[var(--border)]"><Image src={avatar} alt="Profil fotoğrafı" fill unoptimized className="object-cover" /></div>
              <div className="flex-1"><p className="font-bold text-[var(--text)]">Profil fotoğrafı</p><p className="mt-1 text-[13px] leading-5 text-[var(--text-muted)]">JPG, PNG veya WebP formatında bir görsel seç.</p></div>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2.5 text-[13px] font-bold text-[var(--text)] transition hover:border-[var(--link)]"><Camera size={15} /> Fotoğraf seç<input type="file" accept="image/*" className="sr-only" onChange={(event) => { void uploadAvatar(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Ad soyad"><input className={inputClass} value={form.name} onChange={(e) => change("name", e.target.value)} maxLength={80} required /></Field><Field label="E-posta adresi"><div className={`${inputClass} flex items-center justify-between gap-3 opacity-75`}><span className="truncate">{user?.email}</span><span className="shrink-0 text-[11px] font-bold text-emerald-500">{user?.emailVerified ? "Doğrulandı" : "Bekliyor"}</span></div></Field></div>
            <Field label="Kısa tanıtım"><textarea className={inputClass} rows={3} maxLength={500} placeholder="Kendini, çalışma yaklaşımını veya hedefini kısaca anlat..." value={form.bio} onChange={(e) => change("bio", e.target.value)} /><span className="block text-right text-[11px] text-[var(--text-subtle)]">{form.bio.length}/500</span></Field>

            {role === "student" && <div className="space-y-4 border-t border-[var(--border)] pt-5"><SectionHeading eyebrow="Öğrenci profili" title="Eğitim ve sınav hedefleri" detail="Bu bilgiler kişisel analiz ve hedef görünümünde kullanılır." icon={GraduationCap} />
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Sınıf / hazırlık durumu"><select className={inputClass} value={form.grade} onChange={(e) => change("grade", e.target.value)}><option value="">Seçiniz</option>{grades.map((grade) => <option key={grade}>{grade}</option>)}</select></Field><Field label="Alan"><select className={inputClass} value={form.field} onChange={(e) => change("field", e.target.value)}><option value="">Seçiniz</option>{fields.map((field) => <option key={field}>{field}</option>)}</select></Field></div>
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Hedef üniversite"><input className={inputClass} value={form.targetUniversity} onChange={(e) => change("targetUniversity", e.target.value)} placeholder="Örn. ODTÜ" maxLength={120} /></Field><Field label="Hedef bölüm"><input className={inputClass} value={form.targetDepartment} onChange={(e) => change("targetDepartment", e.target.value)} placeholder="Örn. Bilgisayar Mühendisliği" maxLength={120} /></Field></div>
              <div className="grid gap-4 sm:grid-cols-3"><Field label="Hedef sıralama"><input type="number" min="1" className={inputClass} value={form.targetRanking} onChange={(e) => change("targetRanking", e.target.value)} placeholder="Örn. 10.000" /></Field><Field label="TYT hedef net"><input type="number" min="0" max="120" step="0.25" className={inputClass} value={form.goalTyt} onChange={(e) => change("goalTyt", e.target.value)} placeholder="0–120" /></Field><Field label="AYT hedef net"><input type="number" min="0" max="80" step="0.25" className={inputClass} value={form.goalAyt} onChange={(e) => change("goalAyt", e.target.value)} placeholder="0–80" /></Field></div>
              {membership ? <div className="flex items-start gap-3 border-l-2 border-violet-500/40 py-2 pl-4"><School size={18} className="mt-0.5 text-violet-500" /><div className="min-w-0 flex-1"><p className="text-[15px] font-bold text-[var(--text)]">{membership.schoolName}</p><p className="mt-1 text-[13px] text-[var(--text-muted)]">{membership.className || "Sınıf atanmadı"}{membership.studentNumber ? ` · Okul no ${membership.studentNumber}` : ""}</p></div><Link href="/dashboard/student/school-exams" className="text-[13px] font-bold text-[var(--link)]">Sonuçlar <ArrowRight size={13} className="inline" /></Link></div> : <Link href="/dashboard/student/school-exams" className="flex items-center justify-between py-2 text-[15px] font-bold text-[var(--link)]"><span className="flex items-center gap-2"><School size={17} /> Okuluna katıl ve okul sınavlarını profilinde gör</span><ArrowRight size={16} /></Link>}
            </div>}

            {(role === "teacher" || role === "principal") && <div className="space-y-4 border-t border-[var(--border)] pt-5"><SectionHeading eyebrow="Kurum profili" title={role === "teacher" ? "Öğretmen bilgileri" : "Okul yöneticisi bilgileri"} detail="Kurum ve görev bilgileri yöneticin tarafından atanır. Değişiklik için okul yönetimine başvur." icon={role === "teacher" ? BookOpen : Building2} />
              <div className="divide-y divide-[var(--border)] sm:grid sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8"><InfoTile label="Kurum" value={membership?.schoolName || "Henüz kurum atanmamış"} icon={School} /><InfoTile label="Görev" value={role === "teacher" ? membership?.title || "Öğretmen" : "Okul yöneticisi"} icon={Shield} />{role === "teacher" && <InfoTile label="Sınıf ataması" value={membership?.className || "Sınıflarını görüntüle"} icon={Users} />}</div>
            </div>}

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-[13px] text-[var(--text-muted)]">Değişikliklerin profil bilgilerine hemen yansır.</p><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-5 py-3 text-[15px] font-extrabold text-white transition hover:opacity-90 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Kaydediliyor" : "Profili kaydet"}</button></div>
          </form>
        </section>

        <section className="py-8 md:py-10">
          <SectionHeading eyebrow="Erişim özeti" title={`${roleInfo.label} çalışma alanı`} detail={roleInfo.scope} icon={RoleIcon} />
          <div className="mt-2 divide-y divide-[var(--border)]">{roleInfo.links.map((item, index) => <Link key={item.href + item.label} href={item.href} className="group flex items-center gap-4 py-4 transition hover:pl-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[11px] font-extrabold tabular-nums text-[var(--text-subtle)] transition group-hover:border-[var(--link)]/40 group-hover:bg-[var(--brand-soft)] group-hover:text-[var(--link)]">{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block text-[15px] font-bold text-[var(--text)]">{item.label}</span><span className="mt-1 block text-[13px] leading-5 text-[var(--text-muted)]">{item.detail}</span></span><ArrowRight size={17} className="shrink-0 text-[var(--text-subtle)] transition group-hover:translate-x-1 group-hover:text-[var(--link)]" /></Link>)}</div>
          <div className="mt-4 flex items-start gap-2 border-l-2 border-emerald-500/50 py-1 pl-3 text-[13px] leading-5 text-[var(--text-muted)]"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-500" /><span>Bu alanlar rolüne ve kurum atamalarına göre açılır. Yetkiler her işlem sırasında yeniden kontrol edilir.</span></div>
        </section>

        <section className="py-8 md:py-10"><SectionHeading eyebrow="Tercihler" title="Görünüm" detail="Puaniz temasını cihazına göre seç." icon={Sun} /><div className="grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">{([{ key: "light", label: "Açık", note: "Aydınlık görünüm", icon: Sun }, { key: "dark", label: "Koyu", note: "Düşük ışıkta rahat", icon: Moon }, { key: "system", label: "Sistem", note: "Cihaz ayarını kullan", icon: Activity }] as const).map(({ key, label, note, icon: Icon }) => <button key={key} onClick={() => setTheme(key)} aria-pressed={theme === key} className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${theme === key ? "border-[var(--link)] bg-[var(--brand-soft)] text-[var(--link)] shadow-sm" : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]"}`}><Icon size={18} className="shrink-0" /><span className="min-w-0 flex-1"><span className="block text-[13px] font-extrabold">{label}</span><span className="mt-0.5 block text-[11px] opacity-75">{note}</span></span>{theme === key && <Check size={15} />}</button>)}</div></section>
        <section className="py-8 md:py-10"><SectionHeading eyebrow="Hesap güvenliği" title="Giriş bilgileri" detail="Hesap ve oturum güvenliği." icon={KeyRound} /><div className="flex flex-col gap-4 border-y border-[var(--border)] py-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className={`rounded-full p-2 ${user?.emailVerified ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}><Mail size={16} /></div><div className="min-w-0"><p className="text-[13px] font-bold text-[var(--text)]">{user?.email}</p><p className="mt-1 text-[11px] text-[var(--text-muted)]">{user?.emailVerified ? "E-posta adresin doğrulanmış" : "E-posta doğrulaması bekleniyor"}</p></div></div>{user?.emailVerified && <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-500"><CircleCheck size={14} /> Güvenli</span>}</div><p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">Parolanı bu sayfadan sıfırlama e-postası isteyebilirsin. Bağlantı e-posta adresine gönderilir.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void sendPasswordReset()} disabled={passwordResetLoading} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-[13px] font-bold text-[var(--text)] transition hover:border-[var(--link)]/40 hover:bg-[var(--surface-3)] disabled:cursor-wait disabled:opacity-60">{passwordResetLoading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} className="text-[var(--link)]" />}{passwordResetLoading ? "Bağlantı gönderiliyor..." : "Sıfırlama bağlantısı gönder"}<ArrowRight size={14} /></button><button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--err)]/20 bg-[var(--err-bg)] px-4 py-2.5 text-[13px] font-bold text-[var(--err)] transition hover:border-[var(--err)]/40 hover:bg-[var(--err)]/10"><LogOut size={15} /> Oturumu kapat <ArrowRight size={14} /></button></div>{passwordResetMessage && <div role={passwordResetError ? "alert" : "status"} className={`mt-3 max-w-2xl rounded-xl border px-4 py-3 text-[13px] leading-5 ${passwordResetError ? "border-[var(--err)]/20 bg-[var(--err-bg)] text-[var(--err)]" : "border-[var(--ok)]/20 bg-[var(--ok-bg)] text-[var(--ok)]"}`}><p>{passwordResetMessage}</p>{!passwordResetError && <ol className="mt-2 list-decimal space-y-1 pl-5"><li>E-posta kutunu aç.</li><li>“Şifremi Sıfırla” bağlantısına tıkla.</li><li>Açılan ekranda yeni parolanı belirle.</li></ol>}</div>}</section>
        <section className="py-8 md:py-10"><div className="flex flex-col gap-4 border-l-2 border-[var(--err)]/50 pl-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[var(--err)]"><AlertTriangle size={16} /><p className="text-[11px] font-extrabold uppercase tracking-[.15em]">Hesap işlemleri</p></div><h2 className="text-base font-extrabold text-[var(--text)]">Hesabı kalıcı olarak sil</h2><p className="mt-1 max-w-xl text-[13px] leading-5 text-[var(--text-muted)]">Profil, deneme, çalışma ve topluluk kayıtların da silinir. Bu işlem geri alınamaz.</p></div><button onClick={() => setShowDelete(true)} className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-[var(--err)]/25 bg-[var(--err-bg)] px-4 py-2.5 text-[13px] font-bold text-[var(--err)] transition hover:border-[var(--err)]/40 hover:bg-[var(--err)]/10 sm:self-center"><Trash2 size={14} /> Hesabı sil</button></div></section>
    </div>
    {showDelete && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDeleteModal(); }}><section role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl md:p-7"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="rounded-2xl bg-[var(--err-bg)] p-3 text-[var(--err)]"><AlertTriangle size={20} /></div><div><p className="text-[11px] font-extrabold uppercase tracking-[.15em] text-[var(--err)]">Geri alınamaz işlem</p><h2 id="delete-account-title" className="mt-1 text-xl font-extrabold text-[var(--text)]">Hesabını silmek üzeresin</h2></div></div><button type="button" onClick={closeDeleteModal} aria-label="Kapat" className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text)]"><X size={18} /></button></div><p className="mt-5 text-[15px] leading-6 text-[var(--text-muted)]">Profilin, denemelerin, çalışma kayıtların ve topluluk verilerin kalıcı olarak silinecek. Devam etmek için aşağıya <strong className="font-extrabold tracking-wide text-[var(--err)]">ONAYLIYORUM</strong> yaz.</p><label className="mt-5 block text-[13px] font-bold text-[var(--text)]">Onay metni<input autoFocus className={`${inputClass} mt-2 border-[var(--err)]/30 focus:border-[var(--err)] focus:ring-[var(--err)]/15`} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="ONAYLIYORUM" /></label><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={closeDeleteModal} disabled={deleting} className="rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-2.5 text-[15px] font-bold text-[var(--text)] transition hover:bg-[var(--surface-3)] disabled:opacity-50">Vazgeç</button><button type="button" onClick={() => void removeAccount()} disabled={confirmText !== "ONAYLIYORUM" || deleting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--err)] px-4 py-2.5 text-[15px] font-extrabold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">{deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{deleting ? "Hesap siliniyor..." : "Hesabımı kalıcı olarak sil"}</button></div></section></div>}
  </div>;
}

function toForm(profile: UserProfile | null, fallback: UserProfile | null, name: string): FormState {
  const data = profile ?? fallback;
  return { name: data?.name || name, avatarUrl: data?.avatarUrl || "", grade: data?.grade || "", field: data?.field || "", bio: data?.bio || "", targetUniversity: data?.targetUniversity || "", targetDepartment: data?.targetDepartment || "", targetRanking: data?.targetRanking ? String(data.targetRanking) : "", goalTyt: data?.goals?.tyt ? String(data.goals.tyt) : "", goalAyt: data?.goals?.ayt ? String(data.goals.ayt) : "" };
}

function Meta({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UserRound }) {
  return <div className="flex min-w-0 items-center gap-2.5"><Icon size={15} className="shrink-0 text-[var(--text-subtle)]" /><div className="min-w-0"><p className="text-[11px] font-semibold text-[var(--text-subtle)]">{label}</p><p className="truncate text-[13px] font-bold text-[var(--text)]">{value}</p></div></div>;
}

function InfoTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof UserRound }) {
  return <div className="flex items-center gap-3 py-3"><Icon size={16} className="shrink-0 text-[var(--link)]" /><div className="min-w-0"><p className="text-[11px] font-semibold text-[var(--text-subtle)]">{label}</p><p className="truncate text-[13px] font-bold text-[var(--text)]">{value}</p></div></div>;
}
