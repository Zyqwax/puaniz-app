"use server";

import { notifyLearning } from '@/server/learning-notifications';
import crypto from "node:crypto";
import { SCHOOL_IMPORT_VERSION, validateSchoolRows, validCalendarDate } from "@/lib/school-import";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { users, accounts } from "@/server/db/auth-schema";
import {
  classes,
  schoolMembers,
  teacherClasses,
  schoolExams,
  schoolExamResults,
  userProfiles,
  schoolAuditLog,
  schoolClassRevisions,
} from "@/server/db/schema";
import { requirePrincipal } from "@/server/school-auth";
import { hashPassword } from "better-auth/crypto";
import { toMessage } from "@/server/errors";
import type { ClassItem, SchoolExamRecord } from "@/types";

export interface CreateClassInput {
  name: string;
  grade: string;
  field?: string;
}

export interface BulkExamRowInput {
  studentNumber: string;
  studentName: string;
  className?: string;
  scores: Record<string, { d: number; y: number; net: number }>;
  totalNet: number;
}

export interface UploadBulkExamInput {
  examName: string;
  examType: "TYT" | "AYT";
  examDate: string;
  rows: BulkExamRowInput[];
}

function generateJoinCode(className: string): string {
  const cleanName = className.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `PZ-${cleanName}-${rand}`;
}

export async function createClass(
  input: CreateClassInput,
): Promise<{ success: boolean; classItem?: ClassItem; error?: string }> {
  try {
    const { user, schoolId } = await requirePrincipal();

    const joinCode = generateJoinCode(input.name);

    const [created] = await db.transaction(async tx => {
      const [row] = await tx.insert(classes).values({
        schoolId,
        name: input.name.trim(),
        grade: input.grade.trim(),
        field: input.field?.trim() || null,
        joinCode,
      }).returning();
      await tx.insert(schoolClassRevisions).values({schoolId,classId:row.id,actorId:user.id,action:"Sınıf oluşturuldu",reason:"Sınıf kaydı oluşturuldu",before:null,after:{name:row.name,grade:row.grade,field:row.field}});
      await tx.insert(schoolAuditLog).values({schoolId,actorId:user.id,action:"Sınıf oluşturuldu",details:JSON.stringify({classId:row.id,name:row.name,grade:row.grade,field:row.field})});
      return [row];
    });

    return {
      success: true,
      classItem: {
        id: created.id,
        schoolId: created.schoolId,
        name: created.name,
        grade: created.grade,
        field: created.field,
        joinCode: created.joinCode,
        studentCount: 0,
        createdAt: created.createdAt,
      },
    };
  } catch (err) {
    console.error("createClass error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function reviseSchoolClass(input:{classId:string;name:string;grade:string;field:string;reason:string}) {
  const {user,schoolId}=await requirePrincipal();
  const name=input.name.trim(),grade=input.grade.trim(),field=input.field.trim(),reason=input.reason.trim();
  if(!name||name.length>100||!grade||grade.length>20||field.length>30||!reason||reason.length>500)throw new Error("Sınıf bilgileri ve değişiklik gerekçesini kontrol edin.");
  await db.transaction(async tx=>{
    const [current]=await tx.select().from(classes).where(and(eq(classes.id,input.classId),eq(classes.schoolId,schoolId))).limit(1);
    if(!current)throw new Error("Sınıf bulunamadı.");
    const before={name:current.name,grade:current.grade,field:current.field};
    const after={name,grade,field:field||null};
    await tx.update(classes).set(after).where(eq(classes.id,current.id));
    await tx.insert(schoolClassRevisions).values({schoolId,classId:current.id,actorId:user.id,action:"Sınıf bilgileri güncellendi",reason,before,after});
    await tx.insert(schoolAuditLog).values({schoolId,actorId:user.id,action:"Sınıf bilgileri güncellendi",details:JSON.stringify({classId:current.id,reason,before,after})});
  });
}

export async function getSchoolClassRevisions(classId:string) {
  const {schoolId}=await requirePrincipal();
  const [room]=await db.select({id:classes.id}).from(classes).where(and(eq(classes.id,classId),eq(classes.schoolId,schoolId))).limit(1);
  if(!room)throw new Error("Sınıf bulunamadı.");
  return db.select({id:schoolClassRevisions.id,action:schoolClassRevisions.action,reason:schoolClassRevisions.reason,before:schoolClassRevisions.before,after:schoolClassRevisions.after,createdAt:schoolClassRevisions.createdAt,actorName:users.name})
    .from(schoolClassRevisions).leftJoin(users,eq(users.id,schoolClassRevisions.actorId)).where(and(eq(schoolClassRevisions.schoolId,schoolId),eq(schoolClassRevisions.classId,classId))).orderBy(desc(schoolClassRevisions.createdAt)).limit(20);
}

export async function getSchoolClasses(): Promise<ClassItem[]> {
  try {
    const { schoolId } = await requirePrincipal();

    const classList = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(classes.grade, classes.name);

    const studentCounts = await db
      .select({
        classId: schoolMembers.classId,
        count: sql<number>`count(${schoolMembers.id})::int`,
      })
      .from(schoolMembers)
      .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.role, "student")))
      .groupBy(schoolMembers.classId);

    const countMap = new Map<string, number>();
    for (const sc of studentCounts) {
      if (sc.classId) countMap.set(sc.classId, sc.count);
    }

    return classList.map((c) => ({
      id: c.id,
      schoolId: c.schoolId,
      name: c.name,
      grade: c.grade,
      field: c.field,
      joinCode: c.joinCode,
      studentCount: countMap.get(c.id) ?? 0,
      createdAt: c.createdAt,
    }));
  } catch (err) {
    console.error("getSchoolClasses error:", err);
    return [];
  }
}

export async function getClassStudents(classId: string) {
  try {
    const { schoolId } = await requirePrincipal();

    const students = await db
      .select({
        memberId: schoolMembers.id,
        userId: schoolMembers.userId,
        name: users.name,
        email: users.email,
        studentNumber: schoolMembers.studentNumber,
        joinedAt: schoolMembers.createdAt,
      })
      .from(schoolMembers)
      .innerJoin(users, eq(schoolMembers.userId, users.id))
      .where(
        and(
          eq(schoolMembers.schoolId, schoolId),
          eq(schoolMembers.classId, classId),
          eq(schoolMembers.role, "student"),
        ),
      )
      .orderBy(schoolMembers.studentNumber);

    return students;
  } catch (err) {
    console.error("getClassStudents error:", err);
    return [];
  }
}

export async function getSchoolTeachersWithClasses() {
  try {
    const { schoolId } = await requirePrincipal();

    const teachers = await db
      .select({
        id: schoolMembers.id,
        userId: schoolMembers.userId,
        name: users.name,
        email: users.email,
        title: schoolMembers.title,
      })
      .from(schoolMembers)
      .innerJoin(users, eq(schoolMembers.userId, users.id))
      .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.role, "teacher")))
      .orderBy(users.name);

    if (teachers.length === 0) return [];

    const assignments = await db
      .select({
        teacherId: teacherClasses.teacherId,
        classId: teacherClasses.classId,
        className: classes.name,
      })
      .from(teacherClasses)
      .innerJoin(classes, eq(teacherClasses.classId, classes.id))
      .where(eq(classes.schoolId, schoolId));

    const assignmentMap = new Map<string, { classId: string; className: string }[]>();
    for (const a of assignments) {
      const list = assignmentMap.get(a.teacherId) ?? [];
      list.push({ classId: a.classId, className: a.className });
      assignmentMap.set(a.teacherId, list);
    }

    return teachers.map((t) => ({
      ...t,
      assignedClasses: assignmentMap.get(t.userId) ?? [],
    }));
  } catch (err) {
    console.error("getSchoolTeachersWithClasses error:", err);
    return [];
  }
}

export async function assignTeacherClasses(input: {
  teacherId: string;
  classIds: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, schoolId } = await requirePrincipal();

    const [teacher] = await db.select({ id: schoolMembers.id }).from(schoolMembers).where(and(eq(schoolMembers.userId, input.teacherId), eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.role, "teacher"))).limit(1);
    if (!teacher) return { success: false, error: "Öğretmen bu okula kayıtlı değil." };
    // Verify classes belong to this school
    if (input.classIds.length > 0) {
      const schoolClassRows = await db
        .select({ id: classes.id })
        .from(classes)
        .where(and(eq(classes.schoolId, schoolId), inArray(classes.id, input.classIds)));

      if (schoolClassRows.length !== input.classIds.length) {
        return { success: false, error: "Geçersiz sınıf seçimi." };
      }
    }

    await db.transaction(async tx => {
    // Delete existing assignments for this teacher
    const ownClasses = await tx.select({ id: classes.id }).from(classes).where(eq(classes.schoolId, schoolId));
    const ownIds=ownClasses.map(c=>c.id);
    const before=ownIds.length?await tx.select({classId:teacherClasses.classId,className:classes.name}).from(teacherClasses).innerJoin(classes,eq(classes.id,teacherClasses.classId)).where(and(eq(teacherClasses.teacherId,input.teacherId),inArray(teacherClasses.classId,ownIds))):[];
    if (ownClasses.length) await tx.delete(teacherClasses).where(and(eq(teacherClasses.teacherId, input.teacherId), inArray(teacherClasses.classId, ownIds)));

    // Insert new assignments
    if (input.classIds.length > 0) {
      await tx.insert(teacherClasses).values(
        input.classIds.map((cid) => ({
          teacherId: input.teacherId,
          classId: cid,
        })),
      );
    }

    const after=input.classIds.length?await tx.select({classId:classes.id,className:classes.name}).from(classes).where(inArray(classes.id,input.classIds)):[];
    const reason=`Öğretmen: ${input.teacherId}; ${before.map(x=>x.className).join(", ")||"sınıf ataması yok"} → ${after.map(x=>x.className).join(", ")||"sınıf ataması yok"}`;
    for(const classId of new Set([...before.map(x=>x.classId),...after.map(x=>x.classId)])) await tx.insert(schoolClassRevisions).values({schoolId,classId,actorId:user.id,action:"Öğretmen sınıf yetkisi güncellendi",reason,before:{teacherId:input.teacherId,classIds:before.map(x=>x.classId)},after:{teacherId:input.teacherId,classIds:after.map(x=>x.classId)}});
    await tx.insert(schoolAuditLog).values({schoolId,actorId:user.id,action:"Öğretmen sınıf ataması güncellendi",details:JSON.stringify({teacherId:input.teacherId,before:before.map(x=>x.className),after:after.map(x=>x.className)})});
    });
    return { success: true };
  } catch (err) {
    console.error("assignTeacherClasses error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function uploadBulkExamResults(input: UploadBulkExamInput): Promise<{
  success: boolean;
  examId?: string;
  totalProcessed?: number;
  matchedCount?: number;
  error?: string;
}> {
  try {
    const { user, schoolId } = await requirePrincipal();

    if (!input.rows || input.rows.length === 0) {
      return { success: false, error: "Yüklenecek öğrenci verisi bulunamadı." };
    }

    if (!input.examName.trim() || input.examName.length > 200 || !['TYT','AYT'].includes(input.examType) || !validCalendarDate(input.examDate)) return { success: false, error: "Sınav adı, türü veya tarihi geçersiz." };
    if (input.rows.length > 10000) return { success: false, error: "Bir yüklemede en fazla 10.000 öğrenci olabilir." };
    const checked = validateSchoolRows(input.rows, input.examType);
    if (checked.issues.length) return { success: false, error: checked.issues.slice(0,10).map(i=>`${i.row}. satır / ${i.field}: ${i.message}`).join("\n") };
    const normalizedRows = checked.rows;
    const canonical = normalizedRows.map(row=>({...row,className:row.className||'',scores:Object.fromEntries(Object.entries(row.scores).sort(([a],[b])=>a.localeCompare(b)))})).sort((a,b)=>a.studentNumber.localeCompare(b.studentNumber));
    const importHash = crypto.createHash('sha256').update(JSON.stringify({version:SCHOOL_IMPORT_VERSION,name:input.examName.trim(),date:input.examDate,type:input.examType,rows:canonical})).digest('hex');
    // 1. Fetch all classes of this school to map className -> classId
    const schoolClassList = await db
      .select({ id: classes.id, name: classes.name })
      .from(classes)
      .where(eq(classes.schoolId, schoolId));

    const classByName = new Map<string, string>();
    for (const c of schoolClassList) {
      classByName.set(c.name.trim().toLocaleLowerCase('tr-TR'), c.id);
    }

    // 2. Fetch all registered students of this school (for studentNumber -> userId & classId mapping)
    const registeredStudents = await db
      .select({
        userId: schoolMembers.userId,
        studentNumber: schoolMembers.studentNumber,
        classId: schoolMembers.classId,
      })
      .from(schoolMembers)
      .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.role, "student")));

    const studentMap = new Map<string, { userId: string; classId: string | null }>();
    for (const s of registeredStudents) {
      if (s.studentNumber) {
        studentMap.set(s.studentNumber.trim(), { userId: s.userId, classId: s.classId });
      }
    }

    for(const [index,row] of normalizedRows.entries()) {
      const selectedClass = row.className ? classByName.get(row.className.toLocaleLowerCase('tr-TR')) : null;
      if(!selectedClass) return {success:false,error:`${index+2}. satır: Okulda kayıtlı sınıf adı gerekli.`};
      const matched = studentMap.get(row.studentNumber);
      if(matched?.classId && matched.classId!==selectedClass) return {success:false,error:`${index+2}. satır: Okul numarası ile sınıf kaydı çelişiyor.`};
    }
    return await db.transaction(async tx => {
    // Serialize concurrent identical uploads before checking the unique fingerprint.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${schoolId + importHash}, 0))`);
    const [existing] = await tx.select({id:schoolExams.id}).from(schoolExams).where(and(eq(schoolExams.schoolId,schoolId),eq(schoolExams.importHash,importHash))).limit(1);
    if(existing) return {success:false,error:"Bu sınav ve aynı sonuçlar daha önce yüklenmiş. Yeni kayıt oluşturulmadı.",examId:existing.id};
    // 3. Create school exam entry
    const [exam] = await tx
      .insert(schoolExams)
      .values({
        schoolId,
        name: input.examName.trim(),
        type: input.examType,
        date: input.examDate,
        uploadedBy: user.id,
        importHash,
      })
      .returning({ id: schoolExams.id });

    // 4. Calculate rankings
    // Sort all rows by totalNet descending for school rank
    const sortedRows = [...normalizedRows].sort((a, b) => b.totalNet - a.totalNet);

    // Group rows by class to calculate class rank
    const classGroups = new Map<string, typeof sortedRows>();

    const rowsWithMeta = sortedRows.map((r) => {
      const cleanNum = r.studentNumber.trim();
      const matched = studentMap.get(cleanNum);

      let targetClassId = matched?.classId || null;
      if (!targetClassId && r.className) {
        targetClassId = classByName.get(r.className.trim().toLocaleLowerCase('tr-TR')) || null;
      }

      const rowMeta = {
        ...r,
        studentNumber: cleanNum,
        studentUserId: matched?.userId || null,
        classId: targetClassId,
        rankInSchool: sortedRows.findIndex(x => x.totalNet === r.totalNet) + 1,
      };

      const groupKey = targetClassId || "unknown";
      const grp = classGroups.get(groupKey) ?? [];
      grp.push(rowMeta);
      classGroups.set(groupKey, grp);

      return rowMeta;
    });

    // Compute class ranks
    const finalResultsToInsert = rowsWithMeta.map((row) => {
      const groupKey = row.classId || "unknown";
      const grp = classGroups.get(groupKey) || [];
      const rankInClass = grp.findIndex((x) => x.totalNet === row.totalNet) + 1;

      return {
        schoolExamId: exam.id,
        schoolId,
        classId: row.classId,
        studentNumber: row.studentNumber,
        studentName: row.studentName.trim(),
        studentUserId: row.studentUserId,
        scores: row.scores,
        totalNet: String(row.totalNet),
        rankInClass: row.classId ? rankInClass : null,
        rankInSchool: row.rankInSchool,
      };
    });

    // 5. Bulk insert results in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < finalResultsToInsert.length; i += chunkSize) {
      const chunk = finalResultsToInsert.slice(i, i + chunkSize);
      await tx.insert(schoolExamResults).values(chunk);
    }

    await notifyLearning(tx,finalResultsToInsert.filter(r=>r.studentUserId).map(r=>({userId:r.studentUserId!,studentId:r.studentUserId!,schoolId,examId:exam.id,category:'results' as const,message:'Yeni okul denemesi sonucun hazır.',eventKey:`exam:${exam.id}:${r.studentUserId}`})),user.id);
    const matchedCount = finalResultsToInsert.filter((r) => r.studentUserId !== null).length;
    await tx.insert(schoolAuditLog).values({schoolId,actorId:user.id,action:"Sınav sonuçları yüklendi",details:`${input.examName.trim()}: ${finalResultsToInsert.length} sonuç, ${matchedCount} eşleşme (${SCHOOL_IMPORT_VERSION})`});

    return {
      success: true,
      examId: exam.id,
      totalProcessed: finalResultsToInsert.length,
      matchedCount,
    };
    });
  } catch (err) {
    console.error("uploadBulkExamResults error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export async function getSchoolExams(): Promise<SchoolExamRecord[]> {
  try {
    const { schoolId } = await requirePrincipal();

    const examsList = await db
      .select()
      .from(schoolExams)
      .where(eq(schoolExams.schoolId, schoolId))
      .orderBy(desc(schoolExams.date), desc(schoolExams.createdAt));

    const stats = await db
      .select({
        schoolExamId: schoolExamResults.schoolExamId,
        participants: sql<number>`count(${schoolExamResults.id})::int`,
        avgNet: sql<number>`round(avg(${schoolExamResults.totalNet}::numeric), 2)::float`,
      })
      .from(schoolExamResults)
      .where(eq(schoolExamResults.schoolId, schoolId))
      .groupBy(schoolExamResults.schoolExamId);

    const statsMap = new Map<string, { participants: number; avgNet: number }>();
    for (const s of stats) {
      statsMap.set(s.schoolExamId, { participants: s.participants, avgNet: s.avgNet });
    }

    return examsList.map((e) => ({
      id: e.id,
      schoolId: e.schoolId,
      name: e.name,
      type: e.type,
      date: e.date,
      totalParticipants: statsMap.get(e.id)?.participants ?? 0,
      averageNet: statsMap.get(e.id)?.avgNet ?? 0,
      createdAt: e.createdAt,
    }));
  } catch (err) {
    console.error("getSchoolExams error:", err);
    return [];
  }
}

export async function getSchoolExamDetails(examId: string) {
  try {
    const { schoolId } = await requirePrincipal();

    const [exam] = await db
      .select()
      .from(schoolExams)
      .where(and(eq(schoolExams.id, examId), eq(schoolExams.schoolId, schoolId)))
      .limit(1);

    if (!exam) return null;

    const results = await db
      .select({
        id: schoolExamResults.id,
        studentNumber: schoolExamResults.studentNumber,
        studentName: schoolExamResults.studentName,
        studentUserId: schoolExamResults.studentUserId,
        classId: schoolExamResults.classId,
        className: classes.name,
        scores: schoolExamResults.scores,
        totalNet: schoolExamResults.totalNet,
        rankInClass: schoolExamResults.rankInClass,
        rankInSchool: schoolExamResults.rankInSchool,
      })
      .from(schoolExamResults)
      .leftJoin(classes, eq(schoolExamResults.classId, classes.id))
      .where(eq(schoolExamResults.schoolExamId, examId))
      .orderBy(schoolExamResults.rankInSchool);

    return {
      exam,
      results,
    };
  } catch (err) {
    console.error("getSchoolExamDetails error:", err);
    return null;
  }
}

function generateTeacherPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let pass = "";
  for (let i = 0; i < 8; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Pz!${pass}`;
}

export async function createTeacherAccount(input: {
  name: string;
  email: string;
  title?: string;
}): Promise<{
  success: boolean;
  credentials?: { email: string; password: string; name: string };
  error?: string;
}> {
  try {
    const { schoolId } = await requirePrincipal();

    const cleanEmail = input.email.trim().toLowerCase();
    const cleanName = input.name.trim();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (existing) {
      return { success: false, error: "Bu e-posta adresiyle kayıtlı bir hesap zaten var." };
    }

    const rawPassword = generateTeacherPassword();
    const hashedPassword = await hashPassword(rawPassword);
    const userId = crypto.randomUUID();

    // 1. Create user
    await db.insert(users).values({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      emailVerified: true,
    });

    // 2. Create credential account
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hashedPassword,
    });

    // 3. User profile
    await db.insert(userProfiles).values({
      userId,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=7C3AED&color=fff&bold=true`,
    });

    // 4. Add to school members as teacher
    await db.insert(schoolMembers).values({
      schoolId,
      userId,
      role: "teacher",
      title: input.title?.trim() || "Öğretmen",
    });

    return {
      success: true,
      credentials: {
        email: cleanEmail,
        password: rawPassword,
        name: cleanName,
      },
    };
  } catch (err) {
    console.error("createTeacherAccount error:", err);
    return { success: false, error: toMessage(err) };
  }
}

export interface ClassPerformanceStat {
  classId: string;
  className: string;
  grade: string;
  field: string | null;
  studentCount: number;
  averageNet: number;
  examCount: number;
}

export async function getClassComparisonStats(): Promise<ClassPerformanceStat[]> {
  try {
    const { schoolId } = await requirePrincipal();

    const schoolClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.schoolId, schoolId))
      .orderBy(classes.grade, classes.name);

    if (schoolClasses.length === 0) return [];

    const stats = await db
      .select({
        classId: schoolExamResults.classId,
        avgNet: sql<number>`round(avg(${schoolExamResults.totalNet}::numeric), 2)::float`,
        examCount: sql<number>`count(distinct ${schoolExamResults.schoolExamId})::int`,
      })
      .from(schoolExamResults)
      .where(eq(schoolExamResults.schoolId, schoolId))
      .groupBy(schoolExamResults.classId);

    const statsMap = new Map<string, { avgNet: number; examCount: number }>();
    for (const s of stats) {
      if (s.classId) {
        statsMap.set(s.classId, { avgNet: s.avgNet, examCount: s.examCount });
      }
    }

    const studentCounts = await db
      .select({
        classId: schoolMembers.classId,
        count: sql<number>`count(${schoolMembers.id})::int`,
      })
      .from(schoolMembers)
      .where(and(eq(schoolMembers.schoolId, schoolId), eq(schoolMembers.role, "student")))
      .groupBy(schoolMembers.classId);

    const studentCountMap = new Map<string, number>();
    for (const sc of studentCounts) {
      if (sc.classId) studentCountMap.set(sc.classId, sc.count);
    }

    return schoolClasses.map((c) => ({
      classId: c.id,
      className: c.name,
      grade: c.grade,
      field: c.field,
      studentCount: studentCountMap.get(c.id) ?? 0,
      averageNet: statsMap.get(c.id)?.avgNet ?? 0,
      examCount: statsMap.get(c.id)?.examCount ?? 0,
    }));
  } catch (err) {
    console.error("getClassComparisonStats error:", err);
    return [];
  }
}
