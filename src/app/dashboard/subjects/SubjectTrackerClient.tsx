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
} from "lucide-react";
import { TYT_SUBJECTS, AYT_SUBJECTS, SubjectGroup } from "@/data/subjectTopics";
import {
  getTopicTracking,
  updateTopicData,
  bulkUpdateTopics,
  incrementRepeat,
  updateQuestionCount,
} from "@/services/subjectService";
import { useAuth } from "@/context/AuthContext";
import { TopicTrackingItem } from "@/types";

// ---------- Progress Ring ----------
interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 48,
  stroke = 4,
  color = "blue",
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const colorMap: Record<string, string> = {
    purple: "#2F6BFF",
    blue: "#2F6BFF",
    red: "#ef4444",
    yellow: "#FFB020",
    green: "#4ADE80",
    emerald: "#4ADE80",
    amber: "#FFB020",
    teal: "#7FB0FF",
    indigo: "#5B8CFF",
    orange: "#FFB020",
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
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colorMap[color] || "#2F6BFF"}
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
const RepeatBadge: React.FC<{ count: number }> = ({ count }) => {
  let bgColor: string, textColor: string, borderColor: string;

  if (count === 0) {
    bgColor = "bg-[var(--surface-2)]";
    textColor = "text-[var(--text-subtle)]";
    borderColor = "border-[var(--border)]";
  } else if (count === 1) {
    bgColor = "bg-[var(--accent-soft)]";
    textColor = "text-[#FFB020]";
    borderColor = "border-[#FFB020]/30";
  } else if (count === 2) {
    bgColor = "bg-[var(--ok-bg)]";
    textColor = "text-[var(--ok)]";
    borderColor = "border-[var(--ok)]/30";
  } else {
    bgColor = "bg-[var(--brand-soft)]";
    textColor = "text-[var(--link)]";
    borderColor = "border-[var(--link)]/30";
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
interface OverallStatsProps {
  topicTracking: Record<string, TopicTrackingItem>;
  subjects: Record<string, SubjectGroup>;
  examType: string;
}

const OverallStats: React.FC<OverallStatsProps> = ({
  topicTracking,
  subjects,
  examType,
}) => {
  let totalTopics = 0;
  let completedCount = 0;
  let totalQuestions = 0;
  let totalRepeats = 0;

  Object.entries(subjects).forEach(([key, subject]) => {
    totalTopics += subject.topics.length;
    subject.topics.forEach((_: string, idx: number) => {
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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-6 mb-5">
        <ProgressRing
          percent={percent}
          size={64}
          stroke={5}
          color={percent === 100 ? "green" : "blue"}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              {percent === 100 && (
                <Trophy size={20} className="text-[#FFB020]" />
              )}
              {examType.toUpperCase()} Genel İlerleme
            </h3>
            <span className="text-sm font-semibold text-[var(--link)]">
              {completedCount}/{totalTopics}
            </span>
          </div>
          <div className="w-full bg-[var(--surface-3)] rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                percent === 100 ? "bg-emerald-500" : "bg-[#2F6BFF]"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            %{percent} tamamlandı
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 bg-[var(--surface-2)] rounded-2xl px-4 py-3 border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center">
            <CheckCircle2 size={18} className="text-[var(--link)]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text)]">
              {completedCount}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">Tamamlanan</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[var(--surface-2)] rounded-2xl px-4 py-3 border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--brand-soft)] flex items-center justify-center">
            <FileQuestion size={18} className="text-[var(--link)]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text)]">
              {totalQuestions}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">Toplam Soru</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[var(--surface-2)] rounded-2xl px-4 py-3 border border-[var(--border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--ok-bg)] flex items-center justify-center">
            <RefreshCw size={18} className="text-[var(--ok)]" />
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text)]">
              {totalRepeats}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Toplam Tekrar
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Question Count Input ----------
interface QuestionInputProps {
  value: number;
  onUpdate: (count: number) => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ value, onUpdate }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setLocalValue(val);

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
        className="w-14 h-8 text-center text-sm font-medium bg-[var(--surface)] border border-[var(--border-strong)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[#7FB0FF] focus:ring-1 focus:ring-[#7FB0FF]/25 transition-all"
        placeholder="0"
      />
      <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
        soru
      </span>
    </div>
  );
};

// ---------- Repeat Counter ----------
interface RepeatCounterProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const RepeatCounter: React.FC<RepeatCounterProps> = ({
  count,
  onIncrement,
  onDecrement,
}) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (count > 0) onDecrement();
        }}
        disabled={count === 0}
        className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <Minus size={12} />
      </button>
      <RepeatBadge count={count} />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

// ---------- Subject Card ----------
interface SubjectCardProps {
  subjectKey: string;
  subject: SubjectGroup;
  examType: string;
  topicTracking: Record<string, TopicTrackingItem>;
  onToggleComplete: (key: string, val: boolean) => void;
  onUpdateQuestions: (key: string, count: number) => void;
  onIncrementRepeat: (key: string, current: number) => void;
  onDecrementRepeat: (key: string, current: number) => void;
  onBulkToggle: (keys: string[], val: boolean) => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
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
    (_: string, idx: number) => `${examType}_${subjectKey}_${idx}`
  );

  let completedCount = 0;
  let totalQuestions = 0;
  let totalRepeats = 0;

  topicKeys.forEach((k: string) => {
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

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        allDone
          ? "border-emerald-500/40 bg-[var(--surface)]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-4 p-4 md:p-5 text-left transition-all hover:bg-[var(--surface-3)] cursor-pointer bg-[var(--surface-2)] border-b border-[var(--border)] ${
          isOpen ? "border-[var(--border)]" : ""
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
            <h3 className="text-[var(--text)] font-semibold text-base md:text-lg truncate">
              {subject.name}
            </h3>
            {allDone && (
              <Sparkles
                size={16}
                className="text-[#FFB020] shrink-0 animate-pulse"
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-[var(--text-muted)]">
              {completedCount}/{total} konu
            </span>
            <span className="text-xs text-[var(--text-subtle)]">·</span>
            <span className="text-xs text-[var(--link)] font-medium">
              {totalQuestions} soru
            </span>
            <span className="text-xs text-[var(--text-subtle)]">·</span>
            <span className="text-xs text-[var(--ok)] font-medium">
              {totalRepeats} tekrar
            </span>
          </div>
        </div>
        <div className="shrink-0 text-[var(--text-muted)]">
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      {/* Topics Table */}
      {isOpen && (
        <div className="p-3 md:p-4 bg-[var(--surface)]">
          {/* Bulk actions */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border)]">
            <button
              onClick={() => onBulkToggle(topicKeys, true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--brand-soft)] text-[var(--link)] hover:bg-[var(--brand)] hover:text-white transition-colors cursor-pointer font-bold"
            >
              <CheckCheck size={14} /> Tümünü İşaretle
            </button>
            <button
              onClick={() => onBulkToggle(topicKeys, false)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <RotateCcw size={14} /> Sıfırla
            </button>
          </div>

          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 items-center px-3 py-2 mb-1">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Konu
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center w-20">
              Soru
            </span>
            <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider text-center w-28">
              Tekrar
            </span>
          </div>

          {/* Topic Rows */}
          <div className="space-y-1">
            {subject.topics.map((topic: string, idx: number) => {
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
                      ? "bg-[var(--ok-bg)]"
                      : "hover:bg-[var(--surface-2)]"
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
                        className="text-emerald-500 shrink-0 transition-transform duration-200 scale-110"
                      />
                    ) : (
                      <Circle
                        size={20}
                        className="text-[var(--text-subtle)] shrink-0 transition-transform duration-200"
                      />
                    )}
                    <div className="min-w-0">
                      <span
                        className={`text-sm transition-colors block truncate ${
                          isDone
                            ? "text-[var(--ok)] line-through opacity-80"
                            : "text-[var(--text)] font-medium"
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

                  {/* Question count & Repeat counter */}
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
const SubjectTrackerClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tyt" | "ayt">("tyt");
  const [topicTracking, setTopicTracking] = useState<
    Record<string, TopicTrackingItem>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
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
    async (topicKey: string, isCompleted: boolean) => {
      if (!user) return;
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
    async (topicKey: string, count: number) => {
      if (!user) return;
      const prevCount = topicTracking[topicKey]?.questionCount || 0;
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
    async (topicKey: string, currentCount: number) => {
      if (!user) return;
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
    async (topicKey: string, currentCount: number) => {
      if (!user || currentCount <= 0) return;
      const newCount = currentCount - 1;
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
    async (topicKeys: string[], isCompleted: boolean) => {
      if (!user) return;
      const prevState: Record<string, TopicTrackingItem | null> = {};
      topicKeys.forEach((k) => {
        prevState[k] = topicTracking[k] || null;
      });

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
        setTopicTracking((prev) => {
          const next = { ...prev };
          topicKeys.forEach((k) => {
            if (prevState[k]) {
              next[k] = prevState[k]!;
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
            <div
              key={i}
              className="h-20 bg-white/10 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)] mb-2 flex items-center gap-3">
          <BookOpen className="text-[var(--link)]" size={28} />
          Konu Takip Çizelgesi
        </h1>
        <p className="text-[var(--text-muted)]">
          Konularını takip et, çözdüğün soru sayısını kaydet ve tekrar sayını
          izle.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] w-fit">
        {(["tyt", "ayt"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-[var(--brand)] text-white shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
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
