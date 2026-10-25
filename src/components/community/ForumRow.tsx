import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User as UserIcon, MessageCircle, Heart, Clock, Image as ImageIcon } from "lucide-react";
import type { ForumPost } from "@/types";

interface ForumRowProps {
  post: ForumPost;
  user?: any;
}

const ForumRow: React.FC<ForumRowProps> = ({ post }) => {
  const roomLink = `/dashboard/community/${post.id}`;

  const formatTime = (timestamp?: unknown) => {
    if (!timestamp) return "";
    let date: Date;
    if (typeof (timestamp as { toDate?: () => Date }).toDate === "function") {
      date = (timestamp as { toDate: () => Date }).toDate();
    } else {
      date = new Date(timestamp as string | number);
    }
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Şimdi";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}sa`;
    return `${Math.floor(diffInSeconds / 86400)}g`;
  };

  return (
    <Link href={roomLink} className="block group outline-none">
      <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] relative overflow-hidden group-focus-visible:ring-2 group-focus-visible:ring-[#7FB0FF]">
        {/* Subtle side glow for hover */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2F6BFF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="flex flex-col sm:flex-row gap-5 items-start relative z-10">
          {/* User Avatar & Basic Info (Mobile) */}
          <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto sm:block">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-3)] flex items-center justify-center overflow-hidden border border-[var(--border)] shrink-0 shadow-xs relative group-hover:border-[#7FB0FF]/50 transition-colors">
              {post.userPhoto ? (
                <Image src={post.userPhoto} alt={post.userName || "Kullanıcı"} fill className="object-cover" sizes="48px" />
              ) : (
                <UserIcon size={22} className="text-[var(--text-muted)]" />
              )}
            </div>

            <div className="sm:hidden flex-1 overflow-hidden">
              <p className="text-[var(--text)] text-sm font-semibold truncate">{post.userName}</p>
              <div className="flex items-center text-xs text-[var(--text-muted)] gap-1.5 mt-0.5">
                <Clock size={11} className="text-[var(--text-subtle)]" />
                {formatTime(post.createdAt)}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full mt-1 sm:mt-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-lg font-bold text-[var(--text)] group-hover:text-[var(--link)] transition-colors truncate">
                {post.title || "İsimsiz Konu"}
              </h3>
              {post.imageUrl && (
                <div className="px-1.5 py-0.5 rounded bg-[var(--brand-soft)] border border-[var(--border)] text-[var(--link)] shrink-0 flex items-center gap-1">
                  <ImageIcon size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:inline">Görsel</span>
                </div>
              )}
            </div>

            <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed group-hover:text-[var(--text)] transition-colors">
              {post.text}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[var(--surface)] text-[var(--link)] border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 4 && (
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                    +{post.tags.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats & Meta (Desktop) */}
          <div className="hidden sm:flex flex-col items-end gap-3 shrink-0 ml-4 border-l border-[var(--border)] pl-5 py-1">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--err-bg)] border border-[var(--err)]/20 text-[var(--err)]">
                <Heart size={14} className={post.likes && post.likes.length > 0 ? "fill-[var(--err)]" : ""} />
                <span className="text-xs font-bold">{post.likes?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--brand-soft)] border border-[var(--border)] text-[var(--link)]">
                <MessageCircle size={14} />
                <span className="text-xs font-bold">{post.commentsCount || 0}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-0.5 text-xs">
              <span className="text-[var(--text)] font-medium truncate max-w-[120px]">{post.userName}</span>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Clock size={11} />
                <span>{formatTime(post.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Mobile Stats */}
          <div className="sm:hidden flex items-center justify-end w-full mt-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--err-bg)] border border-[var(--err)]/20 text-[var(--err)]">
                <Heart size={12} className={post.likes && post.likes.length > 0 ? "fill-[var(--err)]" : ""} />
                <span className="text-xs font-bold">{post.likes?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-soft)] border border-[var(--border)] text-[var(--link)]">
                <MessageCircle size={12} />
                <span className="text-xs font-bold">{post.commentsCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ForumRow;
