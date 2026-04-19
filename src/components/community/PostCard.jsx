import React, { useState, useEffect, useCallback } from "react";
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
  Send,
  Edit2,
  Reply,
  Image as ImageIcon,
  MessageSquare
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toggleLike, addComment, getComments, deletePost, editComment, deleteComment } from "../../services/communityService";

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

  // New comment states
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [activeCommentMenu, setActiveCommentMenu] = useState(null);

  const roomLink = `/dashboard/community/${post.id}`;

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const fetchedComments = await getComments(post.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  }, [post.id]);

  useEffect(() => {
    if (post.likes) {
      setIsLiked(post.likes.includes(user.uid));
      setLikesCount(post.likes.length);
    }
    setCommentsCount(post.commentsCount || 0);

    if (isDetail) {
      fetchComments();
    }
  }, [post, user.uid, isDetail, fetchComments]);

  const handleLike = async () => {
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      await toggleLike(post.id, user.uid, previousLiked);
    } catch (error) {
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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (editingComment) {
      setSubmittingComment(true);
      try {
        await editComment(post.id, editingComment.id, newComment);
        setEditingComment(null);
        setNewComment("");
        fetchComments();
      } catch (error) {
        console.error("Error editing comment:", error);
      } finally {
        setSubmittingComment(false);
      }
      return;
    }

    setSubmittingComment(true);
    try {
      await addComment(post.id, newComment, user, replyingTo?.id, replyingTo?.userName);
      setNewComment("");
      setReplyingTo(null);
      setCommentsCount((prev) => prev + 1);
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/dashboard/community/${post.id}`;
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

  const handleEditComment = (comment) => {
    setEditingComment({ id: comment.id, text: comment.text });
    setNewComment(comment.text);
    setReplyingTo(null);
    setActiveCommentMenu(null);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Bu yorumu silmek istediğinden emin misin?")) return;
    setLoadingActionId(commentId);
    try {
        await deleteComment(post.id, commentId);
        setCommentsCount((prev) => Math.max(0, prev - 1));
        fetchComments();
    } catch(err) {
        console.error("Error deleting comment:", err);
    } finally {
        setLoadingActionId(null);
        setActiveCommentMenu(null);
    }
  };

  const handleReplyClick = (comment) => {
    setReplyingTo({ id: comment.id, userName: comment.userName });
    setEditingComment(null);
    setNewComment("");
    // scroll to bottom to see input
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };
  
  const cancelReplyOrEdit = () => {
    setReplyingTo(null);
    setEditingComment(null);
    setNewComment("");
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

  if (isDeleting) return null;

  return (
    <div
      className={`transition-all duration-500 w-full ${
        isDetail
          ? "bg-slate-900/40 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative" 
          : "glass-card p-5 group relative"
      }`}
    >
      {/* Detail View Hero Background styling */}
      {isDetail && (
        <>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        </>
      )}

      <div className={`${isDetail ? "p-6 md:p-10" : "p-0"} relative z-10`}>
        
        {/* Post Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`${isDetail ? "w-14 h-14 rounded-2xl" : "w-10 h-10 rounded-xl"} bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shadow-lg shrink-0`}
            >
              {post.userPhoto ? (
                <div className="relative w-full h-full">
                  <Image src={post.userPhoto} alt={post.userName} fill className="object-cover" sizes={isDetail ? "56px" : "40px"} />
                </div>
              ) : (
                <User size={isDetail ? 24 : 20} className="text-slate-400" />
              )}
            </div>
            <div>
              {isDetail ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base md:text-lg">{post.userName}</span>
                  {isOwner && <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-0.5 rounded-full border border-purple-500/20 font-bold uppercase tracking-wider">Yazar</span>}
                </div>
              ) : (
                <Link href={roomLink} className="font-bold text-white text-sm hover:text-purple-400 transition-colors">
                  {post.userName}
                </Link>
              )}
              <div className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                <Clock size={12} className="text-slate-500" />
                {formatTime(post.createdAt)}
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-slate-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 bg-slate-800/50 border border-white/5 cursor-pointer"
              >
                <MoreHorizontal size={20} />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 w-36 py-1 overflow-hidden">
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                    >
                      <Trash2 size={16} />
                      <span>Konuyu Sil</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          {post.title &&
            (isDetail ? (
              <h1 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight tracking-tight">{post.title}</h1>
            ) : (
              <Link href={roomLink}>
                <h3 className="text-lg font-bold text-white mb-2 hover:text-purple-400 transition-colors">
                  {post.title}
                </h3>
              </Link>
            ))}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 cursor-pointer hover:bg-purple-500/20 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    const event = new CustomEvent("community-tag-click", { detail: tag.startsWith("#") ? tag : tag });
                    window.dispatchEvent(event);
                  }}
                >
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          )}

          {/* Text Content */}
          <p
            className={`${isDetail ? "text-lg text-slate-200" : "text-sm text-slate-300 line-clamp-3"} leading-relaxed whitespace-pre-wrap mb-6`}
          >
            {post.text.split(/(#[a-zA-Z0-9ığüşöçİĞÜŞÖÇ]+)/g).map((part, index) => {
              if (part.startsWith("#")) {
                return (
                  <span
                    key={index}
                    className="text-purple-400 hover:text-purple-300 font-bold cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
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

          {/* Image Content */}
          {post.imageUrl &&
            (isDetail ? (
              <div
                className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-900/80 w-full mt-6 shadow-2xl"
              >
                {/* Blurred background for image */}
                <div 
                  className="absolute inset-0 opacity-30 blur-2xl scale-110" 
                  style={{ backgroundImage: `url(${post.imageUrl})`, backgroundPosition: 'center', backgroundSize: 'cover' }} 
                />
                <div className="relative flex justify-center w-full" style={{ maxHeight: "70vh" }}>
                  <img
                    src={post.imageUrl}
                    alt={post.title || "Post content"}
                    className="w-auto h-auto max-h-[70vh] object-contain rounded-xl"
                  />
                </div>
              </div>
            ) : (
              <Link href={roomLink} className="block mt-4">
                <div className="relative rounded-xl overflow-hidden border border-white/5 bg-slate-900/50 aspect-video w-full group-hover:border-white/10 transition-colors">
                  <Image
                    src={post.imageUrl}
                    alt={post.title || "Post content"}
                    fill
                    className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </Link>
            ))}
        </div>

        {/* Action Bar (Likes, Comments, Share) */}
        <div className={`flex items-center justify-between ${isDetail ? "pt-6 border-t border-white/5" : "pt-4 border-t border-white/5"}`}>
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 group/btn transition-colors cursor-pointer px-4 py-2 rounded-xl border ${
                isLiked 
                  ? "bg-pink-500/10 border-pink-500/20 text-pink-400" 
                  : "bg-slate-800/50 hover:bg-slate-800 border-white/5 hover:border-pink-500/20 text-slate-400 hover:text-pink-400"
              }`}
            >
              <Heart
                size={18}
                className={isLiked ? "fill-pink-500" : "group-hover/btn:scale-110 transition-transform"}
              />
              <span className="text-sm font-bold">{likesCount}</span>
            </button>
            
            <button
              onClick={handleToggleComments}
              className={`flex items-center gap-2 text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-blue-400 border border-white/5 hover:border-blue-500/20 px-4 py-2 rounded-xl transition-all group/btn cursor-pointer`}
            >
              <MessageCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
              <span className="text-sm font-bold">{commentsCount}</span>
            </button>
            
            <div className="flex-1"></div>
            
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 px-4 py-2 rounded-xl transition-all group/btn cursor-pointer"
            >
              <Share2 size={18} className="group-hover/btn:scale-110 transition-transform" />
              <span className="hidden sm:inline text-sm font-bold">Paylaş</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="bg-slate-900/60 border-t border-white/5">
          <div className={`${isDetail ? "p-6 md:p-10" : "p-4"}`}>
            
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-400" />
                Yanıtlar <span className="text-slate-500 text-sm bg-slate-800 px-2 py-0.5 rounded-lg">{commentsCount}</span>
              </h4>
            </div>

            {/* Comment Input Area */}
            <div className="mb-8">
              <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
                {(replyingTo || editingComment) && (
                  <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      {replyingTo ? (
                        <>
                          <Reply size={16} className="text-blue-400" />
                          <span className="text-sm text-blue-200">
                            <strong className="text-white font-bold">{replyingTo.userName}</strong> kullanıcısına yanıt veriyorsun
                          </span>
                        </>
                      ) : (
                        <>
                          <Edit2 size={16} className="text-blue-400" />
                          <span className="text-sm text-blue-200">Yorumu düzenliyorsun</span>
                        </>
                      )}
                    </div>
                    <button type="button" onClick={cancelReplyOrEdit} className="p-1 text-blue-300 hover:text-white rounded-full hover:bg-blue-500/20 transition-colors cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0 border border-white/10 shadow-lg overflow-hidden">
                    {user?.photoURL ? (
                      <Image src={user.photoURL} alt="User" width={48} height={48} className="object-cover" />
                    ) : (
                      <User size={24} className="text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 relative group">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCommentSubmit(e);
                        }
                      }}
                      placeholder={editingComment ? "Yorumu güncelle..." : "Bu konuya düşünceni yaz (Enter ile gönder)..."}
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all resize-y min-h-[56px] shadow-inner"
                      rows={1}
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="absolute right-3 bottom-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-2 disabled:opacity-50 disabled:grayscale transition-colors flex items-center justify-center shadow-lg shadow-blue-900/30 cursor-pointer"
                    >
                      {editingComment ? <Check size={18} /> : <Send size={18} className="ml-0.5" />}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Comments List */}
            <div className="space-y-5">
              {loadingComments ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : comments.length > 0 ? (
                comments
                  .filter((c) => !c.replyToId)
                  .map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      allComments={comments}
                      user={user}
                      formatTime={formatTime}
                      handleReplyClick={handleReplyClick}
                      handleEditComment={handleEditComment}
                      handleDeleteComment={handleDeleteComment}
                      activeCommentMenu={activeCommentMenu}
                      setActiveCommentMenu={setActiveCommentMenu}
                      loadingActionId={loadingActionId}
                    />
                  ))
              ) : (
                <div className="text-center bg-slate-900/50 rounded-2xl border border-white/5 py-12 px-4">
                  <MessageSquare size={32} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-white font-bold text-lg mb-1">İlk Yorumu Sen Yap</p>
                  <p className="text-slate-500 text-sm">Bu konuda henüz bir fikir belirtilmemiş.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CommentItem = ({
  comment,
  allComments,
  user,
  formatTime,
  handleReplyClick,
  handleEditComment,
  handleDeleteComment,
  activeCommentMenu,
  setActiveCommentMenu,
  loadingActionId,
}) => {
  const [showAllReplies, setShowAllReplies] = useState(false);
  const replies = allComments.filter((c) => c.replyToId === comment.id);
  const displayedReplies = showAllReplies ? replies : replies.slice(0, 3);
  const isCommentOwner = user?.uid === comment.userId;

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex gap-4 p-5 rounded-2xl transition-colors relative group/comment ${isCommentOwner ? "bg-blue-900/10 border border-blue-500/10" : "bg-slate-800/40 border border-white/5 hover:bg-slate-800/60 hover:border-white/10"}`}>
        
        {/* Comment Avatar */}
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0 shadow-sm">
          {comment.userPhoto ? (
            <div className="relative w-full h-full">
              <Image src={comment.userPhoto} alt={comment.userName} fill className="object-cover" sizes="48px" />
            </div>
          ) : (
            <User size={20} className="text-slate-400" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Comment Header */}
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm md:text-base">{comment.userName}</span>
                {isCommentOwner && <span className="bg-blue-500/20 text-blue-300 text-[9px] px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase">Sen</span>}
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Clock size={10} />
                  {formatTime(comment.createdAt)}
                </span>
                {comment.isEdited && <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">Düzenlendi</span>}
              </div>
            </div>

            {/* Comment Actions (Hover) */}
            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover/comment:opacity-100 transition-opacity">
              <button
                onClick={() => handleReplyClick(comment)}
                className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Yanıtla"
              >
                <Reply size={14} />
                <span className="text-xs font-bold hidden md:inline">Yanıtla</span>
              </button>

              {isCommentOwner && (
                <div className="relative">
                  <button
                    onClick={() => setActiveCommentMenu(activeCommentMenu === comment.id ? null : comment.id)}
                    className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                  {activeCommentMenu === comment.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveCommentMenu(null)}></div>
                      <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 w-32 py-1 overflow-hidden">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5 transition-colors text-left cursor-pointer"
                        >
                          <Edit2 size={14} />
                          <span>Düzenle</span>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={loadingActionId === comment.id}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>{loadingActionId === comment.id ? "Siliniyor..." : "Sil"}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reply Target Badge */}
          {comment.replyToUser && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/10 text-xs font-bold text-blue-300 mb-2">
              <Reply size={12} className="rotate-180" />
              {comment.replyToUser}
            </div>
          )}
          
          {/* Comment Text */}
          <p className="text-slate-200 text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap break-words">{comment.text}</p>
        </div>
      </div>

      {/* Nested Replies */}
      {replies.length > 0 && (
        <div className="ml-6 md:ml-12 border-l-2 border-white/5 pl-4 md:pl-6 space-y-4 mt-1 relative">
          {displayedReplies.map((reply) => (
            <div key={reply.id} className="relative">
              {/* Horizontal connecting line */}
              <div className="absolute -left-[18px] md:-left-[26px] top-6 w-4 md:w-6 h-0.5 bg-white/5 rounded-r" />
              <CommentItem
                comment={reply}
                allComments={allComments}
                user={user}
                formatTime={formatTime}
                handleReplyClick={handleReplyClick}
                handleEditComment={handleEditComment}
                handleDeleteComment={handleDeleteComment}
                activeCommentMenu={activeCommentMenu}
                setActiveCommentMenu={setActiveCommentMenu}
                loadingActionId={loadingActionId}
              />
            </div>
          ))}
          {replies.length > 3 && !showAllReplies && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold py-1.5 px-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-all flex items-center gap-2 w-fit mt-2 cursor-pointer"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              {replies.length - 3} yanıtı daha göster...
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
