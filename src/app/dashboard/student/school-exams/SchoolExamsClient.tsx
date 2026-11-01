"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  joinSchoolClass,
  getMySchoolInfo,
  getMySchoolExams,
  leaveSchool,
} from "@/server/actions/student-school";
import { getMyTeacherFeedbacks } from "@/server/actions/teacher";
import type { SchoolMemberInfo, SchoolStudentExamResult, TeacherFeedbackItem } from "@/types";
import { School, LogOut, ChevronDown } from "lucide-react";
import { StudentSection, StudentMetric, StudentSegments, StudentNotice, StudentEmpty, StudentModal, StudentLoading, studentInput, studentPrimary, studentDanger, studentButton } from "@/components/student/StudentUI";
const subjectNames:Record<string,string>={turkce:"Türkçe",matematik:"Matematik",geometri:"Geometri",fizik:"Fizik",kimya:"Kimya",biyoloji:"Biyoloji",tarih:"Tarih",cografya:"Coğrafya",felsefe:"Felsefe",din:"Din kültürü",edebiyat:"Edebiyat",tarih1:"Tarih-1",cografya1:"Coğrafya-1",tarih2:"Tarih-2",cografya2:"Coğrafya-2"};

export default function SchoolExamsClient() {
  const { reloadUserProfile } = useAuth();

  const [membership, setMembership] = useState<SchoolMemberInfo | null>(null);
  const [exams, setExams] = useState<SchoolStudentExamResult[]>([]);
  const [feedbacks, setFeedbacks] = useState<TeacherFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [pageError,setPageError]=useState("");
  const [leaveOpen,setLeaveOpen]=useState(false);
  const [examFilter,setExamFilter]=useState<"all"|"TYT"|"AYT">("all");
  const visibleExams=exams.filter(exam=>examFilter==="all"||exam.examType===examFilter);
  // Join form state
  const [joinCode, setJoinCode] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  // Leave state
  const [leaving, setLeaving] = useState(false);

  const loadData = () => Promise.all([
    getMySchoolInfo(),getMySchoolExams(),getMyTeacherFeedbacks(),
  ]).then(([mem,exList,fbList])=>{
    setMembership(mem);
    setExams([...exList].sort((a,b)=>new Date(b.examDate).getTime()-new Date(a.examDate).getTime()));
    setFeedbacks(fbList);
  }).catch(()=>setPageError("Okul bilgileri yüklenemedi. Sayfayı yenileyerek tekrar dene.")).finally(()=>setLoading(false));

  useEffect(() => {
    loadData();
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !studentNumber.trim()) {
      setJoinError("Lütfen sınıf kodunu ve okul numaranızı eksiksiz girin.");
      return;
    }
    setJoinError("");
    setJoining(true);
    try {
      const res=await joinSchoolClass({joinCode,studentNumber});
      if(!res.success){setJoinError(res.error||"Sınıfa katılınamadı.");return;}
      setJoinCode("");setStudentNumber("");
      await reloadUserProfile();setLoading(true);await loadData();
    } catch {setJoinError("Sınıfa katılınamadı. Bağlantını kontrol edip tekrar dene.");}
    finally{setJoining(false);}
  };

  const handleLeave = async () => {
    setLeaving(true);setPageError("");
    try {
      const result=await leaveSchool();
      if(!result.success){setPageError(result.error||"Sınıftan ayrılamadın.");return;}
      setLeaveOpen(false);await reloadUserProfile();setLoading(true);await loadData();
    }catch{setPageError("Sınıftan ayrılamadın. Tekrar deneyebilirsin.");}
    finally{setLeaving(false);}
  };

  if (loading) return <StudentLoading/>;

  return <div className="student-page">
    {pageError&&<StudentNotice error>{pageError}</StudentNotice>}
    {!membership ? <StudentSection title="Okuluna ve sınıfına katıl" description="Öğretmeninden aldığın sınıf koduyla okul sonuçlarını hesabına bağla.">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><form onSubmit={handleJoin} className="student-panel space-y-5">
        {joinError&&<StudentNotice error>{joinError}</StudentNotice>}
        <label className="student-field">Sınıf katılım kodu<input className={`${studentInput} font-mono uppercase`} value={joinCode} onChange={event=>setJoinCode(event.target.value.toUpperCase())} placeholder="Sınıf kodunu gir" required maxLength={32}/><small>Kodu öğretmeninden veya okul yönetiminden alabilirsin.</small></label>
        <label className="student-field">Okul numarası<input className={studentInput} value={studentNumber} onChange={event=>setStudentNumber(event.target.value)} placeholder="Örn. 1042" required maxLength={30}/><small>Sonuçların okul numaranla eşleştirilir.</small></label>
        <button disabled={joining} className={studentPrimary}><School size={16}/>{joining?"Katılınıyor…":"Sınıfa katıl"}</button>
      </form><div className="space-y-6 py-2"><h3 className="text-lg font-semibold">Okul sonuçların tek yerde</h3><p className="text-sm leading-7 text-[var(--text-muted)]">Okulunun paylaştığı deneme sonuçlarını, ders bazındaki netlerini ve sıralamanı buradan görebilirsin.</p><div className="border-t border-[var(--border)] pt-5"><h4 className="text-sm font-semibold">Öğretmen geri bildirimleri</h4><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">Öğretmenlerinin sana ilettiği çalışma önerileri sonuçlarının yanında yer alır.</p></div></div></div>
    </StudentSection> : <>
      <StudentSection title={membership.schoolName} description={`${membership.className||"Sınıf atanmadı"} · Okul numarası: ${membership.studentNumber||"—"}`} actions={<button disabled={leaving} onClick={()=>setLeaveOpen(true)} className={studentDanger}><LogOut size={15}/> Sınıftan ayrıl</button>}>
        <div className="student-metrics"><StudentMetric label="Okul denemesi" value={exams.length}/><StudentMetric label="Son deneme neti" value={exams[0]?Number(exams[0].totalNet).toFixed(2):"—"} tone="accent"/><StudentMetric label="Son sınıf sırası" value={exams[0]?.rankInClass?`#${exams[0].rankInClass}`:"—"}/><StudentMetric label="Son okul sırası" value={exams[0]?.rankInSchool?`#${exams[0].rankInSchool}`:"—"}/></div>
      </StudentSection>
      <StudentSection title="Okul deneme sonuçları" description="Sıralamalar okulunun paylaştığı sonuçlara göre gösterilir. Ders ayrıntıları için bir kaydı aç.">
        <div className="student-toolbar mb-5"><StudentSegments label="Sınav türü" value={examFilter} onChange={setExamFilter} options={[{value:"all",label:"Tümü"},{value:"TYT",label:"TYT"},{value:"AYT",label:"AYT"}]}/><span className="text-sm text-[var(--text-muted)]">{visibleExams.length} sonuç</span></div>
        {!visibleExams.length?<StudentEmpty title="Henüz sınav sonucu yok" description="Okulun sonuçları paylaştığında denemelerin burada listelenecek."/>:<div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{visibleExams.map(ex=><details key={ex.id} className="group py-1"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-5 py-4"><div className="min-w-0 flex-1"><span className="student-badge">{ex.examType}</span><h3 className="mt-2 font-semibold">{ex.examName}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(ex.examDate).toLocaleDateString("tr-TR")}</p></div><div className="flex items-center gap-5 text-right"><div><p className="text-xs text-[var(--text-muted)]">Sınıf sırası</p><p className="font-semibold">{ex.rankInClass?`#${ex.rankInClass}`:"—"}</p></div><div><p className="text-xs text-[var(--text-muted)]">Okul sırası</p><p className="font-semibold">{ex.rankInSchool?`#${ex.rankInSchool}`:"—"}</p></div><div><p className="text-xs text-[var(--text-muted)]">Net</p><p className="text-xl font-semibold tabular-nums text-[var(--link)]">{Number(ex.totalNet).toFixed(2)}</p></div><ChevronDown size={17} className="transition-transform group-open:rotate-180"/></div></summary><div className="student-table-wrap mb-4"><table className="student-table"><thead><tr><th>Ders</th><th className="numeric">Doğru</th><th className="numeric">Yanlış</th><th className="numeric">Net</th></tr></thead><tbody>{Object.entries(ex.scores||{}).map(([subject,score])=><tr key={subject}><td>{subjectNames[subject]||subject}</td><td className="numeric">{score.d}</td><td className="numeric">{score.y}</td><td className="numeric font-semibold">{Number(score.net).toFixed(2)}</td></tr>)}</tbody></table></div></details>)}</div>}
      </StudentSection>
      {feedbacks.length>0&&<StudentSection title="Öğretmen geri bildirimleri" description="Öğretmenlerinin senin için paylaştığı çalışma notları."><div className="divide-y divide-[var(--border)]">{feedbacks.map(fb=><article key={fb.id} className="py-4 first:pt-0"><div className="flex flex-wrap justify-between gap-2 text-sm"><p className="font-semibold">{fb.teacherName||"Öğretmenin"}{fb.className?` · ${fb.className}`:""}</p><time className="text-xs text-[var(--text-muted)]">{new Date(fb.createdAt).toLocaleDateString("tr-TR")}</time></div><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--text-muted)]">{fb.note}</p></article>)}</div></StudentSection>}
    </>}
    {leaveOpen&&<StudentModal title="Sınıftan ayrılmak istiyor musun?" description="Okul sonuçlarını ve öğretmen geri bildirimlerini bu bağlantı üzerinden görüntüleyemezsin. Kişisel denemelerin hesabında kalır." onClose={()=>{if(!leaving)setLeaveOpen(false);}}><div className="flex justify-end gap-3"><button className={studentButton} disabled={leaving} onClick={()=>setLeaveOpen(false)}>Vazgeç</button><button className={studentDanger} disabled={leaving} onClick={handleLeave}>{leaving?"Ayrılınıyor…":"Sınıftan ayrıl"}</button></div></StudentModal>}
  </div>;

}
