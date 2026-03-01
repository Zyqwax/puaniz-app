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

// Subject color dots
const colorDot = {
  blue: "bg-blue-400",
  red: "bg-red-400",
  yellow: "bg-yellow-400",
  green: "bg-green-400",
  pink: "bg-pink-400",
  indigo: "bg-indigo-400",
};

// Compact Subject Input
const SubjectInput = ({ label, values, onChange, color, max = 40 }) => {
  const total = (values.d || 0) + (values.y || 0);
  const isInvalid = total > max;
  const net = calculateNet(values.d || 0, values.y || 0);

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isInvalid
          ? "border-red-500/40 bg-red-500/5"
          : "border-white/5 bg-slate-800/30 hover:bg-slate-800/50"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${colorDot[color] || colorDot.blue}`}
          />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <span className="text-[11px] text-slate-500">{max} soru</span>
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
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-center text-sm text-white placeholder-slate-600 focus:outline-none transition-all ${
              isInvalid
                ? "border-red-500/50 focus:border-red-400"
                : "border-white/5 focus:border-green-500/40"
            }`}
          />
          <span className="block text-[10px] text-slate-500 text-center mt-1">
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
            className={`w-full bg-white/5 border rounded-lg px-3 py-2 text-center text-sm text-white placeholder-slate-600 focus:outline-none transition-all ${
              isInvalid
                ? "border-red-500/50 focus:border-red-400"
                : "border-white/5 focus:border-red-500/40"
            }`}
          />
          <span className="block text-[10px] text-slate-500 text-center mt-1">
            Yanlış
          </span>
        </div>

        <div className="w-16 text-center">
          <div
            className={`text-lg font-bold tabular-nums ${
              isInvalid
                ? "text-red-400"
                : net > 0
                  ? "text-white"
                  : "text-slate-600"
            }`}
          >
            {net.toFixed(1)}
          </div>
          <span className="block text-[10px] text-slate-500">Net</span>
        </div>
      </div>

      {isInvalid && (
        <div className="mt-2 flex items-center gap-1.5 text-red-400 text-[11px]">
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

  const getActiveSubjects = useCallback(() => {
    if (examType === "TYT") {
      return [
        "turkce",
        "tarih",
        "cografya",
        "felsefe",
        "din",
        "matematik",
        "geometri",
        "fizik",
        "kimya",
        "biyoloji",
      ];
    }
    switch (aytSubtype) {
      case "SAY":
        return ["matematik", "geometri", "fizik", "kimya", "biyoloji"];
      case "EA":
        return ["matematik", "geometri", "edebiyat", "tarih1", "cografya1"];
      case "SOZ":
        return [
          "edebiyat",
          "tarih1",
          "cografya1",
          "tarih2",
          "cografya2",
          "felsefe",
          "din",
        ];
      default:
        return [];
    }
  }, [examType, aytSubtype]);

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
    if (["matematik", "geometri"].includes(sub)) return "red";
    if (["turkce", "edebiyat"].includes(sub)) return "blue";
    if (["tarih", "tarih1", "tarih2", "kimya"].includes(sub)) return "yellow";
    if (["biyoloji", "cografya", "cografya1", "cografya2"].includes(sub))
      return "green";
    if (["felsefe"].includes(sub)) return "pink";
    if (["din"].includes(sub)) return "indigo";
    if (["fizik"].includes(sub)) return "red";
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
        <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
          <PlusCircle className="text-purple-400" size={28} />
          Deneme Ekle
        </h1>
        <p className="text-slate-400 text-sm">
          Deneme sonuçlarını girerek gelişimini takip et
        </p>
      </div>

      {/* Exam Type & Info */}
      <div className="space-y-5 mb-8">
        {/* Type Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
            <button
              onClick={() => setExamType("TYT")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                examType === "TYT"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              TYT
            </button>
            <button
              onClick={() => setExamType("AYT")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                examType === "AYT"
                  ? "bg-pink-600 text-white shadow-lg shadow-pink-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              AYT
            </button>
          </div>

          {examType === "AYT" && (
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
              {aytOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAytSubtype(opt.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    aytSubtype === opt.value
                      ? "bg-slate-700 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
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
              className={`flex items-center gap-2 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg border border-white/5 hover:border-white/10 transition-all cursor-pointer ${
                loading ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <Upload size={14} />
              <span>JSON</span>
            </label>
          </div>
        </div>

        {/* Name & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">
              Deneme Adı
            </label>
            <input
              type="text"
              placeholder="Örn: 3D Türkiye Geneli"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="glass-input w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">
              Tarih
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="glass-input w-full text-sm"
            />
          </div>
        </div>
      </div>

      {/* Subject Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {getActiveSubjects().map((sub) => (
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

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 md:left-20 right-0 z-30">
        <div className="bg-slate-900/90 backdrop-blur-xl border-t border-white/5 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator size={18} className="text-slate-500" />
              <div>
                <span className="text-xs text-slate-500 block">Toplam Net</span>
                <span className="text-xl font-bold text-white tabular-nums">
                  {totalNet.toFixed(2)}
                </span>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={loading || saved}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                saved
                  ? "bg-green-600 text-white"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20"
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
    </div>
  );
};

export default AddExamClient;
