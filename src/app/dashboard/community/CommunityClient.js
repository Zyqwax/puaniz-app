"use client";

import React, { useEffect, useState } from "react";
import CreatePost from "@/components/community/CreatePost";
import PostCard from "@/components/community/PostCard";
import PostSkeleton from "@/components/community/PostSkeleton";
import Modal from "@/components/Modal";
import { getPosts } from "@/services/communityService";
import { useAuth } from "@/context/AuthContext";
import { Plus, Search, X } from "lucide-react";

const CommunityClient = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTag, setActiveTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts(activeTag);

    // Listen for tag clicks from PostCard
    const handleTagClick = (e) => {
      let tag = e.detail;
      if (tag.startsWith("#")) tag = tag.substring(1);
      activeTagSearch(tag);
    };
    window.addEventListener("community-tag-click", handleTagClick);

    return () => {
      window.removeEventListener("community-tag-click", handleTagClick);
    };
  }, [activeTag]);

  const fetchPosts = async (tag = null) => {
    setLoading(true);
    setPosts([]);
    try {
      const fetchedPosts = await getPosts(tag);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    fetchPosts(activeTag);
    setIsCreateModalOpen(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const activeTagSearch = (tag) => {
    setActiveTag(tag);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="h-full flex flex-col pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Topluluk & Soru-Cevap
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Sorularını sor, diğerlerine yardım et ve tartış.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <input
              type="text"
              placeholder="Tabip ara veya #etiket..."
              className="bg-slate-800 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-slate-500 w-full md:w-64 focus:outline-none focus:border-purple-500/50 transition-colors"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === "") setActiveTag(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchQuery);
                }
              }}
            />
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all active:scale-95 font-medium whitespace-nowrap shrink-0"
          >
            <Plus size={20} />
            <span className="hidden md:inline">Yeni Soru Sor</span>
            <span className="md:hidden">Ekle</span>
          </button>
        </div>
      </div>

      {activeTag && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-slate-400">Etikete göre filtrelendi:</span>
          <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/20">
            <span className="font-semibold">{activeTag}</span>
            <button onClick={() => setActiveTag(null)} className="hover:text-white">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-4 space-y-6">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
              <h3 className="font-semibold text-white mb-2">Topluluk Kuralları</h3>
              <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside">
                <li>Saygılı ve yapıcı olun.</li>
                <li>Net ve anlaşılır sorular sorun.</li>
                <li>Gereksiz tekrarlardan kaçının.</li>
              </ul>
            </div>

            <div className="bg-linear-to-br from-purple-900/20 to-slate-900 rounded-xl p-4 border border-white/5">
              <h3 className="font-semibold text-white mb-2">Popüler Konular</h3>
              <div className="flex flex-wrap gap-2">
                {["TYT", "AYT", "Matematik", "Geometri", "Fizik"].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`text-xs px-2 py-1 rounded-lg cursor-pointer transition-colors border border-white/5 ${activeTag === tag ? "bg-purple-600 text-white" : "bg-white/5 hover:bg-white/10 text-slate-300"}`}
                  >
                    #{tag}
                  </button>
                ))}
                <button
                  onClick={() => setActiveTag(null)}
                  className="text-xs text-slate-500 hover:text-white px-2 py-1"
                >
                  Tümü
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed - Masonry Layout */}
        <div className="lg:col-span-3">
          {/* Mobile Tags (Horizontal Scroll) */}
          <div className="lg:hidden mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <div className="flex gap-2 w-max">
              {["TYT", "AYT", "Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Türkçe", "Tarih", "Coğrafya"].map(
                (tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`text-sm px-4 py-2 rounded-xl cursor-pointer transition-colors border border-white/5 whitespace-nowrap 
                    ${activeTag === tag ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
                  >
                    #{tag}
                  </button>
                ),
              )}
              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)}
                  className="text-sm text-slate-400 hover:text-white px-3 py-2 whitespace-nowrap"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="break-inside-avoid">
                  <PostSkeleton />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="columns-1 md:columns-2 gap-4 space-y-4">
              {posts
                .filter((post) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (post.title && post.title.toLowerCase().includes(q)) ||
                    (post.text && post.text.toLowerCase().includes(q))
                  );
                })
                .map((post) => (
                  <div key={post.id} className="break-inside-avoid mb-4">
                    <PostCard post={post} user={user} onPostDeleted={handlePostCreated} />
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-800/30 rounded-3xl border border-white/5 text-slate-400">
              <p className="text-xl">Henüz hiç gönderi yok.</p>
              <p className="mt-2 text-sm">İlk paylaşımı sen yap ve topluluğu başlat!</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Yeni Gönderi Oluştur">
        <CreatePost user={user} onPostCreated={handlePostCreated} onClose={() => setIsCreateModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default CommunityClient;
