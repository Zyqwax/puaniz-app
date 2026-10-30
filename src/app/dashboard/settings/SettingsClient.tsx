"use client";

import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  BookOpen,
  Save,
  Loader2,
  Camera,
  Mail,
  Trash2,
  AlertTriangle,
  Shield,
  CircleCheck,
  CircleX,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  deleteAccount,
} from "@/server/actions/profile";
import { uploadProfileImage } from "@/services/cloudinaryService";

const GRADES = [
  { value: "9. Sınıf", label: "9. Sınıf" },
  { value: "10. Sınıf", label: "10. Sınıf" },
  { value: "11. Sınıf", label: "11. Sınıf" },
  { value: "12. Sınıf - SAY", label: "12. Sınıf — Sayısal" },
  { value: "12. Sınıf - EA", label: "12. Sınıf — Eşit Ağırlık" },
  { value: "12. Sınıf - SÖZ", label: "12. Sınıf — Sözel" },
  { value: "12. Sınıf - DİL", label: "12. Sınıf — Dil" },
  { value: "Mezun - SAY", label: "Mezun — Sayısal" },
  { value: "Mezun - EA", label: "Mezun — Eşit Ağırlık" },
  { value: "Mezun - SÖZ", label: "Mezun — Sözel" },
  { value: "Mezun - DİL", label: "Mezun — Dil" },
];

/* ── Reusable form field ── */
interface FieldProps {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, icon: Icon, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
      {Icon && <Icon size={14} className="text-[var(--link)]" />}
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl px-4 py-3 text-[var(--text)] text-sm font-medium placeholder:text-[var(--text-subtle)] focus:outline-none focus:ring-2 focus:ring-[#7FB0FF]/25 focus:border-[#7FB0FF] transition-all";

const SettingsClient: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, reloadUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    avatarUrl: "",
    grade: "",
  });
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info" | "";
    content: string;
  }>({ type: "", content: "" });
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getUserProfile().then((profile) => {
      if (cancelled) return;
      setFormData({
        name: profile?.name || user.displayName || "",
        avatarUrl: profile?.avatarUrl || "",
        grade: profile?.grade || "",
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showMsg = (
    type: "success" | "error" | "info",
    content: string,
    duration = 4000
  ) => {
    setMessage({ type, content });
    setTimeout(() => setMessage({ type: "", content: "" }), duration);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", content: "" });
    try {
      if (user) {
        await updateUserProfile(formData);
        if (formData.name !== user.name || formData.avatarUrl !== user.image) {
          await authClient.updateUser({
            name: formData.name,
            image: formData.avatarUrl || null,
          });
        }
        await reloadUserProfile();
        showMsg("success", "Profil başarıyla güncellendi!");
      }
    } catch (error) {
      console.error(error);
      showMsg("error", "Güncelleme sırasında bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "onaylıyorum") return;
    setDeleting(true);
    setMessage({ type: "", content: "" });
    try {
      if (user) {
        const result = await deleteAccount();
        if (!result.success)
          throw new Error("Hesap silme işlemi sırasında hata oluştu.");
        await authClient.signOut();
        router.push("/auth");
      }
    } catch (error: any) {
      console.error("Account deletion error:", error);
      showMsg(
        "error",
        "Hesap silme sırasında bir hata oluştu: " +
          (error?.message || "Bilinmeyen hata"),
        8000
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-[#2F6BFF]/20 border-t-[#2F6BFF] rounded-full animate-spin" />
        <p className="text-[var(--text-muted)] text-sm font-medium">
          Profil bilgileri yükleniyor...
        </p>
      </div>
    );
  }

  const avatarPreview =
    formData.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      formData.name || "User"
    )}&background=2F6BFF&color=fff&bold=true`;

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--brand-soft)] text-[var(--link)] text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={13} />
          Hesap Yönetimi
        </div>
        <h1 className="text-3xl font-extrabold text-[var(--text)] mb-2 tracking-tight">
          Profil & Ayarlar
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Kişisel bilgilerini düzenle, hedeflerini ve sınıfını güncelle.
        </p>
      </div>

      {/* ── Toast Message ── */}
      {message.content && (
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold mb-6 border transition-all ${
            message.type === "success"
              ? "bg-[var(--ok-bg)] text-[var(--ok)] border-[var(--ok)]/30"
              : message.type === "info"
              ? "bg-[var(--brand-soft)] text-[var(--link)] border-[var(--link)]/30"
              : "bg-[var(--err-bg)] text-[var(--err)] border-[var(--err)]/30"
          }`}
        >
          {message.type === "success" ? (
            <CircleCheck size={18} className="shrink-0 text-[var(--ok)]" />
          ) : message.type === "info" ? (
            <Sparkles size={18} className="shrink-0 text-[var(--link)]" />
          ) : (
            <CircleX size={18} className="shrink-0 text-[var(--err)]" />
          )}
          {message.content}
        </div>
      )}

      {/* ── Profile Card ── */}
      <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 md:p-8 mb-6 shadow-sm relative overflow-hidden">
        {/* Avatar + user info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 relative z-10">
          {/* Avatar upload */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-[var(--border-strong)] bg-[var(--surface-2)] relative group-hover:border-[#7FB0FF] transition-all duration-300 shadow-sm">
              <Image
                src={avatarPreview}
                alt="Profil"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs">
              <div className="flex flex-col items-center gap-1">
                <Camera size={18} className="text-white" />
                <span className="text-[10px] text-white font-bold">
                  Değiştir
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSaving(true);
                  showMsg("info", "Fotoğraf yükleniyor...", 30000);
                  try {
                    const url = await uploadProfileImage(file);
                    setFormData((prev) => ({ ...prev, avatarUrl: url || "" }));
                    showMsg(
                      "success",
                      "Fotoğraf yüklendi! Kaydetmeyi unutmayın."
                    );
                  } catch {
                    showMsg("error", "Fotoğraf yüklenemedi.");
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            </label>
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[var(--surface)] shadow-xs" />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-[var(--text)] mb-1">
              {formData.name || "İsimsiz Kullanıcı"}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[var(--text-muted)] text-sm mb-3 font-medium">
              <Mail size={14} className="text-[var(--text-subtle)]" />
              {user?.email}
            </div>
            {formData.grade && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[var(--brand-soft)] text-[var(--link)] text-xs font-bold">
                <Shield size={12} />
                {formData.grade}
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <Field label="Ad Soyad" icon={UserIcon}>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Adınız Soyadınız"
              className={inputCls}
            />
          </Field>

          <Field label="Sınıf / Bölüm" icon={BookOpen}>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className={`${inputCls} cursor-pointer`}
            >
              <option
                value=""
                className="text-[var(--text-muted)] bg-[var(--surface)]"
              >
                Seçiniz...
              </option>
              {GRADES.map((g) => (
                <option
                  key={g.value}
                  value={g.value}
                  className="text-[var(--text)] bg-[var(--surface)]"
                >
                  {g.label}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save size={18} />
                Değişiklikleri Kaydet
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Danger Zone ── */}
      <div className="rounded-3xl border border-[var(--err)]/30 bg-[var(--err-bg)] overflow-hidden shadow-xs">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--err)]/20 bg-[var(--err-bg)]">
          <div className="w-8 h-8 rounded-xl bg-[var(--err-bg)] border border-[var(--err)]/30 flex items-center justify-center">
            <AlertTriangle size={16} className="text-[var(--err)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--err)] uppercase tracking-wider">
              Tehlikeli Bölge
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Geri alınamaz hesap işlemleri
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-[var(--text-muted)] text-sm leading-relaxed font-medium">
            Hesabınızı sildiğinizde tüm denemeleriniz, verileriniz ve profil
            bilgileriniz kalıcı olarak silinir.{" "}
            <span className="text-[var(--err)] font-bold">
              Bu işlem geri alınamaz.
            </span>
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--err-bg)] hover:bg-[var(--err)]/20 border border-[var(--err)]/40 text-[var(--err)] text-sm font-bold transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              Hesabımı Kalıcı Olarak Sil
            </button>
          ) : (
            <div className="space-y-4 pt-4 border-t border-[var(--err)]/20">
              <div className="space-y-2">
                <label className="text-sm text-[var(--text-muted)] font-medium">
                  Onaylamak için{" "}
                  <span className="text-[var(--err)] font-bold">
                    onaylıyorum
                  </span>{" "}
                  yazın
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="onaylıyorum"
                  className={`${inputCls} border-[var(--err)]/40 focus:ring-[var(--err)]/20 focus:border-[var(--err)]`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "onaylıyorum" || deleting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[var(--err)] hover:bg-[var(--err)]/90 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      Hesabı Sil
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText("");
                  }}
                  className="px-5 py-2.5 text-[var(--text-muted)] hover:text-[var(--text)] text-sm font-semibold rounded-xl hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsClient;
