"use server";

import { and, asc, count, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { posts, comments, postTags, postLikes, forumReplyLikes, forumCategories, forumUserTopics, forumReports, forumModerationLog, forumNotifications } from '@/server/db/schema';
import { users } from '@/server/db/auth-schema';
import { requireUser } from '@/server/session';
import { isSuperAdminEmail, requireSuperAdmin } from '@/server/school-auth';
import type { ForumCategory, ForumFilter, ForumTopic, ForumReply } from '@/lib/forum';

const PAGE_SIZE = 20;
const uuid = (id: string) => { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new Error('Geçersiz kayıt.'); return id; };
const clean = (value: string, min: number, max: number) => { const v = value.trim(); if (v.length < min || v.length > max) throw new Error(`İçerik ${min}–${max} karakter olmalı.`); return v; };
const authorRole = sql<string>`coalesce((select role from school_members where user_id = users.id limit 1), 'student')`;
const photo = sql<string | null>`coalesce((select avatar_url from user_profiles where user_id = users.id), users.image)`;
const replyCount = sql<number>`(select count(*)::int from comments where post_id = posts.id)`;
const likeCount = sql<number>`(select count(*)::int from post_likes where post_id = posts.id)`;
function plain<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
async function topicForWrite(id: string, tx: typeof db = db) {
  const [topic] = await tx.select().from(posts).where(eq(posts.id, uuid(id))).limit(1);
  if (!topic || topic.hidden) throw new Error('Konu bulunamadı.');
  return topic;
}
async function checkRate(userId: string, tx: typeof db) {
  // Serialize writes per account; simultaneous requests cannot bypass the cooldown.
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
  const recent = await tx.execute(sql`select 1 from posts where user_id=${userId} and created_at > now()-interval '10 seconds' union all select 1 from comments where user_id=${userId} and created_at > now()-interval '10 seconds' limit 1`);
  if (recent.length) throw new Error('Yeni bir mesaj göndermeden önce birkaç saniye bekle.');
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  await requireUser();
  const categories = await db.select({ slug: forumCategories.slug, name: forumCategories.name, description: forumCategories.description, position: forumCategories.position, adminOnly: forumCategories.adminOnly, count: sql<number>`(select count(*)::int from posts where category_slug = forum_categories.slug and not hidden)` }).from(forumCategories).orderBy(asc(forumCategories.position));
  return categories;
}

export async function getForumTopics(input: ForumFilter = {}) {
  const user = await requireUser();
  const page = Math.max(1, Math.min(100000, Math.floor(Number(input.page) || 1)));
  const where = [eq(posts.hidden, false)];
  if (input.category) where.push(eq(posts.categorySlug, input.category.slice(0, 80)));
  if (input.q?.trim()) {
    const q = input.q.trim().slice(0, 160);
    where.push(sql`(to_tsvector('simple', ${posts.title} || ' ' || ${posts.body}) @@ websearch_to_tsquery('simple', ${q}) or ${users.name} ilike ${'%'+q.replace(/[%_\\]/g, '\\$&')+'%'} or exists(select 1 from post_tags where post_id=posts.id and tag ilike ${'%'+q.replace(/[%_\\]/g, '\\$&')+'%'}))`);
  }
  if (input.tag) where.push(sql`exists(select 1 from post_tags where post_id=posts.id and tag=${input.tag.slice(0, 50)})`);
  if (input.tab === 'unanswered') where.push(sql`${replyCount} = 0`);
  if (input.tab === 'solved') where.push(sql`${posts.solutionId} is not null`);
  if (input.tab === 'mine') where.push(eq(posts.userId, user.id));
  if (input.tab === 'following') where.push(sql`exists(select 1 from forum_user_topics where post_id=posts.id and user_id=${user.id} and following)`);
  if (input.tab === 'bookmarks') where.push(sql`exists(select 1 from forum_user_topics where post_id=posts.id and user_id=${user.id} and bookmarked)`);
  if (input.tab === 'unread') where.push(sql`not exists(select 1 from forum_user_topics where post_id=posts.id and user_id=${user.id} and read_at >= posts.last_activity_at)`);
  const condition = and(...where);
  const [total] = await db.select({ count: count() }).from(posts).innerJoin(users, eq(users.id, posts.userId)).where(condition);
  const pages = Math.max(1, Math.ceil(total.count / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = await db.select({ ...topicSelection(user.id), categoryName: forumCategories.name }).from(posts).innerJoin(users, eq(users.id, posts.userId)).innerJoin(forumCategories, eq(forumCategories.slug, posts.categorySlug)).where(condition).orderBy(desc(posts.pinned), input.tab === 'new' ? desc(posts.createdAt) : desc(posts.lastActivityAt), desc(posts.id)).limit(PAGE_SIZE).offset((current - 1) * PAGE_SIZE);
  return { topics: plain(rows.map(r => ({ ...r, role: isSuperAdminEmail(r.email) ? 'admin' : r.role, email: undefined }))) as unknown as ForumTopic[], total: total.count, page: current, pages };
}

function topicSelection(userId: string) {
  return { id: posts.id, userId: posts.userId, title: posts.title, body: posts.body, imageUrl: posts.imageUrl, userName: users.name, userPhoto: photo, email: users.email, role: authorRole, categorySlug: posts.categorySlug, kind: posts.kind, pinned: posts.pinned, locked: posts.locked, hidden: posts.hidden, solutionId: posts.solutionId, createdAt: posts.createdAt, lastActivityAt: posts.lastActivityAt, commentsCount: replyCount, likesCount: likeCount,
    following: sql<boolean>`exists(select 1 from forum_user_topics where post_id=posts.id and user_id=${userId} and following)`,
    bookmarked: sql<boolean>`exists(select 1 from forum_user_topics where post_id=posts.id and user_id=${userId} and bookmarked)`,
    unread: sql<boolean>`not exists(select 1 from forum_user_topics where post_id=posts.id and user_id=${userId} and read_at>=posts.last_activity_at)`,
    likedByMe: sql<boolean>`exists(select 1 from post_likes where post_id=posts.id and user_id=${userId})`,
    lastAuthor: sql<string | null>`(select u.name from comments c join users u on u.id=c.user_id where c.post_id=posts.id order by c.created_at desc limit 1)`,
  };
}

export async function getForumTopic(id: string, page = 1, replyId?: string) {
  const user = await requireUser(); uuid(id);
  const [topic] = await db.select({ ...topicSelection(user.id), categoryName: forumCategories.name }).from(posts).innerJoin(users, eq(users.id, posts.userId)).innerJoin(forumCategories, eq(forumCategories.slug, posts.categorySlug)).where(and(eq(posts.id, id), eq(posts.hidden, false))).limit(1);
  if (!topic) return null;
  const [state] = await db.select().from(forumUserTopics).where(and(eq(forumUserTopics.userId, user.id), eq(forumUserTopics.postId, id)));
  const [firstUnread] = await db.select({ id: comments.id, createdAt: comments.createdAt }).from(comments).where(and(eq(comments.postId, id), state?.readAt ? sql`${comments.createdAt} > ${state.readAt.toISOString()}::timestamptz` : undefined)).orderBy(asc(comments.createdAt), asc(comments.id)).limit(1);
  let target = Math.max(1, Math.floor(Number(page) || 1));
  if (page === -1 && firstUnread) { const [before] = await db.select({ value: count() }).from(comments).where(and(eq(comments.postId, id), sql`(${comments.createdAt}, ${comments.id}) < (${firstUnread.createdAt.toISOString()}::timestamptz, ${firstUnread.id}::uuid)`)); target = Math.floor(before.value / PAGE_SIZE) + 1; }
  if (replyId) {
    uuid(replyId);
    const [anchor] = await db.select({ createdAt: comments.createdAt, id: comments.id }).from(comments).where(and(eq(comments.postId,id),eq(comments.id,replyId)));
    if (anchor) { const [before] = await db.select({ value:count() }).from(comments).where(and(eq(comments.postId,id),sql`(${comments.createdAt}, ${comments.id}) < (${anchor.createdAt.toISOString()}::timestamptz, ${anchor.id}::uuid)`)); target=Math.floor(before.value/PAGE_SIZE)+1; }
  }
  const pages = Math.max(1, Math.ceil(topic.commentsCount/PAGE_SIZE)); target = page === -1 && !firstUnread && !replyId ? pages : Math.min(target, pages);
  const replies = await db.select({ id: comments.id, userId: comments.userId, userName: users.name, userPhoto: photo, email: users.email, role: authorRole, body: comments.body, replyToId: comments.replyToId, isEdited: comments.isEdited, createdAt: comments.createdAt,
    likesCount: sql<number>`(select count(*)::int from forum_reply_likes where comment_id=${comments.id})`,
    likedByMe: sql<boolean>`exists(select 1 from forum_reply_likes where comment_id=${comments.id} and user_id=${user.id})`,
    replyToUser: sql<string | null>`(select u.name from comments c join users u on u.id=c.user_id where c.id=${comments.replyToId})`, quote: sql<string | null>`(select left(body, 300) from comments where id=${comments.replyToId})`,
  }).from(comments).innerJoin(users, eq(users.id, comments.userId)).where(eq(comments.postId, id)).orderBy(asc(comments.createdAt), asc(comments.id)).limit(PAGE_SIZE).offset((target-1)*PAGE_SIZE);
  return plain({ topic: { ...topic, email: undefined, role: isSuperAdminEmail(topic.email) ? 'admin' : topic.role }, replies: replies.map(r => ({ ...r, role: isSuperAdminEmail(r.email) ? 'admin' : r.role, email: undefined })), page: target, pages, firstUnreadId: firstUnread?.id ?? null, viewerId: user.id, isAdmin: isSuperAdminEmail(user.email), tags: (await db.select().from(postTags).where(eq(postTags.postId, id))).map(t => t.tag) }) as unknown as { topic: ForumTopic; replies: ForumReply[]; page: number; pages: number; firstUnreadId: string | null; viewerId: string; isAdmin: boolean; tags: string[] };
}

export async function markForumTopicRead(id: string, lastReplyId?: string) {
  const user = await requireUser();
  const topic = await topicForWrite(id);
  let readAt = topic.createdAt;
  if (lastReplyId) {
    const [reply] = await db.select({ createdAt:comments.createdAt }).from(comments).where(and(eq(comments.id,uuid(lastReplyId)),eq(comments.postId,id)));
    if (!reply) return;
    readAt = reply.createdAt;
  }
  await db.insert(forumUserTopics).values({ userId:user.id, postId:id, readAt }).onConflictDoUpdate({ target:[forumUserTopics.userId,forumUserTopics.postId], set:{ readAt:sql`greatest(${forumUserTopics.readAt}, ${readAt.toISOString()}::timestamptz)` } });
}

export async function createForumTopic(input: { title: string; body: string; category: string; kind: string; tags: string[]; imageUrl?: string | null }) {
  const user = await requireUser();
  const title = clean(input.title, 5, 180), body = clean(input.body, 10, 20000);
  const [category] = await db.select().from(forumCategories).where(eq(forumCategories.slug, input.category));
  if (!category || (category.adminOnly && !isSuperAdminEmail(user.email))) throw new Error('Bu kategoride konu açamazsın.');
  if (!['question','discussion','announcement'].includes(input.kind) || (input.kind === 'announcement' && !isSuperAdminEmail(user.email))) throw new Error('Geçersiz konu türü.');
  if (input.imageUrl && !/^https:\/\/res\.cloudinary\.com\//.test(input.imageUrl)) throw new Error('Geçersiz görsel adresi.');
  if (!Array.isArray(input.tags) || input.tags.length > 4) throw new Error('En fazla 4 etiket ekleyebilirsin.');
  const tags = [...new Set(input.tags.map(t => clean(t.replace(/^#/, ''), 1, 30)))].slice(0,4);
  const id = await db.transaction(async tx => {
    await checkRate(user.id, tx as unknown as typeof db);
    const [post] = await tx.insert(posts).values({ userId: user.id, title, body, categorySlug: category.slug, kind: category.adminOnly ? 'announcement' : input.kind, imageUrl: input.imageUrl || null }).returning({ id: posts.id });
    if (tags.length) await tx.insert(postTags).values(tags.map(tag => ({ postId: post.id, tag })));
    await tx.insert(forumUserTopics).values({ userId: user.id, postId: post.id, following: true });
    return post.id;
  });
  return { id };
}

export async function replyForumTopic(id: string, body: string, replyToId?: string | null) {
  const user = await requireUser(); clean(body, 1, 15000); uuid(id);
  return db.transaction(async tx => {
    await checkRate(user.id, tx as unknown as typeof db);
    await tx.execute(sql`select id from posts where id=${id}::uuid for update`);
    const topic = await topicForWrite(id, tx as unknown as typeof db);
    if (topic.locked) throw new Error('Bu konu yeni yanıtlara kapalı.');
    let quoteUser: string | null = null;
    if (replyToId) { const [parent] = await tx.select().from(comments).where(and(eq(comments.id, uuid(replyToId)), eq(comments.postId, id))); if (!parent) throw new Error('Alıntılanan yanıt bulunamadı.'); quoteUser = parent.userId; }
    const [reply] = await tx.insert(comments).values({ postId: id, userId: user.id, body: body.trim(), replyToId: replyToId || null }).returning();
    await tx.update(posts).set({ lastActivityAt: reply.createdAt }).where(eq(posts.id, id));
    const followers = await tx.select({ userId: forumUserTopics.userId }).from(forumUserTopics).where(and(eq(forumUserTopics.postId, id), eq(forumUserTopics.following, true)));
    const recipients = [...new Set([...followers.map(f => f.userId), ...(quoteUser ? [quoteUser] : [])])].filter(uid => uid !== user.id);
    if (recipients.length) await tx.insert(forumNotifications).values(recipients.map(userId => ({ userId, postId: id, commentId: reply.id, message: `${user.name}, “${topic.title}” konusuna yanıt yazdı.` })));
    return { id: reply.id };
  });
}

export async function editForumContent(id: string, body: string, isTopic = false, title?: string) {
  const user = await requireUser(); uuid(id); const text = clean(body, isTopic ? 10 : 1, isTopic ? 20000 : 15000);
  if (isTopic) {
    const topic = await topicForWrite(id); if (topic.userId !== user.id || topic.locked) throw new Error('Düzenleme yetkin yok.');
    await db.update(posts).set({ body: text, ...(title ? { title: clean(title,5,180) } : {}) }).where(and(eq(posts.id,id),eq(posts.userId,user.id)));
  } else {
    const [reply] = await db.select().from(comments).where(eq(comments.id,id)); if (!reply || reply.userId !== user.id) throw new Error('Düzenleme yetkin yok.');
    if ((await topicForWrite(reply.postId)).locked) throw new Error('Konu kilitli.');
    await db.update(comments).set({ body: text, isEdited: true }).where(and(eq(comments.id,id),eq(comments.userId,user.id)));
  }
}

export async function deleteForumContent(id: string, isTopic = false) {
  const user = await requireUser(); uuid(id);
  if (isTopic) {
    await db.transaction(async tx => {
      await tx.execute(sql`select id from posts where id=${id}::uuid for update`);
      const topic = await topicForWrite(id, tx as unknown as typeof db);
      if (topic.userId !== user.id) throw new Error('Silme yetkin yok.');
      const [other] = await tx.select({ id: comments.id }).from(comments).where(and(eq(comments.postId,id),ne(comments.userId,user.id))).limit(1);
      if (other || topic.locked) throw new Error('Yanıtlanmış veya kilitli konuları yalnızca yönetim kaldırabilir.');
      await tx.delete(posts).where(and(eq(posts.id,id),eq(posts.userId,user.id)));
    });
  } else {
    const [reply] = await db.select().from(comments).where(eq(comments.id,id)); if (!reply || reply.userId !== user.id) throw new Error('Silme yetkin yok.');
    if ((await topicForWrite(reply.postId)).locked) throw new Error('Konu kilitli.');
    await db.transaction(async tx => { await tx.update(posts).set({ solutionId: null }).where(eq(posts.solutionId,id)); await tx.delete(comments).where(and(eq(comments.id,id),eq(comments.userId,user.id))); });
  }
}

export async function setForumTopicState(id: string, key: 'following' | 'bookmarked', value: boolean) {
  const user = await requireUser(); await topicForWrite(id);
  if (!['following','bookmarked'].includes(key) || typeof value !== 'boolean') throw new Error('Geçersiz tercih.');
  await db.insert(forumUserTopics).values({ userId: user.id, postId: id, [key]: value }).onConflictDoUpdate({ target: [forumUserTopics.userId, forumUserTopics.postId], set: { [key]: value } });
}

export async function likeForumTopic(id: string, liked: boolean) {
  const user = await requireUser(); await topicForWrite(id);
  if (liked) await db.insert(postLikes).values({ postId: id, userId: user.id }).onConflictDoNothing();
  else await db.delete(postLikes).where(and(eq(postLikes.postId,id),eq(postLikes.userId,user.id)));
}

export async function likeForumReply(id: string, liked: boolean) {
  const user=await requireUser();
  const [reply]=await db.select({postId:comments.postId}).from(comments).where(eq(comments.id,uuid(id)));
  if(!reply)throw new Error('Yanıt bulunamadı.');
  await topicForWrite(reply.postId);
  if(liked)await db.insert(forumReplyLikes).values({commentId:id,userId:user.id}).onConflictDoNothing();
  else await db.delete(forumReplyLikes).where(and(eq(forumReplyLikes.commentId,id),eq(forumReplyLikes.userId,user.id)));
}

export async function selectForumSolution(id: string, replyId: string | null) {
  const user = await requireUser(); const topic = await topicForWrite(id);
  if ((topic.userId !== user.id && !isSuperAdminEmail(user.email)) || topic.kind !== 'question') throw new Error('Çözüm seçme yetkin yok.');
  if (replyId) { const [reply] = await db.select().from(comments).where(and(eq(comments.id, uuid(replyId)),eq(comments.postId,id))); if (!reply) throw new Error('Yanıt bulunamadı.'); }
  await db.transaction(async tx => { await tx.update(posts).set({ solutionId: replyId }).where(eq(posts.id,id)); if (replyId) { const [reply] = await tx.select().from(comments).where(eq(comments.id,replyId)); if (reply.userId !== user.id) await tx.insert(forumNotifications).values({ userId: reply.userId, postId:id, commentId:replyId, message: `“${topic.title}” konusundaki yanıtın çözüm seçildi.` }); } });
}

export async function reportForumContent(id: string, reason: string, commentId?: string) {
  const user = await requireUser(); await topicForWrite(id); clean(reason, 5, 1000);
  if (commentId) { const [reply] = await db.select().from(comments).where(and(eq(comments.id,uuid(commentId)),eq(comments.postId,id))); if (!reply) throw new Error('Yanıt bulunamadı.'); }
  const [existing] = await db.select().from(forumReports).where(and(eq(forumReports.postId,id),eq(forumReports.reporterId,user.id),eq(forumReports.resolved,false), commentId ? eq(forumReports.commentId,commentId) : sql`${forumReports.commentId} is null`)).limit(1);
  if (existing) throw new Error('Bu içerik için bildirimin zaten inceleniyor.');
  await db.insert(forumReports).values({ reporterId:user.id,postId:id,commentId:commentId || null,reason:reason.trim() });
}

export async function getForumNotifications() {
  const user = await requireUser();
  return plain(await db.select({ id:forumNotifications.id, postId:forumNotifications.postId, commentId:forumNotifications.commentId, message:forumNotifications.message, read:forumNotifications.read, createdAt:forumNotifications.createdAt }).from(forumNotifications).innerJoin(posts,eq(posts.id,forumNotifications.postId)).where(and(eq(forumNotifications.userId,user.id),eq(posts.hidden,false))).orderBy(desc(forumNotifications.createdAt)).limit(30));
}
export async function readForumNotifications() { const user = await requireUser(); await db.update(forumNotifications).set({ read:true }).where(eq(forumNotifications.userId,user.id)); }

export async function getForumModeration() {
  await requireSuperAdmin();
  const [reports, logs, topics] = await Promise.all([
    db.select({ id:forumReports.id,postId:forumReports.postId,commentId:forumReports.commentId,reason:forumReports.reason,createdAt:forumReports.createdAt,title:posts.title,body:sql<string>`coalesce((select body from comments where id=${forumReports.commentId}), ${posts.body})`,reporter:users.name }).from(forumReports).innerJoin(posts,eq(posts.id,forumReports.postId)).innerJoin(users,eq(users.id,forumReports.reporterId)).where(eq(forumReports.resolved,false)).orderBy(asc(forumReports.createdAt)).limit(100),
    db.select({ action:forumModerationLog.action,createdAt:forumModerationLog.createdAt,actor:users.name }).from(forumModerationLog).leftJoin(users,eq(users.id,forumModerationLog.actorId)).orderBy(desc(forumModerationLog.createdAt)).limit(30),
    db.select({ id:posts.id,title:posts.title,hidden:posts.hidden,pinned:posts.pinned,locked:posts.locked,categorySlug:posts.categorySlug }).from(posts).orderBy(desc(posts.lastActivityAt)).limit(100),
  ]);
  return plain({ reports,logs,topics });
}

export async function moderateForumTopic(id: string, action: 'pin'|'lock'|'hide'|'move', value: boolean | string) {
  const user = await requireSuperAdmin(); uuid(id);
  const patch: Partial<typeof posts.$inferInsert> = {};
  if (action === 'move') { const [cat] = await db.select().from(forumCategories).where(eq(forumCategories.slug,String(value))); if (!cat) throw new Error('Kategori bulunamadı.'); patch.categorySlug=cat.slug; }
  else if (['pin','lock','hide'].includes(action) && typeof value === 'boolean') { if (action === 'pin') patch.pinned=value; if (action === 'lock') patch.locked=value; if (action === 'hide') patch.hidden=value; }
  else throw new Error('Geçersiz işlem.');
  await db.transaction(async tx => { const rows=await tx.update(posts).set(patch).where(eq(posts.id,id)).returning(); if (!rows.length) throw new Error('Konu bulunamadı.'); await tx.insert(forumModerationLog).values({ actorId:user.id,postId:id,action:`${action}: ${value}` }); });
}
export async function resolveForumReport(id: string, removeReply = false) {
  const user = await requireSuperAdmin(); uuid(id);
  await db.transaction(async tx => { const [report]=await tx.select().from(forumReports).where(eq(forumReports.id,id)); if (!report) throw new Error('Bildirim bulunamadı.'); if (removeReply && report.commentId) { await tx.update(posts).set({ solutionId:null }).where(eq(posts.solutionId,report.commentId)); await tx.delete(comments).where(eq(comments.id,report.commentId)); } await tx.update(forumReports).set({resolved:true}).where(eq(forumReports.id,id)); await tx.insert(forumModerationLog).values({actorId:user.id,postId:report.postId,action:removeReply ? 'Bildirilen yanıt kaldırıldı' : 'Bildirim incelendi'}); });
}
export async function saveForumCategory(input: { slug:string; name:string; description:string; position:number; adminOnly:boolean }) {
  const user = await requireSuperAdmin();
  if (!/^[a-z0-9-]{2,50}$/.test(input.slug)) throw new Error('Kategori adresi küçük harf, rakam ve tire içermeli.');
  const values={slug:input.slug,name:clean(input.name,2,60),description:clean(input.description,5,250),position:Math.max(0,Math.floor(Number(input.position)||0)),adminOnly:Boolean(input.adminOnly)};
  await db.transaction(async tx => { await tx.insert(forumCategories).values(values).onConflictDoUpdate({target:forumCategories.slug,set:values}); await tx.insert(forumModerationLog).values({actorId:user.id,action:`Kategori güncellendi: ${values.slug}`}); });
}
