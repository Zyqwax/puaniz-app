"use client";

import React, { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { X, Send, Hash, FileImage } from "lucide-react";
import NextImage from "next/image";
import { createPost } from "@/services/communityService";
import type { UserProfile } from "@/types";
import type { User } from "firebase/auth";

const PREDEFINED_TAGS: string[] = [
  "TYT", "AYT", "Matematik", "Geometri", "Fizik", "Kimya", 
  "Biyoloji", "Türkçe", "Tarih", "Coğrafya", "Felsefe", "Din", "Genel"
];

interface CreatePostProps {
  user: (UserProfile | User) | null;
  onPostCreated?: () => void;
  onClose?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ user, onPostCreated, onClose }) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 4) return;
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Dosya boyutu 2MB'dan küçük olmalıdır.");
        return;
      }
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Lütfen bir başlık giriniz.");
      return;
    }

    setLoading(true);
    try {
      await createPost(title, text, image, selectedTags, user);
      setText("");
      setTitle("");
      setSelectedTags([]);
      removeImage();
      if (onPostCreated) onPostCreated();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error posting:", error);
      alert("Gönderi oluşturulurken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* User Badge & Title Input */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-purple-500/20 border border-white/20">
            {user?.displayName ? user.displayName[0].toUpperCase() : user?.email?.[0].toUpperCase() || "?"}
          </div>
          <div className="flex-1 w-full relative group">
            <input
              type="text"
              placeholder="Konu başlığını yazın..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800 transition-all font-semibold text-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Content Input */}
        <div className="relative group">
          <textarea
            placeholder="Sorunu veya düşünceni detaylıca anlat... (Örn: #matematik etiketi ile...)"
            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-5 text-white placeholder:text-slate-500 min-h-[140px] focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-slate-800 resize-y transition-all text-sm leading-relaxed"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Tag Selector */}
        <div>
          <p className="text-xs font-semibold text-slate-400 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
            <Hash size={14} className="text-purple-400" />
            Etiketler (Maks 4)
          </p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30 border-none scale-105"
                      : "bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700 hover:text-slate-300 hover:border-white/10"
                  }`}
                >
                  <Hash size={12} className={isSelected ? "text-purple-200" : "text-slate-500"} />
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Image Preview */}
        {previewUrl && (
          <div className="relative mt-2 inline-block group w-fit">
            <div className="relative rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-xl shadow-purple-900/20">
              <NextImage
                src={previewUrl}
                alt="Preview"
                width={300}
                height={200}
                className="max-h-60 w-auto object-cover"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors"></div>
            </div>
            <button
              type="button"
              onClick={removeImage}
              aria-label="Görseli Kaldır"
              className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg shadow-red-900/30 transition-transform scale-100 hover:scale-110 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-xl transition-all shadow-sm cursor-pointer group"
          >
            <FileImage size={18} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Görsel Ekle</span>
          </button>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-slate-400 hover:text-white bg-transparent hover:bg-white/5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                İptal
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (!text.trim() && !image) || !title.trim()}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl disabled:opacity-50 disabled:grayscale transition-all font-bold shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Yayınla</span>
                  <Send size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
