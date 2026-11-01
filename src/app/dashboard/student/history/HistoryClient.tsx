"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  getUserExams,
  deleteExam,
  updateExam,
} from "@/server/actions/exam";
import { filterStudentExams } from "@/lib/student-exams";
import { calculateNet } from "@/lib/exam";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronRight,
  Trash2,
  SquarePen,
  Save,
  Download,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { EXAM_CONFIG } from "@/constants";
import { StudentModal, StudentNotice, StudentScoreRow, studentPrimary, studentDanger, StudentHeaderActions, StudentSection, StudentMetric, StudentSegments, StudentEmpty, StudentLoading, studentButton, studentInput } from "@/components/student/StudentUI";
import type { ExamRecord } from "@/types";

const SUBJECT_LABELS: Record<string, string> = {
  turkce: "Türkçe",
  matematik: "Matematik",
  geometri: "Geometri",
  fizik: "Fizik",
  kimya: "Kimya",
  biyoloji: "Biyoloji",
  tarih: "Tarih",
  cografya: "Coğrafya",
  felsefe: "Felsefe",
  din: "Din",
  edebiyat: "Edebiyat",
  tarih1: "Tarih-1",
  cografya1: "Coğrafya-1",
  tarih2: "Tarih-2",
  cografya2: "Coğrafya-2",
};

interface ExamDetailModalProps {
  exam:ExamRecord;
  onClose:()=>void;
  onDelete:(id:string)=>Promise<void>;
  onUpdate:(id:string,data:Partial<ExamRecord>)=>Promise<void>;
}
function ExamDetailModal({exam,onClose,onDelete,onUpdate}:ExamDetailModalProps){
  const [isEditing,setIsEditing]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [draft,setDraft]=useState({name:exam.name,date:exam.date,scores:{...exam.scores}});
  const config=(EXAM_CONFIG[exam.type as keyof typeof EXAM_CONFIG] as Record<string,number>)||{};
  const updateScore=(subject:string,field:"d"|"y",value:number)=>setDraft(previous=>{const score={...previous.scores[subject],[field]:value};return {...previous,scores:{...previous.scores,[subject]:{...score,net:calculateNet(score.d,score.y)}}};});
  const save=async()=>{setError("");if(!draft.name.trim()||!draft.date){setError("Deneme adı ve tarihi gerekli.");return;}if(Object.entries(draft.scores).some(([key,score])=>score.d+score.y>(config[key]||40))){setError("Soru sayılarını kontrol et. Doğru ve yanlış toplamı dersin soru sayısını aşamaz.");return;}setBusy(true);try{await onUpdate(exam.id,{...draft,totalNet:Object.values(draft.scores).reduce((sum,score)=>sum+score.net,0)});setIsEditing(false);}catch(e){setError(e instanceof Error?e.message:"Deneme güncellenemedi.");}finally{setBusy(false);}};
  return <StudentModal title={isEditing?"Denemeyi düzenle":exam.name} description={`${exam.type}${exam.subtype?` / ${exam.subtype}`:""} · ${new Date(exam.date).toLocaleDateString("tr-TR")}`} onClose={()=>{if(!busy)onClose();}}>
    <div className="space-y-5">{error&&<StudentNotice error>{error}</StudentNotice>}
      {confirmDelete?<><StudentNotice error>Bu deneme ve ders sonuçları kalıcı olarak silinecek. Bu işlem geri alınamaz.</StudentNotice><div className="flex justify-end gap-3"><button disabled={busy} className={studentButton} onClick={()=>setConfirmDelete(false)}>Vazgeç</button><button disabled={busy} className={studentDanger} onClick={async()=>{setBusy(true);try{await onDelete(exam.id);onClose();}catch(e){setError(e instanceof Error?e.message:"Deneme silinemedi.");}finally{setBusy(false);}}}>{busy?"Siliniyor…":"Kalıcı olarak sil"}</button></div></>:<>
      {isEditing&&<div className="grid gap-4 sm:grid-cols-2"><label className="student-field">Deneme adı<input className={studentInput} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label className="student-field">Tarih<input className={studentInput} type="date" value={draft.date} onChange={e=>setDraft({...draft,date:e.target.value})}/></label></div>}
      {isEditing?<div>{Object.entries(draft.scores).map(([subject,score])=><StudentScoreRow key={subject} label={SUBJECT_LABELS[subject]||subject} values={score} max={config[subject]} onChange={(field,value)=>updateScore(subject,field,value)}/>)}</div>:<><div className="flex items-end justify-between border-y border-[var(--border)] py-4"><p className="text-sm text-[var(--text-muted)]">Toplam net</p><strong className="text-3xl font-semibold tabular-nums text-[var(--link)]">{exam.totalNet.toFixed(2)}</strong></div><div className="student-table-wrap"><table className="student-table"><thead><tr><th>Ders</th><th className="numeric">Doğru</th><th className="numeric">Yanlış</th><th className="numeric">Net</th></tr></thead><tbody>{Object.entries(exam.scores).map(([subject,score])=><tr key={subject}><td>{SUBJECT_LABELS[subject]||subject}</td><td className="numeric">{score.d}</td><td className="numeric">{score.y}</td><td className="numeric font-semibold">{score.net.toFixed(2)}</td></tr>)}</tbody></table></div></>}
      <div className="flex flex-wrap items-center justify-between gap-3"><button disabled={busy} className={studentDanger} onClick={()=>setConfirmDelete(true)}><Trash2 size={15}/> Sil</button><div className="flex gap-3">{isEditing?<><button disabled={busy} className={studentButton} onClick={()=>{setIsEditing(false);setDraft({name:exam.name,date:exam.date,scores:{...exam.scores}});}}>Vazgeç</button><button disabled={busy} className={studentPrimary} onClick={save}><Save size={15}/>{busy?"Kaydediliyor…":"Değişiklikleri kaydet"}</button></>:<button className={studentButton} onClick={()=>setIsEditing(true)}><SquarePen size={15}/> Düzenle</button>}</div></div>
      </>}
    </div>
  </StudentModal>;
}

// ---------- Mini Stats ----------
const MiniStats: React.FC<{ exams: ExamRecord[] }> = ({ exams }) => {
  const tytExams = exams.filter((e) => e.type === "TYT");
  const aytExams = exams.filter((e) => e.type === "AYT");

  const bestTyt =
    tytExams.length > 0 ? Math.max(...tytExams.map((e) => e.totalNet)) : null;
  const bestAyt =
    aytExams.length > 0 ? Math.max(...aytExams.map((e) => e.totalNet)) : null;

  const lastExamDate =
    exams.length > 0
      ? new Date(
          [...exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
            .date,
        ).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
        })
      : "—";

  return <div className="student-metrics">
    <StudentMetric label="Toplam deneme" value={exams.length} detail="Kişisel deneme kayıtların"/>
    <StudentMetric label="Son deneme" value={lastExamDate} detail="Son kayıt tarihi"/>
    <StudentMetric label="En yüksek TYT" value={bestTyt!==null?bestTyt.toFixed(2):"—"} tone="accent"/>
    <StudentMetric label="En yüksek AYT" value={bestAyt!==null?bestAyt.toFixed(2):"—"} tone="accent"/>
  </div>;
};

// ---------- Main Component ----------
const HistoryClient: React.FC = () => {
  const [loadError,setLoadError]=useState("");
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "TYT" | "AYT">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [dateFrom,setDateFrom] = useState("");
  const [dateTo,setDateTo] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchExams = async () => {
      if (user) {
        const data = await getUserExams();
        setExams(data);
      }
      setLoading(false);
    };
    if (user) void fetchExams().catch(()=>setLoadError("Denemeler yüklenemedi. Sayfayı yenileyerek tekrar dene.")).finally(()=>setLoading(false));
  }, [user]);

  const filteredExams = useMemo(() => {
    let list = [...exams];

    if (activeFilter === "TYT") list = list.filter((e) => e.type === "TYT");
    if (activeFilter === "AYT") list = list.filter((e) => e.type === "AYT");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.date.includes(q) ||
          e.type.toLowerCase().includes(q),
      );
    }

    list=filterStudentExams(list,dateFrom,dateTo);
    list.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [exams, activeFilter, searchQuery, sortOrder, dateFrom, dateTo]);

  if (loading) return <StudentLoading />;

  const handleDeleteExam = async (examId: string) => {
    const result = await deleteExam(examId);
    if (result.success) {
      setExams(exams.filter((e) => e.id !== examId));
    } else {
      throw new Error(result.error||"Silme işlemi başarısız oldu.");
    }
  };

  const handleUpdateExam = async (examId: string, updatedData: Partial<ExamRecord>) => {
    const result = await updateExam(examId, updatedData);
    if (result.success) {
      setExams((prev) =>
        prev.map((e) => (e.id === examId ? ({ ...e, ...updatedData } as ExamRecord) : e)),
      );
      setSelectedExam((prev) => (prev ? ({ ...prev, ...updatedData } as ExamRecord) : null));
    } else {
      throw new Error(result.error||"Güncelleme sırasında bir hata oluştu.");
    }
  };

  const handleExportJSON = () => {
    if (exams.length === 0) {
      alert("Dışa aktarılacak deneme bulunamadı.");
      return;
    }

    const exportedExams = exams.map((exam) => {
      const cleanScores: Record<string, { d: number; y: number }> = {};
      Object.entries(exam.scores || {}).forEach(([subject, stats]) => {
        cleanScores[subject] = {
          d: stats.d || 0,
          y: stats.y || 0,
        };
      });

      return {
        name: exam.name,
        date: exam.date,
        type: exam.type,
        subtype: exam.subtype || null,
        scores: cleanScores,
      };
    });

    const dataStr = JSON.stringify(exportedExams, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `puaniz_denemeler_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const getNetChange = (exam: ExamRecord) => {
    const sameType = exams
      .filter((e) => e.type === exam.type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const idx = sameType.findIndex((e) => e.id === exam.id);
    if (idx === -1 || idx >= sameType.length - 1) return null;
    return exam.totalNet - sameType[idx + 1].totalNet;
  };

  return (
    <div className="student-page">
      <StudentHeaderActions><button onClick={handleExportJSON} disabled={!exams.length} className={studentButton}><Download size={16}/> Dışa aktar</button></StudentHeaderActions>
      {loadError&&<StudentNotice error>{loadError}</StudentNotice>}
      {exams.length > 0 && <MiniStats exams={exams}/>}
      <StudentSection title="Deneme kayıtları" description={`${filteredExams.length} kayıt · Bir denemeyi açarak sonuçlarını inceleyebilir veya düzenleyebilirsin.`}>
        <div className="student-toolbar mb-5">
          <div className="relative min-w-48 flex-1"><Search size={16} className="absolute left-3 top-3 text-[var(--text-muted)]"/><input aria-label="Deneme ara" className={`${studentInput} !pl-10`} placeholder="Deneme adı veya tarih ara…" value={searchQuery} onChange={event=>setSearchQuery(event.target.value)}/></div>
          <StudentSegments value={activeFilter} onChange={setActiveFilter} label="Sınav türü" options={[{value:"all",label:"Tümü"},{value:"TYT",label:"TYT"},{value:"AYT",label:"AYT"}]}/>
          <button className={studentButton} onClick={()=>setSortOrder(sortOrder==="desc"?"asc":"desc")}><ArrowUpDown size={15}/>{sortOrder==="desc"?"En yeni":"En eski"}</button>
        </div>
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <label className="student-field flex-1 sm:max-w-48">Başlangıç tarihi<input type="date" className={studentInput} value={dateFrom} onChange={event=>setDateFrom(event.target.value)}/></label>
          <label className="student-field flex-1 sm:max-w-48">Bitiş tarihi<input type="date" className={studentInput} value={dateTo} min={dateFrom} onChange={event=>setDateTo(event.target.value)}/></label>
          {(searchQuery||activeFilter!=="all"||dateFrom||dateTo)&&<button className={studentButton} onClick={()=>{setSearchQuery("");setActiveFilter("all");setDateFrom("");setDateTo("");}}>Filtreleri temizle</button>}
        </div>
        {filteredExams.length === 0 ? <StudentEmpty title={exams.length?"Bu filtrelerle deneme bulunamadı":"İlk denemeni ekle"} description={exams.length?"Aramanı veya tarih aralığını değiştirmeyi dene.":"Deneme sonuçlarını ekledikçe gelişimini burada takip edebilirsin."}/> : <>
          <div className="student-table-wrap hidden md:block"><table className="student-table"><thead><tr><th>Tarih</th><th>Deneme</th><th>Sınav türü</th><th className="numeric">Toplam net</th><th className="numeric">Önceki denemeye göre</th><th><span className="sr-only">İşlem</span></th></tr></thead><tbody>{filteredExams.map(exam=>{const change=getNetChange(exam);return <tr key={exam.id}><td className="whitespace-nowrap text-[var(--text-muted)]">{new Date(exam.date).toLocaleDateString("tr-TR")}</td><td><button onClick={()=>setSelectedExam(exam)} className="text-left font-semibold hover:text-[var(--link)]">{exam.name}</button></td><td><span className="student-badge">{exam.type}{exam.subtype?` / ${exam.subtype}`:""}</span></td><td className="numeric font-semibold">{exam.totalNet.toFixed(2)}</td><td className="numeric"><span className={change===null?"text-[var(--text-muted)]":change<0?"text-[var(--err)]":"text-[var(--ok)]"}>{change===null?"—":`${change>0?"+":""}${change.toFixed(2)}`}</span></td><td className="numeric"><button className={studentButton} onClick={()=>setSelectedExam(exam)}>İncele <ChevronRight size={14}/></button></td></tr>;})}</tbody></table></div>
          <div className="divide-y divide-[var(--border)] border-y border-[var(--border)] md:hidden">{filteredExams.map(exam=><button key={exam.id} onClick={()=>setSelectedExam(exam)} className="flex w-full items-center justify-between gap-4 py-5 text-left"><div className="min-w-0"><span className="student-badge">{exam.type}</span><p className="mt-2 font-semibold">{exam.name}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{new Date(exam.date).toLocaleDateString("tr-TR")}</p></div><div className="shrink-0 text-right"><p className="text-xl font-semibold tabular-nums">{exam.totalNet.toFixed(2)}</p><span className="text-xs text-[var(--text-muted)]">net</span></div></button>)}</div>
        </>}
      </StudentSection>
      {selectedExam&&<ExamDetailModal key={selectedExam.id} exam={selectedExam} onClose={()=>setSelectedExam(null)} onDelete={handleDeleteExam} onUpdate={handleUpdateExam}/>}
    </div>
  );

};

export default HistoryClient;
