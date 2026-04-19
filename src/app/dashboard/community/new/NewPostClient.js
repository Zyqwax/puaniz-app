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
import { createPost } from "@/services/communityService";
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
  const [selectedTags, setSelectedTags] = useState([]);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const fileInputRef = useRef(null);

  const userInitial =
    user?.displayName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "?";
  const userName =
    user?.displayName || user?.email?.split("@")[0] || "Kullanıcı";

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 4) return;
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createPost(title, text, image, selectedTags, user);
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

      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[300px] bg-pink-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* ── Sticky Top Navigation Bar ── */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 mb-8">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/community"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/10 transition-all">
                <ArrowLeft size={16} />
              </div>
              <span className="text-sm font-semibold hidden sm:inline">Topluluk</span>
            </Link>

            <ChevronRight size={14} className="text-slate-600" />

            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-400" />
              <span className="text-sm font-bold text-white">Yeni Konu</span>
            </div>
          </div>

          {/* Submit button in nav */}
          <button
            type="submit"
            form="new-post-form"
            disabled={!canSubmit}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-purple-900/30 disabled:opacity-40 disabled:grayscale hover:-translate-y-0.5 hover:shadow-purple-900/50 transition-all cursor-pointer"
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
            <form id="new-post-form" onSubmit={handleSubmit} className="space-y-4">

              {/* Author Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-purple-500/20 border border-white/20 shrink-0">
                  {userInitial}
                </div>
                <div>
                  <p className="font-bold text-white text-base">{userName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-xs text-slate-400 font-medium">Herkese açık paylaşım</p>
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.03] focus-within:border-purple-500/40 focus-within:bg-white/[0.05] transition-all">
                <div className="px-5 pt-4 pb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Başlık <span className="text-red-400">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Sorunuzu veya konunuzu kısaca özetleyin..."
                  className="w-full bg-transparent px-5 pb-5 pt-2 text-white placeholder:text-slate-600 focus:outline-none font-bold text-xl"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  maxLength={200}
                />
                <div className="px-5 pb-3 flex justify-end">
                  <span className={`text-xs font-medium ${title.length > 180 ? "text-red-400" : "text-slate-600"}`}>
                    {title.length}/200
                  </span>
                </div>
              </div>

              {/* Body Textarea */}
              <div className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.03] focus-within:border-blue-500/30 focus-within:bg-white/[0.05] transition-all">
                <div className="px-5 pt-4 pb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    İçerik
                  </label>
                </div>
                <textarea
                  placeholder="Sorunuzu detaylandırın, adımları açıklayın, nerede takıldığınızı belirtin..."
                  className="w-full bg-transparent px-5 pb-4 pt-2 text-[15px] text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none min-h-[200px] leading-relaxed"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                />
                {/* Image Preview inside textarea card */}
                {previewUrl && (
                  <div className="px-5 pb-4">
                    <div className="relative inline-block group">
                      <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg">
                        <img
                          src={previewUrl}
                          alt="Önizleme"
                          className="max-h-64 w-auto object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors rounded-xl" />
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
                <div className="px-5 pb-4 pt-2 border-t border-white/5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 text-sm font-semibold transition-all cursor-pointer group"
                  >
                    <ImagePlus size={16} className="group-hover:scale-110 transition-transform" />
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
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Hash size={12} className="text-purple-400" />
                    Etiketler
                  </label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    selectedTags.length >= 4
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-white/5 text-slate-500"
                  }`}>
                    {selectedTags.length}/4
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map(({ label, color }) => {
                    const isSelected = selectedTags.includes(label);
                    const isDisabled = !isSelected && selectedTags.length >= 4;
                    return (
                      <button
                        type="button"
                        key={label}
                        onClick={() => toggleTag(label)}
                        disabled={isDisabled}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? `bg-gradient-to-r ${color} text-white shadow-lg scale-[1.03] border-none`
                            : isDisabled
                              ? "bg-white/[0.02] text-slate-600 border border-white/5 cursor-not-allowed"
                              : "bg-white/5 text-slate-300 border border-white/5 hover:bg-white/10 hover:border-white/10 hover:text-white"
                        }`}
                      >
                        <Hash size={11} className={isSelected ? "opacity-70" : isDisabled ? "text-slate-700" : "text-slate-500"} />
                        {label}
                      </button>
                    );
                  })}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">Seçilenler:</span>
                      {selectedTags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/20">
                          #{t}
                          <button type="button" onClick={() => toggleTag(t)} className="hover:text-white cursor-pointer ml-0.5">
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
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-2xl shadow-xl shadow-purple-900/30 disabled:opacity-40 disabled:grayscale transition-all cursor-pointer"
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
            <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-amber-300">İpucu</h3>
              </div>
              <p className="text-[13px] text-amber-200/70 leading-relaxed">{activeTip}</p>
            </div>

            {/* Rules Card */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white">Gönderi Kuralları</h3>
              </div>
              <ul className="space-y-3">
                {[
                  "Saygılı ve yardımsever bir dil kullanın.",
                  "Gerçek ve anlaşılır sorular sorun.",
                  "Konuya uygun etiketler seçin.",
                  "Tekrarlayan konuları açmaktan kaçının.",
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-slate-400">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Preview Card */}
            {title && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Smile size={16} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Önizleme</h3>
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-white text-base leading-tight line-clamp-2">{title}</p>
                  {text && (
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{text}</p>
                  )}
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedTags.map((t) => (
                        <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
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
