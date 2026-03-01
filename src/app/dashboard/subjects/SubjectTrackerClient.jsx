"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  CheckCheck,
  RotateCcw,
  Trophy,
  Sparkles,
  Plus,
  Minus,
  FileQuestion,
  RefreshCw,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { TYT_SUBJECTS, AYT_SUBJECTS } from "@/data/subjectTopics";
import {
  getTopicTracking,
  updateTopicData,
  bulkUpdateTopics,
  incrementRepeat,
  updateQuestionCount,
} from "@/services/subjectService";
import { useAuth } from "@/context/AuthContext";

// ---------- Progress Ring ----------
const ProgressRing = ({ percent, size = 48, stroke = 4, color = "purple" }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const colorMap = {
    purple: "#a855f7",
    blue: "#3b82f6",
    red: "#ef4444",
    yellow: "#eab308",
    green: "#22c55e",
    emerald: "#10b981",
    amber: "#f59e0b",
    teal: "#14b8a6",
    indigo: "#6366f1",
    orange: "#f97316",
    pink: "#ec4899",
    rose: "#f43f5e",
  };

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colorMap[color] || colorMap.purple}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500 ease-out"
      />
    </svg>
  );
};

// ---------- Repeat Badge ----------
const RepeatBadge = ({ count }) => {
  let bgColor, textColor, borderColor;

  if (count === 0) {
    bgColor = "bg-slate-800/60";
    textColor = "text-slate-500";
    borderColor = "border-slate-700/50";
  } else if (count === 1) {
    bgColor = "bg-amber-500/10";
    textColor = "text-amber-400";
    borderColor = "border-amber-500/20";
  } else if (count === 2) {
    bgColor = "bg-green-500/10";
    textColor = "text-green-400";
    borderColor = "border-green-500/20";
  } else {
    bgColor = "bg-blue-500/10";
    textColor = "text-blue-400";
    borderColor = "border-blue-500/20";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${bgColor} ${textColor} ${borderColor}`}
    >
      <RefreshCw size={10} />
      {count}×
    </span>
  );
};

// ---------- Overall Stats Bar ----------
const OverallStats = ({ topicTracking, subjects, examType }) => {
  let totalTopics = 0;
  let completedCount = 0;
  let totalQuestions = 0;
  let totalRepeats = 0;

  Object.entries(subjects).forEach(([key, subject]) => {
    totalTopics += subject.topics.length;
    subject.topics.forEach((_, idx) => {
      const topicKey = `${examType}_${key}_${idx}`;
      const data = topicTracking[topicKey];
      if (data) {
        if (data.completed) completedCount++;
        totalQuestions += data.questionCount || 0;
        totalRepeats += data.repeatCount || 0;
      }
    });
  });

  const percent =
    totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-6 mb-5">
        <ProgressRing
          percent={percent}
          size={64}
          stroke={5}
          color={percent === 100 ? "green" : "purple"}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              {percent === 100 && (
                <Trophy size={20} className="text-yellow-400" />
              )}
              {examType.toUpperCase()} Genel İlerleme
            </h3>
            <span className="text-sm font-semibold text-purple-400">
              {completedCount}/{totalTopics}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                percent === 100
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : "bg-gradient-to-r from-purple-500 to-pink-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5">%{percent} tamamlandı</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
          <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <CheckCircle2 size={18} className="text-purple-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{completedCount}</p>
            <p className="text-[11px] text-slate-500">Tamamlanan</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
            <FileQuestion size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{totalQuestions}</p>
            <p className="text-[11px] text-slate-500">Toplam Soru</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
          <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center">
            <RefreshCw size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">{totalRepeats}</p>
            <p className="text-[11px] text-slate-500">Toplam Tekrar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Question Count Input ----------
const QuestionInput = ({ value, onUpdate }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e) => {
    const val = e.target.value;
    // Allow empty string or valid numbers
    if (val === "" || /^\d+$/.test(val)) {
      setLocalValue(val);

      // Debounce the save
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const num = parseInt(val) || 0;
        if (num !== value) {
          onUpdate(num);
        }
      }, 600);
    }
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const num = parseInt(localValue) || 0;
    setLocalValue(num.toString());
    if (num !== value) {
      onUpdate(num);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onClick={(e) => e.stopPropagation()}
        className="w-14 h-8 text-center text-sm font-medium bg-slate-800/80 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
        placeholder="0"
      />
      <span className="text-[11px] text-slate-500 hidden sm:inline">soru</span>
    </div>
  );
};

// ---------- Repeat Counter ----------
const RepeatCounter = ({ count, onIncrement, onDecrement }) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (count > 0) onDecrement();
        }}
        disabled={count === 0}
        className="w-7 h-7 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <Minus size={12} />
      </button>
      <RepeatBadge count={count} />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        className="w-7 h-7 rounded-lg bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

// ---------- Subject Card ----------
const SubjectCard = ({
  subjectKey,
  subject,
  examType,
  topicTracking,
  onToggleComplete,
  onUpdateQuestions,
  onIncrementRepeat,
  onDecrementRepeat,
  onBulkToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const topicKeys = subject.topics.map(
    (_, idx) => `${examType}_${subjectKey}_${idx}`
  );

  let completedCount = 0;
  let totalQuestions = 0;
  let totalRepeats = 0;

  topicKeys.forEach((k) => {
    const data = topicTracking[k];
    if (data) {
      if (data.completed) completedCount++;
      totalQuestions += data.questionCount || 0;
      totalRepeats += data.repeatCount || 0;
    }
  });

  const total = subject.topics.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const allDone = completedCount === total;

  const colorMap = {
    red: "from-red-500/20 to-red-600/5 border-red-500/30",
    blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30",
    yellow: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30",
    green: "from-green-500/20 to-green-600/5 border-green-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30",
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30",
    teal: "from-teal-500/20 to-teal-600/5 border-teal-500/30",
    indigo: "from-indigo-500/20 to-indigo-600/5 border-indigo-500/30",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/30",
    rose: "from-rose-500/20 to-rose-600/5 border-rose-500/30",
    pink: "from-pink-500/20 to-pink-600/5 border-pink-500/30",
  };

  const headerGradient = colorMap[subject.color] || colorMap.blue;

  return (
    <div
      className={`rounded-xl border backdrop-blur-sm overflow-hidden transition-all duration-300 ${
        allDone
          ? "border-green-500/40 bg-green-900/10"
          : "border-white/10 bg-slate-800/40"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-4 p-4 md:p-5 text-left transition-all hover:bg-white/5 cursor-pointer bg-gradient-to-r ${headerGradient} border-b border-transparent ${
          isOpen ? "border-white/5" : ""
        }`}
      >
        <ProgressRing
          percent={percent}
          size={42}
          stroke={3.5}
          color={subject.color}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-base md:text-lg truncate">
              {subject.name}
            </h3>
            {allDone && (
              <Sparkles
                size={16}
                className="text-yellow-400 shrink-0 animate-pulse"
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-slate-400">
              {completedCount}/{total} konu
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-blue-400/70">
              {totalQuestions} soru
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-green-400/70">
              {totalRepeats} tekrar
            </span>
          </div>
        </div>
        <div className="shrink-0 text-slate-400">
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      {/* Topics Table */}
      {isOpen && (
        <div className="p-3 md:p-4">
          {/* Bulk actions */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
            <button
              onClick={() => onBulkToggle(topicKeys, true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors cursor-pointer"
            >
              <CheckCheck size={14} /> Tümünü İşaretle
            </button>
            <button
              onClick={() => onBulkToggle(topicKeys, false)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700/80 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} /> Sıfırla
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 items-center px-3 py-2 mb-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Konu
            </span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center w-20">
              Soru
            </span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center w-28">
              Tekrar
            </span>
          </div>

          {/* Topic Rows */}
          <div className="space-y-1">
            {subject.topics.map((topic, idx) => {
              const topicKey = `${examType}_${subjectKey}_${idx}`;
              const data = topicTracking[topicKey] || {};
              const isDone = !!data.completed;
              const questionCount = data.questionCount || 0;
              const repeatCount = data.repeatCount || 0;
              const lastStudied = data.lastStudied;

              return (
                <div
                  key={topicKey}
                  className={`grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 sm:gap-3 items-center px-3 py-2.5 rounded-lg transition-all ${
                    isDone
                      ? "bg-green-500/8 hover:bg-green-500/12"
                      : "hover:bg-white/5"
                  }`}
                >
                  {/* Topic name + checkbox */}
                  <button
                    onClick={() => onToggleComplete(topicKey, !isDone)}
                    className="flex items-center gap-3 text-left cursor-pointer min-w-0"
                  >
                    {isDone ? (
                      <CheckCircle2
                        size={20}
                        className="text-green-400 shrink-0 transition-transform duration-200 scale-110"
                      />
                    ) : (
                      <Circle
                        size={20}
                        className="text-slate-500 shrink-0 transition-transform duration-200"
                      />
                    )}
                    <div className="min-w-0">
                      <span
                        className={`text-sm transition-colors block truncate ${
                          isDone
                            ? "text-green-300 line-through decoration-green-500/40"
                            : "text-slate-300"
                        }`}
                      >
                        {topic}
                      </span>
                      {lastStudied && (
                        <span className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                          <Calendar size={9} />
                          {new Date(lastStudied).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Question count & Repeat counter — mobile: inline row */}
                  <div className="flex items-center gap-3 sm:gap-0 sm:contents pl-8 sm:pl-0">
                    <QuestionInput
                      value={questionCount}
                      onUpdate={(count) => onUpdateQuestions(topicKey, count)}
                    />
                    <RepeatCounter
                      count={repeatCount}
                      onIncrement={() =>
                        onIncrementRepeat(topicKey, repeatCount)
                      }
                      onDecrement={() =>
                        onDecrementRepeat(topicKey, repeatCount)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------- Main Component ----------
const SubjectTrackerClient = () => {
  const [activeTab, setActiveTab] = useState("tyt");
  const [topicTracking, setTopicTracking] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const data = await getTopicTracking(user.uid);
        setTopicTracking(data);
      }
      setLoading(false);
    };
    if (user) fetchData();
  }, [user]);

  const handleToggleComplete = useCallback(
    async (topicKey, isCompleted) => {
      if (!user) return;
      // Optimistic update
      setTopicTracking((prev) => ({
        ...prev,
        [topicKey]: {
          ...(prev[topicKey] || { questionCount: 0, repeatCount: 0 }),
          completed: isCompleted,
          lastStudied: new Date().toISOString(),
        },
      }));
      const result = await updateTopicData(user.uid, topicKey, {
        completed: isCompleted,
      });
      if (!result.success) {
        // Revert
        setTopicTracking((prev) => ({
          ...prev,
          [topicKey]: {
            ...(prev[topicKey] || {}),
            completed: !isCompleted,
          },
        }));
      }
    },
    [user]
  );

  const handleUpdateQuestions = useCallback(
    async (topicKey, count) => {
      if (!user) return;
      const prevCount =
        topicTracking[topicKey]?.questionCount || 0;
      // Optimistic
      setTopicTracking((prev) => ({
        ...prev,
        [topicKey]: {
          ...(prev[topicKey] || { completed: false, repeatCount: 0 }),
          questionCount: count,
          lastStudied: new Date().toISOString(),
        },
      }));
      const result = await updateQuestionCount(user.uid, topicKey, count);
      if (!result.success) {
        setTopicTracking((prev) => ({
          ...prev,
          [topicKey]: {
            ...(prev[topicKey] || {}),
            questionCount: prevCount,
          },
        }));
      }
    },
    [user, topicTracking]
  );

  const handleIncrementRepeat = useCallback(
    async (topicKey, currentCount) => {
      if (!user) return;
      // Optimistic
      setTopicTracking((prev) => ({
        ...prev,
        [topicKey]: {
          ...(prev[topicKey] || { completed: false, questionCount: 0 }),
          repeatCount: currentCount + 1,
          lastStudied: new Date().toISOString(),
        },
      }));
      const result = await incrementRepeat(user.uid, topicKey, currentCount);
      if (!result.success) {
        setTopicTracking((prev) => ({
          ...prev,
          [topicKey]: {
            ...(prev[topicKey] || {}),
            repeatCount: currentCount,
          },
        }));
      }
    },
    [user]
  );

  const handleDecrementRepeat = useCallback(
    async (topicKey, currentCount) => {
      if (!user || currentCount <= 0) return;
      const newCount = currentCount - 1;
      // Optimistic
      setTopicTracking((prev) => ({
        ...prev,
        [topicKey]: {
          ...(prev[topicKey] || { completed: false, questionCount: 0 }),
          repeatCount: newCount,
          lastStudied: new Date().toISOString(),
        },
      }));
      const result = await updateTopicData(user.uid, topicKey, {
        repeatCount: newCount,
      });
      if (!result.success) {
        setTopicTracking((prev) => ({
          ...prev,
          [topicKey]: {
            ...(prev[topicKey] || {}),
            repeatCount: currentCount,
          },
        }));
      }
    },
    [user]
  );

  const handleBulkToggle = useCallback(
    async (topicKeys, isCompleted) => {
      if (!user) return;
      // Save previous state for rollback
      const prevState = {};
      topicKeys.forEach((k) => {
        prevState[k] = topicTracking[k] || null;
      });

      // Optimistic update
      setTopicTracking((prev) => {
        const next = { ...prev };
        topicKeys.forEach((k) => {
          if (isCompleted) {
            next[k] = {
              ...(prev[k] || { questionCount: 0, repeatCount: 0 }),
              completed: true,
              lastStudied: new Date().toISOString(),
            };
          } else {
            next[k] = {
              completed: false,
              questionCount: 0,
              repeatCount: 0,
              lastStudied: null,
            };
          }
        });
        return next;
      });

      const result = await bulkUpdateTopics(user.uid, topicKeys, isCompleted);
      if (!result.success) {
        // Revert
        setTopicTracking((prev) => {
          const next = { ...prev };
          topicKeys.forEach((k) => {
            if (prevState[k]) {
              next[k] = prevState[k];
            } else {
              delete next[k];
            }
          });
          return next;
        });
      }
    },
    [user, topicTracking]
  );

  const subjects = activeTab === "tyt" ? TYT_SUBJECTS : AYT_SUBJECTS;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-36 bg-white/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="text-purple-400" size={28} />
          Konu Takip Çizelgesi
        </h1>
        <p className="text-slate-400">
          Konularını takip et, çözdüğün soru sayısını kaydet ve tekrar sayını izle.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        {["tyt", "ayt"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-lg font-semibold text-sm transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Overall Progress */}
      <OverallStats
        topicTracking={topicTracking}
        subjects={subjects}
        examType={activeTab}
      />

      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(subjects).map(([key, subject]) => (
          <SubjectCard
            key={`${activeTab}_${key}`}
            subjectKey={key}
            subject={subject}
            examType={activeTab}
            topicTracking={topicTracking}
            onToggleComplete={handleToggleComplete}
            onUpdateQuestions={handleUpdateQuestions}
            onIncrementRepeat={handleIncrementRepeat}
            onDecrementRepeat={handleDecrementRepeat}
            onBulkToggle={handleBulkToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default SubjectTrackerClient;
