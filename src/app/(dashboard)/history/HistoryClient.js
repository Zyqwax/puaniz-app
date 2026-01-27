"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getUserExams, deleteExam, updateExam, calculateNet } from "@/services/examService";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  ChevronRight,
  Trash2,
  X,
  Edit2,
  Save,
  AlertCircle,
  LayoutList,
  LayoutGrid,
  RectangleVertical,
  Download,
} from "lucide-react";
import { EXAM_CONFIG } from "@/constants";
import HistorySkeleton from "@/components/history/HistorySkeleton";

// Subject Input Component
const SubjectInput = ({ label, values, onChange, color, max = 40 }) => {
  const isInvalid = (values.d || 0) + (values.y || 0) > max;

  return (
    <div className={`glass-card p-3 transition-all ${isInvalid ? "border-red-500/50 bg-red-500/10" : "bg-white/5"}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-sm font-bold text-${color}-400`}>{label}</h4>
        <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded">Max: {max}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Doğru</label>
          <input
            type="number"
            min="0"
            value={values.d || ""}
            onChange={(e) => onChange("d", parseInt(e.target.value) || 0)}
            className={`glass-input w-full text-xs p-1 ${
              isInvalid ? "border-red-500 focus:border-red-500" : "border-green-500/30 focus:border-green-400"
            }`}
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">Yanlış</label>
          <input
            type="number"
            min="0"
            value={values.y || ""}
            onChange={(e) => onChange("y", parseInt(e.target.value) || 0)}
            className={`glass-input w-full text-xs p-1 ${
              isInvalid ? "border-red-500 focus:border-red-500" : "border-red-500/30 focus:border-red-400"
            }`}
          />
        </div>
      </div>

      {isInvalid && (
        <div className="mt-2 flex items-center gap-1 text-red-400 text-[10px] animate-pulse">
          <AlertCircle size={10} />
          <span>Soru limiti aşıldı!</span>
        </div>
      )}

      <div className="mt-2 text-right">
        <span className="text-xs text-slate-400">Net: </span>
        <span className={`text-sm font-bold ${isInvalid ? "text-red-400" : "text-white"}`}>
          {calculateNet(values.d || 0, values.y || 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

// Exam Details Modal
const ExamDetailModal = ({ exam, onClose, onDelete, onUpdate }) => {
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    if (exam) {
      setEditData({
        name: exam.name,
        date: exam.date,
        scores: { ...exam.scores },
      });
    }
  }, [exam]);

  if (!exam || !editData) return null;

  const handleDelete = async () => {
    if (window.confirm("Bu denemeyi silmek istediğinize emin misiniz?")) {
      setDeleting(true);
      await onDelete(exam.id);
      setDeleting(false);
      onClose();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let totalNet = 0;
      Object.values(editData.scores).forEach((score) => {
        const net = calculateNet(score.d || 0, score.y || 0);
        score.net = net;
        totalNet += net;
      });

      const updatedExam = {
        ...editData,
        totalNet,
      };

      await onUpdate(exam.id, updatedExam);
      setIsEditing(false);
    } catch (error) {
      console.error("Update failed", error);
      alert("Güncelleme başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  const handleScoreChange = (subject, field, value) => {
    setEditData((prev) => ({
      ...prev,
      scores: {
        ...prev.scores,
        [subject]: {
          ...prev.scores[subject],
          [field]: value,
        },
      },
    }));
  };

  const getActiveSubjects = () => {
    const type = exam.type;
    const subtype = exam.subtype;

    if (type === "TYT") {
      return ["turkce", "matematik", "geometri", "tarih", "cografya", "felsefe", "din", "fizik", "kimya", "biyoloji"];
    }

    switch (subtype) {
      case "SAY":
        return ["matematik", "geometri", "fizik", "kimya", "biyoloji"];
      case "EA":
        return ["matematik", "geometri", "edebiyat", "tarih1", "cografya1"];
      case "SOZ":
        return ["edebiyat", "tarih1", "cografya1", "tarih2", "cografya2", "felsefe", "din"];
      default:
        return Object.keys(editData.scores).includes("geometri")
          ? Object.keys(editData.scores)
          : [...Object.keys(editData.scores), "geometri"];
    }
  };

  const renderEditInputs = () => {
    const subjects = getActiveSubjects();
    const config = EXAM_CONFIG[exam.type] || {};

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((sub) => {
          if (!editData.scores[sub]) {
            editData.scores[sub] = { d: 0, y: 0, net: 0 };
          }

          let color = "blue";
          if (["matematik", "geometri", "fizik"].includes(sub)) color = "red";
          if (["turkce", "edebiyat"].includes(sub)) color = "blue";
          if (["sosyal", "tarih", "tarih1", "tarih2", "kimya"].includes(sub)) color = "yellow";
          if (["fen", "biyoloji", "cografya", "cografya1", "cografya2"].includes(sub)) color = "green";
          if (["felsefe"].includes(sub)) color = "pink";
          if (["din"].includes(sub)) color = "indigo";

          const max = config[sub] || 40;

          return (
            <SubjectInput
              key={sub}
              label={labels[sub] || sub}
              values={editData.scores[sub]}
              onChange={(f, v) => handleScoreChange(sub, f, v)}
              color={color}
              max={max}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Deneme Adı</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="glass-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Tarih</label>
                    <input
                      type="date"
                      value={editData.date}
                      onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                      className="glass-input w-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-lg sm:text-2xl text-white shrink-0 ${
                    exam.type === "TYT" ? "bg-purple-600/20 text-purple-400" : "bg-pink-600/20 text-pink-400"
                  }`}
                >
                  {exam.subtype || exam.type}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-white wrap-break-word">{exam.name}</h2>
                  <div className="flex items-center gap-2 text-slate-400 mt-1">
                    <Calendar size={16} />
                    <span>{exam.date}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 w-full md:w-auto">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-full transition-colors"
                title="Düzenle"
              >
                <Edit2 size={20} />
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-2 text-green-400 hover:bg-green-400/10 rounded-full transition-colors"
                title="Kaydet"
              >
                <Save size={20} />
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
              title="Denemeyi Sil"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Netleri Düzenle</h3>
            {renderEditInputs()}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-card bg-slate-800/50 p-4 text-center">
                <p className="text-slate-400 text-sm">Toplam Net</p>
                <p className="text-3xl font-bold text-white">{exam.totalNet.toFixed(2)}</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-4">Ders Bazlı Analiz</h3>
            <div className="space-y-3">
              {Object.entries(exam.scores || {}).map(([subject, stats]) => (
                <div
                  key={subject}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                >
                  <span className="capitalize text-slate-200 font-medium w-32">{subject}</span>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-green-400">{stats.d} D</span>
                    <span className="text-red-400">{stats.y} Y</span>
                    <span className="font-bold text-white w-16 text-right">{stats.net.toFixed(2)} Net</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Main History Page
const HistoryClient = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("historyViewMode") || "list";
    }
    return "list";
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchExams = async () => {
      if (user) {
        const data = await getUserExams(user.uid);
        setExams(data);
      }
      setLoading(false);
    };
    if (user) fetchExams();
  }, [user]);

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem("historyViewMode", mode);
  };

  const { tytExams, aytExams } = useMemo(() => {
    const sorted = [...exams].sort((a, b) => new Date(b.date) - new Date(a.date));
    return {
      tytExams: sorted.filter((e) => e.type === "TYT"),
      aytExams: sorted.filter((e) => e.type === "AYT"),
    };
  }, [exams]);

  if (loading) return <HistorySkeleton />;

  const handleDeleteExam = async (examId) => {
    const result = await deleteExam(examId);
    if (result.success) {
      setExams(exams.filter((e) => e.id !== examId));
    } else {
      alert("Silme işlemi başarısız oldu.");
    }
  };

  const handleUpdateExam = async (examId, updatedData) => {
    const result = await updateExam(examId, updatedData);
    if (result.success) {
      setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, ...updatedData } : e)));
      setSelectedExam((prev) => ({ ...prev, ...updatedData }));
    } else {
      alert("Güncelleme sırasında bir hata oluştu.");
    }
  };

  const handleExportJSON = () => {
    if (exams.length === 0) {
      alert("Dışa aktarılacak deneme bulunamadı.");
      return;
    }

    const exportedExams = exams.map((exam) => {
      const cleanScores = {};
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
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `puaniz_denemeler_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const renderExamList = (list, emptyMessage) => (
    <div
      className={
        viewMode === "grid" ? "grid grid-cols-2 lg:grid-cols-3 gap-3" : viewMode === "card" ? "space-y-4" : "space-y-3"
      }
    >
      {list.length === 0 ? (
        <p className="text-slate-400 italic">{emptyMessage}</p>
      ) : (
        list.map((exam) => (
          <div
            key={exam.id}
            onClick={() => setSelectedExam(exam)}
            className={`glass-card hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden
              ${viewMode === "list" ? "flex items-center justify-between p-3 sm:p-4" : ""}
              ${viewMode === "grid" ? "p-3 flex flex-col gap-2" : ""} 
              ${viewMode === "card" ? "p-5 sm:p-6 flex flex-col gap-4" : ""}
            `}
          >
            {viewMode === "card" && (
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/2 ${
                  exam.type === "TYT" ? "bg-purple-500" : "bg-pink-500"
                }`}
              />
            )}

            <div className={`flex ${viewMode === "card" ? "items-start justify-between" : "items-center gap-3"}`}>
              <div className="flex items-center gap-3 w-full overflow-hidden">
                <div
                  className={`flex items-center justify-center font-bold text-white shrink-0
                    ${viewMode === "card" ? "w-12 h-12 text-sm rounded-xl" : "w-8 h-8 text-[10px] rounded-full"}
                    ${exam.type === "TYT" ? "bg-purple-600/20 text-purple-400" : "bg-pink-600/20 text-pink-400"}
                  `}
                >
                  {exam.subtype || exam.type}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-white truncate ${viewMode === "card" ? "text-lg" : "text-sm"}`}>
                    {exam.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] sm:text-xs">
                    <Calendar size={viewMode === "grid" ? 10 : 12} />
                    <span className="truncate">{exam.date}</span>
                  </div>
                </div>
              </div>

              {viewMode === "card" && (
                <div className="text-right z-10 shrink-0">
                  <p className="text-xs text-slate-400">Toplam Net</p>
                  <p className="text-2xl font-bold text-white">{exam.totalNet.toFixed(2)}</p>
                </div>
              )}
            </div>

            {viewMode === "grid" && (
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-400">Net</span>
                <span className="text-sm font-bold text-white">{exam.totalNet.toFixed(2)}</span>
              </div>
            )}

            {viewMode === "list" && (
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Net</p>
                  <p className="text-sm sm:text-lg font-bold text-white">{exam.totalNet.toFixed(2)}</p>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
              </div>
            )}

            {viewMode === "card" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {exam.type === "TYT" ? (
                  <>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <p className="text-[10px] text-slate-400">Türkçe</p>
                      <p className="font-bold text-white">{exam.scores?.turkce?.net?.toFixed(2) || "-"}</p>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <p className="text-[10px] text-slate-400">Matematik</p>
                      <p className="font-bold text-white">{exam.scores?.matematik?.net?.toFixed(2) || "-"}</p>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <p className="text-[10px] text-slate-400">Fen</p>
                      <p className="font-bold text-white">
                        {(
                          (exam.scores?.fizik?.net || 0) +
                          (exam.scores?.kimya?.net || 0) +
                          (exam.scores?.biyoloji?.net || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded p-2 text-center">
                      <p className="text-[10px] text-slate-400">Sosyal</p>
                      <p className="font-bold text-white">
                        {(
                          (exam.scores?.tarih?.net || 0) +
                          (exam.scores?.cografya?.net || 0) +
                          (exam.scores?.felsefe?.net || 0) +
                          (exam.scores?.din?.net || 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </>
                ) : (
                  Object.entries(exam.scores || {})
                    .slice(0, 4)
                    .map(([sub, val]) => (
                      <div key={sub} className="bg-white/5 rounded p-2 text-center">
                        <p className="text-[10px] text-slate-400 capitalize">{sub}</p>
                        <p className="font-bold text-white">{val.net?.toFixed(2) || "-"}</p>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-white">Deneme Geçmişi</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="glass-btn px-4 py-2 flex items-center gap-2 text-sm"
            title="Tüm Denemeleri JSON Olarak İndir"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Dışa Aktar</span>
          </button>

          <div className="flex bg-slate-800/50 p-1 rounded-xl glass-panel">
            <button
              onClick={() => handleSetViewMode("list")}
              className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              title="Liste Görünümü"
            >
              <LayoutList size={20} />
            </button>
            <button
              onClick={() => handleSetViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              title="Izgara Görünümü"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => handleSetViewMode("card")}
              className={`p-2 rounded-lg transition-all ${viewMode === "card" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}
              title="Kart Görünümü"
            >
              <RectangleVertical size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TYT COLUMN */}
        <div>
          <h2 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
            TYT Denemeleri
          </h2>
          {renderExamList(tytExams, "Henüz TYT denemesi yok.")}
        </div>

        {/* AYT COLUMN */}
        <div>
          <h2 className="text-xl font-bold text-pink-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-8 bg-pink-500 rounded-full"></span>
            AYT Denemeleri
          </h2>
          {renderExamList(aytExams, "Henüz AYT denemesi yok.")}
        </div>
      </div>

      {selectedExam && (
        <ExamDetailModal
          exam={selectedExam}
          onClose={() => setSelectedExam(null)}
          onDelete={handleDeleteExam}
          onUpdate={handleUpdateExam}
        />
      )}
    </div>
  );
};

export default HistoryClient;
