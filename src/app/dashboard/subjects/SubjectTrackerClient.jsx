"use client";

import React, { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { TYT_SUBJECTS, AYT_SUBJECTS } from "@/data/subjectTopics";
import {
  getCompletedTopics,
  toggleTopic,
  bulkToggleTopics,
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
    <svg
      width={size}
      height={size}
      className="shrink-0 -rotate-90"
    >
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

// ---------- Overall Stats Bar ----------
const OverallStats = ({ completedTopics, subjects, examType }) => {
  let totalTopics = 0;
  let completedCount = 0;

  Object.entries(subjects).forEach(([key, subject]) => {
    totalTopics += subject.topics.length;
    subject.topics.forEach((_, idx) => {
      const topicKey = `${examType}_${key}_${idx}`;
      if (completedTopics[topicKey]) completedCount++;
    });
  });

  const percent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return (
    <div className="glass-card flex items-center gap-6">
      <ProgressRing percent={percent} size={64} stroke={5} color={percent === 100 ? "green" : "purple"} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            {percent === 100 && <Trophy size={20} className="text-yellow-400" />}
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
        <p className="text-xs text-slate-400 mt-1.5">
          %{percent} tamamlandı
        </p>
      </div>
    </div>
  );
};

// ---------- Subject Card ----------
const SubjectCard = ({
  subjectKey,
  subject,
  examType,
  completedTopics,
  onToggle,
  onBulkToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const topicKeys = subject.topics.map(
    (_, idx) => `${examType}_${subjectKey}_${idx}`
  );
  const completedCount = topicKeys.filter((k) => completedTopics[k]).length;
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
        <ProgressRing percent={percent} size={42} stroke={3.5} color={subject.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold text-base md:text-lg truncate">
              {subject.name}
            </h3>
            {allDone && (
              <Sparkles size={16} className="text-yellow-400 shrink-0 animate-pulse" />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {completedCount}/{total} konu · %{percent}
          </p>
        </div>
        <div className="shrink-0 text-slate-400">
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      {/* Topics */}
      {isOpen && (
        <div className="p-4 md:p-5 space-y-2">
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

          {/* Topic List */}
          {subject.topics.map((topic, idx) => {
            const topicKey = `${examType}_${subjectKey}_${idx}`;
            const isDone = !!completedTopics[topicKey];

            return (
              <button
                key={topicKey}
                onClick={() => onToggle(topicKey, !isDone)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                  isDone
                    ? "bg-green-500/10 hover:bg-green-500/15"
                    : "hover:bg-white/5"
                }`}
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
                <span
                  className={`text-sm transition-colors ${
                    isDone
                      ? "text-green-300 line-through decoration-green-500/40"
                      : "text-slate-300"
                  }`}
                >
                  {topic}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------- Main Component ----------
const SubjectTrackerClient = () => {
  const [activeTab, setActiveTab] = useState("tyt");
  const [completedTopics, setCompletedTopics] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const data = await getCompletedTopics(user.uid);
        setCompletedTopics(data);
      }
      setLoading(false);
    };
    if (user) fetchData();
  }, [user]);

  const handleToggle = useCallback(
    async (topicKey, isCompleted) => {
      if (!user) return;
      // Optimistic update
      setCompletedTopics((prev) => ({ ...prev, [topicKey]: isCompleted }));
      const result = await toggleTopic(user.uid, topicKey, isCompleted);
      if (!result.success) {
        // Revert on failure
        setCompletedTopics((prev) => ({ ...prev, [topicKey]: !isCompleted }));
      }
    },
    [user]
  );

  const handleBulkToggle = useCallback(
    async (topicKeys, isCompleted) => {
      if (!user) return;
      // Optimistic update
      setCompletedTopics((prev) => {
        const next = { ...prev };
        topicKeys.forEach((k) => (next[k] = isCompleted));
        return next;
      });
      const result = await bulkToggleTopics(user.uid, topicKeys, isCompleted);
      if (!result.success) {
        // Revert on failure
        setCompletedTopics((prev) => {
          const next = { ...prev };
          topicKeys.forEach((k) => (next[k] = !isCompleted));
          return next;
        });
      }
    },
    [user]
  );

  const subjects = activeTab === "tyt" ? TYT_SUBJECTS : AYT_SUBJECTS;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-24 bg-white/10 rounded-xl animate-pulse" />
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
          Konu Takip
        </h1>
        <p className="text-slate-400">
          Tüm TYT ve AYT konularını takip et, çalıştıkların konuları işaretle.
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
        completedTopics={completedTopics}
        subjects={subjects}
        examType={activeTab}
      />

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(subjects).map(([key, subject]) => (
          <SubjectCard
            key={`${activeTab}_${key}`}
            subjectKey={key}
            subject={subject}
            examType={activeTab}
            completedTopics={completedTopics}
            onToggle={handleToggle}
            onBulkToggle={handleBulkToggle}
          />
        ))}
      </div>
    </div>
  );
};

export default SubjectTrackerClient;
