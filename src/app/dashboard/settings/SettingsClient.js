"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  BookOpen,
  Save,
  Loader2,
  Camera,
  Mail,
  Trash2,
  AlertTriangle,
  Shield,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccountData,
} from "@/services/userService";
import { updateProfile, deleteUser } from "firebase/auth";
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
const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-[#0F2A5C] uppercase tracking-wider flex items-center gap-2">
      {Icon && <Icon size={14} className="text-[#2F6BFF]" />}
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full bg-[#F4F7FC] border border-[#0F2A5C]/[0.1] rounded-2xl px-4 py-3 text-[#0F2A5C] text-sm font-medium placeholder:text-[#4A5B7A]/50 focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/20 focus:border-[#2F6BFF] focus:bg-white transition-all";

const SettingsClient = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", avatarUrl: "", grade: "" });
  const [message, setMessage] = useState({ type: "", content: "" });
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) return;
      setUser(currentUser);
      getUserProfile(currentUser.uid).then((profile) => {
        setFormData({
          name: profile?.name || currentUser.displayName || "",
          avatarUrl: profile?.avatarUrl || "",
          grade: profile?.grade || "",
        });
        setLoading(false);
      });
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const showMsg = (type, content, duration = 4000) => {
    setMessage({ type, content });
    setTimeout(() => setMessage({ type: "", content: "" }), duration);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", content: "" });
    try {
      if (user) {
        await updateUserProfile(user.uid, formData);
        if (formData.name !== user.displayName)
          await updateProfile(user, { displayName: formData.name });
        if (formData.avatarUrl !== user.photoURL)
          await updateProfile(user, { photoURL: formData.avatarUrl });
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
        const dbResult = await deleteUserAccountData(user.uid);
        if (!dbResult.success) throw new Error("Veri silme işlemi sırasında hata oluştu.");
        await deleteUser(user);
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      showMsg(
        "error",
        error.code === "auth/requires-recent-login"
          ? "Bu işlemi yapmadan önce tekrar giriş yapmalısınız."
          : "Hesap silme sırasında bir hata oluştu: " + (error.message || "Bilinmeyen hata"),
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
        <p className="text-[#4A5B7A] text-sm font-medium">Profil bilgileri yükleniyor...</p>
      </div>
    );
  }

  const avatarPreview =
    formData.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || "User")}&background=2F6BFF&color=fff&bold=true`;

  return (
    <div className="max-w-2xl mx-auto pb-24">

      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF] text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles size={13} />
          Hesap Yönetimi
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F2A5C] mb-2 tracking-tight">
          Profil & Ayarlar
        </h1>
        <p className="text-[#4A5B7A] text-sm">
          Kişisel bilgilerini düzenle, hedeflerini ve sınıfını güncelle.
        </p>
      </div>

      {/* ── Toast Message ── */}
      {message.content && (
        <div
          className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold mb-6 border transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={18} className="shrink-0 text-emerald-600" />
          ) : (
            <XCircle size={18} className="shrink-0 text-red-600" />
          )}
          {message.content}
        </div>
      )}

      {/* ── Profile Card ── */}
      <div className="bg-white rounded-3xl border border-[#0F2A5C]/[0.08] p-6 md:p-8 mb-6 shadow-sm relative overflow-hidden">
        {/* Avatar + user info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 relative z-10">
          {/* Avatar upload */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-[#0F2A5C]/[0.1] bg-[#F4F7FC] relative group-hover:border-[#2F6BFF] transition-all duration-300 shadow-sm">
              <Image src={avatarPreview} alt="Profil" fill className="object-cover" />
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-[#0F2A5C]/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-xs">
              <div className="flex flex-col items-center gap-1">
                <Camera size={18} className="text-white" />
                <span className="text-[10px] text-white font-bold">Değiştir</span>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setSaving(true);
                  showMsg("info", "Fotoğraf yükleniyor...", 30000);
                  try {
                    const url = await uploadProfileImage(file);
                    setFormData((prev) => ({ ...prev, avatarUrl: url }));
                    showMsg("success", "Fotoğraf yüklendi! Kaydetmeyi unutmayın.");
                  } catch {
                    showMsg("error", "Fotoğraf yüklenemedi.");
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            </label>
            {/* Online dot */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-xs" />
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-[#0F2A5C] mb-1">
              {formData.name || "İsimsiz Kullanıcı"}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[#4A5B7A] text-sm mb-3 font-medium">
              <Mail size={14} className="text-[#4A5B7A]/70" />
              {user?.email}
            </div>
            {formData.grade && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#2F6BFF]/10 text-[#2F6BFF] text-xs font-bold">
                <Shield size={12} />
                {formData.grade}
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <Field label="Ad Soyad" icon={User}>
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
              <option value="" className="text-[#4A5B7A]">
                Seçiniz...
              </option>
              {GRADES.map((g) => (
                <option key={g.value} value={g.value} className="text-[#0F2A5C]">
                  {g.label}
                </option>
              ))}
            </select>
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#0F2A5C] hover:bg-[#1a3a78] text-white font-bold rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 transition-all cursor-pointer"
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
      <div className="rounded-3xl border border-red-200 bg-white overflow-hidden shadow-xs">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100 bg-red-50/50">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">
              Tehlikeli Bölge
            </h3>
            <p className="text-xs text-[#4A5B7A]">Geri alınamaz hesap işlemleri</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-[#4A5B7A] text-sm leading-relaxed font-medium">
            Hesabınızı sildiğinizde tüm denemeleriniz, verileriniz ve profil
            bilgileriniz kalıcı olarak silinir.{" "}
            <span className="text-red-600 font-bold">Bu işlem geri alınamaz.</span>
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-sm font-bold transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              Hesabımı Kalıcı Olarak Sil
            </button>
          ) : (
            <div className="space-y-4 pt-4 border-t border-red-100">
              <div className="space-y-2">
                <label className="text-sm text-[#4A5B7A] font-medium">
                  Onaylamak için{" "}
                  <span className="text-red-600 font-bold">onaylıyorum</span> yazın
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="onaylıyorum"
                  className={`${inputCls} border-red-300 focus:ring-red-200 focus:border-red-500`}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "onaylıyorum" || deleting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs"
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
                  className="px-5 py-2.5 text-[#4A5B7A] hover:text-[#0F2A5C] text-sm font-semibold rounded-xl hover:bg-[#F4F7FC] transition-colors cursor-pointer"
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
