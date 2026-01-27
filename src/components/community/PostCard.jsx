import React, { useState, useEffect } from "react";
import {
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  User,
  Clock,
  Check,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toggleLike, addComment, getComments, deletePost } from "../../services/communityService";

const PostCard = ({ post, user, onPostDeleted, isDetail = false }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(isDetail);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // We'll use this to navigate to the room structure
  const roomLink = `/community/${post.id}`;

  useEffect(() => {
    if (post.likes) {
      setIsLiked(post.likes.includes(user.uid));
      setLikesCount(post.likes.length);
    }
    setCommentsCount(post.commentsCount || 0);

    if (isDetail) {
      fetchComments();
    }
  }, [post, user.uid, isDetail]);

  const handleLike = async () => {
    // Optimistic update
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      await toggleLike(post.id, user.uid, previousLiked);
    } catch (error) {
      // Revert if error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error("Error toggling like:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bu gönderiyi silmek istediğinden emin misin?")) return;

    setIsDeleting(true);
    try {
      await deletePost(post.id);
      if (onPostDeleted) onPostDeleted();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Gönderi silinirken bir hata oluştu.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const fetchedComments = await getComments(post.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await addComment(post.id, newComment, user);
      setNewComment("");
      setCommentsCount((prev) => prev + 1);
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/community/${post.id}`;
    const shareData = {
      title: post.title || "Puanİz Gönderisi",
      text: post.text?.substring(0, 100) + "...",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Bağlantı kopyalandı!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        alert("Bağlantı kopyalanamadı.");
      }
    }
  };

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

  const isOwner = user && post.userId === user.uid;

  if (isDeleting) return null; // Or show loading state

  return (
    <div
      className={`transition-all duration-300 ${
        isDetail
          ? "bg-transparent h-full flex flex-col" // Full height, transparent, flex column for chat layout
          : "bg-slate-800 rounded-xl border border-white/10 overflow-hidden shadow-lg hover:shadow-xl hover:border-white/20 group relative"
      }`}
    >
      <div className={isDetail ? "p-6 md:p-8" : "p-4"}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`${isDetail ? "w-12 h-12" : "w-10 h-10"} rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600`}
            >
              {post.userPhoto ? (
                <div className="relative w-full h-full">
                  <Image src={post.userPhoto} alt={post.userName} fill className="object-cover" sizes="40px" />
                </div>
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </div>
            <div>
              {isDetail ? (
                <span className="font-semibold text-white text-sm">{post.userName}</span>
              ) : (
                <Link href={roomLink} className="font-semibold text-white text-sm hover:underline">
                  {post.userName}
                </Link>
              )}
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Clock size={10} />
                {formatTime(post.createdAt)}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
              >
                <MoreHorizontal size={18} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 w-32 py-1 overflow-hidden">
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <Trash2 size={14} />
                      <span>Sil</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content - Link to the room */}
        <div className="mb-4">
          {post.title &&
            (isDetail ? (
              <h3 className="text-2xl font-bold text-white mb-4">{post.title}</h3>
            ) : (
              <Link href={roomLink}>
                <h3 className="text-lg font-bold text-white mb-2 hover:text-purple-400 transition-colors">
                  {post.title}
                </h3>
              </Link>
            ))}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-semibold px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/20 cursor-pointer hover:bg-purple-500/30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    // If it's a hashtag in the text (e.g. #TYT), we can treat it same as a predefined tag.
                    // The logic below for text parsing still exists for hashtags in body.
                    const event = new CustomEvent("community-tag-click", { detail: tag.startsWith("#") ? tag : tag });
                    window.dispatchEvent(event);
                  }}
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          <p
            className={`${isDetail ? "text-base md:text-lg" : "text-sm"} text-slate-200 leading-relaxed whitespace-pre-wrap mb-3`}
          >
            {post.text.split(/(#[a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+)/g).map((part, index) => {
              if (part.startsWith("#")) {
                return (
                  <span
                    key={index}
                    className="text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Custom event to notify parent about tag click
                      const event = new CustomEvent("community-tag-click", { detail: part });
                      window.dispatchEvent(event);
                    }}
                  >
                    {part}
                  </span>
                );
              }
              return part;
            })}
          </p>
          {post.imageUrl &&
            (isDetail ? (
              <div className="relative rounded-lg overflow-hidden border border-white/5 bg-slate-900/50 w-full mt-3">
                {/* Remove fixed aspect ratio for detailed view to show full image */}
                <img
                  src={post.imageUrl}
                  alt={post.title || "Post content"}
                  className="w-full h-auto object-contain max-h-[80vh]"
                />
              </div>
            ) : (
              <Link href={roomLink} className="block mt-3">
                <div className="relative rounded-lg overflow-hidden border border-white/5 bg-slate-900/50 aspect-video w-full">
                  <Image
                    src={post.imageUrl}
                    alt={post.title || "Post content"}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </Link>
            ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-4 w-full">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 group/btn transition-colors cursor-pointer ${isLiked ? "text-pink-500" : "text-slate-400 hover:text-pink-500"}`}
            >
              <div
                className={`p-1.5 rounded-full ${isLiked ? "bg-pink-500/10" : "group-hover/btn:bg-pink-500/10"} transition-colors`}
              >
                <Heart
                  size={18}
                  className={isLiked ? "fill-pink-500" : "group-hover/btn:scale-110 transition-transform"}
                />
              </div>
              <span className="text-sm font-medium">{likesCount}</span>
            </button>
            <button
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors group/btn cursor-pointer"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-blue-500/10 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="text-sm font-medium">{commentsCount}</span>
            </button>
            <div className="flex-1"></div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-slate-400 hover:text-green-400 transition-colors group/btn cursor-pointer"
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-green-500/10 transition-colors">
                <Share2 size={18} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className={`${isDetail ? "bg-transparent p-0 mt-4" : "bg-slate-900/30 border-t border-white/5 p-4"}`}>
          <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Yorum yap..."
              className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !newComment.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg p-2 disabled:opacity-50"
            >
              <Check size={18} />
            </button>
          </form>

          <div className="space-y-3">
            {loadingComments ? (
              <div className="flex justify-center p-2 text-slate-500 text-sm">Yükleniyor...</div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                    {comment.userPhoto ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={comment.userPhoto}
                          alt={comment.userName}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                    ) : (
                      <User size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{comment.userName}</span>
                      <span className="text-xs text-slate-500">{formatTime(comment.createdAt)}</span>
                    </div>
                    <p className="text-slate-300">{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 text-sm py-2">Henüz yorum yok. İlk yorumu sen yap!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
