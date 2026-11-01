"use server";
import { and,eq,desc,sql,lte,inArray } from 'drizzle-orm';
import { db } from '@/server/db';
import { learningNotifications,learningNotificationPreferences,learningTasks,learningMeetings,schoolExamResults } from '@/server/db/schema';
import { requireUser } from '@/server/session';
import { getUsableSchoolIdsForUser,getUserRoleContext,requireStudentAccess } from '@/server/school-auth';
export async function getLearningNotificationCount() {
 const user=await requireUser();const schoolIds=await getUsableSchoolIdsForUser(user.id);if(!schoolIds.length)return 0;const [row]=await db.select({count:sql<number>`count(*)::int`}).from(learningNotifications).where(and(eq(learningNotifications.userId,user.id),eq(learningNotifications.read,false),inArray(learningNotifications.schoolId,schoolIds)));return row.count;
}
export async function getLearningNotifications(page=1,unreadOnly=false) {
 const user=await requireUser();if(!Number.isInteger(page)||page<1||page>10000)throw new Error('Geçersiz sayfa.');
 const schoolIds=await getUsableSchoolIdsForUser(user.id);if(!schoolIds.length)return {rows:[],total:0,page,preferences:{tasks:true,meetings:true,results:true},readBefore:new Date().toISOString()};
 const filter=and(eq(learningNotifications.userId,user.id),inArray(learningNotifications.schoolId,schoolIds),unreadOnly?eq(learningNotifications.read,false):undefined);
 const [rows,count,preferences]=await Promise.all([
  db.select({id:learningNotifications.id,message:learningNotifications.message,category:learningNotifications.category,read:learningNotifications.read,createdAt:learningNotifications.createdAt}).from(learningNotifications).where(filter).orderBy(desc(learningNotifications.createdAt),desc(learningNotifications.id)).limit(30).offset((page-1)*30),
  db.select({count:sql<number>`count(*)::int`}).from(learningNotifications).where(filter),
  db.select().from(learningNotificationPreferences).where(eq(learningNotificationPreferences.userId,user.id)).limit(1),
 ]);
 return {rows,total:count[0].count,page,preferences:preferences[0]??{tasks:true,meetings:true,results:true},readBefore:new Date().toISOString()};
}
export async function saveLearningNotificationPreferences(input:{tasks:boolean;meetings:boolean;results:boolean}) {
 const user=await requireUser();if([input.tasks,input.meetings,input.results].some(v=>typeof v!=='boolean'))throw new Error('Geçersiz tercih.');
 const values={tasks:input.tasks,meetings:input.meetings,results:input.results};
 await db.insert(learningNotificationPreferences).values({userId:user.id,...values}).onConflictDoUpdate({target:learningNotificationPreferences.userId,set:values});
}
export async function markLearningNotificationRead(id:string) {
 const user=await requireUser();await db.update(learningNotifications).set({read:true}).where(and(eq(learningNotifications.id,id),eq(learningNotifications.userId,user.id)));
}
export async function markAllLearningNotificationsRead(before:string) {
 const user=await requireUser();const date=new Date(before);if(!Number.isFinite(date.getTime())||date.getTime()>Date.now()+1000)throw new Error('Geçersiz tarih.');
 await db.update(learningNotifications).set({read:true}).where(and(eq(learningNotifications.userId,user.id),lte(learningNotifications.createdAt,date)));
}
export async function openLearningNotification(id:string) {
 const {user,role,membership}=await getUserRoleContext();
 const [notice]=await db.select().from(learningNotifications).where(and(eq(learningNotifications.id,id),eq(learningNotifications.userId,user.id))).limit(1);
 if(!notice)throw new Error('Bildirim bulunamadı.');
 if(!(await getUsableSchoolIdsForUser(user.id)).includes(notice.schoolId))throw new Error('Bu okul bildirimi için güncel lisans erişiminiz bulunmuyor.');
 let exists=false;
 if(notice.eventKey.startsWith('result-unlinked:'))exists=true;
 else if(notice.taskId)exists=(await db.select({id:learningTasks.id}).from(learningTasks).where(and(eq(learningTasks.id,notice.taskId),eq(learningTasks.studentId,notice.studentId),eq(learningTasks.schoolId,notice.schoolId)))).length>0;
 else if(notice.meetingId)exists=(await db.select({id:learningMeetings.id}).from(learningMeetings).where(and(eq(learningMeetings.id,notice.meetingId),eq(learningMeetings.studentId,notice.studentId),eq(learningMeetings.schoolId,notice.schoolId)))).length>0;
 else if(notice.examId)exists=(await db.select({id:schoolExamResults.id}).from(schoolExamResults).where(and(eq(schoolExamResults.schoolExamId,notice.examId),eq(schoolExamResults.studentUserId,user.id),eq(schoolExamResults.schoolId,notice.schoolId)))).length>0;
 if(!exists)throw new Error('İlgili kayıt artık bulunmuyor.');
 let href:string;
 if(notice.eventKey.startsWith('result-unlinked:')) href='/dashboard/notifications';
 else if(user.id===notice.studentId&&role==='student') href=notice.examId?'/dashboard/student/school-exams':'/dashboard/student/plan';
 else {
  if(!['teacher','principal'].includes(role)||membership?.schoolId!==notice.schoolId)throw new Error('Bu kayda güncel erişiminiz yok.');
  await requireStudentAccess(notice.studentId);
  href=`/dashboard/${role}/students/${notice.studentId}`;
 }
 await markLearningNotificationRead(id);
 return {href};
}
