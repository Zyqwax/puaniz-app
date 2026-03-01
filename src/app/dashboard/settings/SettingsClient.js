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

const SettingsClient = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    avatarUrl: "",
    grade: "",
  });

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", content: "" });

    try {
      if (user) {
        await updateUserProfile(user.uid, formData);

        if (formData.name !== user.displayName) {
          await updateProfile(user, { displayName: formData.name });
        }

        if (formData.avatarUrl !== user.photoURL) {
          await updateProfile(user, { photoURL: formData.avatarUrl });
        }

        setMessage({
          type: "success",
          content: "Profil başarıyla güncellendi!",
        });
        setTimeout(() => setMessage({ type: "", content: "" }), 3000);
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        content: "Güncelleme sırasında bir hata oluştu.",
      });
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
        if (!dbResult.success) {
          throw new Error("Veri silme işlemi sırasında hata oluştu.");
        }
        await deleteUser(user);
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      if (error.code === "auth/requires-recent-login") {
        setMessage({
          type: "error",
          content:
            "Güvenlik nedeniyle bu işlemi yapmadan önce tekrar giriş yapmalısınız.",
        });
      } else {
        setMessage({
          type: "error",
          content:
            "Hesap silme sırasında bir hata oluştu: " +
            (error.message || "Bilinmeyen hata"),
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-purple-500" size={40} />
      </div>
    );
  }

  const avatarPreview =
    formData.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || "User")}&background=random`;

  const grades = [
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

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Profil</h1>
        <p className="text-slate-400 text-sm">Hesap bilgilerinizi düzenleyin</p>
      </div>

      {/* Toast Message */}
      {message.content && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {message.content}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800 relative group-hover:border-purple-500/50 transition-all duration-300">
              <Image
                src={avatarPreview}
                alt="Profile"
                fill
                className="object-cover"
              />
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={20} className="text-white" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setSaving(true);
                    setMessage({
                      type: "info",
                      content: "Fotoğraf yükleniyor...",
                    });
                    try {
                      const url = await uploadProfileImage(file);
                      setFormData((prev) => ({ ...prev, avatarUrl: url }));
                      setMessage({
                        type: "success",
                        content: "Fotoğraf yüklendi! Kaydetmeyi unutmayın.",
                      });
                    } catch {
                      setMessage({
                        type: "error",
                        content: "Fotoğraf yüklenemedi.",
                      });
                    } finally {
                      setSaving(false);
                    }
                  }
                }}
              />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-lg truncate">
              {formData.name || "İsimsiz Kullanıcı"}
            </p>
            <p className="text-slate-400 text-sm truncate flex items-center gap-1.5 mt-0.5">
              <Mail size={13} />
              {user?.email}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5" />

        {/* Form Fields */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <User size={14} /> Ad Soyad
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Adınız Soyadınız"
              className="glass-input w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <BookOpen size={14} /> Sınıf / Bölüm
            </label>
            <select
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              className="glass-input w-full"
            >
              <option value="" className="bg-slate-800 text-white">
                Seçiniz...
              </option>
              {grades.map((g) => (
                <option
                  key={g.value}
                  value={g.value}
                  className="bg-slate-800 text-white"
                >
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="glass-btn w-full py-3 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer"
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

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Danger Zone */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Shield size={16} />
          <h3 className="text-sm font-medium uppercase tracking-wider">
            Tehlikeli Bölge
          </h3>
        </div>

        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="text-red-400/70 shrink-0 mt-0.5"
            />
            <p className="text-slate-400 text-sm leading-relaxed">
              Hesabınızı sildiğinizde tüm denemeleriniz, gönderileriniz ve
              profil bilgileriniz kalıcı olarak silinir.{" "}
              <span className="text-red-400/80 font-medium">
                Bu işlem geri alınamaz.
              </span>
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400/70 hover:text-red-400 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              Hesabımı Sil
            </button>
          ) : (
            <div className="space-y-3 pt-2 border-t border-red-500/10">
              <label className="text-sm text-slate-400">
                Onaylamak için{" "}
                <span className="text-white font-semibold">onaylıyorum</span>{" "}
                yazın
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="onaylıyorum"
                className="glass-input w-full border-red-500/20 focus:ring-red-500/30"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "onaylıyorum" || deleting}
                  className="bg-red-500/80 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Hesabı Sil
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText("");
                  }}
                  className="text-slate-400 hover:text-white px-4 py-2 text-sm transition-colors cursor-pointer"
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
