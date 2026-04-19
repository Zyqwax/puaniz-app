"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPost } from "@/services/communityService";
import PostCard from "@/components/community/PostCard";
import {
  ArrowLeft,
  AlertCircle,
  Users,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export default function CommunityRoomClient({ id }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchedPost = await getPost(id);
        setPost(fetchedPost);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Gönderi bulunamadı veya bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  const handlePostDeleted = () => {
    router.push("/dashboard/community");
  };

  /* ── Loading State ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Konu yükleniyor...</p>
      </div>
    );
  }

  /* ── Error State ── */
  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl flex items-center justify-center">
          <AlertCircle size={36} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Gönderi Bulunamadı</h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">{error || "Bu konu silinmiş veya erişim izniniz yok."}</p>
        </div>
        <Link
          href="/dashboard/community"
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/5"
        >
          <ArrowLeft size={16} />
          Topluluğa Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/8 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Sticky Breadcrumb Nav ── */}
      <div className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 mb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Link
            href="/dashboard/community"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/10 transition-all">
              <ArrowLeft size={15} />
            </div>
            <span className="text-sm font-semibold hidden sm:inline">Topluluk</span>
          </Link>

          <ChevronRight size={14} className="text-slate-600 shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare size={14} className="text-purple-400 shrink-0" />
            <span className="text-sm font-bold text-white truncate">
              {post.title || "Konu"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6">

        {/* Tags bar above post */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-slate-500 font-medium">Etiketler:</span>
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/dashboard/community?tag=${tag}`}
                className="text-xs font-bold px-3 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
              >
                #{tag.startsWith("#") ? tag.slice(1) : tag}
              </Link>
            ))}
          </div>
        )}

        {/* Main PostCard */}
        <PostCard
          post={post}
          user={user}
          onPostDeleted={handlePostDeleted}
          isDetail={true}
        />

        {/* Community info footer */}
        <div className="mt-8 flex items-center justify-between py-5 border-t border-white/5">
          <div className="flex items-center gap-3 text-slate-500">
            <Users size={15} />
            <span className="text-sm font-medium">Puanİz Topluluğu</span>
          </div>
          <Link
            href="/dashboard/community"
            className="text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors"
          >
            Tüm Konulara Bak
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
