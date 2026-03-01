"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  getUserExams,
  deleteExam,
  updateExam,
  calculateNet,
} from "@/services/examService";
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
  Download,
  Search,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardList,
  ArrowUpDown,
} from "lucide-react";
import { EXAM_CONFIG } from "@/constants";
import HistorySkeleton from "@/components/history/HistorySkeleton";

const SUBJECT_LABELS = {
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

// ---------- Subject Input ----------
const SubjectInput = ({ label, values, onChange, color, max = 40 }) => {
  const isInvalid = (values.d || 0) + (values.y || 0) > max;

  return (
    <div
      className={`rounded-xl border bg-white/5 p-3 transition-all ${
        isInvalid ? "border-red-500/50 bg-red-500/10" : "border-white/5"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-sm font-bold text-${color}-400`}>{label}</h4>
        <span className="text-[10px] text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
          Max: {max}
        </span>
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
              isInvalid
                ? "border-red-500 focus:border-red-500"
                : "border-green-500/30 focus:border-green-400"
            }`}
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400 mb-1">
            Yanlış
          </label>
          <input
            type="number"
            min="0"
            value={values.y || ""}
            onChange={(e) => onChange("y", parseInt(e.target.value) || 0)}
            className={`glass-input w-full text-xs p-1 ${
              isInvalid
                ? "border-red-500 focus:border-red-500"
                : "border-red-500/30 focus:border-red-400"
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
        <span
          className={`text-sm font-bold ${isInvalid ? "text-red-400" : "text-white"}`}
        >
          {calculateNet(values.d || 0, values.y || 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
};

// ---------- Exam Detail Modal ----------
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
      return [
        "turkce",
        "matematik",
        "geometri",
        "tarih",
        "cografya",
        "felsefe",
        "din",
        "fizik",
        "kimya",
        "biyoloji",
      ];
    }

    switch (subtype) {
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
        return Object.keys(editData.scores).includes("geometri")
          ? Object.keys(editData.scores)
          : [...Object.keys(editData.scores), "geometri"];
    }
  };

  const renderEditInputs = () => {
    const subjects = getActiveSubjects();
    const config = EXAM_CONFIG[exam.type] || {};

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {subjects.map((sub) => {
          if (!editData.scores[sub]) {
            editData.scores[sub] = { d: 0, y: 0, net: 0 };
          }

          let color = "blue";
          if (["matematik", "geometri", "fizik"].includes(sub)) color = "red";
          if (["turkce", "edebiyat"].includes(sub)) color = "blue";
          if (["sosyal", "tarih", "tarih1", "tarih2", "kimya"].includes(sub))
            color = "yellow";
          if (
            ["fen", "biyoloji", "cografya", "cografya1", "cografya2"].includes(
              sub,
            )
          )
            color = "green";
          if (["felsefe"].includes(sub)) color = "pink";
          if (["din"].includes(sub)) color = "indigo";

          const max = config[sub] || 40;

          return (
            <SubjectInput
              key={sub}
              label={SUBJECT_LABELS[sub] || sub}
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
        className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">
                    Deneme Adı
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="glass-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-sm mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={editData.date}
                    onChange={(e) =>
                      setEditData({ ...editData, date: e.target.value })
                    }
                    className="glass-input w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shrink-0 ${
                    exam.type === "TYT"
                      ? "bg-purple-600/20 text-purple-400"
                      : "bg-pink-600/20 text-pink-400"
                  }`}
                >
                  {exam.subtype || exam.type}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white break-words">
                    {exam.name}
                  </h2>
                  <div className="flex items-center gap-2 text-slate-400 mt-1">
                    <Calendar size={14} />
                    <span className="text-sm">{exam.date}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5 shrink-0">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2.5 text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors cursor-pointer"
                title="Düzenle"
              >
                <Edit2 size={18} />
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-2.5 text-green-400 hover:bg-green-400/10 rounded-xl transition-colors cursor-pointer"
                title="Kaydet"
              >
                <Save size={18} />
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors cursor-pointer"
              title="Denemeyi Sil"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4">
              Netleri Düzenle
            </h3>
            {renderEditInputs()}
          </div>
        ) : (
          <>
            {/* Total Net */}
            <div className="rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-white/10 p-4 mb-6 text-center">
              <p className="text-sm text-slate-400 mb-1">Toplam Net</p>
              <p className="text-4xl font-bold text-white">
                {exam.totalNet.toFixed(2)}
              </p>
            </div>

            {/* Subject Scores */}
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              Ders Bazlı Sonuçlar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(exam.scores || {}).map(([subject, stats]) => (
                <div
                  key={subject}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                >
                  <span className="text-sm text-slate-200 font-medium">
                    {SUBJECT_LABELS[subject] || subject}
                  </span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-400 text-xs">{stats.d}D</span>
                    <span className="text-red-400 text-xs">{stats.y}Y</span>
                    <span className="font-bold text-white w-14 text-right">
                      {stats.net.toFixed(2)}
                    </span>
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

// ---------- Mini Stats ----------
const MiniStats = ({ exams }) => {
  const tytExams = exams.filter((e) => e.type === "TYT");
  const aytExams = exams.filter((e) => e.type === "AYT");

  const bestTyt =
    tytExams.length > 0 ? Math.max(...tytExams.map((e) => e.totalNet)) : null;
  const bestAyt =
    aytExams.length > 0 ? Math.max(...aytExams.map((e) => e.totalNet)) : null;

  const lastExamDate =
    exams.length > 0
      ? new Date(
          [...exams].sort((a, b) => new Date(b.date) - new Date(a.date))[0]
            .date,
        ).toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
        })
      : "—";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="rounded-xl bg-white/5 border border-white/5 p-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
          Toplam
        </p>
        <p className="text-xl font-bold text-white">{exams.length}</p>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/5 p-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
          Son Deneme
        </p>
        <p className="text-sm font-bold text-white">{lastExamDate}</p>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/5 p-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
          En Yüksek TYT
        </p>
        <p className="text-xl font-bold text-purple-400">
          {bestTyt !== null ? bestTyt.toFixed(1) : "—"}
        </p>
      </div>
      <div className="rounded-xl bg-white/5 border border-white/5 p-3">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
          En Yüksek AYT
        </p>
        <p className="text-xl font-bold text-pink-400">
          {bestAyt !== null ? bestAyt.toFixed(1) : "—"}
        </p>
      </div>
    </div>
  );
};

// ---------- Main Component ----------
const HistoryClient = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
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

  const filteredExams = useMemo(() => {
    let list = [...exams];

    // Filter by type
    if (activeFilter === "TYT") list = list.filter((e) => e.type === "TYT");
    if (activeFilter === "AYT") list = list.filter((e) => e.type === "AYT");

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.date.includes(q) ||
          e.type.toLowerCase().includes(q),
      );
    }

    // Sort
    list.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [exams, activeFilter, searchQuery, sortOrder]);

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
      setExams((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, ...updatedData } : e)),
      );
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
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `puaniz_denemeler_${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Get net change indicator for an exam
  const getNetChange = (exam) => {
    const sameType = exams
      .filter((e) => e.type === exam.type)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const idx = sameType.findIndex((e) => e.id === exam.id);
    if (idx === -1 || idx >= sameType.length - 1) return null;
    return exam.totalNet - sameType[idx + 1].totalNet;
  };

  const renderExamCard = (exam) => {
    const netChange = getNetChange(exam);

    if (viewMode === "list") {
      return (
        <div
          key={exam.id}
          onClick={() => setSelectedExam(exam)}
          className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                exam.type === "TYT"
                  ? "bg-purple-600/15 text-purple-400"
                  : "bg-pink-600/15 text-pink-400"
              }`}
            >
              {exam.subtype || exam.type}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {exam.name}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Calendar size={10} />
                <span>{exam.date}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            {netChange !== null && (
              <span
                className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                  netChange > 0
                    ? "text-green-400"
                    : netChange < 0
                      ? "text-red-400"
                      : "text-slate-500"
                }`}
              >
                {netChange > 0 ? (
                  <TrendingUp size={10} />
                ) : netChange < 0 ? (
                  <TrendingDown size={10} />
                ) : (
                  <Minus size={10} />
                )}
                {netChange > 0 ? "+" : ""}
                {netChange.toFixed(1)}
              </span>
            )}
            <div className="text-right">
              <p className="text-[10px] text-slate-500">Net</p>
              <p className="text-base font-bold text-white">
                {exam.totalNet.toFixed(2)}
              </p>
            </div>
            <ChevronRight
              size={14}
              className="text-slate-600 group-hover:text-white transition-colors"
            />
          </div>
        </div>
      );
    }

    // Grid view (fallback)
    return (
      <div
        key={exam.id}
        onClick={() => setSelectedExam(exam)}
        className="p-3.5 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all cursor-pointer flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
              exam.type === "TYT"
                ? "bg-purple-600/15 text-purple-400"
                : "bg-pink-600/15 text-pink-400"
            }`}
          >
            {exam.subtype || exam.type}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {exam.name}
            </h3>
            <span className="text-[10px] text-slate-500">{exam.date}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
          <div className="flex items-center gap-1">
            {netChange !== null && (
              <span
                className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                  netChange > 0
                    ? "text-green-400"
                    : netChange < 0
                      ? "text-red-400"
                      : "text-slate-500"
                }`}
              >
                {netChange > 0 ? (
                  <TrendingUp size={9} />
                ) : netChange < 0 ? (
                  <TrendingDown size={9} />
                ) : (
                  <Minus size={9} />
                )}
                {netChange > 0 ? "+" : ""}
                {netChange.toFixed(1)}
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-white">
            {exam.totalNet.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <History size={28} className="text-purple-400" />
            Deneme Geçmişi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Tüm denemelerini görüntüle, düzenle ve karşılaştır
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-sm transition-colors flex items-center gap-2 cursor-pointer"
            title="Dışa Aktar"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Dışa Aktar</span>
          </button>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {[
              { mode: "list", icon: LayoutList },
              { mode: "grid", icon: LayoutGrid },
            ].map(({ mode, icon: ModeIcon }) => (
              <button
                key={mode}
                onClick={() => handleSetViewMode(mode)}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  viewMode === mode
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                    : "text-slate-400 hover:text-white"
                }`}
                title={mode}
              >
                <ModeIcon size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      {exams.length > 0 && <MiniStats exams={exams} />}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            placeholder="Deneme ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500/30 focus:ring-1 focus:ring-purple-500/20 transition-all"
          />
        </div>

        <div className="flex gap-2">
          {/* Type Filter */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
            {["all", "TYT", "AYT"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === filter
                    ? "bg-purple-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {filter === "all" ? "Tümü" : filter}
              </button>
            ))}
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Sıralama"
          >
            <ArrowUpDown size={14} />
            {sortOrder === "desc" ? "Yeni" : "Eski"}
          </button>
        </div>
      </div>

      {/* Exam List */}
      {filteredExams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-800/30 text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
            <ClipboardList size={28} className="text-purple-400" />
          </div>
          <p className="text-white text-lg font-semibold mb-2">
            {searchQuery ? "Sonuç bulunamadı" : "Henüz deneme yok"}
          </p>
          <p className="text-slate-500 text-sm">
            {searchQuery
              ? "Farklı bir arama terimi deneyin."
              : "Deneme ekledikten sonra geçmişiniz burada görünecek."}
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 lg:grid-cols-3 gap-3"
              : "space-y-2"
          }
        >
          {filteredExams.map((exam) => renderExamCard(exam))}
        </div>
      )}

      {/* Modal */}
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
