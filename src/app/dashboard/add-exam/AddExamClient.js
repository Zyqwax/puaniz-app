"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Save,
  AlertCircle,
  Upload,
  PlusCircle,
  Loader2,
  Calculator,
  Check,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EXAM_CONFIG } from "@/constants";
import { addExam, calculateNet } from "@/services/examService";
import { useRouter } from "next/navigation";

// Subject color dots based on brand and subject
const colorDot = {
  blue: "bg-[#2F6BFF]",
  navy: "bg-[#0F2A5C]",
  amber: "bg-[#FFB020]",
  lightblue: "bg-[#7FB0FF]",
};

// Compact Subject Input matching PDF page 9
const SubjectInput = ({ label, values, onChange, color = "blue", max = 40 }) => {
  const total = (values.d || 0) + (values.y || 0);
  const isInvalid = total > max;
  const net = calculateNet(values.d || 0, values.y || 0);

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isInvalid
          ? "border-rose-400 bg-rose-50/50"
          : "border-[#0F2A5C]/[0.06] bg-[#F4F7FC]/70 hover:bg-[#F4F7FC]"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${colorDot[color] || colorDot.blue}`}
          />
          <span className="text-sm font-bold text-[#0F2A5C]">{label}</span>
        </div>
        <span className="text-[11px] font-medium text-[#4A5B7A]">{max} soru</span>
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
            className={`w-full bg-white border rounded-xl px-2.5 py-2 text-center text-sm font-bold text-[#0F2A5C] placeholder-[#4A5B7A]/40 focus:outline-none transition-all ${
              isInvalid
                ? "border-rose-400 focus:border-rose-500"
                : "border-[#0F2A5C]/10 focus:border-[#2F6BFF]"
            }`}
          />
          <span className="block text-[10px] font-semibold text-[#4A5B7A] text-center mt-1">
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
            className={`w-full bg-white border rounded-xl px-2.5 py-2 text-center text-sm font-bold text-[#0F2A5C] placeholder-[#4A5B7A]/40 focus:outline-none transition-all ${
              isInvalid
                ? "border-rose-400 focus:border-rose-500"
                : "border-[#0F2A5C]/10 focus:border-[#2F6BFF]"
            }`}
          />
          <span className="block text-[10px] font-semibold text-[#4A5B7A] text-center mt-1">
            Yanlış
          </span>
        </div>

        <div className="w-16 text-center">
          <div
            className={`text-lg font-black tabular-nums ${
              isInvalid
                ? "text-rose-500"
                : net > 0
                  ? "text-[#0F2A5C]"
                  : "text-[#4A5B7A]"
            }`}
          >
            {net.toFixed(1)}
          </div>
          <span className="block text-[10px] font-semibold text-[#4A5B7A]">Net</span>
        </div>
      </div>

      {isInvalid && (
        <div className="mt-2 flex items-center gap-1.5 text-rose-500 text-[11px] font-bold">
          <AlertCircle size={12} />
          <span>
            Limit aşıldı ({total}/{max})
          </span>
        </div>
      )}
    </div>
  );
};

const AddExamClient = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState("TYT");
  const [aytSubtype, setAytSubtype] = useState("SAY");
  const [examName, setExamName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saved, setSaved] = useState(false);

  const [scores, setScores] = useState({
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

  const handleScoreChange = (subject, field, value) => {
    setScores((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!examName) return alert("Lütfen deneme adı giriniz.");
    if (!user) return alert("Kullanıcı oturumu bulunamadı.");

    const activeSubjects = getActiveSubjects();
    const config = EXAM_CONFIG[examType];

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

    const examData = {
      name: examName,
      date: date,
      type: examType,
      subtype: examType === "AYT" ? aytSubtype : null,
      scores: {},
      totalNet: 0,
    };

    let calculatedTotal = 0;
    activeSubjects.forEach((sub) => {
      const net = calculateNet(scores[sub].d || 0, scores[sub].y || 0);
      examData.scores[sub] = { ...scores[sub], net };
      calculatedTotal += net;
    });
    examData.totalNet = calculatedTotal;

    const result = await addExam(user.uid, examData);

    setLoading(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => router.push("/dashboard"), 800);
    } else {
      alert("Hata oluştu: " + result.error);
    }
  };

  const handleJsonUpload = async (e) => {
    if (!user) return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
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

          const examData = {
            name: exam.name,
            date: exam.date || new Date().toISOString().split("T")[0],
            type: exam.type,
            subtype: exam.type === "AYT" ? exam.subtype || "SAY" : null,
            scores: {},
            totalNet: 0,
          };

          let calculatedTotal = 0;
          const config = EXAM_CONFIG[exam.type];

          if (!config) {
            failCount++;
            continue;
          }

          for (const [subject, score] of Object.entries(exam.scores)) {
            const d = Number(score.d) || 0;
            const y = Number(score.y) || 0;
            const net = calculateNet(d, y);
            examData.scores[subject] = { d, y, net };
            calculatedTotal += net;
          }
          examData.totalNet = calculatedTotal;

          const result = await addExam(user.uid, examData);
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

  const labels = {
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

  const getColor = (sub) => {
    if (["matematik", "geometri", "tarih"].includes(sub)) return "amber";
    if (["turkce", "cografya", "din"].includes(sub)) return "navy";
    if (["felsefe", "fizik"].includes(sub)) return "lightblue";
    return "blue";
  };

  const aytOptions = [
    { value: "SAY", label: "Sayısal" },
    { value: "EA", label: "Eşit Ağırlık" },
    { value: "SOZ", label: "Sözel" },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-28">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#0F2A5C] mb-1 flex items-center gap-3 tracking-tight">
          <PlusCircle className="text-[#2F6BFF]" size={28} />
          Deneme Ekle
        </h1>
        <p className="text-[#4A5B7A] text-sm font-medium">
          Deneme sonuçlarını girerek gelişimini takip et
        </p>
      </div>

      {/* Exam Type & Info */}
      <div className="space-y-6 mb-8">
        {/* Type Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 p-1 bg-white border border-[#0F2A5C]/[0.08] rounded-2xl shadow-xs">
            <button
              onClick={() => setExamType("TYT")}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                examType === "TYT"
                  ? "bg-[#0F2A5C] text-white shadow-sm"
                  : "text-[#4A5B7A] hover:text-[#0F2A5C]"
              }`}
            >
              TYT
            </button>
            <button
              onClick={() => setExamType("AYT")}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                examType === "AYT"
                  ? "bg-[#0F2A5C] text-white shadow-sm"
                  : "text-[#4A5B7A] hover:text-[#0F2A5C]"
              }`}
            >
              AYT
            </button>
          </div>

          {examType === "AYT" && (
            <div className="flex gap-1 p-1 bg-white border border-[#0F2A5C]/[0.08] rounded-2xl shadow-xs">
              {aytOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAytSubtype(opt.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    aytSubtype === opt.value
                      ? "bg-[#2F6BFF] text-white"
                      : "text-[#4A5B7A] hover:text-[#0F2A5C]"
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
              className={`flex items-center gap-2 text-xs font-bold text-[#0F2A5C] bg-white hover:bg-[#F4F7FC] px-4 py-2.5 rounded-xl border border-[#0F2A5C]/[0.08] shadow-xs transition-all cursor-pointer ${
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
            <label className="block text-xs font-bold text-[#4A5B7A] uppercase mb-1.5">
              Deneme Adı
            </label>
            <input
              type="text"
              placeholder="Örn: 3D Türkiye Geneli"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full bg-white border border-[#0F2A5C]/15 rounded-2xl px-4 py-3 text-[#0F2A5C] placeholder-[#4A5B7A]/40 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/30 text-sm shadow-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#4A5B7A] uppercase mb-1.5">
              Tarih
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-[#0F2A5C]/15 rounded-2xl px-4 py-3 text-[#0F2A5C] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/30 text-sm shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Subject Inputs */}
      <div className="space-y-6 mb-8">
        {getGroupedSubjects().map((group) => (
          <div key={group.title} className="p-6 md:p-8 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm">
            <h3 className="text-base font-black text-[#0F2A5C] mb-6 flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-[#2F6BFF] rounded-full" />
              {group.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {group.subjects.map((sub) => (
                <SubjectInput
                  key={sub}
                  label={labels[sub] || sub}
                  color={getColor(sub)}
                  values={scores[sub]}
                  max={EXAM_CONFIG[examType][sub]}
                  onChange={(f, v) => handleScoreChange(sub, f, v)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar (Navy floating bar with Amber Save button as in PDF page 9) */}
      <div className="fixed bottom-0 left-0 md:left-20 right-0 z-30 p-4">
        <div className="bg-[#0F2A5C] text-white rounded-3xl shadow-2xl px-6 py-4 max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Calculator size={20} />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-white/70 block uppercase tracking-wider">Toplam Net</span>
              <span className="text-2xl font-black text-white tabular-nums tracking-tight">
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
                : "bg-[#FFB020] hover:bg-[#f5a71a] text-[#0F2A5C] shadow-lg shadow-[#FFB020]/25"
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
