import React, { useState, useRef } from "react";
import { Image, X, Send, Camera } from "lucide-react";
import { createPost } from "../../services/communityService";

const PREDEFINED_TAGS = [
  "TYT",
  "AYT",
  "Matematik",
  "Geometri",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Türkçe",
  "Tarih",
  "Coğrafya",
  "Felsefe",
  "Din",
  "Genel",
];

const CreatePost = ({ user, onPostCreated, onClose }) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
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

  const handleSubmit = async (e) => {
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
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-purple-500/20">
            {user?.displayName ? user.displayName[0].toUpperCase() : user?.email?.[0].toUpperCase() || "?"}
          </div>

          <div className="flex-1 space-y-4">
            {/* Title Input */}
            <input
              type="text"
              placeholder="Başlık (örn: Trigonometri sorusu)"
              className="w-full bg-transparent border-b border-white/10 p-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-semibold text-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />

            {/* Tag Selector */}
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedTags.includes(tag)
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                      : "bg-slate-800 text-slate-400 border border-white/5 hover:bg-slate-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              placeholder="Sorunu detaylandır..."
              className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-white placeholder:text-slate-500 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 resize-y transition-all"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {previewUrl && (
              <div className="relative mt-3 inline-block group">
                <div className="relative rounded-xl overflow-hidden border border-white/10">
                  <img src={previewUrl} alt="Preview" className="h-40 w-auto object-cover" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 md:mt-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors group cursor-pointer"
              >
                <div className="p-1.5 rounded-full bg-slate-800 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                  <Image size={18} />
                </div>
                <span>Fotoğraf Ekle</span>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

              <div className="flex items-center gap-3">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    İptal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || (!text.trim() && !image) || !title.trim()}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 active:scale-95 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Paylaş</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default CreatePost;
