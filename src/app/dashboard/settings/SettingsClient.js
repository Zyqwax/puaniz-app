"use client";

import React, { useState, useEffect } from "react";
import { User, Link, BookOpen, Save, ArrowLeft, Loader2 } from "lucide-react";
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
import { Trash2, AlertTriangle } from "lucide-react";

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
        // 1. Delete Firestore Data
        const dbResult = await deleteUserAccountData(user.uid);
        if (!dbResult.success) {
          throw new Error("Veri silme işlemi sırasında hata oluştu.");
        }

        // 2. Delete Auth Account
        await deleteUser(user);

        // 3. Redirect
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

  return (
    <div className="space-y-6 pb-20">
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft size={20} />
        <span>Geri Dön</span>
      </button>

      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32" />

        <h2 className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
          Profil Ayarları
        </h2>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/30 group-hover:border-purple-500 transition-colors bg-slate-800 relative">
                <Image
                  src={avatarPreview}
                  alt="Profile Preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <p className="text-sm text-slate-400">Profil Önizleme</p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User size={16} /> Ad Soyad
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
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <BookOpen size={16} /> Sınıfım / Bölümüm
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
                  <option
                    value="12. Sınıf - SAY"
                    className="bg-slate-800 text-white"
                  >
                    12. Sınıf - SAY
                  </option>
                  <option
                    value="12. Sınıf - EA"
                    className="bg-slate-800 text-white"
                  >
                    12. Sınıf - EA
                  </option>
                  <option
                    value="12. Sınıf - SÖZ"
                    className="bg-slate-800 text-white"
                  >
                    12. Sınıf - SÖZ
                  </option>
                  <option
                    value="12. Sınıf - DİL"
                    className="bg-slate-800 text-white"
                  >
                    12. Sınıf - DİL
                  </option>
                  <option
                    value="Mezun - SAY"
                    className="bg-slate-800 text-white"
                  >
                    Mezun - SAY
                  </option>
                  <option
                    value="Mezun - EA"
                    className="bg-slate-800 text-white"
                  >
                    Mezun - EA
                  </option>
                  <option
                    value="Mezun - SÖZ"
                    className="bg-slate-800 text-white"
                  >
                    Mezun - SÖZ
                  </option>
                  <option
                    value="Mezun - DİL"
                    className="bg-slate-800 text-white"
                  >
                    Mezun - DİL
                  </option>
                  <option value="11. Sınıf" className="bg-slate-800 text-white">
                    11. Sınıf
                  </option>
                  <option value="10. Sınıf" className="bg-slate-800 text-white">
                    10. Sınıf
                  </option>
                  <option value="9. Sınıf" className="bg-slate-800 text-white">
                    9. Sınıf
                  </option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-4">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Link size={16} /> Profil Fotoğrafı
                </label>

                <div className="flex gap-4 items-center">
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-white/10 transition-colors flex items-center gap-2 text-sm w-full justify-center">
                    <User size={16} />
                    <span>Fotoğraf Yükle</span>
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
                            setFormData((prev) => ({
                              ...prev,
                              avatarUrl: url,
                            }));
                            setMessage({
                              type: "success",
                              content:
                                "Fotoğraf yüklendi! Kaydetmeyi unutmayın.",
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

                <p className="text-xs text-slate-500">
                  Bilgisayarınızdan bir fotoğraf seçin.
                </p>
              </div>
            </div>

            {message.content && (
              <div
                className={`p-4 rounded-xl text-sm ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
              >
                {message.content}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="glass-btn px-8 py-3 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all text-purple-200 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-panel p-8 border-red-500/20">
        <div className="flex items-center gap-3 text-red-400 mb-6">
          <AlertTriangle size={24} />
          <h2 className="text-xl font-bold">Tehlikeli Bölge</h2>
        </div>

        <div className="space-y-6">
          <p className="text-slate-400 text-sm">
            Hesabınızı sildiğinizde tüm denemeleriniz, gönderileriniz ve profil
            bilgileriniz kalıcı olarak silinir. Bu işlem geri alınamaz.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 size={16} />
              <span>Hesabımı Silmek İstiyorum</span>
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Onaylamak için{" "}
                  <span className="text-white font-bold italic">
                    onaylıyorum
                  </span>{" "}
                  yazın
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="onaylıyorum"
                  className="glass-input w-full border-red-500/30 focus:border-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "onaylıyorum" || deleting}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Siliniyor...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Hesabımı Kalıcı Olarak Sil
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setConfirmText("");
                  }}
                  className="text-slate-400 hover:text-white px-6 py-2 text-sm font-medium transition-colors cursor-pointer"
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
