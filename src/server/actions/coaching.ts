"use server";

import { and, eq, desc, sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { users } from '@/server/db/auth-schema';
import { classes, schoolMembers, schoolExams, schoolExamResults, learningTasks, learningMeetings, learningMeetingRevisions, schoolAuditLog } from '@/server/db/schema';
import { notifyLearning } from '@/server/learning-notifications';
import { requireUser } from '@/server/session';
import { requireStudentAccess, requireTeacher, getSchoolMembership } from '@/server/school-auth';
import { validCalendarDate } from '@/lib/school-import';

async function studentScope(studentId:string) {
 const user=await requireUser();
 await requireTeacher(); // Self-access alone must never grant a staff action.
 await requireStudentAccess(studentId);
 const [student]=await db.select({id:users.id,name:users.name,schoolId:schoolMembers.schoolId,classId:classes.id,className:classes.name,studentNumber:schoolMembers.studentNumber,grade:classes.grade,field:classes.field})
  .from(schoolMembers).innerJoin(users,eq(users.id,schoolMembers.userId)).innerJoin(classes,eq(classes.id,schoolMembers.classId))
  .where(and(eq(schoolMembers.userId,studentId),eq(schoolMembers.role,'student'),eq(classes.schoolId,schoolMembers.schoolId))).limit(1);
 if(!student) throw new Error('Öğrenci kaydı bulunamadı.');
 return {user,student};
}
async function meetingHistory(studentId:string,schoolId?:string) {
 return db.select({id:learningMeetingRevisions.id,meetingId:learningMeetingRevisions.meetingId,revision:learningMeetingRevisions.revision,reason:learningMeetingRevisions.reason,before:learningMeetingRevisions.before,after:learningMeetingRevisions.after,createdAt:learningMeetingRevisions.createdAt,editorName:users.name})
  .from(learningMeetingRevisions).innerJoin(learningMeetings,eq(learningMeetings.id,learningMeetingRevisions.meetingId)).leftJoin(users,eq(users.id,learningMeetingRevisions.editorId))
  .where(and(eq(learningMeetings.studentId,studentId),schoolId?eq(learningMeetings.schoolId,schoolId):undefined)).orderBy(desc(learningMeetingRevisions.revision));
}
export async function getStudentCoaching(studentId:string,page=1) {
 const {user,student}=await studentScope(studentId);
 if(!Number.isInteger(page)||page<1||page>10000)throw new Error('Geçersiz sayfa.');
 const [results,tasks,meetings,membership,history]=await Promise.all([
  db.select({id:schoolExamResults.id,name:schoolExams.name,date:schoolExams.date,type:schoolExams.type,net:schoolExamResults.totalNet,scores:schoolExamResults.scores})
   .from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId))
   .where(and(eq(schoolExamResults.studentUserId,studentId),eq(schoolExamResults.schoolId,student.schoolId))).orderBy(desc(schoolExams.date),desc(schoolExamResults.id)).limit(25).offset((page-1)*25),
  db.select().from(learningTasks).where(and(eq(learningTasks.studentId,studentId),eq(learningTasks.schoolId,student.schoolId))).orderBy(desc(learningTasks.createdAt)).limit(25).offset((page-1)*25),
  db.select({id:learningMeetings.id,revision:learningMeetings.revision,authorId:learningMeetings.authorId,meetingDate:learningMeetings.meetingDate,followupDate:learningMeetings.followupDate,note:learningMeetings.note,authorName:users.name})
   .from(learningMeetings).innerJoin(users,eq(users.id,learningMeetings.authorId))
   .where(and(eq(learningMeetings.studentId,studentId),eq(learningMeetings.schoolId,student.schoolId))).orderBy(desc(learningMeetings.meetingDate)).limit(25).offset((page-1)*25),
  getSchoolMembership(user.id),
  meetingHistory(studentId,student.schoolId),
 ]);
 const [resultCount]=await db.select({count:sql<number>`count(*)::int`}).from(schoolExamResults).where(and(eq(schoolExamResults.studentUserId,studentId),eq(schoolExamResults.schoolId,student.schoolId)));
 const [taskCount]=await db.select({count:sql<number>`count(*)::int`}).from(learningTasks).where(and(eq(learningTasks.studentId,studentId),eq(learningTasks.schoolId,student.schoolId)));
 const [meetingCount]=await db.select({count:sql<number>`count(*)::int`}).from(learningMeetings).where(and(eq(learningMeetings.studentId,studentId),eq(learningMeetings.schoolId,student.schoolId)));
 const totalPages=Math.max(1,Math.ceil(Math.max(resultCount.count,taskCount.count,meetingCount.count)/25));
 return {student,page,totalPages,results:results.map(r=>({...r,net:Number(r.net)})),tasks:tasks.map(t=>({...t,canRevise:t.authorId===user.id || (membership?.role==='principal'&&membership.schoolId===t.schoolId)})),meetings:meetings.map(m=>({...m,canRevise:m.authorId===user.id||(membership?.role==='principal'&&membership.schoolId===student.schoolId),history:history.filter(h=>h.meetingId===m.id)}))};
}
export async function addLearningMeeting(input:{studentId:string;meetingDate:string;followupDate:string;note:string}) {
 const {user,student}=await studentScope(input.studentId);
 if(!validCalendarDate(input.meetingDate) || (input.followupDate&&(!validCalendarDate(input.followupDate)||input.followupDate<input.meetingDate))) throw new Error('Görüşme ve takip tarihlerini kontrol edin.');
 const note=input.note.trim();if(!note||note.length>4000)throw new Error('Görüşme notu 1–4000 karakter olmalı.');
 await db.transaction(async tx=>{
  const [meeting]=await tx.insert(learningMeetings).values({schoolId:student.schoolId,studentId:student.id,authorId:user.id,meetingDate:input.meetingDate,followupDate:input.followupDate||null,note}).returning({id:learningMeetings.id});
  await notifyLearning(tx,[{userId:student.id,studentId:student.id,schoolId:student.schoolId,meetingId:meeting.id,category:"meetings",message:"Yeni bir görüşme notu paylaşıldı.",eventKey:`meeting:${meeting.id}:1`}],user.id);
  await tx.insert(schoolAuditLog).values({schoolId:student.schoolId,actorId:user.id,action:'Öğrenci görüşmesi kaydedildi',details:`Öğrenci ${student.id}; görüşme ${input.meetingDate}; takip ${input.followupDate||'yok'}`});
 });
}
export async function reviseLearningTask(input:{id:string;revision:number;title:string;subject:string;dueDate:string;baselineResultId:string;followupResultId:string;reviewNote:string}) {
 const user=await requireUser();
 const [task]=await db.select().from(learningTasks).where(eq(learningTasks.id,input.id)).limit(1);
 if(!task)throw new Error('Görev bulunamadı.');
 if(task.schoolId) {
  const {student}=await studentScope(task.studentId);
  const member=await getSchoolMembership(user.id);
  if(student.schoolId!==task.schoolId || (task.authorId!==user.id && !(member?.role==='principal'&&member.schoolId===task.schoolId))) throw new Error('Bu görevi düzenleme yetkiniz yok.');
 } else if(task.studentId!==user.id||task.authorId!==user.id) throw new Error('Bu görev kişiseldir.');
 const title=input.title.trim();
 if(!title||title.length>300||input.subject.length>100||input.reviewNote.length>2000||(input.dueDate&&!validCalendarDate(input.dueDate)))throw new Error('Görev bilgilerini kontrol edin.');
 if(!task.schoolId&&(input.baselineResultId||input.followupResultId||input.reviewNote))throw new Error('Kişisel görevlerde okul değerlendirmesi kullanılamaz.');
 await db.transaction(async tx=>{
  const lookup=async(id:string)=>{
   if(!id)return null;
   const [result]=await tx.select({id:schoolExamResults.id,date:schoolExams.date,type:schoolExams.type}).from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId))
    .where(and(eq(schoolExamResults.id,id),eq(schoolExamResults.studentUserId,task.studentId),eq(schoolExamResults.schoolId,task.schoolId!))).limit(1);
   if(!result)throw new Error('Deneme sonucu bu öğrenci ve okula ait değil.');return result;
  };
  const baseline=await lookup(input.baselineResultId),followup=await lookup(input.followupResultId);
  if(followup&&(!baseline||followup.type!==baseline.type||followup.date<=baseline.date))throw new Error('Takip denemesi aynı türde ve başlangıç denemesinden sonraki bir tarihte olmalı.');
  const changed=await tx.update(learningTasks).set({title,subject:input.subject.trim()||null,dueDate:input.dueDate||null,baselineResultId:baseline?.id??null,followupResultId:followup?.id??null,reviewNote:input.reviewNote.trim()||null,revision:sql`${learningTasks.revision}+1`,updatedAt:new Date()})
   .where(and(eq(learningTasks.id,task.id),eq(learningTasks.revision,input.revision))).returning({id:learningTasks.id});
  if(!changed.length)throw new Error('Görev başka bir işlemde değişti. Sayfayı yenileyip tekrar deneyin.');
  if(task.schoolId)await notifyLearning(tx,[{userId:task.studentId,studentId:task.studentId,schoolId:task.schoolId,taskId:task.id,category:'tasks',message:'Destek görevin veya öğretmen değerlendirmen güncellendi.',eventKey:`task:${task.id}:revision:${input.revision+1}`}],user.id);
  if(task.schoolId)await tx.insert(schoolAuditLog).values({schoolId:task.schoolId,actorId:user.id,action:'Destek görevi revize edildi',details:JSON.stringify({taskId:task.id,previous:{title:task.title,subject:task.subject,dueDate:task.dueDate,baseline:task.baselineResultId,followup:task.followupResultId,reviewNote:task.reviewNote},next:{title,subject:input.subject,dueDate:input.dueDate,baseline:input.baselineResultId,followup:input.followupResultId,reviewNote:input.reviewNote.trim()},revision:input.revision+1})});
 });
}
export async function getWeeklyLearningPlan() {
 const user=await requireUser();
 const [tasks,meetings,results,history]=await Promise.all([
  db.select().from(learningTasks).where(eq(learningTasks.studentId,user.id)).orderBy(desc(learningTasks.createdAt)),
  db.select({id:learningMeetings.id,revision:learningMeetings.revision,note:learningMeetings.note,meetingDate:learningMeetings.meetingDate,followupDate:learningMeetings.followupDate,authorName:users.name}).from(learningMeetings).innerJoin(users,eq(users.id,learningMeetings.authorId)).where(eq(learningMeetings.studentId,user.id)).orderBy(desc(learningMeetings.meetingDate)),
  db.select({id:schoolExamResults.id,name:schoolExams.name,date:schoolExams.date,type:schoolExams.type,net:schoolExamResults.totalNet}).from(schoolExamResults).innerJoin(schoolExams,eq(schoolExams.id,schoolExamResults.schoolExamId)).where(eq(schoolExamResults.studentUserId,user.id)),
  meetingHistory(user.id),
 ]);
 return {studentId:user.id,tasks,meetings:meetings.map(m=>({...m,history:history.filter(h=>h.meetingId===m.id)})),results:results.map(r=>({...r,net:Number(r.net)})),today:new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'})};
}
export async function scheduleLearningTask(input:{id:string;revision:number;plannedDate:string;plannedMinutes:number}) {
 const user=await requireUser();
 if((input.plannedDate&&!validCalendarDate(input.plannedDate))||!Number.isInteger(input.plannedMinutes)||input.plannedMinutes<0||input.plannedMinutes>480)throw new Error('Plan tarihi ve süreyi kontrol edin (0–480 dakika).');
 const changed=await db.update(learningTasks).set({plannedDate:input.plannedDate||null,plannedMinutes:input.plannedMinutes,revision:sql`${learningTasks.revision}+1`,updatedAt:new Date()})
  .where(and(eq(learningTasks.id,input.id),eq(learningTasks.studentId,user.id),eq(learningTasks.revision,input.revision))).returning({id:learningTasks.id});
 if(!changed.length)throw new Error('Görev değişmiş veya erişiminiz yok. Sayfayı yenileyin.');
}

export async function reviseLearningMeeting(input:{id:string;revision:number;meetingDate:string;followupDate:string;note:string;reason:string}) {
 const [meeting]=await db.select().from(learningMeetings).where(eq(learningMeetings.id,input.id)).limit(1);
 if(!meeting)throw new Error('Görüşme bulunamadı.');
 const {user,student}=await studentScope(meeting.studentId);
 const member=await getSchoolMembership(user.id);
 if(student.schoolId!==meeting.schoolId||(meeting.authorId!==user.id&&!(member?.role==='principal'&&member.schoolId===meeting.schoolId)))throw new Error('Görüşmeyi düzeltme yetkiniz yok.');
 if(meeting.revision!==input.revision)throw new Error('Görüşme değişmiş. Sayfayı yenileyin.');
 const note=input.note.trim(),reason=input.reason.trim();
 if(!note||note.length>4000||!reason||reason.length>500||!validCalendarDate(input.meetingDate)||(input.followupDate&&(!validCalendarDate(input.followupDate)||input.followupDate<input.meetingDate)))throw new Error('Not, düzeltme gerekçesi ve tarihleri kontrol edin.');
 const before={note:meeting.note,meetingDate:meeting.meetingDate,followupDate:meeting.followupDate};
 const after={note,meetingDate:input.meetingDate,followupDate:input.followupDate||null};
 await db.transaction(async tx=>{
  const changed=await tx.update(learningMeetings).set({...after,revision:sql`${learningMeetings.revision}+1`,updatedAt:new Date()}).where(and(eq(learningMeetings.id,meeting.id),eq(learningMeetings.revision,input.revision))).returning({id:learningMeetings.id});
  if(!changed.length)throw new Error('Görüşme değişmiş. Sayfayı yenileyin.');
  await tx.insert(learningMeetingRevisions).values({meetingId:meeting.id,editorId:user.id,revision:input.revision+1,reason,before,after});
  await tx.insert(schoolAuditLog).values({schoolId:meeting.schoolId,actorId:user.id,action:'Görüşme notu düzeltildi',details:JSON.stringify({meetingId:meeting.id,revision:input.revision+1,reason})});
  await notifyLearning(tx,[{userId:meeting.studentId,studentId:meeting.studentId,schoolId:meeting.schoolId,meetingId:meeting.id,category:'meetings',message:'Paylaşılan görüşme notunda düzeltme yapıldı.',eventKey:`meeting:${meeting.id}:${input.revision+1}`}],user.id);
 });
}
