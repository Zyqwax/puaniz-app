"use server";
import { eq,sql } from 'drizzle-orm';
import { db } from '@/server/db';
import { classes,schoolAuditLog,teacherClasses } from '@/server/db/schema';
import { getUserRoleContext } from '@/server/school-auth';
import { validCalendarDate } from '@/lib/school-import';
import type { LearningReport,LearningReportFilters,LearningReportMetric,LearningReportRole } from '@/lib/learning-report';

export async function getLearningReport(role:LearningReportRole,input:Partial<LearningReportFilters>={}):Promise<LearningReport> {
 const context=await getUserRoleContext();
 if(!['student','teacher','principal'].includes(role)||context.role!==role)throw new Error('Bu rapor kapsamına erişiminiz yok.');
 const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
 const year=Number(today.slice(0,4))-(Number(today.slice(5,7))<9?1:0);
 const filters:LearningReportFilters={type:input.type??'TYT',from:input.from||`${year}-09-01`,to:input.to||today,classId:input.classId??'',grade:input.grade??'',field:input.field??'',source:input.source??''};
 if(!['TYT','AYT'].includes(filters.type)||!validCalendarDate(filters.from)||!validCalendarDate(filters.to)||filters.from>filters.to||Date.parse(filters.to)-Date.parse(filters.from)>730*86400000||filters.grade.length>20||filters.field.length>20||!['','Kişisel','Okul'].includes(filters.source))throw new Error('Filtreleri kontrol edin. Rapor dönemi en fazla 731 gün olabilir.');
 const schoolId=context.membership?.schoolId;
 let classRows:LearningReport['classes']=[];
 if(role!=='student') {
  if(!schoolId)throw new Error('Okul kaydı gerekli.');
  classRows=await db.select({id:classes.id,name:classes.name,grade:classes.grade,field:classes.field}).from(classes).where(eq(classes.schoolId,schoolId));
  if(role==='teacher') {
   const assigned=await db.select({id:teacherClasses.classId}).from(teacherClasses).where(eq(teacherClasses.teacherId,context.user.id));
   classRows=classRows.filter(c=>assigned.some(a=>a.id===c.id));
  }
 }
 if(role!=='student'&&filters.source&&filters.source!=='Okul')throw new Error('Personel raporları yalnızca okul verilerini içerir.');
 if(filters.from<'1900-01-01'||filters.to>'2199-12-31')throw new Error('Rapor tarihleri 1900–2199 arasında olmalı.');
 if(filters.classId&&!classRows.some(c=>c.id===filters.classId))throw new Error('Sınıf kapsamı geçersiz.');
 if(role==='student'&&(filters.grade||filters.field))throw new Error('Öğrenci raporunda okul kapsamı filtresi kullanılamaz.');
 const classIds=classRows.filter(c=>(!filters.classId||c.id===filters.classId)&&(!filters.grade||c.grade===filters.grade)&&(!filters.field||c.field===filters.field)).map(c=>c.id);
 const classFilter=classIds.length?sql`r.class_id in (${sql.join(classIds.map(id=>sql`${id}::uuid`),sql`, `)})`:sql`false`;
 const source=role==='student'?sql`
  select e.date,e.type,e.total_net as net,e.user_id as student_key,null::uuid as class_id,null::text as class_name,'Kişisel'::text as source from exams e where e.user_id=${context.user.id}
  union all select e.date,e.type,r.total_net,r.student_user_id,r.class_id,null::text,'Okul'::text from school_exam_results r join school_exams e on e.id=r.school_exam_id where r.student_user_id=${context.user.id}
 `:sql`
  select e.date,e.type,r.total_net as net,coalesce(r.student_user_id,'number:'||r.student_number) as student_key,r.class_id,c.name as class_name,'Okul'::text as source
  from school_exam_results r join school_exams e on e.id=r.school_exam_id join classes c on c.id=r.class_id
  where r.school_id=${schoolId!} and c.school_id=${schoolId!} and ${classFilter}
 `;
 const duration=Date.parse(filters.to)-Date.parse(filters.from)+86400000;
 const previousFrom=new Date(Date.parse(filters.from)-duration).toISOString().slice(0,10);
 const sourceFilter=role==='student'&&filters.source?sql`source=${filters.source}`:sql`true`;
 const result=await db.execute(sql`
  with scoped as (${source}), filtered as (select * from scoped where type=${filters.type} and date>=${previousFrom}::date and date<=${filters.to}::date and ${sourceFilter}),
  periods as (select *,case when date>=${filters.from}::date then 'current' else 'previous' end as period from filtered)
  select period as kind,null::text as label,null::text as class_id,count(*)::int as count,count(distinct student_key)::int as students,avg(net)::float as average,percentile_cont(0.5) within group(order by net::float) as median,min(net)::float as minimum,max(net)::float as maximum from periods group by period
  union all
  select 'class',class_name,class_id::text,count(*)::int,count(distinct student_key)::int,avg(net)::float,percentile_cont(0.5) within group(order by net::float),min(net)::float,max(net)::float from periods where period='current' and class_name is not null group by class_name,class_id
  union all
  select 'date',date::text,null::text,count(*)::int,count(distinct student_key)::int,avg(net)::float,percentile_cont(0.5) within group(order by net::float),min(net)::float,max(net)::float from periods where period='current' group by date
 `);
 const rows=Array.from(result);
 const metric=(row:typeof rows[number]|undefined):LearningReportMetric=>{
  const students=Number(row?.students??0),count=Number(row?.count??0),suppressed=role!=='student'&&students>0&&students<5;
  const numeric=(key:string)=>row?.[key]==null||suppressed?null:Number(row[key]);
  return {students,count,suppressed,average:numeric('average'),median:numeric('median'),minimum:numeric('minimum'),maximum:numeric('maximum')};
 };
 const current=metric(rows.find(r=>r.kind==='current')),previous=metric(rows.find(r=>r.kind==='previous'));
 const groups=rows.filter(r=>r.kind==='class').map(r=>({...metric(r),name:String(r.label),classId:String(r.class_id)})).sort((a,b)=>a.name.localeCompare(b.name,'tr'));
 const trend=rows.filter(r=>r.kind==='date').map(r=>({...metric(r),date:String(r.label)})).sort((a,b)=>a.date.localeCompare(b.date));
 // Suppress the total too when class values could otherwise expose a small group by subtraction.
 if(role!=='student'&&groups.some(g=>g.suppressed)){Object.assign(current,{average:null,median:null,minimum:null,maximum:null,suppressed:true});for(const day of trend)Object.assign(day,{average:null,median:null,minimum:null,maximum:null,suppressed:true});}
 return {role,filters,classes:classRows,current,previous,delta:current.average===null||previous.average===null?null:current.average-previous.average,groups,trend,generatedAt:new Date().toISOString(),schoolName:role==='student'?'Kişisel gelişim raporu':context.membership!.schoolName,authorName:context.user.name,privacyNote:role==='student'?'Yalnızca kendi kayıtlarınız. Kişisel ve okul sonuçları kaynak filtresine göre birlikte bulunabilir.':'Bu rapor öğrenci adlarını içermez. 5 öğrenciden küçük gruplarda net istatistikleri gizlenir. Bu önlem raporun anonim olduğunu garanti etmez.'};
}
export async function exportLearningReport(role:LearningReportRole,filters:LearningReportFilters,format:'csv'|'pdf') {
 if(!['csv','pdf'].includes(format))throw new Error('Geçersiz rapor biçimi.');
 const report=await getLearningReport(role,filters);const context=await getUserRoleContext();
 if(role!=='student'&&context.membership)await db.insert(schoolAuditLog).values({schoolId:context.membership.schoolId,actorId:context.user.id,action:'Dönem raporu dışa aktarıldı',details:JSON.stringify({format,...report.filters})});
 return report;
}
