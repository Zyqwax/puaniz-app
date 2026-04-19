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
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-purple-900/40 via-slate-900 to-slate-900 p-8 md:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Users size={14} />
              Birlikte Başaralım
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">
              Topluluk & Forum
            </h1>
            <p className="text-slate-400 text-base md:text-lg max-w-xl leading-relaxed">
              Sorularını sor, netlerini paylaş, çalışma taktiklerini tartış ve hedefine giden yolda yalnız yürüme.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/dashboard/community/new"
              className="group relative flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-white shadow-xl shadow-purple-900/30 transition-all hover:-translate-y-1 hover:shadow-purple-900/50 overflow-hidden w-full md:w-auto justify-center"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <PenSquare size={20} className="relative z-10" />
              <span className="relative z-10">Yeni Konu Aç</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 mt-8 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative flex items-center bg-slate-900 border border-white/10 rounded-2xl overflow-hidden focus-within:border-purple-500/50 focus-within:bg-slate-800 transition-all">
              <div className="pl-4 pr-3 text-slate-500">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Konu, etiket veya kullanıcı ara..."
                className="w-full bg-transparent py-4 text-white placeholder:text-slate-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === "") setActiveTag(null);
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>
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
              className="group flex items-center gap-3 p-4 rounded-2xl border border-dashed border-white/10 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors shrink-0">
                <Plus size={20} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Yeni Konu Aç</p>
                <p className="text-xs text-slate-500">Topluluğa katkı sağla</p>
              </div>
            </Link>

            {/* Rules Card */}
            <div className="glass-card p-5 border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full" />
                Topluluk Kuralları
              </h3>
              <ul className="text-[13px] text-slate-400 space-y-3">
                <li className="flex gap-2">
                  <AlertCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>Saygılı ve yapıcı bir dil kullanın.</span>
                </li>
                <li className="flex gap-2">
                  <HelpCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>Soru sorarken detay verin, net olun.</span>
                </li>
                <li className="flex gap-2">
                  <MessageSquare size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  <span>Tekrar konudan kaçının, önce arama yapın.</span>
                </li>
              </ul>
            </div>

            {/* Popular Tags */}
            <div className="glass-card p-5 border-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2" />
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full" />
                Popüler Etiketler
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                    !activeTag
                      ? "bg-slate-700 text-white shadow-md border border-slate-600"
                      : "bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent"
                  }`}
                >
                  Tümü
                </button>
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
                      activeTag === tag
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/20 border-none"
                        : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5 hover:border-white/10"
                    }`}
                  >
                    <Hash size={10} className={activeTag === tag ? "text-purple-200" : "text-slate-500"} />
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
            <div className="mb-6 flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Hash size={16} className="text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-400">Filtrelenen etiket:</p>
                <p className="text-base font-bold text-purple-300">{activeTag}</p>
              </div>
              <button
                onClick={() => setActiveTag(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
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
                    ? "bg-slate-700 text-white shadow-md border border-slate-600"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent"
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
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/20 border-none"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-white/5"
                  }`}
                >
                  <Hash size={12} className={activeTag === tag ? "text-purple-200" : "text-slate-500"} />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Container */}
          <div className="bg-slate-900/30 border border-white/5 rounded-3xl p-1 sm:p-2 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 mb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <TrendingUp size={16} className="text-purple-400" />
                En Son Konular
              </div>
              <div className="text-xs text-slate-500">
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
