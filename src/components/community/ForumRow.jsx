import React from "react";
import Link from "next/link";
import Image from "next/image";
import { User, MessageCircle, Heart, Clock, Image as ImageIcon } from "lucide-react";

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
    <Link href={roomLink} className="block group">
      <div className="bg-slate-800/50 hover:bg-slate-800 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-200">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          
          {/* User Avatar */}
          <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto sm:block">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-600 shrink-0">
              {post.userPhoto ? (
                <div className="relative w-full h-full">
                  <Image src={post.userPhoto} alt={post.userName} fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </div>
            <div className="sm:hidden flex-1 overflow-hidden">
                <p className="text-white text-sm font-medium truncate">{post.userName}</p>
                <div className="flex items-center text-xs text-slate-400 gap-1">
                  <Clock size={10} />
                  {formatTime(post.createdAt)}
                </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                {post.title || "İsimsiz Konu"}
              </h3>
              {post.imageUrl && (
                <ImageIcon size={14} className="text-slate-400 shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-slate-400 line-clamp-1 mb-2">
              {post.text}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 hidden sm:flex">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stats & Meta (Desktop) */}
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 ml-4">
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 text-slate-400">
                 <Heart size={14} className={post.likes?.length > 0 ? "fill-pink-500/20 text-pink-500" : ""} />
                 <span className="text-xs font-medium">{post.likes?.length || 0}</span>
               </div>
               <div className="flex items-center gap-1.5 text-slate-400">
                 <MessageCircle size={14} />
                 <span className="text-xs font-medium">{post.commentsCount || 0}</span>
               </div>
             </div>
             <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
               <span className="truncate max-w-[80px]">{post.userName}</span>
               <span className="mx-1">•</span>
               <span>{formatTime(post.createdAt)}</span>
             </div>
          </div>

          {/* Mobile Stats */}
           <div className="sm:hidden flex items-center justify-between w-full mt-2 pt-3 border-t border-white/5">
             {post.tags && post.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    #{post.tags[0]}
                  </span>
                </div>
              ) : <div/>}

              <div className="flex items-center gap-3">
               <div className="flex items-center gap-1 text-slate-400">
                 <Heart size={12} className={post.likes?.length > 0 ? "fill-pink-500/20 text-pink-500" : ""} />
                 <span className="text-xs">{post.likes?.length || 0}</span>
               </div>
               <div className="flex items-center gap-1 text-slate-400">
                 <MessageCircle size={12} />
                 <span className="text-xs">{post.commentsCount || 0}</span>
               </div>
             </div>
           </div>

        </div>
      </div>
    </Link>
  );
};

export default ForumRow;
