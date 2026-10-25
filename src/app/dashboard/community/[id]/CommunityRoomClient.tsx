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
import { Post } from "@/types";

interface CommunityRoomClientProps {
  id: string;
}

export default function CommunityRoomClient({ id }: CommunityRoomClientProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="w-12 h-12 border-4 border-[#2F6BFF]/20 border-t-[#2F6BFF] rounded-full animate-spin" />
        <p className="text-[var(--text-muted)] text-sm font-medium">
          Konu yükleniyor...
        </p>
      </div>
    );
  }

  /* ── Error State ── */
  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
        <div className="w-20 h-20 bg-[var(--err-bg)] border border-[var(--err)]/20 rounded-3xl flex items-center justify-center">
          <AlertCircle size={36} className="text-[var(--err)]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[var(--text)] mb-2">
            Gönderi Bulunamadı
          </h1>
          <p className="text-[var(--text-muted)] text-sm max-w-sm mx-auto">
            {error || "Bu konu silinmiş veya erişim izniniz yok."}
          </p>
        </div>
        <Link
          href="/dashboard/community"
          className="flex items-center gap-2 px-6 py-3 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--text)] rounded-xl font-semibold transition-colors border border-[var(--border)]"
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
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2F6BFF]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Sticky Breadcrumb Nav ── */}
      <div className="sticky top-0 z-30 bg-[var(--surface)]/90 backdrop-blur-xl border-b border-[var(--border)] mb-8">
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
          <Link
            href="/dashboard/community"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors group shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center group-hover:bg-[var(--surface-3)] transition-all">
              <ArrowLeft size={15} />
            </div>
            <span className="text-sm font-semibold hidden sm:inline">
              Topluluk
            </span>
          </Link>

          <ChevronRight
            size={14}
            className="text-[var(--text-subtle)] shrink-0"
          />

          <div className="flex items-center gap-2 min-w-0">
            <MessageSquare size={14} className="text-[var(--brand)] shrink-0" />
            <span className="text-sm font-bold text-[var(--text)] truncate">
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
            <span className="text-xs text-[var(--text-subtle)] font-medium">
              Etiketler:
            </span>
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/dashboard/community?tag=${tag}`}
                className="text-xs font-bold px-3 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--link)] border border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-colors"
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
        <div className="mt-8 flex items-center justify-between py-5 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 text-[var(--text-muted)]">
            <Users size={15} />
            <span className="text-sm font-medium">Puanİz Topluluğu</span>
          </div>
          <Link
            href="/dashboard/community"
            className="text-sm font-semibold text-[var(--link)] hover:underline flex items-center gap-1.5 transition-colors"
          >
            Tüm Konulara Bak
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
