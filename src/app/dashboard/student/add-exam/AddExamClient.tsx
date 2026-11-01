"use client";

import React, { useState, useMemo, useCallback, type ChangeEvent } from "react";
import {
  Save,
  Upload,
  Loader2,
  Calculator,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EXAM_CONFIG, type ExamType } from "@/constants";
import { addExam } from "@/server/actions/exam";
import { StudentScoreRow as SubjectInput, StudentHeaderActions, StudentSection, StudentSegments, StudentModal, StudentNotice, studentInput, studentButton, studentPrimary } from "@/components/student/StudentUI";
import { calculateNet } from "@/lib/exam";
import { useRouter } from "next/navigation";
import type { SubjectScore } from "@/types";

type AYTSubtype = "SAY" | "EA" | "SOZ";

const AddExamClient: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState<ExamType>("TYT");
  const [aytSubtype, setAytSubtype] = useState<AYTSubtype>("SAY");
  const [examName, setExamName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState("");

  const [scores, setScores] = useState<Record<string, { d: number; y: number }>>({
    turkce: { d: 0, y: 0 },
    tarih: { d: 0, y: 0 },
    cografya: { d: 0, y: 0 },
    felsefe: { d: 0, y: 0 },
    din: { d: 0, y: 0 },
    matematik: { d: 0, y: 0 },
    geometri: { d: 0, y: 0 },
    fizik: { d: 0, y: 0 },
    kimya: { d: 0, y: 0 },
    biyoloji: { d: 0, y: 0 },
    edebiyat: { d: 0, y: 0 },
    tarih1: { d: 0, y: 0 },
    cografya1: { d: 0, y: 0 },
    tarih2: { d: 0, y: 0 },
    cografya2: { d: 0, y: 0 },
  });

  const getGroupedSubjects = useCallback(() => {
    if (examType === "TYT") {
      return [
        { title: "Türkçe Testi", subjects: ["turkce"] },
        { title: "Sosyal Bilimler Testi", subjects: ["tarih", "cografya", "felsefe", "din"] },
        { title: "Temel Matematik Testi", subjects: ["matematik", "geometri"] },
        { title: "Fen Bilimleri Testi", subjects: ["fizik", "kimya", "biyoloji"] },
      ];
    }
    switch (aytSubtype) {
      case "SAY":
        return [
          { title: "Matematik Testi", subjects: ["matematik", "geometri"] },
          { title: "Fen Bilimleri Testi", subjects: ["fizik", "kimya", "biyoloji"] },
        ];
      case "EA":
        return [
          { title: "Matematik Testi", subjects: ["matematik", "geometri"] },
          { title: "Edebiyat - Sosyal Bilimler-1", subjects: ["edebiyat", "tarih1", "cografya1"] },
        ];
      case "SOZ":
        return [
          { title: "Edebiyat - Sosyal Bilimler-1", subjects: ["edebiyat", "tarih1", "cografya1"] },
          { title: "Sosyal Bilimler-2 Testi", subjects: ["tarih2", "cografya2", "felsefe", "din"] },
        ];
      default:
        return [];
    }
  }, [examType, aytSubtype]);

  const getActiveSubjects = useCallback(() => {
    return getGroupedSubjects().flatMap((g) => g.subjects);
  }, [getGroupedSubjects]);

  const totalNet = useMemo(() => {
    let total = 0;
    const subjects = getActiveSubjects();
    subjects.forEach((key) => {
      total += calculateNet(scores[key]?.d || 0, scores[key]?.y || 0);
    });
    return total;
  }, [scores, getActiveSubjects]);

  const handleScoreChange = (subject: string, field: "d" | "y", value: number) => {
    setScores((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!examName.trim()) return setError("Lütfen deneme adı gir.");
    setError("");
    if (!user) return setError("Kullanıcı oturumu bulunamadı.");

    const activeSubjects = getActiveSubjects();
    const config = EXAM_CONFIG[examType] as Record<string, number>;

    for (const sub of activeSubjects) {
      const limit = config[sub] || 40;
      const total = (scores[sub]?.d || 0) + (scores[sub]?.y || 0);
      if (total > limit) {
        return setError(`${sub.toUpperCase()} alanındaki soru sayısını kontrol et.`);
      }
    }

    setLoading(true);

    const examDataScores: Record<string, SubjectScore> = {};
    let calculatedTotal = 0;
    activeSubjects.forEach((sub) => {
      const net = calculateNet(scores[sub].d || 0, scores[sub].y || 0);
      examDataScores[sub] = { ...scores[sub], net };
      calculatedTotal += net;
    });

    const examData = {
      name: examName,
      date: date,
      type: examType,
      subtype: examType === "AYT" ? aytSubtype : undefined,
      scores: examDataScores,
      totalNet: calculatedTotal,
    };

    try {
      const result=await addExam(examData);
      if(result.success){setSaved(true);router.push("/dashboard/student/history");}
      else setError(result.error||"Deneme kaydedilemedi.");
    }catch{setError("Deneme kaydedilemedi. Bağlantını kontrol edip tekrar dene.");}
    finally{setLoading(false);}
  };

  const handleJsonUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    e.target.value="";
    setImportResult("");
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        const exams = Array.isArray(jsonData) ? jsonData : [jsonData];

        if (exams.length === 0) {
          return setImportResult("Yüklenen dosya boş veya geçersiz formatta.");
        }

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const exam of exams) {
          if (!exam.name || !exam.type || !exam.scores) {
            failCount++;
            continue;
          }

          const config = EXAM_CONFIG[exam.type as ExamType] as Record<string, number> | undefined;

          if (!config) {
            failCount++;
            continue;
          }

          const parsedScores: Record<string, SubjectScore> = {};
          let calculatedTotal = 0;

          for (const [subject, score] of Object.entries(exam.scores as Record<string, { d?: number; y?: number }>)) {
            const d = Number(score.d) || 0;
            const y = Number(score.y) || 0;
            const net = calculateNet(d, y);
            parsedScores[subject] = { d, y, net };
            calculatedTotal += net;
          }

          const examData = {
            name: exam.name as string,
            date: (exam.date as string) || new Date().toISOString().split("T")[0],
            type: exam.type as ExamType,
            subtype: exam.type === "AYT" ? (exam.subtype || "SAY") : undefined,
            scores: parsedScores,
            totalNet: calculatedTotal,
          };

          const result = await addExam(examData);
          if (result.success) successCount++;
          else failCount++;
        }

        setLoading(false);
        setImportResult(`Aktarım tamamlandı: ${successCount} başarılı, ${failCount} hatalı kayıt.`);
      } catch (error) {
        console.error("JSON parse hatası:", error);
        setImportResult("Dosya okunamadı veya geçersiz JSON formatı.");
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const labels: Record<string, string> = {
    turkce: "Türkçe",
    matematik: "Matematik",
    geometri: "Geometri",
    fizik: "Fizik",
    kimya: "Kimya",
    biyoloji: "Biyoloji",
    tarih: "Tarih",
    cografya: "Coğrafya",
    felsefe: "Felsefe",
    din: "Din Kültürü",
    edebiyat: "Edebiyat",
    tarih1: "Tarih-1",
    cografya1: "Coğrafya-1",
    tarih2: "Tarih-2",
    cografya2: "Coğrafya-2",
  };

  const hasInvalidScore = getActiveSubjects().some(subject => {
    const limit = (EXAM_CONFIG[examType] as Record<string,number>)[subject] || 40;
    return scores[subject].d + scores[subject].y > limit;
  });

  const aytOptions: Array<{ value: AYTSubtype; label: string }> = [
    { value: "SAY", label: "Sayısal" },
    { value: "EA", label: "Eşit Ağırlık" },
    { value: "SOZ", label: "Sözel" },
  ];

  return (
    <div className="student-page">
      <StudentHeaderActions><button type="button" className={studentButton} onClick={() => setImportOpen(true)}><Upload size={16}/> Dosyadan aktar</button></StudentHeaderActions>
      {error && <StudentNotice error>{error}</StudentNotice>}
      <StudentSection title="Deneme bilgileri" description="Sınav türünü seç, deneme adını ve tarihini gir.">
        <div className="student-toolbar mb-5">
          <StudentSegments value={examType} onChange={setExamType} label="Sınav türü" options={[{value:"TYT",label:"TYT"},{value:"AYT",label:"AYT"}]}/>
          {examType === "AYT" && <StudentSegments value={aytSubtype} onChange={setAytSubtype} label="AYT alanı" options={aytOptions}/>}
        </div>
        <div className="student-form-grid">
          <label className="student-field">Deneme adı<input className={studentInput} value={examName} onChange={e => setExamName(e.target.value)} placeholder="Örn. 3D Türkiye Geneli" maxLength={120}/></label>
          <label className="student-field">Sınav tarihi<input className={studentInput} type="date" value={date} onChange={e => setDate(e.target.value)}/></label>
        </div>
      </StudentSection>
      <StudentSection title="Ders sonuçları" description="Doğru ve yanlış sayılarını gir. Boş ve net değerleri otomatik hesaplanır.">
        <div className="student-score-heading"><span>Ders</span>{["Doğru","Yanlış","Boş","Net"].map(label=><span key={label} className="text-center">{label}</span>)}</div>
        {getGroupedSubjects().map(group => <div key={group.title} className="pt-5">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{group.title}</h3>
          {group.subjects.map(sub => <SubjectInput key={sub} label={labels[sub] || sub} values={scores[sub]} max={(EXAM_CONFIG[examType] as Record<string,number>)[sub]} onChange={(field,value)=>handleScoreChange(sub,field,value)}/>)}
        </div>)}
      </StudentSection>
      <div className="student-panel sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-4 !py-4 md:bottom-4">
        <div className="flex items-center gap-3"><Calculator size={20} className="text-[var(--link)]"/><div><p className="text-xs text-[var(--text-muted)]">Toplam net · {examType}{examType === "AYT" ? ` / ${aytSubtype}` : ""}</p><p className="text-2xl font-semibold tabular-nums">{totalNet.toFixed(2)}</p></div></div>
        <button type="button" onClick={handleSave} disabled={loading || saved || !examName.trim() || !date || hasInvalidScore} className={studentPrimary}>{loading?<Loader2 size={16} className="animate-spin"/>:saved?<Check size={16}/>:<Save size={16}/>} {loading?"Kaydediliyor…":saved?"Kaydedildi":"Denemeyi kaydet"}</button>
      </div>
      {importOpen && <StudentModal title="Denemeleri dosyadan aktar" description="Daha önce dışa aktardığın JSON dosyasını seç. Birden fazla deneme içerebilir." onClose={()=>{if(!loading)setImportOpen(false);}}>
        <div className="space-y-5"><StudentNotice>Geçmiş sayfasındaki “Dışa aktar” işlemiyle oluşturulan dosyaları kullanabilirsin.</StudentNotice><label className="student-field">JSON dosyası<input className={studentInput} type="file" accept=".json,application/json" onChange={handleJsonUpload} disabled={loading}/></label>{loading&&<p className="flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin"/> Denemeler aktarılıyor…</p>}{importResult&&<StudentNotice>{importResult}</StudentNotice>}<div className="flex justify-end"><button type="button" disabled={loading} className={studentButton} onClick={()=>setImportOpen(false)}>Tamam</button></div></div>
      </StudentModal>}
    </div>
  );

};

export default AddExamClient;
