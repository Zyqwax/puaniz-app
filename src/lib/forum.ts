export type ForumCategory = { slug: string; name: string; description: string; position: number; adminOnly: boolean; count: number };
export type ForumTopic = {
  id: string; userId: string; title: string; body: string; imageUrl: string | null;
  userName: string; userPhoto: string | null; role: string; categorySlug: string; categoryName: string;
  kind: string; pinned: boolean; locked: boolean; solutionId: string | null; hidden: boolean;
  createdAt: string; lastActivityAt: string; commentsCount: number; likesCount: number;
  following: boolean; bookmarked: boolean; unread: boolean; likedByMe: boolean;
  lastAuthor: string | null;
};
export type ForumReply = { id: string; userId: string; userName: string; userPhoto: string | null; role: string; body: string; replyToId: string | null; replyToUser: string | null; quote: string | null; likesCount:number; likedByMe:boolean; isEdited: boolean; createdAt: string };
export type ForumFilter = { category?: string; q?: string; tab?: string; tag?: string; page?: number };
export const forumTabs = [{ key: 'activity', label: 'Son etkinlik' }, { key: 'new', label: 'Yeni konular' }, { key: 'unanswered', label: 'Yanıtlanmamış' }, { key: 'solved', label: 'Çözüldü' }, { key: 'unread', label: 'Okunmamış' }];
export const roleLabels: Record<string, string> = { student: 'Öğrenci', teacher: 'Öğretmen', principal: 'Okul müdürü', admin: 'Yönetici' };
export function forumTime(value: string) { return new Date(value).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
