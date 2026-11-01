"use server";
import { and, eq, inArray, desc, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/auth-schema';
import { classes, schoolMembers, schoolExamResults, schoolExams, teacherClasses, exams, learningTasks, schoolAuditLog, userProfiles, studySessions, userTopicProgress, schoolResultRevisions } from '@/server/db/schema';
import { schoolResultSnapshot } from '@/lib/school-results';
import { recalculateSchoolRanks } from '@/server/school-results';
import { notifyLearning } from '@/server/learning-notifications';
import { requireUser } from '@/server/session';
import { getUsableSchoolIdsForUser, requirePrincipal, requireTeacher, requireStudentAccess, requireUsableInstitutionLicense } from '@/server/school-auth';
import { validCalendarDate } from '@/lib/school-import';
import type { LearningResult } from '@/lib/learning';

async function scope(role: 'student'|'teacher'|'principal') {
 if(!['student','teacher','principal'].includes(role)) throw new Error('Geçersiz rol.');
 const user=await requireUser();
 if(role==='student') return {user, schoolId:null, classIds:[] as string[], students:[{id:user.id,name:user.name,classId:null as string|null,className:'Kişisel',studentNumber:null as string|null}], classRows:[] as {id:string;name:string}[]};
 const context=role==='principal'?await requirePrincipal():await requireTeacher();
 const membership=await db.select().from(schoolMembers).where(and(eq(schoolMembers.userId,user.id),eq(schoolMembers.role,role))).limit(1);
 const schoolId=membership[0]?.schoolId ?? context.schoolId;
 if(!schoolId) throw new Error('Okul seçimi gerekli.');
 let classRows=await db.select({id:classes.id,name:classes.name}).from(classes).where(eq(classes.schoolId,schoolId));
 if(role==='teacher') {
  const assigned=await db.select().from(teacherClasses).where(eq(teacherClasses.teacherId,user.id));
  classRows=classRows.filter(c=>assigned.some(a=>a.classId===c.id));
 }
 const classIds=classRows.map(c=>c.id);
 const students=classIds.length?await db.select({id:users.id,name:users.name,classId:schoolMembers.classId,className:classes.name,studentNumber:schoolMembers.studentNumber}).from(schoolMembers).innerJoin(users,eq(users.id,schoolMembers.userId)).innerJoin(classes,eq(classes.id,schoolMembers.classId)).where(and(eq(schoolMembers.schoolId,schoolId),eq(schoolMembers.role,'student'),inArray(schoolMembers.classId,classIds))):[];
 return {user,schoolId,classIds,students,classRows};
}
export async function getLearningWorkspace(role:'student'|'teacher'|'principal') {
 const context=await scope(role); const ids=context.students.map(s=>s.id);
 const licensedSchoolIds=role==='student'?await getUsableSchoolIdsForUser(context.user.id):[];
 const schoolRows=role==='student' ? licensedSchoolIds.length?await db.select({r:schoolExamResults,e:schoolExams}).from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId)).where(and(eq(schoolExamResults.studentUserId,context.user.id),inArray(schoolExamResults.schoolId,licensedSchoolIds))):[] : context.classIds.length ? await db.select({r:schoolExamResults,e:schoolExams}).from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId)).where(and(eq(schoolExamResults.schoolId,context.schoolId!),inArray(schoolExamResults.classId,context.classIds))) : [];
 // Personal records are private: staff analytics use institution-owned results only.
 const personal=role==='student'?await db.select().from(exams).where(eq(exams.userId,context.user.id)):[];
 const results:LearningResult[]=[...schoolRows.map(({r,e})=>({studentId:r.studentUserId??`unmatched:${r.studentNumber}`,classId:r.classId,date:e.date,type:e.type,net:Number(r.totalNet),source:'Okul',scores:r.scores})),...personal.map(e=>({studentId:context.user.id,classId:null,date:e.date,type:e.type,net:Number(e.totalNet),source:'Kişisel',scores:e.scores}))];
 const taskScope=role==='student'?or(isNull(learningTasks.schoolId),licensedSchoolIds.length?inArray(learningTasks.schoolId,licensedSchoolIds):undefined):eq(learningTasks.schoolId,context.schoolId!);
 const tasks=ids.length?await db.select().from(learningTasks).where(and(inArray(learningTasks.studentId,ids),taskScope)).orderBy(desc(learningTasks.createdAt)):[];
 const logs=role==='principal'?await db.select({id:schoolAuditLog.id,action:schoolAuditLog.action,details:schoolAuditLog.details,actorName:users.name,createdAt:schoolAuditLog.createdAt}).from(schoolAuditLog).leftJoin(users,eq(users.id,schoolAuditLog.actorId)).where(eq(schoolAuditLog.schoolId,context.schoolId!)).orderBy(desc(schoolAuditLog.createdAt)).limit(30):[];
 const qualityCount=role==='principal'?(await db.select({count:sql<number>`count(*)::int`}).from(schoolExamResults).where(and(eq(schoolExamResults.schoolId,context.schoolId!),isNull(schoolExamResults.studentUserId))))[0].count:0;
 const profile=role==='student'?(await db.select().from(userProfiles).where(eq(userProfiles.userId,context.user.id)).limit(1))[0]:null;
 const sessions=role==='student'?await db.select().from(studySessions).where(eq(studySessions.userId,context.user.id)).orderBy(desc(studySessions.date)).limit(100):[];
 const topics=role==='student'?await db.select().from(userTopicProgress).where(eq(userTopicProgress.userId,context.user.id)):[];
 const topicReviews=topics.filter(t=>t.lastStudied).map(t=>{const intervalDays=[1,3,7,14,30][Math.min(Math.max(t.repeatCount,0),4)];const dueAt=new Date(t.lastStudied!.getTime()+intervalDays*86400000);return {topicKey:t.topicKey,completed:t.completed,questionCount:t.questionCount,repeatCount:t.repeatCount,lastStudied:t.lastStudied,intervalDays,due:dueAt<=new Date()};}).filter(t=>t.due).sort((a,b)=>a.lastStudied!.getTime()-b.lastStudied!.getTime()).slice(0,10);
 return {qualityCount,students:context.students,classes:context.classRows,results,tasks,logs,goals:{TYT:Number(profile?.goalTyt??0),AYT:Number(profile?.goalAyt??0)},sessions: sessions.map(s=>({date:s.date,minutes:s.durationMinutes,questions:s.questionCount})),topics:{completed:topics.filter(t=>t.completed).length,questions:topics.reduce((a,t)=>a+t.questionCount,0),reviews:topicReviews}};
}
export async function createLearningTask(input:{studentId:string;title:string;subject:string;dueDate:string;plannedDate?:string;plannedMinutes?:number}) {
 const user=await requireStudentAccess(input.studentId);
 const title=input.title.trim(); if(!title || title.length>300) throw new Error('Görev 1–300 karakter olmalı.');
 if(input.subject.length>100 || (input.dueDate && !validCalendarDate(input.dueDate))) throw new Error('Görev bilgileri geçersiz.');
 if((input.plannedDate&&!validCalendarDate(input.plannedDate))||(input.plannedMinutes!==undefined&&(!Number.isInteger(input.plannedMinutes)||input.plannedMinutes<0||input.plannedMinutes>480))) throw new Error('Plan tarihi ve süresi geçersiz.');
 await db.transaction(async tx=>{
 const [member]=await tx.select().from(schoolMembers).where(eq(schoolMembers.userId,input.studentId)).limit(1);
 const schoolId=user.id!==input.studentId?member?.schoolId:null;
 const [created]=await tx.insert(learningTasks).values({schoolId,studentId:input.studentId,authorId:user.id,title,subject:input.subject.trim()||null,dueDate:input.dueDate||null,plannedDate:schoolId?null:input.plannedDate||null,plannedMinutes:schoolId?0:input.plannedMinutes??0}).returning({id:learningTasks.id});
 if(schoolId)await notifyLearning(tx,[{userId:input.studentId,studentId:input.studentId,schoolId,taskId:created.id,category:"tasks",message:"Yeni bir destek görevi oluşturuldu.",eventKey:`task:${created.id}:created`}],user.id);
 if(schoolId) await tx.insert(schoolAuditLog).values({schoolId,actorId:user.id,action:'Takip görevi oluşturuldu',details:title});
 });
}
export async function updateLearningTask(input:{id:string;status:'open'|'done';reflection:string;revision:number}) {
 const [task]=await db.select().from(learningTasks).where(eq(learningTasks.id,input.id)).limit(1);
 if(!task) throw new Error('Görev bulunamadı.');
 if(task.schoolId) await requireUsableInstitutionLicense(task.schoolId);
 const user=await requireStudentAccess(task.studentId);
 if(!['open','done'].includes(input.status)||input.reflection.length>2000) throw new Error('Geçersiz görev güncellemesi.');
 // Reflections belong to the student; staff can follow completion but cannot rewrite it.
 if(user.id!==task.studentId) throw new Error('Görevi yalnızca öğrenci güncelleyebilir.');
 await db.transaction(async tx=>{
  const changed=await tx.update(learningTasks).set({status:input.status,reflection:input.reflection.trim(),revision:sql`${learningTasks.revision}+1`,updatedAt:new Date()}).where(and(eq(learningTasks.id,task.id),eq(learningTasks.revision,input.revision))).returning({id:learningTasks.id});
  if(!changed.length) throw new Error('Görev değişti. Sayfayı yenileyip tekrar deneyin.');
  if(task.schoolId)await notifyLearning(tx,[{userId:task.authorId,studentId:task.studentId,schoolId:task.schoolId,taskId:task.id,category:'tasks',message:input.status==='done'?'Öğrencin bir destek görevini tamamladı.':'Öğrencin bir destek görevini yeniden açtı.',eventKey:`task:${task.id}:status:${input.revision+1}`}],user.id);
  if(task.schoolId) await tx.insert(schoolAuditLog).values({schoolId:task.schoolId,actorId:user.id,action:input.status==='done'?'Görev tamamlandı':'Görev yeniden açıldı',details:task.title});
 });
}

export async function recordLearningExport(role:'student'|'teacher'|'principal',filters:{type:string;from:string;to:string;classId:string;studentId:string;source:string}) {
 const context=await scope(role);
 if(!context.schoolId) return;
 if(filters.classId && !context.classIds.includes(filters.classId)) throw new Error('Sınıf kapsamı geçersiz.');
 if(filters.studentId && !context.students.some(s=>s.id===filters.studentId)) throw new Error('Öğrenci kapsamı geçersiz.');
 await db.insert(schoolAuditLog).values({schoolId:context.schoolId,actorId:context.user.id,action:'Gelişim CSV raporu dışa aktarıldı',details:JSON.stringify({type:filters.type.slice(0,10),from:filters.from.slice(0,10),to:filters.to.slice(0,10),classId:filters.classId,studentId:filters.studentId})});
}

export async function linkSchoolResult(input:{resultId:string;studentId:string;revision:number;reason:string}) {
 const {user,schoolId}=await requirePrincipal();
 const reason=input.reason.trim();if(!reason||reason.length>500)throw new Error('Eşleştirme gerekçesi zorunlu (en fazla 500 karakter).');
 await db.transaction(async tx=>{
  const [target]=await tx.select().from(schoolExamResults).where(and(eq(schoolExamResults.id,input.resultId),eq(schoolExamResults.schoolId,schoolId))).limit(1);
  if(!target) throw new Error('Sonuç bulunamadı.');
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${target.schoolExamId}, 0))`);
  const [current]=await tx.select().from(schoolExamResults).where(eq(schoolExamResults.id,target.id)).limit(1);
  if(current.revision!==input.revision)throw new Error('Sonuç değişmiş. Sayfayı yenileyin.');
  if(current.studentUserId) throw new Error('Bu sonuç zaten eşleştirilmiş. Sayfayı yenileyin.');
  const [member]=await tx.select().from(schoolMembers).where(and(eq(schoolMembers.schoolId,schoolId),eq(schoolMembers.userId,input.studentId),eq(schoolMembers.role,'student'))).limit(1);
  if(!member?.classId||!member.studentNumber) throw new Error('Öğrencinin sınıf ve okul numarası kaydı gerekli.');
  const [room]=await tx.select({id:classes.id}).from(classes).where(and(eq(classes.id,member.classId),eq(classes.schoolId,schoolId))).limit(1);
  if(!room) throw new Error('Sınıf bu okula ait değil.');
  const duplicate=await tx.select({id:schoolExamResults.id}).from(schoolExamResults).where(and(eq(schoolExamResults.schoolExamId,target.schoolExamId),eq(schoolExamResults.studentNumber,member.studentNumber)));
  if(duplicate.some(r=>r.id!==target.id)) throw new Error('Bu öğrenci numarasıyla aynı sınavda zaten sonuç var.');
  await tx.update(schoolExamResults).set({studentUserId:member.userId,studentNumber:member.studentNumber,classId:member.classId,revision:current.revision+1,updatedAt:new Date()}).where(eq(schoolExamResults.id,target.id));
  await recalculateSchoolRanks(tx,target.schoolExamId);
  const [updated]=await tx.select().from(schoolExamResults).where(eq(schoolExamResults.id,target.id));
  await tx.insert(schoolResultRevisions).values({resultId:target.id,editorId:user.id,revision:updated.revision,reason,before:schoolResultSnapshot(current),after:schoolResultSnapshot(updated)});
  await notifyLearning(tx,[{userId:member.userId,studentId:member.userId,schoolId,examId:target.schoolExamId,category:'results',message:'Yeni okul denemesi sonucun hazır.',eventKey:`exam:${target.schoolExamId}:${member.userId}`}],user.id);
  await tx.insert(schoolAuditLog).values({schoolId,actorId:user.id,action:'Sınav sonucu öğrenciyle eşleştirildi',details:`Sonuç ${target.id}; öğrenci ${member.userId}; okul numarası ${target.studentNumber} → ${member.studentNumber}`});
 });
}
