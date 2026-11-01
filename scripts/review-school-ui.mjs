/** Disposable local-only fixture for browser checks. No real user accounts are modified. */
import {registerHooks} from 'node:module';
import {existsSync,readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {hashPassword} from 'better-auth/crypto';
process.loadEnvFile('.env.local');
if(!['localhost','127.0.0.1','::1','[::1]'].includes(new URL(process.env.DATABASE_URL).hostname))throw new Error('UI fixture yalnızca yerel veritabanında kullanılabilir.');
const root=fileURLToPath(new URL('../src/',import.meta.url));
registerHooks({resolve(specifier,context,next){
 if(specifier==='server-only')return {url:'data:text/javascript,export {}',shortCircuit:true};
 let candidate;if(specifier.startsWith('@/'))candidate=root+specifier.slice(2);else if(specifier.startsWith('.')&&context.parentURL?.includes('/src/'))candidate=fileURLToPath(new URL(specifier,context.parentURL));
 if(candidate)for(const suffix of ['','.ts','/index.ts'])if(existsSync(candidate+suffix)&&(candidate+suffix).endsWith('.ts'))return {url:pathToFileURL(candidate+suffix).href,shortCircuit:true};
 return next(specifier,context);
}});
const {db}=await import('../src/server/db/index.ts');
const {users,accounts}=await import('../src/server/db/auth-schema.ts');
const {schools,classes,schoolMembers,teacherClasses,schoolExams,schoolExamResults,userProfiles}=await import('../src/server/db/schema.ts');
const {eq,inArray}=await import('drizzle-orm');
const path='/tmp/puaniz-ui-review.json';
try {
 if(process.argv[2]==='cleanup'){
  const fixture=JSON.parse(readFileSync(path,'utf8'));
  if(!fixture.userIds.every(id=>id.startsWith('ui-review-')))throw new Error('Fixture kimlikleri geçersiz.');
  await db.transaction(async tx=>{await tx.delete(schools).where(eq(schools.id,fixture.schoolId));await tx.delete(users).where(inArray(users.id,fixture.userIds));});unlinkSync(path);console.log('Geçici UI okulu ve hesapları temizlendi.');
 }else {
  if(existsSync(path))throw new Error('Önce mevcut UI fixture temizlenmeli.');
  const token=randomUUID();
  // Deliberately public test-only password; accounts exist solely in an isolated local fixture.
  const password=await hashPassword('PuanizLocalReview!2026');
  const login=['principal','teacher','student'].map(role=>({id:`ui-review-${role}-${token}`,name:`UI Test ${role}`,email:`ui-${role}-${token}@example.invalid`,emailVerified:true}));
  const passive=Array.from({length:28},(_,i)=>({id:`ui-review-passive-${i}-${token}`,name:`UI Test Öğrenci ${i+2}`,email:`ui-passive-${i}-${token}@example.invalid`,emailVerified:true}));
  const fixture=await db.transaction(async tx=>{
   await tx.insert(users).values([...login,...passive]);
   await tx.insert(accounts).values(login.map(a=>({id:randomUUID(),accountId:a.id,userId:a.id,providerId:'credential',password})));
   await tx.insert(userProfiles).values(login.map(a=>({userId:a.id,grade:'12',field:'SAY'})));
   const [school]=await tx.insert(schools).values({name:'UI Kontrol Okulu',code:`UI-REVIEW-${token}`}).returning();
   const [room]=await tx.insert(classes).values({schoolId:school.id,name:'UI 12-A',grade:'12',field:'SAY',joinCode:`UI-CLASS-${token}`}).returning();
   const students=[login[2],...passive];
   await tx.insert(schoolMembers).values([{schoolId:school.id,userId:login[0].id,role:'principal'},{schoolId:school.id,userId:login[1].id,role:'teacher'},...students.map((s,i)=>({schoolId:school.id,userId:s.id,role:'student',classId:room.id,studentNumber:String(i+1)}))]);
   await tx.insert(teacherClasses).values({teacherId:login[1].id,classId:room.id});
   const [exam]=await tx.insert(schoolExams).values({schoolId:school.id,name:'UI Kontrol TYT',type:'TYT',date:'2026-11-01',uploadedBy:login[0].id}).returning();
   const results=await tx.insert(schoolExamResults).values([...students.slice(0,28).map((s,i)=>({schoolId:school.id,schoolExamId:exam.id,classId:room.id,studentUserId:s.id,studentNumber:String(i+1),studentName:s.name,scores:{'Türkçe':{d:10+i,y:0,net:10+i}},totalNet:String(10+i)})),{schoolId:school.id,schoolExamId:exam.id,studentNumber:'999',studentName:'UI Eşleşmeyen Kayıt',scores:{'Türkçe':{d:5,y:0,net:5}},totalNet:'5'}]).returning();
   return {schoolId:school.id,classId:room.id,examId:exam.id,resultId:results[0].id,unmatchedId:results.at(-1).id,userIds:[...login,...passive].map(a=>a.id),login:login.map((a,i)=>({role:['principal','teacher','student'][i],email:a.email})),studentId:login[2].id};
  });
  writeFileSync(path,JSON.stringify(fixture));console.log(JSON.stringify(fixture));
 }
}finally{await db.$client.end();}
