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

  // We'll use this to navigate to the room structure
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
      fetchComments(); // Refresh comments
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

  if (isDeleting) return null; // Or show loading state

  return (
    <div
      className={`transition-all duration-300 ${
        isDetail
          ? "bg-slate-900/40 flex flex-col" 
          : "bg-slate-800 rounded-xl border border-white/10 overflow-hidden shadow-lg hover:shadow-xl hover:border-white/20 group relative"
      }`}
    >
      <div className={isDetail ? "p-6 md:p-8" : "p-4"}>
        {/* Header - Only show in feed/list view, Topic page has its own unified header */}
        {!isDetail && (
          <div className="flex items-center justify-between mb-5">
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
        )}

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
              <div
                className="relative rounded-lg overflow-hidden border border-white/5 bg-slate-900/50 w-full mt-3"
                style={{ maxHeight: "80vh" }}
              >
                <Image
                  src={post.imageUrl}
                  alt={post.title || "Post content"}
                  width={800}
                  height={600}
                  className="w-full h-auto object-contain"
                  sizes="(max-width: 768px) 100vw, 800px"
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
        <div className={`${isDetail ? "bg-slate-950 p-6 md:p-8 border-t border-white/10" : "bg-slate-900/30 border-t border-white/5 p-4"}`}>
          <div className="mb-6">
            <h4 className="text-lg font-bold text-white mb-4">Yanıtlar ({commentsCount})</h4>
            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-3">
              {(replyingTo || editingComment) && (
                <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    {replyingTo ? (
                      <>
                        <Reply size={14} className="text-purple-400" />
                        <span><strong className="text-purple-400">{replyingTo.userName}</strong> kullanıcısına yanıt veriyorsun</span>
                      </>
                    ) : (
                      <>
                        <Edit2 size={14} className="text-blue-400" />
                        <span>Yorumu düzenliyorsun</span>
                      </>
                    )}
                  </div>
                  <button type="button" onClick={cancelReplyOrEdit} className="p-1 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-white/10 overflow-hidden">
                  {user?.photoURL ? (
                    <Image src={user.photoURL} alt="User" width={40} height={40} className="object-cover" />
                  ) : (
                    <User size={20} className="text-slate-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={editingComment ? "Yorumu güncelle..." : "Bu konuya yanıt ver..."}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-4 py-2 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <span className="hidden sm:inline">{editingComment ? "Güncelle" : "Gönder"}</span>
                  {editingComment ? <Check size={16} /> : <Send size={16} />}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {loadingComments ? (
              <div className="flex justify-center p-2 text-slate-500 text-sm">Yükleniyor...</div>
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
              <div className="text-center text-slate-500 text-sm py-2">Henüz yorum yok. İlk yorumu sen yap!</div>
            )}
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5 group/comment">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
          {comment.userPhoto ? (
            <div className="relative w-full h-full">
              <Image src={comment.userPhoto} alt={comment.userName} fill className="object-cover" sizes="40px" />
            </div>
          ) : (
            <User size={20} className="text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{comment.userName}</span>
              <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {formatTime(comment.createdAt)}
              </span>
              {comment.isEdited && <span className="text-[10px] text-slate-500">(Düzenlendi)</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReplyClick(comment)}
                className="text-slate-500 hover:text-purple-400 transition-colors text-xs font-medium opacity-0 group-hover/comment:opacity-100 flex items-center gap-1 cursor-pointer"
              >
                <Reply size={12} />
                Yanıtla
              </button>

              {user?.uid === comment.userId && (
                <div className="relative">
                  <button
                    onClick={() => setActiveCommentMenu(activeCommentMenu === comment.id ? null : comment.id)}
                    className="text-slate-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 opacity-0 group-hover/comment:opacity-100 cursor-pointer"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {activeCommentMenu === comment.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveCommentMenu(null)}></div>
                      <div className="absolute right-0 top-full mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 w-32 py-1 overflow-hidden">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors text-left cursor-pointer"
                        >
                          <Edit2 size={14} />
                          <span>Düzenle</span>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={loadingActionId === comment.id}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left disabled:opacity-50 cursor-pointer"
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

          {comment.replyToUser && (
            <div className="text-xs text-purple-400 font-medium mb-1 flex items-center gap-1">
              <Reply size={12} />
              {comment.replyToUser}
            </div>
          )}
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap break-words">{comment.text}</p>
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-4 md:ml-10 border-l border-white/5 pl-4 space-y-3 mt-1">
          {displayedReplies.map((reply) => (
            <CommentItem
              key={reply.id}
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
          ))}
          {replies.length > 3 && !showAllReplies && (
            <button
              onClick={() => setShowAllReplies(true)}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold py-1 px-3 rounded-lg hover:bg-purple-500/10 transition-all flex items-center gap-2 w-fit"
            >
              <div className="w-1 h-1 rounded-full bg-purple-500"></div>
              {replies.length - 3} yanıtı daha göster...
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
