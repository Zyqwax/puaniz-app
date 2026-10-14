"use client";

import React, { useEffect, useState } from "react";
import ForumRow from "@/components/community/ForumRow";
import PostSkeleton from "@/components/community/PostSkeleton";
import { getPosts } from "@/services/communityService";
import { useAuth } from "@/context/AuthContext";
import {
  Plus, Search, X, Users, MessageSquare, AlertCircle,
  TrendingUp, HelpCircle, Hash, PenSquare
} from "lucide-react";
import Link from "next/link";

const CommunityClient = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPosts(activeTag);

    const handleTagClick = (e) => {
      let tag = e.detail;
      if (tag.startsWith("#")) tag = tag.substring(1);
      setActiveTag(tag);
    };
    window.addEventListener("community-tag-click", handleTagClick);
    return () => window.removeEventListener("community-tag-click", handleTagClick);
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

  const POPULAR_TAGS = [
    "TYT", "AYT", "Matematik", "Geometri", "Fizik", "Kimya", "Biyoloji", "Türkçe"
  ];

  return (
    <div className="h-full flex flex-col pb-20">

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0F2A5C] text-white p-8 md:p-10 mb-8 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#2F6BFF]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-[#FFB020] text-xs font-bold uppercase tracking-wider mb-3">
              <Users size={14} />
              Birlikte Başaralım
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight">
              Topluluk & Forum
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-xl leading-relaxed">
              Sorularını sor, netlerini paylaş, çalışma taktiklerini tartış ve hedefine giden yolda yalnız yürüme.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/dashboard/community/new"
              className="flex items-center gap-2 px-6 py-3.5 bg-[#2F6BFF] hover:bg-[#2558d6] text-white font-bold rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 justify-center"
            >
              <PenSquare size={18} />
              <span>Yeni Konu Aç</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 mt-6 max-w-2xl">
          <div className="relative flex items-center bg-white rounded-2xl overflow-hidden border border-white/20 shadow-xs focus-within:ring-2 focus-within:ring-[#2F6BFF]">
            <div className="pl-4 pr-2 text-[#4A5B7A]">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Konu, etiket veya kullanıcı ara..."
              className="w-full bg-transparent py-3.5 text-[#0F2A5C] placeholder:text-[#4A5B7A]/60 font-medium focus:outline-none"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === "") setActiveTag(null);
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 text-[#4A5B7A] hover:text-[#0F2A5C] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 relative">

        {/* Left Sidebar */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-6 space-y-6">

            {/* New Post CTA */}
            <Link
              href="/dashboard/community/new"
              className="group flex items-center gap-3 p-4 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] hover:border-[#2F6BFF]/40 shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#2F6BFF]/10 flex items-center justify-center group-hover:bg-[#2F6BFF]/20 transition-colors shrink-0 text-[#2F6BFF]">
                <Plus size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0F2A5C]">Yeni Konu Aç</p>
                <p className="text-xs text-[#4A5B7A]">Topluluğa katkı sağla</p>
              </div>
            </Link>

            {/* Rules Card */}
            <div className="bg-white rounded-3xl border border-[#0F2A5C]/[0.08] p-6 shadow-xs">
              <h3 className="font-bold text-[#0F2A5C] text-sm mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#2F6BFF] rounded-full" />
                Topluluk Kuralları
              </h3>
              <ul className="text-xs text-[#4A5B7A] space-y-3 font-medium">
                <li className="flex gap-2.5">
                  <AlertCircle size={15} className="text-[#2F6BFF] shrink-0 mt-0.5" />
                  <span>Saygılı ve yapıcı bir dil kullanın.</span>
                </li>
                <li className="flex gap-2.5">
                  <HelpCircle size={15} className="text-[#2F6BFF] shrink-0 mt-0.5" />
                  <span>Soru sorarken detay verin, net olun.</span>
                </li>
                <li className="flex gap-2.5">
                  <MessageSquare size={15} className="text-[#2F6BFF] shrink-0 mt-0.5" />
                  <span>Tekrar konudan kaçının, önce arama yapın.</span>
                </li>
              </ul>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-3xl border border-[#0F2A5C]/[0.08] p-6 shadow-xs">
              <h3 className="font-bold text-[#0F2A5C] text-sm mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#FFB020] rounded-full" />
                Popüler Etiketler
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    !activeTag
                      ? "bg-[#0F2A5C] text-white shadow-xs"
                      : "bg-[#F4F7FC] text-[#4A5B7A] hover:text-[#0F2A5C]"
                  }`}
                >
                  Tümü
                </button>
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1 ${
                      activeTag === tag
                        ? "bg-[#0F2A5C] text-white shadow-xs"
                        : "bg-[#F4F7FC] text-[#4A5B7A] hover:text-[#0F2A5C]"
                    }`}
                  >
                    <Hash size={11} className={activeTag === tag ? "text-[#FFB020]" : "text-[#4A5B7A]/50"} />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-3">

          {/* Active Tag Indicator */}
          {activeTag && (
            <div className="mb-6 flex items-center gap-3 bg-white border border-[#0F2A5C]/[0.08] p-4 rounded-3xl shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-[#2F6BFF]/10 flex items-center justify-center shrink-0 text-[#2F6BFF]">
                <Hash size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#4A5B7A]">Filtrelenen etiket:</p>
                <p className="text-base font-bold text-[#0F2A5C]">{activeTag}</p>
              </div>
              <button
                onClick={() => setActiveTag(null)}
                className="px-3.5 py-1.5 bg-[#F4F7FC] hover:bg-[#e8edf7] text-[#0F2A5C] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X size={14} /> Kaldır
              </button>
            </div>
          )}

          {/* Mobile Tags */}
          <div className="lg:hidden mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            <div className="flex gap-2 w-max">
              <button
                onClick={() => setActiveTag(null)}
                className={`text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all ${
                  !activeTag
                    ? "bg-[#0F2A5C] text-white shadow-xs"
                    : "bg-white text-[#4A5B7A] border border-[#0F2A5C]/[0.08]"
                }`}
              >
                Tümü
              </button>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeTag === tag
                      ? "bg-[#0F2A5C] text-white shadow-xs"
                      : "bg-white text-[#4A5B7A] border border-[#0F2A5C]/[0.08]"
                  }`}
                >
                  <Hash size={12} className={activeTag === tag ? "text-[#FFB020]" : "text-[#4A5B7A]/50"} />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Container */}
          <div className="bg-white border border-[#0F2A5C]/[0.08] rounded-3xl p-3 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between px-3 py-3 border-b border-[#0F2A5C]/[0.06] mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0F2A5C]">
                <TrendingUp size={16} className="text-[#2F6BFF]" />
                En Son Konular
              </div>
              <div className="text-xs text-[#4A5B7A] font-medium">
                {posts.length} Gönderi
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-2">
                    <PostSkeleton />
                  </div>
                ))}
              </div>
            ) : posts.length > 0 ? (
              <div className="flex flex-col gap-2">
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
                    <ForumRow key={post.id} post={post} user={user} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-24 px-4">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <MessageSquare size={32} className="text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gönderi Bulunamadı</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
                  Aramanıza veya filtrenize uygun bir konu bulamadık.
                </p>
                <Link
                  href="/dashboard/community/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                >
                  <Plus size={18} />
                  Yeni Konu Aç
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityClient;
