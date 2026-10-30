"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Hash,
  ImagePlus,
  X,
  Send,
  ChevronRight,
  Lightbulb,
  AlertCircle,
  MessageSquare,
  Smile,
} from "lucide-react";
import { createPost } from "@/server/actions/community";
import { uploadPostImage } from "@/services/cloudinaryService";
import { useAuth } from "@/context/AuthContext";

const PREDEFINED_TAGS = [
  { label: "TYT", color: "from-purple-600 to-violet-600" },
  { label: "AYT", color: "from-pink-600 to-rose-600" },
  { label: "Matematik", color: "from-blue-600 to-cyan-600" },
  { label: "Geometri", color: "from-indigo-600 to-blue-600" },
  { label: "Fizik", color: "from-yellow-600 to-amber-600" },
  { label: "Kimya", color: "from-green-600 to-emerald-600" },
  { label: "Biyoloji", color: "from-teal-600 to-green-600" },
  { label: "Türkçe", color: "from-orange-600 to-red-600" },
  { label: "Tarih", color: "from-amber-600 to-orange-600" },
  { label: "Coğrafya", color: "from-cyan-600 to-teal-600" },
  { label: "Felsefe", color: "from-violet-600 to-purple-600" },
  { label: "Din", color: "from-rose-600 to-pink-600" },
  { label: "Genel", color: "from-slate-500 to-slate-600" },
];

const TIPS = [
  "Net bir başlık, daha fazla yardım almanızı sağlar.",
  "Konuyu etiketle, doğru kişilere ulaşsın.",
  "Formülleri veya adım adım çözümü paylaşmak cevaplamayı kolaylaştırır.",
  "Fotoğraf ekleyerek soruyu görselleştirebilirsiniz.",
];

export default function NewPostClient() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTip] = useState(
    () => TIPS[Math.floor(Math.random() * TIPS.length)]
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userInitial =
    user?.displayName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";
  const userName =
    user?.displayName || user?.email?.split("@")[0] || "Kullanıcı";

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 4) return;
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Dosya boyutu 2MB'dan küçük olmalıdır.");
      return;
    }
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setLoading(true);
    try {
      const imageUrl = image ? await uploadPostImage(image) : null;
      const result = await createPost(title, text, imageUrl, selectedTags);
      if (!result.success) throw result.error;
      router.push("/dashboard/community");
    } catch (error) {
      console.error("Error posting:", error);
      alert("Gönderi oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = title.trim().length > 0 && !loading;

  return (
    <div className="min-h-screen pb-24">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2F6BFF]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Sticky Top Navigation Bar ── */}
      <div className="sticky top-0 z-30 bg-[var(--surface)]/90 backdrop-blur-xl border-b border-[var(--border)] mb-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/community"
              className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--surface-3)] transition-all">
                <ArrowLeft size={16} />
              </div>
              <span className="text-sm font-semibold hidden sm:inline">
                Topluluk
              </span>
            </Link>

            <ChevronRight size={14} className="text-[var(--text-subtle)]" />

            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[var(--brand)]" />
              <span className="text-sm font-bold text-[var(--text)]">
                Yeni Konu
              </span>
            </div>
          </div>

          {/* Submit button in nav */}
          <button
            type="submit"
            form="new-post-form"
            disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2F6BFF] hover:bg-[#4A80FF] text-white text-sm font-bold rounded-xl shadow-sm disabled:opacity-40 disabled:grayscale hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={15} />
                <span>Yayınla</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ── Left: Form ── */}
          <div className="lg:col-span-2">
            <form
              id="new-post-form"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Author Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="w-12 h-12 rounded-2xl bg-[#2F6BFF] flex items-center justify-center font-black text-white text-xl shadow-sm shrink-0">
                  {userInitial}
                </div>
                <div>
                  <p className="font-bold text-[var(--text)] text-base">
                    {userName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-xs text-[var(--text-muted)] font-medium">
                      Herkese açık paylaşım
                    </p>
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] focus-within:border-[#7FB0FF] focus-within:ring-2 focus-within:ring-[#7FB0FF]/25 transition-all">
                <div className="px-5 pt-4 pb-1">
                  <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-widest">
                    Başlık <span className="text-red-400">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Sorunuzu veya konunuzu kısaca özetleyin..."
                  className="w-full bg-transparent px-5 pb-5 pt-2 text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none font-bold text-xl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  maxLength={200}
                />
                <div className="px-5 pb-3 flex justify-end">
                  <span
                    className={`text-xs font-medium ${
                      title.length > 180
                        ? "text-red-400"
                        : "text-[var(--text-subtle)]"
                    }`}
                  >
                    {title.length}/200
                  </span>
                </div>
              </div>

              {/* Body Textarea */}
              <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] focus-within:border-[#7FB0FF] focus-within:ring-2 focus-within:ring-[#7FB0FF]/25 transition-all">
                <div className="px-5 pt-4 pb-1">
                  <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-widest">
                    İçerik
                  </label>
                </div>
                <textarea
                  placeholder="Sorunuzu detaylandırın, adımları açıklayın, nerede takıldığınızı belirtin..."
                  className="w-full bg-transparent px-5 pb-4 pt-2 text-[15px] text-[var(--text)] placeholder:text-[var(--text-subtle)] focus:outline-none resize-none min-h-[200px] leading-relaxed"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                />
                {/* Image Preview inside textarea card */}
                {previewUrl && (
                  <div className="px-5 pb-4">
                    <div className="relative inline-block group">
                      <div className="relative rounded-xl overflow-hidden border border-[var(--border)] shadow-lg">
                        <img
                          src={previewUrl}
                          alt="Önizleme"
                          className="max-h-64 w-auto object-cover rounded-xl"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
                {/* Toolbar inside card */}
                <div className="px-5 pb-4 pt-2 border-t border-[var(--border)] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--brand)] hover:bg-[var(--brand-soft)] text-sm font-semibold transition-all cursor-pointer group"
                  >
                    <ImagePlus
                      size={16}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span className="hidden sm:inline">Görsel Ekle</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-bold text-[var(--text-subtle)] uppercase tracking-widest flex items-center gap-2">
                    <Hash size={12} className="text-[var(--brand)]" />
                    Etiketler
                  </label>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      selectedTags.length >= 4
                        ? "bg-[#FFB020]/15 text-[#FFB020] border border-[#FFB020]/30"
                        : "bg-[var(--surface-2)] text-[var(--text-subtle)] border border-[var(--border)]"
                    }`}
                  >
                    {selectedTags.length}/4
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map(({ label }) => {
                    const isSelected = selectedTags.includes(label);
                    const isDisabled =
                      !isSelected && selectedTags.length >= 4;
                    return (
                      <button
                        type="button"
                        key={label}
                        onClick={() => toggleTag(label)}
                        disabled={isDisabled}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#2F6BFF] text-white shadow-sm scale-[1.02]"
                            : isDisabled
                            ? "bg-[var(--surface-2)] text-[var(--text-subtle)] opacity-40 cursor-not-allowed border border-[var(--border)]"
                            : "bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                        }`}
                      >
                        <Hash
                          size={11}
                          className={
                            isSelected
                              ? "text-[#FFB020]"
                              : "text-[var(--text-subtle)]"
                          }
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-[var(--text-subtle)]">
                        Seçilenler:
                      </span>
                      {selectedTags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--link)] text-xs font-bold border border-[var(--border-strong)]"
                        >
                          #{t}
                          <button
                            type="button"
                            onClick={() => toggleTag(t)}
                            className="hover:text-[var(--text)] cursor-pointer ml-0.5"
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Submit (mobile friendly) */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#2F6BFF] hover:bg-[#4A80FF] text-white font-bold rounded-2xl shadow-md disabled:opacity-40 disabled:grayscale transition-all cursor-pointer"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Konuyu Yayınla
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Right: Sidebar Info ── */}
          <div className="hidden lg:flex flex-col gap-5">
            {/* Tip Card */}
            <div className="rounded-2xl border border-[#FFB020]/30 bg-[rgba(255,176,32,0.12)] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-[#FFB020]" />
                <h3 className="text-sm font-bold text-[#FFB020]">İpucu</h3>
              </div>
              <p className="text-[13px] text-[var(--text)] leading-relaxed font-medium">
                {activeTip}
              </p>
            </div>

            {/* Rules Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-[var(--brand)]" />
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Gönderi Kuralları
                </h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Saygılı ve yardımsever bir dil kullanın.",
                  "Gerçek ve anlaşılır sorular sorun.",
                  "Konuya uygun etiketler seçin.",
                  "Tekrarlayan konuları açmaktan kaçının.",
                ].map((rule, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[13px] text-[var(--text-muted)]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[var(--brand-soft)] text-[var(--brand)] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Preview Card */}
            {title && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Smile size={16} className="text-[#4ADE80]" />
                  <h3 className="text-sm font-bold text-[var(--text)]">
                    Önizleme
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-[var(--text)] text-base leading-tight line-clamp-2">
                    {title}
                  </p>
                  {text && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                      {text}
                    </p>
                  )}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedTags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--link)] border border-[var(--border-strong)]"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
