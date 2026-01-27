"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Save, AlertCircle, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EXAM_CONFIG } from "@/constants";
import { addExam, calculateNet } from "@/services/examService";
import { useRouter } from "next/navigation";

// SubjectInput Component
const SubjectInput = ({ label, values, onChange, color, max = 40 }) => {
  const isInvalid = (values.d || 0) + (values.y || 0) > max;

  return (
    <div className={`glass-card p-4 transition-all ${isInvalid ? "border-red-500/50 bg-red-500/10" : ""}`}>
      <div className="flex justify-between items-start mb-4">
        <h4 className={`text-lg font-bold text-${color}-400`}>{label}</h4>
        <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">Max: {max}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Doğru</label>
          <input
            type="number"
            min="0"
            value={values.d || ""}
            onChange={(e) => onChange("d", parseInt(e.target.value) || 0)}
            className={`glass-input w-full ${
              isInvalid ? "border-red-500 focus:border-red-500" : "border-green-500/30 focus:border-green-400"
            }`}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Yanlış</label>
          <input
            type="number"
            min="0"
            value={values.y || ""}
            onChange={(e) => onChange("y", parseInt(e.target.value) || 0)}
            className={`glass-input w-full ${
              isInvalid ? "border-red-500 focus:border-red-500" : "border-red-500/30 focus:border-red-400"
            }`}
          />
        </div>
      </div>

      {isInvalid && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs animate-pulse">
          <AlertCircle size={14} />
          <span>Soru limiti aşıldı! (Max: {max})</span>
        </div>
      )}

      <div className="mt-3 text-right">
        <span className="text-sm text-slate-400">Net: </span>
        <span className={`text-xl font-bold ${isInvalid ? "text-red-400" : "text-white"}`}>
          {calculateNet(values.d || 0, values.y || 0).toFixed(2)}
        </span>
      </div>
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

  const [scores, setScores] = useState({
    // TYT Common
    turkce: { d: 0, y: 0 },
    // TYT Split
    tarih: { d: 0, y: 0 },
    cografya: { d: 0, y: 0 },
    felsefe: { d: 0, y: 0 },
    din: { d: 0, y: 0 },
    matematik: { d: 0, y: 0 },
    geometri: { d: 0, y: 0 },
    fizik: { d: 0, y: 0 },
    kimya: { d: 0, y: 0 },
    biyoloji: { d: 0, y: 0 },
    // AYT Specific
    edebiyat: { d: 0, y: 0 },
    tarih1: { d: 0, y: 0 },
    cografya1: { d: 0, y: 0 },
    tarih2: { d: 0, y: 0 },
    cografya2: { d: 0, y: 0 },
  });

  // Subject mapping based on selected type
  const getActiveSubjects = useCallback(() => {
    if (examType === "TYT") {
      return ["turkce", "tarih", "cografya", "felsefe", "din", "matematik", "geometri", "fizik", "kimya", "biyoloji"];
    }

    // AYT Combinations
    switch (aytSubtype) {
      case "SAY":
        return ["matematik", "geometri", "fizik", "kimya", "biyoloji"];
      case "EA":
        return ["matematik", "geometri", "edebiyat", "tarih1", "cografya1"];
      case "SOZ":
        return ["edebiyat", "tarih1", "cografya1", "tarih2", "cografya2", "felsefe", "din"];
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
        return alert(`${sub.toUpperCase()} alanında soru limitini aştınız! Lütfen düzeltiniz.`);
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
      router.push("/");
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
            console.error("Geçersiz sınav formatı:", exam);
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
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        }

        setLoading(false);
        alert(`İşlem tamamlandı.\nBaşarılı: ${successCount}\nHatalı: ${failCount}`);

        if (successCount > 0) {
          router.push("/");
        }
      } catch (error) {
        console.error("JSON parse hatası:", error);
        alert("Dosya okunamadı veya geçersiz JSON formatı.");
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const renderSubjectInputs = () => {
    return getActiveSubjects().map((sub) => {
      const max = EXAM_CONFIG[examType][sub];

      let color = "blue";
      if (["matematik", "geometri", "fizik"].includes(sub)) color = "red";
      if (["turkce", "edebiyat"].includes(sub)) color = "blue";
      if (["sosyal", "tarih", "tarih1", "tarih2", "kimya"].includes(sub)) color = "yellow";
      if (["fen", "biyoloji", "cografya", "cografya1", "cografya2"].includes(sub)) color = "green";
      if (["felsefe"].includes(sub)) color = "pink";
      if (["din"].includes(sub)) color = "indigo";

      const labels = {
        turkce: "Türkçe",
        matematik: "Matematik",
        geometri: "Geometri",
        fen: "Fen Bilimleri",
        sosyal: "Sosyal Bilimler",
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

      return (
        <SubjectInput
          key={sub}
          label={labels[sub] || sub}
          color={color}
          values={scores[sub]}
          max={max}
          onChange={(f, v) => handleScoreChange(sub, f, v)}
        />
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white w-full md:w-auto text-center md:text-left">
          Deneme Ekle
        </h1>

        <div className="relative">
          <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" id="json-upload" />
          <label
            htmlFor="json-upload"
            className={`glass-btn px-4 py-2 flex items-center gap-2 text-sm cursor-pointer ${loading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <Upload size={16} />
            <span className="hidden md:inline">JSON Yükle</span>
          </label>
        </div>

        <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full md:w-auto">
          {/* Main Exam Type Toggle */}
          <div className="bg-slate-800 p-1 rounded-lg flex">
            <button
              onClick={() => setExamType("TYT")}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-bold transition-all ${
                examType === "TYT" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              TYT
            </button>
            <button
              onClick={() => setExamType("AYT")}
              className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-bold transition-all ${
                examType === "AYT" ? "bg-pink-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              AYT
            </button>
          </div>

          {/* Subtype Toggle */}
          {examType === "AYT" && (
            <div className="bg-slate-800 p-1 rounded-lg flex">
              <button
                onClick={() => setAytSubtype("SAY")}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-bold transition-all ${
                  aytSubtype === "SAY" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                SAY
              </button>
              <button
                onClick={() => setAytSubtype("EA")}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-bold transition-all ${
                  aytSubtype === "EA" ? "bg-orange-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                EA
              </button>
              <button
                onClick={() => setAytSubtype("SOZ")}
                className={`px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-bold transition-all ${
                  aytSubtype === "SOZ" ? "bg-teal-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                }`}
              >
                SÖZ
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-400 mb-2">Deneme Adı / Yayın</label>
            <input
              type="text"
              placeholder="Örn: 3D Türkiye Geneli"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-2">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input w-full" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{renderSubjectInputs()}</div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex justify-between items-center z-30">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="px-3 py-2 md:px-4 md:py-2 bg-slate-800 rounded-lg flex flex-col md:flex-row md:items-center">
            <span className="text-slate-400 text-xs md:text-sm md:mr-2">Toplam Net:</span>
            <span className="text-xl md:text-2xl font-bold text-white">{totalNet.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="glass-btn px-4 md:px-8 flex items-center gap-2 text-sm md:text-base"
        >
          {loading ? (
            "Kaydediliyor..."
          ) : (
            <>
              <Save size={20} /> <span className="hidden md:inline">Kaydet</span>
              <span className="md:hidden">Kaydet</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AddExamClient;
