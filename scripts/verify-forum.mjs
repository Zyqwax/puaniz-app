/** Integration checks against the configured local DB. Uses isolated temporary users.
 * Session lookup is replaced only in this Node test process; actions, permissions,
 * database transactions and queries run through the production implementation.
 */
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
process.loadEnvFile('.env.local');
const root = fileURLToPath(new URL('../src/', import.meta.url));
const session = 'data:text/javascript,' + encodeURIComponent('export async function requireUser(){if(!globalThis.__forumTestUser)throw new Error("Unauthorized");return globalThis.__forumTestUser;}');
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
  if (specifier === '@/server/session' || (specifier === './session' && context.parentURL?.includes('/server/'))) return { url: session, shortCircuit: true };
  let candidate;
  if (specifier.startsWith('@/')) candidate = root + specifier.slice(2);
  else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:') && context.parentURL.includes('/src/')) candidate = fileURLToPath(new URL(specifier, context.parentURL));
  if (candidate) { for (const suffix of ['', '.ts', '/index.ts']) if (existsSync(candidate + suffix) && (candidate + suffix).endsWith('.ts')) return { url: pathToFileURL(candidate + suffix).href, shortCircuit: true }; }
  return next(specifier, context);
} });
const { db } = await import('../src/server/db/index.ts');
const { users } = await import('../src/server/db/auth-schema.ts');
const { posts, comments, forumModerationLog, forumCategories } = await import('../src/server/db/schema.ts');
const { eq, inArray } = await import('drizzle-orm');
const forum = await import('../src/server/actions/forum.ts');
const token = randomUUID();
const accounts = ['author','reader','admin'].map(name => ({ id:`forum-test-${name}-${token}`,name:`Forum test ${name}`,email:`${name}-${token}@example.invalid`,emailVerified:true }));
process.env.ADMIN_EMAILS = [process.env.ADMIN_EMAILS, accounts[2].email].filter(Boolean).join(',');
const as = index => { globalThis.__forumTestUser = accounts[index]; };
const category = `test-${token}`;
let passed = 0;
function check(label) { console.log(`✓ ${label}`); passed++; }
try {
  await db.insert(users).values(accounts);
  as(0);
  const created = await forum.createForumTopic({title:`Forum ${token}`,body:'Bu konu yalnızca otomatik doğrulama içindir.',category:'tyt',kind:'question',tags:['kontrol']});
  const id=created.id;
  check('Konu oluşturma ve kategori');
  await assert.rejects(()=>forum.createForumTopic({title:'Yetkisiz duyuru',body:'Yönetici kategorisi kontrolü.',category:'duyurular',kind:'announcement',tags:[]}));
  check('Öğrenci duyuru yayınlayamaz');
  as(1);
  await forum.setForumTopicState(id,'following',true);
  await forum.setForumTopicState(id,'bookmarked',true);
  assert.equal((await forum.getForumTopics({tab:'bookmarks',q:token})).total,1);
  const reply=await forum.replyForumTopic(id,'Örnek bir çözüm yanıtı.');
  await forum.likeForumReply(reply.id,true);
  assert.equal((await forum.getForumTopic(id)).replies[0].likesCount,1);
  await forum.likeForumReply(reply.id,false);
  await assert.rejects(()=>forum.replyForumTopic(id,'Çok hızlı ikinci yanıt.'));
  check('Takip, kaydetme ve gönderim sıklığı kontrolü');
  as(0);
  assert.ok((await forum.getForumNotifications()).some(n=>n.postId===id));
  await forum.selectForumSolution(id,reply.id);
  assert.equal((await forum.getForumTopics({tab:'solved',q:token})).total,1);
  await assert.rejects(()=>forum.deleteForumContent(id,true));
  check('Bildirim, çözüm seçme ve yanıtlanmış konuyu koruma');
  as(1);
  await assert.rejects(()=>forum.selectForumSolution(id,reply.id));
  await assert.rejects(()=>forum.editForumContent(id,'Yetkisiz konu düzenleme.',true));
  await assert.rejects(()=>forum.moderateForumTopic(id,'lock',true));
  check('Sahiplik ve yönetici yetkisi');
  await forum.reportForumContent(id,'Test bildirim gerekçesi.');
  await assert.rejects(()=>forum.reportForumContent(id,'Aynı içeriği tekrar bildirme.'));
  as(2);
  assert.ok((await forum.getForumModeration()).reports.some(r=>r.postId===id));
  await forum.moderateForumTopic(id,'lock',true);
  as(0);
  await assert.rejects(()=>forum.replyForumTopic(id,'Kilitli konu yanıt kontrolü.'));
  as(2);
  await forum.moderateForumTopic(id,'lock',false);
  await forum.moderateForumTopic(id,'hide',true);
  as(1);
  assert.equal(await forum.getForumTopic(id),null);
  assert.equal((await forum.getForumTopics({q:token})).total,0);
  check('Bildirme, moderasyon, kilitleme ve gizlilik');
  as(2);
  await forum.moderateForumTopic(id,'hide',false);
  await forum.saveForumCategory({slug:category,name:'Geçici test kategorisi',description:'Test sonunda kaldırılır.',position:99,adminOnly:false});
  await forum.moderateForumTopic(id,'move',category);
  as(0);
  assert.equal((await forum.getForumTopics({category,q:token})).total,1);
  await db.insert(posts).values(Array.from({length:24},(_,i)=>({userId:accounts[0].id,title:`Sayfalama ${token} ${i}`,body:'Geçici test içeriği',categorySlug:category})));
  const first=await forum.getForumTopics({q:token,category,page:1});
  const second=await forum.getForumTopics({q:token,category,page:2});
  assert.equal(first.topics.length,20); assert.equal(second.topics.length,5);
  assert.equal(new Set([...first.topics,...second.topics].map(t=>t.id)).size,25);
  assert.equal((await forum.getForumTopics({q:'bulunmayan-'+token})).total,0);
  check('Kategori yönetimi, taşıma, tam arama ve sayfalama');
  const detail=await forum.getForumTopic(id); assert.equal(detail.replies[0].id,reply.id);
  await forum.markForumTopicRead(id,reply.id);
  assert.equal((await forum.getForumTopics({q:`Forum ${token}`,tab:'unread'})).topics.some(t=>t.id===id),false);
  as(1); await forum.deleteForumContent(reply.id);
  as(0); assert.equal((await forum.getForumTopic(id)).topic.solutionId,null);
  check('Okuma durumu ve silinen çözümün temizlenmesi');
  // Exercise cross-page anchors and verify prefetch/read queries do not mark read.
  const rows=await db.insert(comments).values(Array.from({length:25},(_,index)=>({postId:id,userId:accounts[1].id,body:`Sayfa yanıtı ${index}`,createdAt:new Date(Date.now()-60000+index*1000)}))).returning();
  await db.update(posts).set({lastActivityAt:rows.at(-1).createdAt}).where(eq(posts.id,id));
  as(2);
  assert.equal((await forum.getForumTopics({q:`Forum ${token}`,tab:'unread'})).topics.some(t=>t.id===id),true);
  await forum.getForumTopic(id,1);
  assert.equal((await forum.getForumTopics({q:`Forum ${token}`,tab:'unread'})).topics.some(t=>t.id===id),true);
  const anchored=await forum.getForumTopic(id,1,rows.at(-1).id);
  assert.equal(anchored.page,2);assert.ok(anchored.replies.some(r=>r.id===rows.at(-1).id));
  await forum.markForumTopicRead(id,rows[19].id);
  assert.equal((await forum.getForumTopic(id,-1)).page,2);
  await forum.markForumTopicRead(id,rows.at(-1).id);
  assert.equal((await forum.getForumTopic(id,-1)).page,2);
  const [otherTopic]=await db.insert(posts).values({userId:accounts[2].id,title:'Ayrı test konusu',body:'Yanıt ilişkisi doğrulaması',categorySlug:category,createdAt:new Date(Date.now()-60000)}).returning();
  as(1);
  await assert.rejects(()=>forum.replyForumTopic(otherTopic.id,'Başka konuya ait alıntı.',rows[0].id));
  assert.equal((await forum.getForumTopic(otherTopic.id)).topic.commentsCount,0);
  check('Yanıt bağlantıları, okunmamış sayfa, ön yükleme ve konu dışı alıntı engeli');
  globalThis.__forumTestUser=null; await assert.rejects(()=>forum.getForumTopics());
  check('Oturumsuz erişim engeli');
  console.log(`${passed} entegrasyon kontrolü başarılı.`);
} finally {
  await db.delete(forumModerationLog).where(inArray(forumModerationLog.actorId,accounts.map(a=>a.id)));
  await db.delete(users).where(inArray(users.id,accounts.map(a=>a.id)));
  await db.delete(forumCategories).where(eq(forumCategories.slug,category));
  delete globalThis.__forumTestUser;
  // Close the postgres-js pool initialized by the application DB module.
  await db.$client.end();
}
