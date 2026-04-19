import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, MessageCircle, Heart, Clock, Image as ImageIcon, Sparkles } from "lucide-react";

const ForumRow = ({ post }) => {
  const roomLink = `/dashboard/community/${post.id}`;

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Şimdi";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}dk`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}sa`;
    return `${Math.floor(diffInSeconds / 86400)}g`;
  };

  return (
    <Link href={roomLink} className="block group outline-none">
      <div className="glass-card p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-900/20 hover:border-white/10 hover:bg-white/[0.04] relative overflow-hidden border-none group-focus-visible:ring-2 group-focus-visible:ring-purple-500">
        
        {/* Subtle side glow for hover */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="flex flex-col sm:flex-row gap-5 items-start relative z-10">
          
          {/* User Avatar & Basic Info (Mobile) */}
          <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto sm:block">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 shadow-lg relative group-hover:border-purple-500/30 transition-colors">
              {post.userPhoto ? (
                <Image src={post.userPhoto} alt={post.userName} fill className="object-cover" sizes="48px" />
              ) : (
                <User size={22} className="text-slate-400" />
              )}
            </div>
            
            <div className="sm:hidden flex-1 overflow-hidden">
                <p className="text-white text-sm font-semibold truncate">{post.userName}</p>
                <div className="flex items-center text-xs text-slate-400 gap-1.5 mt-0.5">
                  <Clock size={11} className="text-slate-500" />
                  {formatTime(post.createdAt)}
                </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full mt-1 sm:mt-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                {post.title || "İsimsiz Konu"}
              </h3>
              {post.imageUrl && (
                <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0 flex items-center gap-1">
                  <ImageIcon size={12} />
                  <span className="text-[9px] font-bold uppercase tracking-wider hidden sm:inline">Görsel</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed group-hover:text-slate-300 transition-colors">
              {post.text}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 4 && (
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-slate-800 text-slate-500">
                    +{post.tags.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats & Meta (Desktop) */}
          <div className="hidden sm:flex flex-col items-end gap-3 shrink-0 ml-4 border-l border-white/5 pl-5 py-1">
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/5 border border-pink-500/10 text-pink-400">
                 <Heart size={14} className={post.likes?.length > 0 ? "fill-pink-500/40" : ""} />
                 <span className="text-xs font-bold">{post.likes?.length || 0}</span>
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/5 border border-blue-500/10 text-blue-400">
                 <MessageCircle size={14} />
                 <span className="text-xs font-bold">{post.commentsCount || 0}</span>
               </div>
             </div>
             
             <div className="flex flex-col items-end gap-0.5 text-xs">
               <span className="text-slate-300 font-medium truncate max-w-[120px]">{post.userName}</span>
               <div className="flex items-center gap-1.5 text-slate-500">
                 <Clock size={11} />
                 <span>{formatTime(post.createdAt)}</span>
               </div>
             </div>
          </div>

          {/* Mobile Stats */}
           <div className="sm:hidden flex items-center justify-end w-full mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/5 border border-pink-500/10 text-pink-400">
                 <Heart size={12} className={post.likes?.length > 0 ? "fill-pink-500/40" : ""} />
                 <span className="text-xs font-bold">{post.likes?.length || 0}</span>
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-blue-400">
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
