"use client";

import React, { useState, useMemo, useCallback, type ChangeEvent } from "react";
import {
  Save,
  AlertCircle,
  Upload,
  CirclePlus,
  Loader2,
  Calculator,
  Check,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EXAM_CONFIG, type ExamType } from "@/constants";
import { addExam } from "@/server/actions/exam";
import { calculateNet } from "@/lib/exam";
import { useRouter } from "next/navigation";
import type { SubjectScore } from "@/types";

const colorDot: Record<string, string> = {
  blue: "bg-[#2F6BFF]",
  navy: "bg-[var(--brand)]",
  amber: "bg-[#FFB020]",
  lightblue: "bg-[#7FB0FF]",
};

interface SubjectInputProps {
  label: string;
  values: { d: number; y: number };
  onChange: (field: "d" | "y", value: number) => void;
  color?: string;
  max?: number;
}

const SubjectInput: React.FC<SubjectInputProps> = ({
  label,
  values,
  onChange,
  color = "blue",
  max = 40,
}) => {
  const total = (values.d || 0) + (values.y || 0);
  const isInvalid = total > max;
  const net = calculateNet(values.d || 0, values.y || 0);

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isInvalid
          ? "border-[var(--err)] bg-[var(--err-bg)]"
          : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-strong)]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${colorDot[color] || colorDot.blue}`}
          />
          <span className="text-sm font-bold text-[var(--text)]">{label}</span>
        </div>
        <span className="text-[11px] font-medium text-[var(--text-muted)]">{max} soru</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="number"
            min="0"
            max={max}
            value={values.d || ""}
            onChange={(e) => onChange("d", parseInt(e.target.value) || 0)}
            placeholder="D"
            aria-label={`${label} Doğru Sayısı`}
            className={`w-full bg-[var(--surface)] border rounded-xl px-2.5 py-2 text-center text-sm font-bold text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none transition-all ${
              isInvalid
                ? "border-[var(--err)] focus:border-[var(--err)]"
                : "border-[var(--border-strong)] focus:border-[#7FB0FF] focus:ring-2 focus:ring-[#7FB0FF]/25"
            }`}
          />
          <span className="block text-[10px] font-semibold text-[var(--text-muted)] text-center mt-1">
            Doğru
          </span>
        </div>

        <div className="flex-1">
          <input
            type="number"
            min="0"
            max={max}
            value={values.y || ""}
            onChange={(e) => onChange("y", parseInt(e.target.value) || 0)}
            placeholder="Y"
            aria-label={`${label} Yanlış Sayısı`}
            className={`w-full bg-[var(--surface)] border rounded-xl px-2.5 py-2 text-center text-sm font-bold text-[var(--text)] placeholder-[var(--text-subtle)] focus:outline-none transition-all ${
              isInvalid
                ? "border-[var(--err)] focus:border-[var(--err)]"
                : "border-[var(--border-strong)] focus:border-[#7FB0FF] focus:ring-2 focus:ring-[#7FB0FF]/25"
            }`}
          />
          <span className="block text-[10px] font-semibold text-[var(--text-muted)] text-center mt-1">
            Yanlış
          </span>
        </div>

        <div className="w-16 text-center">
          <div
            className={`text-lg font-black tabular-nums ${
              isInvalid
                ? "text-[var(--err)]"
                : net > 0
                  ? "text-[var(--text)]"
                  : "text-[var(--text-muted)]"
            }`}
          >
            {net.toFixed(1)}
          </div>
          <span className="block text-[10px] font-semibold text-[var(--text-muted)]">Net</span>
        </div>
      </div>

      {isInvalid && (
        <div className="mt-2 flex items-center gap-1.5 text-[var(--err)] text-[11px] font-bold">
          <AlertCircle size={12} />
          <span>
            Limit aşıldı ({total}/{max})
          </span>
        </div>
      )}
    </div>
  );
};

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
    if (!examName) return alert("Lütfen deneme adı giriniz.");
    if (!user) return alert("Kullanıcı oturumu bulunamadı.");

    const activeSubjects = getActiveSubjects();
    const config = EXAM_CONFIG[examType] as Record<string, number>;

    for (const sub of activeSubjects) {
      const limit = config[sub] || 40;
      const total = (scores[sub]?.d || 0) + (scores[sub]?.y || 0);
      if (total > limit) {
        return alert(
          `${sub.toUpperCase()} alanında soru limitini aştınız! Lütfen düzeltiniz.`,
        );
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

    const result = await addExam(examData);

    setLoading(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => router.push("/dashboard"), 800);
    } else {
      alert("Hata oluştu: " + result.error);
    }
  };

  const handleJsonUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        const exams = Array.isArray(jsonData) ? jsonData : [jsonData];

        if (exams.length === 0) {
          return alert("Yüklenen dosya boş veya geçersiz formatta.");
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
        alert(
          `İşlem tamamlandı.\nBaşarılı: ${successCount}\nHatalı: ${failCount}`,
        );

        if (successCount > 0) router.push("/dashboard");
      } catch (error) {
        console.error("JSON parse hatası:", error);
        alert("Dosya okunamadı veya geçersiz JSON formatı.");
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

  const getColor = (sub: string) => {
    if (["matematik", "geometri", "tarih"].includes(sub)) return "amber";
    if (["turkce", "cografya", "din"].includes(sub)) return "navy";
    if (["felsefe", "fizik"].includes(sub)) return "lightblue";
    return "blue";
  };

  const aytOptions: Array<{ value: AYTSubtype; label: string }> = [
    { value: "SAY", label: "Sayısal" },
    { value: "EA", label: "Eşit Ağırlık" },
    { value: "SOZ", label: "Sözel" },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--text)] mb-1 flex items-center gap-3 tracking-tight">
          <CirclePlus className="text-[#2F6BFF]" size={28} />
          Deneme Ekle
        </h1>
        <p className="text-[var(--text-muted)] text-sm font-medium">
          Deneme sonuçlarını girerek gelişimini takip et
        </p>
      </div>

      {/* Exam Type & Info */}
      <div className="space-y-6 mb-8">
        {/* Type Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl">
            <button
              onClick={() => setExamType("TYT")}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                examType === "TYT"
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              TYT
            </button>
            <button
              onClick={() => setExamType("AYT")}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                examType === "AYT"
                  ? "bg-[var(--brand)] text-white shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              AYT
            </button>
          </div>

          {examType === "AYT" && (
            <div className="flex gap-1 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl">
              {aytOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAytSubtype(opt.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    aytSubtype === opt.value
                      ? "bg-[var(--brand)] text-white shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* JSON Upload */}
          <div className="ml-auto">
            <input
              type="file"
              accept=".json"
              onChange={handleJsonUpload}
              className="hidden"
              id="json-upload"
            />
            <label
              htmlFor="json-upload"
              className={`flex items-center gap-2 text-xs font-bold text-[var(--text)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] px-4 py-2.5 rounded-xl border border-[var(--border)] transition-all cursor-pointer ${
                loading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <Upload size={14} />
              <span>JSON</span>
            </label>
          </div>
        </div>

        {/* Name & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">
              Deneme Adı
            </label>
            <input
              type="text"
              placeholder="Örn: 3D Türkiye Geneli"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl px-4 py-3 text-[var(--text)] placeholder-[var(--text-subtle)] font-semibold focus:outline-none focus:ring-2 focus:ring-[#7FB0FF]/25 focus:border-[#7FB0FF] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">
              Tarih
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-2xl px-4 py-3 text-[var(--text)] font-semibold focus:outline-none focus:ring-2 focus:ring-[#7FB0FF]/25 focus:border-[#7FB0FF] text-sm"
            />
          </div>
        </div>
      </div>

      {/* Subject Inputs */}
      <div className="space-y-6 mb-8">
        {getGroupedSubjects().map((group) => (
          <div key={group.title} className="p-6 md:p-8 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
            <h3 className="text-base font-black text-[var(--text)] mb-6 flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-[#2F6BFF] rounded-full" />
              {group.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {group.subjects.map((sub) => {
                const config = EXAM_CONFIG[examType] as Record<string, number>;
                return (
                  <SubjectInput
                    key={sub}
                    label={labels[sub] || sub}
                    color={getColor(sub)}
                    values={scores[sub]}
                    max={config[sub]}
                    onChange={(f, v) => handleScoreChange(sub, f, v)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 md:left-20 right-0 z-30 p-4">
        <div className="bg-[var(--surface-3)] text-[var(--text)] border border-[var(--border-strong)] rounded-3xl shadow-2xl px-6 py-4 max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--link)]">
              <Calculator size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] block uppercase tracking-wider">Toplam Net</span>
              <span className="text-2xl font-black text-[var(--text)] tabular-nums tracking-tight">
                {totalNet.toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading || saved}
            className={`flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-black transition-all cursor-pointer ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-[#FFB020] hover:bg-[#FFC24D] text-[#0F2A5C] shadow-lg shadow-[#FFB020]/20"
            } disabled:opacity-70`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : saved ? (
              <>
                <Check size={16} />
                Kaydedildi
              </>
            ) : (
              <>
                <Save size={16} />
                Kaydet
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExamClient;
