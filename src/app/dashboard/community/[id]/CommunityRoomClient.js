"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPost } from "@/services/communityService";
import PostCard from "@/components/community/PostCard";
import { ArrowLeft, AlertCircle } from "lucide-react";
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
      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col">
        {/* Simple Inline Header */}
        <div className="flex items-center gap-2 p-4 text-slate-400 shrink-0">
          <Link
            href="/dashboard/community"
            className="p-2 -ml-2 rounded-full hover:bg-white/10 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <span className="text-sm font-medium">Soru Odası</span>
        </div>

        {/* Post Content */}
        <div className="flex-1 pb-20 px-4 md:px-0">
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
