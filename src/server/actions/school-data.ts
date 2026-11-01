"use server";
import { and,eq,desc,isNull,or,ilike,sql,inArray } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/auth-schema';
import { classes,schoolExams,schoolExamResults,schoolMembers,teacherClasses,schoolResultRevisions,schoolAuditLog } from '@/server/db/schema';
import { requirePrincipal,getUserRoleContext } from '@/server/school-auth';
import { checkedPage,literalSearch,schoolResultSnapshot } from '@/lib/school-results';
import { validateSchoolRows,type SchoolImportRow } from '@/lib/school-import';
import { recalculateSchoolRanks } from '@/server/school-results';
import { notifyLearning } from '@/server/learning-notifications';

export async function getSchoolDataPage(input:{page?:number;q?:string;unmatched?:boolean;examId?:string}={}) {
 const {schoolId}=await requirePrincipal();const page=checkedPage(input.page);const q=(input.q??'').trim();if(q.length>100)throw new Error('Arama en fazla 100 karakter olabilir.');
 if(input.examId){const [exam]=await db.select({id:schoolExams.id}).from(schoolExams).where(and(eq(schoolExams.id,input.examId),eq(schoolExams.schoolId,schoolId))).limit(1);if(!exam)throw new Error('Sınav bulunamadı.');}
 const search='%'+literalSearch(q)+'%';
 const filter=and(eq(schoolExamResults.schoolId,schoolId),input.unmatched?isNull(schoolExamResults.studentUserId):undefined,input.examId?eq(schoolExamResults.schoolExamId,input.examId):undefined,q?or(ilike(schoolExamResults.studentNumber,search),ilike(schoolExamResults.studentName,search),ilike(schoolExams.name,search)):undefined);
 const [rows,counts]=await Promise.all([
  db.select({id:schoolExamResults.id,examId:schoolExams.id,examName:schoolExams.name,date:schoolExams.date,type:schoolExams.type,studentNumber:schoolExamResults.studentNumber,studentName:schoolExamResults.studentName,className:classes.name,studentUserId:schoolExamResults.studentUserId,totalNet:schoolExamResults.totalNet,rankInSchool:schoolExamResults.rankInSchool,rankInClass:schoolExamResults.rankInClass,revision:schoolExamResults.revision})
   .from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId)).leftJoin(classes,eq(classes.id,schoolExamResults.classId)).where(filter).orderBy(desc(schoolExams.date),desc(schoolExamResults.createdAt),desc(schoolExamResults.id)).limit(25).offset((page-1)*25),
  db.select({count:sql<number>`count(*)::int`}).from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId)).where(filter),
 ]);
 return {rows,total:counts[0].count,page,q,unmatched:input.unmatched??false,examId:input.examId??''};
}
export async function getSchoolStudentPage(role:'teacher'|'principal',input:{page?:number;q?:string;classId?:string}={}) {
 const context=await getUserRoleContext();if(!['teacher','principal'].includes(role)||context.role!==role||!context.membership)throw new Error('Öğrenci listesine erişiminiz yok.');
 const schoolId=context.membership.schoolId;const page=checkedPage(input.page);const q=(input.q??'').trim();if(q.length>100)throw new Error('Arama en fazla 100 karakter olabilir.');
 let classRows=await db.select({id:classes.id,name:classes.name,grade:classes.grade,field:classes.field,joinCode:classes.joinCode}).from(classes).where(eq(classes.schoolId,schoolId)).orderBy(classes.grade,classes.name,classes.id);
 if(role==='teacher'){const assigned=await db.select().from(teacherClasses).where(eq(teacherClasses.teacherId,context.user.id));classRows=classRows.filter(c=>assigned.some(a=>a.classId===c.id));}
 if(input.classId&&!classRows.some(c=>c.id===input.classId))throw new Error('Bu sınıfa yetkiniz yok.');
 const ids=classRows.filter(c=>!input.classId||c.id===input.classId).map(c=>c.id);const search='%'+literalSearch(q)+'%';
 if(!ids.length)return {rows:[],classes:classRows,total:0,page,q,classId:input.classId??''};
 const filter=and(eq(schoolMembers.schoolId,schoolId),eq(classes.schoolId,schoolId),eq(schoolMembers.role,'student'),inArray(schoolMembers.classId,ids),q?or(ilike(users.name,search),ilike(schoolMembers.studentNumber,search)):undefined);
 const [rows,counts]=await Promise.all([
  db.select({id:users.id,name:users.name,studentNumber:schoolMembers.studentNumber,className:classes.name,classId:classes.id}).from(schoolMembers).innerJoin(users,eq(users.id,schoolMembers.userId)).innerJoin(classes,eq(classes.id,schoolMembers.classId)).where(filter).orderBy(classes.name,schoolMembers.studentNumber,schoolMembers.id).limit(25).offset((page-1)*25),
  db.select({count:sql<number>`count(*)::int`}).from(schoolMembers).innerJoin(users,eq(users.id,schoolMembers.userId)).innerJoin(classes,eq(classes.id,schoolMembers.classId)).where(filter),
 ]);
 return {rows,classes:classRows,total:counts[0].count,page,q,classId:input.classId??''};
}
export async function getSchoolResultDetail(id:string,historyPage=1) {
 const {schoolId}=await requirePrincipal();checkedPage(historyPage);
 const [row]=await db.select({result:schoolExamResults,examName:schoolExams.name,type:schoolExams.type,date:schoolExams.date,className:classes.name}).from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId)).leftJoin(classes,eq(classes.id,schoolExamResults.classId)).where(and(eq(schoolExamResults.id,id),eq(schoolExamResults.schoolId,schoolId))).limit(1);
 if(!row)throw new Error('Sonuç bulunamadı.');
 const [history,count]=await Promise.all([
  db.select({id:schoolResultRevisions.id,revision:schoolResultRevisions.revision,reason:schoolResultRevisions.reason,before:schoolResultRevisions.before,after:schoolResultRevisions.after,editorName:users.name,createdAt:schoolResultRevisions.createdAt}).from(schoolResultRevisions).leftJoin(users,eq(users.id,schoolResultRevisions.editorId)).where(eq(schoolResultRevisions.resultId,id)).orderBy(desc(schoolResultRevisions.revision)).limit(20).offset((historyPage-1)*20),
  db.select({count:sql<number>`count(*)::int`}).from(schoolResultRevisions).where(eq(schoolResultRevisions.resultId,id)),
 ]);
 return {...row,history,historyTotal:count[0].count,historyPage};
}
export async function reviseSchoolResult(input:{id:string;revision:number;studentName:string;scores:SchoolImportRow['scores'];reason:string}) {
 const {user,schoolId}=await requirePrincipal();const reason=input.reason.trim();if(!reason||reason.length>500||!Number.isInteger(input.revision))throw new Error('Düzeltme gerekçesi zorunlu (en fazla 500 karakter).');
 await db.transaction(async tx=>{
  const [initial]=await tx.select({examId:schoolExamResults.schoolExamId}).from(schoolExamResults).where(and(eq(schoolExamResults.id,input.id),eq(schoolExamResults.schoolId,schoolId))).limit(1);
  if(!initial)throw new Error('Sonuç bulunamadı.');
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${initial.examId}, 0))`);
  const [current]=await tx.select({r:schoolExamResults,type:schoolExams.type}).from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId)).where(and(eq(schoolExamResults.id,input.id),eq(schoolExamResults.schoolId,schoolId))).limit(1);
  if(!current||current.r.revision!==input.revision)throw new Error('Sonuç değişmiş. Sayfayı yenileyin.');
  if(current.type!=='TYT'&&current.type!=='AYT')throw new Error('Sınav türü desteklenmiyor.');
  const checked=validateSchoolRows([{studentNumber:current.r.studentNumber,studentName:input.studentName,scores:input.scores,totalNet:0}],current.type);
  if(checked.issues.length)throw new Error(checked.issues.map(i=>`${i.field}: ${i.message}`).join('\n'));
  const next=checked.rows[0];const before=schoolResultSnapshot(current.r);
  await tx.update(schoolExamResults).set({studentName:next.studentName,scores:next.scores,totalNet:String(next.totalNet),revision:input.revision+1,updatedAt:new Date()}).where(eq(schoolExamResults.id,input.id));
  await recalculateSchoolRanks(tx,initial.examId);
  const [updated]=await tx.select().from(schoolExamResults).where(eq(schoolExamResults.id,input.id));
  await tx.insert(schoolResultRevisions).values({resultId:input.id,editorId:user.id,revision:updated.revision,reason,before,after:schoolResultSnapshot(updated)});
  await tx.insert(schoolAuditLog).values({schoolId,actorId:user.id,action:'Sınav sonucu düzeltildi',details:JSON.stringify({resultId:input.id,revision:updated.revision,reason})});
  if(updated.studentUserId)await notifyLearning(tx,[{userId:updated.studentUserId,studentId:updated.studentUserId,schoolId,examId:initial.examId,category:'results',message:'Okul denemesi sonucunda düzeltme yapıldı.',eventKey:`result:${input.id}:${updated.revision}`}],user.id);
 });
}

export async function reassignSchoolResult(input:{id:string;revision:number;studentId:string;reason:string;identityConfirmed:boolean}) {
 const {user,schoolId}=await requirePrincipal();
 const reason=input.reason.trim();
 if(!input.identityConfirmed||!reason||reason.length>500)throw new Error('Kimlik kontrolü ve gerekçeli işlem zorunludur.');
 await db.transaction(async tx=>{
  const [initial]=await tx.select({examId:schoolExamResults.schoolExamId}).from(schoolExamResults).where(and(eq(schoolExamResults.id,input.id),eq(schoolExamResults.schoolId,schoolId))).limit(1);
  if(!initial)throw new Error('Sonuç bulunamadı.');
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${initial.examId}, 0))`);
  const [current]=await tx.select().from(schoolExamResults).where(and(eq(schoolExamResults.id,input.id),eq(schoolExamResults.schoolId,schoolId))).limit(1);
  if(!current||current.revision!==input.revision)throw new Error('Sonuç değişmiş. Sayfayı yenileyin.');
  const [member]=await tx.select().from(schoolMembers).where(and(eq(schoolMembers.schoolId,schoolId),eq(schoolMembers.userId,input.studentId),eq(schoolMembers.role,'student'))).limit(1);
  if(!member?.classId||!member.studentNumber)throw new Error('Hedef öğrencinin sınıf ve okul numarası kaydı gerekli.');
  const [room]=await tx.select({id:classes.id}).from(classes).where(and(eq(classes.id,member.classId),eq(classes.schoolId,schoolId))).limit(1);
  if(!room)throw new Error('Hedef sınıf bu okula ait değil.');
  if(current.studentUserId===member.userId)throw new Error('Bu sonuç zaten seçilen öğrenciye bağlı.');
  const duplicate=await tx.select({id:schoolExamResults.id}).from(schoolExamResults).where(and(eq(schoolExamResults.schoolExamId,current.schoolExamId),eq(schoolExamResults.studentNumber,member.studentNumber)));
  if(duplicate.some(r=>r.id!==current.id))throw new Error('Hedef öğrencinin okul numarasıyla aynı sınavda başka sonuç var.');
  const before=schoolResultSnapshot(current);
  await tx.update(schoolExamResults).set({studentUserId:member.userId,studentNumber:member.studentNumber,classId:member.classId,revision:current.revision+1,updatedAt:new Date()}).where(eq(schoolExamResults.id,current.id));
  await recalculateSchoolRanks(tx,current.schoolExamId);
  const [updated]=await tx.select().from(schoolExamResults).where(eq(schoolExamResults.id,current.id));
  await tx.insert(schoolResultRevisions).values({resultId:current.id,editorId:user.id,revision:updated.revision,reason,before,after:schoolResultSnapshot(updated)});
  await tx.insert(schoolAuditLog).values({schoolId,actorId:user.id,action:'Sınav sonucu öğrenci hesabına aktarıldı',details:JSON.stringify({resultId:current.id,from:current.studentUserId,to:member.userId,reason})});
  if(current.studentUserId)await notifyLearning(tx,[{userId:current.studentUserId,studentId:current.studentUserId,schoolId,examId:current.schoolExamId,category:'results',message:'Bir okul denemesi sonucu profilinden kaldırıldı; okul yönetimiyle görüşebilirsin.',eventKey:`result-unlinked:${current.id}:${updated.revision}`}],user.id);
  await notifyLearning(tx,[{userId:member.userId,studentId:member.userId,schoolId,examId:current.schoolExamId,category:'results',message:'Yeni bir okul denemesi sonucun hazır.',eventKey:`result:${current.schoolExamId}:${member.userId}`}],user.id);
 });
}
