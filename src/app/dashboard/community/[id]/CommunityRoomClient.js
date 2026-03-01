"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPost, deletePost } from "@/services/communityService";
import PostCard from "@/components/community/PostCard";
import {
  ArrowLeft,
  AlertCircle,
  User,
  Clock,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CommunityRoomClient({ id }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

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

  const handleDeletePost = async () => {
    if (!window.confirm("Bu gönderiyi silmek istediğinden emin misin?")) return;

    setIsDeletingPost(true);
    try {
      await deletePost(post.id);
      handlePostDeleted();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Gönderi silinirken bir hata oluştu.");
      setIsDeletingPost(false);
    }
  };

  const isOwner = user && post && post.userId === user.uid;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-950 p-4 flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Hata</h1>
        <p className="text-slate-400 mb-6">{error || "Gönderi bulunamadı."}</p>
        <Link
          href="/dashboard/community"
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          Topluluğa Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col scrollbar-hide">
      <div className="flex-1 w-full flex flex-col">
        {/* Unified Header */}
        <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/community"
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
            >
              <ArrowLeft size={22} />
            </Link>

            <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 relative">
                {post.userPhoto ? (
                  <Image
                    src={post.userPhoto}
                    alt={post.userName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User size={18} className="text-slate-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">
                  {post.userName}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Clock size={10} />
                  <span>
                    {post.createdAt
                      ? post.createdAt.toDate
                        ? "Yeni Gönderi"
                        : "Gönderi"
                      : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1 rounded-full border border-purple-500/20 hidden xs:block">
              Topluluk
            </div>

            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-slate-500 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5 cursor-pointer"
                >
                  <MoreHorizontal size={20} />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowMenu(false)}
                    ></div>
                    <div className="absolute right-0 top-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-40 w-44 py-2 overflow-hidden">
                      <div className="px-4 py-1.5 border-b border-white/5 mb-1">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                          İşlemler
                        </p>
                      </div>
                      <button
                        onClick={handleDeletePost}
                        disabled={isDeletingPost}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-100 hover:bg-red-500/20 transition-colors text-left cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 size={16} className="text-red-400" />
                        <span>
                          {isDeletingPost ? "Siliniyor..." : "Gönderiyi Sil"}
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="flex-1">
          <PostCard
            post={post}
            user={user}
            onPostDeleted={handlePostDeleted}
            isDetail={true}
          />
        </div>
      </div>
    </div>
  );
}
