"use client";

import React, { useEffect, useState } from "react";
import ForumRow from "@/components/community/ForumRow";
import PostSkeleton from "@/components/community/PostSkeleton";
import { getPosts } from "@/services/communityService";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Search,
  X,
  Users,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  HelpCircle,
  Hash,
  SquarePen,
} from "lucide-react";
import Link from "next/link";
import { Post } from "@/types";

const POPULAR_TAGS = [
  "TYT",
  "AYT",
  "Matematik",
  "Geometri",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Türkçe",
];

const CommunityClient: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchPosts = async (tag: string | null = null) => {
    setLoading(true);
    setPosts([]);
    try {
      const fetchedPosts = await getPosts(tag || undefined);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(activeTag);

    const handleTagClick = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      let tag = customEvent.detail;
      if (tag && tag.startsWith("#")) tag = tag.substring(1);
      setActiveTag(tag);
    };
    window.addEventListener("community-tag-click", handleTagClick);
    return () =>
      window.removeEventListener("community-tag-click", handleTagClick);
  }, [activeTag]);

  return (
    <div className="h-full flex flex-col pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2A5C] to-[#16244A] border border-[var(--border-strong)] text-white p-8 md:p-10 mb-8 shadow-sm">
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
            <p className="text-[#9FB4D9] text-base md:text-lg max-w-xl leading-relaxed">
              Sorularını sor, netlerini paylaş, çalışma taktiklerini tartış ve
              hedefine giden yolda yalnız yürüme.
            </p>
          </div>

          <div className="shrink-0">
            <Link
              href="/dashboard/community/new"
              className="flex items-center gap-2 px-6 py-3.5 bg-[#2F6BFF] hover:bg-[#4A80FF] text-white font-bold rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 justify-center cursor-pointer"
            >
              <SquarePen size={18} />
              <span>Yeni Konu Aç</span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative z-10 mt-6 max-w-2xl">
          <div className="relative flex items-center bg-[var(--surface-2)] rounded-2xl overflow-hidden border border-[var(--border-strong)] shadow-xs focus-within:ring-2 focus-within:ring-[#7FB0FF]">
            <div className="pl-4 pr-2 text-[var(--text-subtle)]">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Konu, etiket veya kullanıcı ara..."
              className="w-full bg-transparent py-3.5 text-[var(--text)] placeholder:text-[var(--text-subtle)] font-medium focus:outline-none"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === "") setActiveTag(null);
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors cursor-pointer"
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
              className="group flex items-center gap-3 p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--brand)] hover:bg-[var(--surface-2)] shadow-xs hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 text-[var(--brand)]">
                <Plus size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text)]">
                  Yeni Konu Aç
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Topluluğa katkı sağla
                </p>
              </div>
            </Link>

            {/* Rules Card */}
            <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-xs">
              <h3 className="font-bold text-[var(--text)] text-sm mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[var(--brand)] rounded-full" />
                Topluluk Kuralları
              </h3>
              <ul className="text-xs text-[var(--text-muted)] space-y-3 font-medium">
                <li className="flex gap-2.5">
                  <AlertCircle
                    size={15}
                    className="text-[var(--brand)] shrink-0 mt-0.5"
                  />
                  <span>Saygılı ve yapıcı bir dil kullanın.</span>
                </li>
                <li className="flex gap-2.5">
                  <HelpCircle
                    size={15}
                    className="text-[var(--brand)] shrink-0 mt-0.5"
                  />
                  <span>Soru sorarken detay verin, net olun.</span>
                </li>
                <li className="flex gap-2.5">
                  <MessageSquare
                    size={15}
                    className="text-[var(--brand)] shrink-0 mt-0.5"
                  />
                  <span>Tekrar konudan kaçının, önce arama yapın.</span>
                </li>
              </ul>
            </div>

            {/* Popular Tags */}
            <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-xs">
              <h3 className="font-bold text-[var(--text)] text-sm mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[#FFB020] rounded-full" />
                Popüler Etiketler
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setActiveTag(null)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                    !activeTag
                      ? "bg-[var(--brand)] text-white shadow-xs"
                      : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
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
                        ? "bg-[var(--brand)] text-white shadow-xs"
                        : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
                    }`}
                  >
                    <Hash
                      size={11}
                      className={
                        activeTag === tag
                          ? "text-[#FFB020]"
                          : "text-[var(--text-subtle)]"
                      }
                    />
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
            <div className="mb-6 flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] p-4 rounded-3xl shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center shrink-0 text-[var(--brand)]">
                <Hash size={16} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-[var(--text-muted)]">
                  Filtrelenen etiket:
                </p>
                <p className="text-base font-bold text-[var(--text)]">
                  {activeTag}
                </p>
              </div>
              <button
                onClick={() => setActiveTag(null)}
                className="px-3.5 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-[var(--border)]"
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
                    ? "bg-[var(--brand)] text-white shadow-xs"
                    : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
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
                      ? "bg-[var(--brand)] text-white shadow-xs"
                      : "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]"
                  }`}
                >
                  <Hash
                    size={12}
                    className={
                      activeTag === tag
                        ? "text-[#FFB020]"
                        : "text-[var(--text-subtle)]"
                    }
                  />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Feed Container */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-3 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)] mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                <TrendingUp size={16} className="text-[var(--brand)]" />
                En Son Konular
              </div>
              <div className="text-xs text-[var(--text-muted)] font-medium">
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
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-[var(--surface-2)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
                  <MessageSquare
                    size={28}
                    className="text-[var(--text-subtle)]"
                  />
                </div>
                <h3 className="text-lg font-bold text-[var(--text)] mb-2">
                  Gönderi Bulunamadı
                </h3>
                <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto mb-6">
                  Aramanıza veya filtrenize uygun bir konu bulamadık.
                </p>
                <Link
                  href="/dashboard/community/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white rounded-xl transition-colors font-bold text-sm cursor-pointer shadow-sm"
                >
                  <Plus size={16} />
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
