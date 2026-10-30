"use client";

import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Calendar,
  Save,
  X,
  ArrowRight,
  BookOpen,
  BarChart3,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getUserExams } from "@/server/actions/exam";
import { getUserProfile, updateUserGoals } from "@/server/actions/profile";
import { useAuth } from "@/context/AuthContext";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import Link from "next/link";
import type { ExamRecord } from "@/types";

// ---------- Stat Card ----------
interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconBg = "bg-[var(--brand)]",
  iconColor = "text-white",
  onClick,
}) => {
  const isPositive = subtext && subtext.includes("+");
  const isNegative = subtext && subtext.includes("-");

  return (
    <div
      className={`p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] transition-all duration-300 flex items-start justify-between ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div>
        <p className="text-[var(--text-muted)] text-[11px] font-bold tracking-wider mb-2 uppercase">
          {title}
        </p>
        <h3 className="text-4xl font-black text-[var(--text)] mb-3 tracking-tight">
          {value}
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center ${
            isPositive
              ? "bg-[var(--ok-bg)] text-[var(--ok)]"
              : isNegative
                ? "bg-[var(--err-bg)] text-[var(--err)]"
                : "bg-[var(--surface-2)] text-[var(--text-muted)]"
          }`}
        >
          {subtext}
        </span>
      </div>
      <div
        className={`w-12 h-12 rounded-2xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 shadow-sm`}
      >
        <Icon size={22} />
      </div>
    </div>
  );
};

// ---------- Goal Modal ----------
interface GoalModalProps {
  currentGoals: { tyt: number; ayt: number };
  onClose: () => void;
  onSave: (goals: { tyt: number; ayt: number }) => void;
}

const GoalModal: React.FC<GoalModalProps> = ({ currentGoals, onClose, onSave }) => {
  const [goals, setGoals] = useState(currentGoals);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--surface)] rounded-3xl border border-[var(--border-strong)] shadow-2xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] rounded-full transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-black text-[var(--text)] mb-6">
          Hedeflerini Belirle
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">
              TYT Hedef Net
            </label>
            <input
              type="number"
              value={goals.tyt || ""}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  tyt: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
              className="w-full bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text)] font-bold focus:outline-none focus:ring-2 focus:ring-[#7FB0FF]/40 focus:border-[#7FB0FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">
              AYT Hedef Net
            </label>
            <input
              type="number"
              value={goals.ayt || ""}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  ayt: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
              className="w-full bg-[var(--surface-2)] border border-[var(--border-strong)] rounded-xl px-4 py-3 text-[var(--text)] font-bold focus:outline-none focus:ring-2 focus:ring-[#7FB0FF]/40 focus:border-[#7FB0FF]"
            />
          </div>

          <button
            onClick={() => onSave(goals)}
            className="w-full py-3.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white font-bold flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md transition-all"
          >
            <Save size={18} /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Last Exam Summary ----------
interface LastExamCardProps {
  exam: ExamRecord | null;
}

const LastExamCard: React.FC<LastExamCardProps> = ({ exam }) => {
  if (!exam) return null;

  const subjectLabels: Record<string, string> = {
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

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-soft)] text-[var(--link)] text-xs font-bold mb-3">
            En Son Çözülen Deneme
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-[var(--text)] mb-1.5 tracking-tight">
            {exam.name}
          </h3>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            {exam.date} tarihinde çözüldü
          </p>
        </div>

        <div className="flex items-center gap-6 md:text-right">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Deneme Türü</p>
            <span className="inline-flex items-center px-3.5 py-1 rounded-xl text-xs font-black bg-[var(--brand)] text-white">
              {exam.subtype || exam.type}
            </span>
          </div>
          <div className="w-px h-10 bg-[var(--border)] hidden md:block"></div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Toplam Net</p>
            <p className="text-4xl font-black text-[var(--text)] tracking-tight">
              {(exam.totalNet ?? exam.net ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {Object.entries(exam.scores || {}).map(([sub, stats]) => {
          const isWeak = (stats.net || 0) <= 2.0 && (stats.d || 0) <= 2;
          return (
            <div
              key={sub}
              className="bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-2xl p-4 border border-[var(--border)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-bold text-[var(--text)] truncate">
                    {subjectLabels[sub] || sub}
                  </span>
                  {isWeak && (
                    <span className="text-[9px] font-bold bg-[var(--accent-soft)] text-[var(--accent-text)] px-1.5 py-0.5 rounded-md">
                      Eksik
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-[var(--text)] mb-2 tracking-tight">
                  {(stats.net || 0).toFixed(1)}
                </p>
              </div>

              <div className="w-full h-1 bg-[var(--surface-3)] rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${isWeak ? "bg-[var(--accent)] w-1/3" : "bg-[var(--brand)] w-3/4"}`}
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="text-[var(--ok)] bg-[var(--ok-bg)] px-2 py-0.5 rounded-md">
                  {stats.d || 0} D
                </span>
                <span className="text-[var(--err)] bg-[var(--err-bg)] px-2 py-0.5 rounded-md">
                  {stats.y || 0} Y
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Quick Links ----------
const QuickLinks: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
    {[
      {
        label: "Deneme Ekle",
        desc: "Yeni deneme sonuçlarını gir",
        href: "/dashboard/add-exam",
        icon: Zap,
        iconBg: "bg-[var(--brand)]",
        iconColor: "text-white",
      },
      {
        label: "Detaylı Analiz",
        desc: "Ders bazlı analiz ve grafikler",
        href: "/dashboard/analysis",
        icon: BarChart3,
        iconBg: "bg-[var(--accent)]",
        iconColor: "text-[#0F2A5C]",
      },
      {
        label: "Konu Takip",
        desc: "Konuları, soruları ve tekrarları izle",
        href: "/dashboard/subjects",
        icon: BookOpen,
        iconBg: "bg-[var(--surface-3)]",
        iconColor: "text-[var(--link)]",
      },
    ].map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className="group flex items-center gap-4 p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm hover:border-[var(--border-strong)] hover:bg-[var(--surface-2)] transition-all duration-300"
      >
        <div
          className={`w-12 h-12 rounded-2xl ${link.iconBg} ${link.iconColor} flex items-center justify-center shrink-0 shadow-sm`}
        >
          <link.icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-[var(--text)] group-hover:text-[var(--link)] transition-colors">
            {link.label}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">{link.desc}</p>
        </div>
        <ArrowRight
          size={16}
          className="text-[var(--text-subtle)] group-hover:text-[var(--link)] group-hover:translate-x-1 transition-all shrink-0"
        />
      </Link>
    ))}
  </div>
);

// ---------- Custom Tooltip ----------
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { trialName: string; date: string; net: number } }>;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface-3)] border border-[var(--border-strong)] text-[var(--text)] p-3 rounded-2xl shadow-xl">
        <p className="font-semibold text-xs text-[var(--text-muted)] mb-1">
          {payload[0].payload.trialName}
        </p>
        <p className="text-[var(--accent)] font-black text-lg">
          {payload[0].value} Net
        </p>
      </div>
    );
  }
  return null;
};

// ---------- Main Component ----------
const DashboardContent: React.FC = () => {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({ tyt: 0, ayt: 0 });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [chartTab, setChartTab] = useState<"TYT" | "AYT">("TYT");
  const [stats, setStats] = useState({
    totalExams: 0,
    tytAvg: "0",
    aytAvg: "0",
  });
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Verilerin analiz ediliyor... 🚀",
  );
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const examData = await getUserExams();
        const reversedData = [...examData].reverse();
        setExams(reversedData);

        const userProfile = await getUserProfile();
        if (userProfile && userProfile.goals) {
          setGoals(userProfile.goals);
        }
        if (userProfile && userProfile.welcomeMessage) {
          setWelcomeMessage(userProfile.welcomeMessage);
        } else {
          setWelcomeMessage(
            "Hoşgeldin! İlk denemeni ekleyerek yolculuğa başla. 🚀",
          );
        }

        const tytExams = examData.filter((e) => e.type === "TYT");
        const aytExams = examData.filter((e) => e.type === "AYT");

        const tytAvg =
          tytExams.length > 0
            ? (
                tytExams.reduce((acc, curr) => acc + (curr.totalNet ?? curr.net ?? 0), 0) /
                tytExams.length
              ).toFixed(2)
            : "0";

        const aytAvg =
          aytExams.length > 0
            ? (
                aytExams.reduce((acc, curr) => acc + (curr.totalNet ?? curr.net ?? 0), 0) /
                aytExams.length
              ).toFixed(2)
            : "0";

        setStats({
          totalExams: examData.length,
          tytAvg,
          aytAvg,
        });
      }
      setLoading(false);
    };
    if (user) fetchData();
  }, [user]);

  const handleGoalSave = async (newGoals: { tyt: number; ayt: number }) => {
    if (user) {
      await updateUserGoals(newGoals);
      setGoals(newGoals);
      setIsGoalModalOpen(false);
    }
  };

  const tytData = exams
    .filter((e) => e.type === "TYT")
    .sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeA - timeB;
    })
    .map((e) => ({ trialName: e.name || e.title, date: e.date, net: e.totalNet ?? e.net ?? 0 }));

  const aytData = exams
    .filter((e) => e.type === "AYT")
    .sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeA - timeB;
    })
    .map((e) => ({ trialName: e.name || e.title, date: e.date, net: e.totalNet ?? e.net ?? 0 }));

  const activeChartData = chartTab === "TYT" ? tytData : aytData;
  const activeGoal = chartTab === "TYT" ? goals.tyt : goals.ayt;

  const lastExam = exams.length > 0 ? exams[0] : null;

  const getTrend = (type: "TYT" | "AYT") => {
    const typedExams = exams
      .filter((e) => e.type === type)
      .sort((a, b) => {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return timeB - timeA;
      });
    if (typedExams.length < 2) return null;
    return (typedExams[0]?.totalNet ?? typedExams[0]?.net ?? 0) - (typedExams[1]?.totalNet ?? typedExams[1]?.net ?? 0);
  };

  const tytTrend = getTrend("TYT");
  const aytTrend = getTrend("AYT");

  const getGoalStatus = (current: string | number, goal: number) => {
    const currentNum = typeof current === "string" ? parseFloat(current) : current;
    if (!goal || goal === 0) return "Hedef ayarla";
    const diff = currentNum - goal;
    if (diff >= 0) return "Hedefe ulaşıldı! 🎉";
    return `${Math.abs(diff).toFixed(2)} net kaldı`;
  };

  const getTrendText = (trend: number | null) => {
    if (trend === null) return "Trend verisi yok";
    if (trend > 0) return `+${trend.toFixed(2)} son denemede`;
    if (trend < 0) return `${trend.toFixed(2)} son denemede`;
    return "Değişim yok";
  };

  return (
    <div className="space-y-8">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] mb-1.5 tracking-tight">
                Genel Bakış
              </h1>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-3">
                Deneme sonuçlarının güncel özeti
              </p>
              <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center shrink-0">
                  <Zap size={18} />
                </div>
                <div className="text-xs font-medium text-[var(--text-muted)] leading-relaxed [&_p]:mb-1 [&_strong]:text-[var(--text)]">
                  <Markdown>{welcomeMessage}</Markdown>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-[var(--ok)]">Sistem Aktif</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Toplam Deneme"
              value={stats.totalExams}
              subtext="Tüm zamanlar"
              icon={Calendar}
              iconBg="bg-[var(--brand)]"
              iconColor="text-white"
            />
            <StatCard
              title="TYT Ortalama"
              value={stats.tytAvg}
              subtext={
                tytTrend !== null
                  ? getTrendText(tytTrend)
                  : getGoalStatus(stats.tytAvg, goals.tyt)
              }
              icon={
                tytTrend !== null && tytTrend >= 0 ? TrendingUp : TrendingDown
              }
              iconBg="bg-[var(--brand)]"
              iconColor="text-white"
            />
            <StatCard
              title="AYT Ortalama"
              value={stats.aytAvg}
              subtext={
                aytTrend !== null
                  ? getTrendText(aytTrend)
                  : getGoalStatus(stats.aytAvg, goals.ayt)
              }
              icon={
                aytTrend !== null && aytTrend >= 0 ? TrendingUp : TrendingDown
              }
              iconBg="bg-[var(--accent)]"
              iconColor="text-[#0F2A5C]"
            />
            <StatCard
              title="Hedef Netler"
              value={`${goals.tyt} / ${goals.ayt}`}
              subtext="Düzenlemek için tıkla"
              icon={Target}
              iconBg="bg-[var(--surface-3)]"
              iconColor="text-[var(--link)]"
              onClick={() => setIsGoalModalOpen(true)}
            />
          </div>

          {/* Last Exam Summary */}
          <LastExamCard exam={lastExam} />

          {/* Quick Links */}
          <QuickLinks />

          {/* Chart with Tab Switcher */}
          {(tytData.length > 0 || aytData.length > 0) && (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-black text-[var(--text)] tracking-tight">
                    Net Değişim Grafiği
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                    Son denemelerindeki net artışını takip et
                  </p>
                </div>
                <div className="flex gap-1.5 p-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl">
                  {(["TYT", "AYT"] as const).map((tab) => {
                    const hasData =
                      tab === "TYT" ? tytData.length > 0 : aytData.length > 0;
                    return (
                      <button
                        key={tab}
                        onClick={() => hasData && setChartTab(tab)}
                        disabled={!hasData}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                          chartTab === tab
                            ? "bg-[var(--brand)] text-white shadow-sm"
                            : "text-[var(--text-muted)] hover:text-[var(--text)]"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeChartData.length > 0 ? (
                <div className="h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={activeChartData}
                      margin={{ top: 10, right: 10, bottom: 30, left: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="puanizChartGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#2F6BFF"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#2F6BFF"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        strokeOpacity={0.8}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="var(--text-subtle)"
                        tick={{
                          fontSize: 11,
                          fill: "var(--text-muted)",
                          fontWeight: 500,
                        }}
                        tickFormatter={(value) => {
                          if (!value) return "";
                          const date = new Date(value);
                          return date.toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          });
                        }}
                        height={40}
                      />
                      <YAxis
                        stroke="var(--text-subtle)"
                        tick={{ fontSize: 11, fill: "var(--text-muted)", fontWeight: 500 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => (
                          <ChartTooltip
                            active={active}
                            payload={payload as any}
                          />
                        )}
                      />
                      {activeGoal > 0 && (
                        <ReferenceLine
                          y={activeGoal}
                          stroke="#FFB020"
                          strokeDasharray="6 4"
                          strokeWidth={2}
                          label={{
                            value: `Hedef: ${activeGoal}`,
                            fill: "#FFB020",
                            fontSize: 11,
                            fontWeight: 700,
                            position: "insideTopRight",
                          }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke="#5B8CFF"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "var(--surface)", stroke: "#5B8CFF", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#FFB020", stroke: "#0F2A5C", strokeWidth: 2 }}
                        fillOpacity={1}
                        fill="url(#puanizChartGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-[var(--text-muted)] text-sm">
                    Bu tür için henüz deneme verisi yok.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {tytData.length === 0 && aytData.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-[var(--brand-soft)] border border-[var(--border)] flex items-center justify-center mx-auto mb-5">
                <BarChart3 size={28} className="text-[var(--link)]" />
              </div>
              <p className="text-[var(--text)] text-lg font-bold mb-2">
                Henüz deneme verisi yok
              </p>
              <p className="text-[var(--text-muted)] text-sm mb-6 max-w-sm mx-auto">
                İlk denemeni ekledikten sonra grafikler ve analizler burada
                görünecek.
              </p>
              <Link
                href="/dashboard/add-exam"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Zap size={16} />
                Deneme Ekle
              </Link>
            </div>
          )}
        </>
      )}

      {isGoalModalOpen && (
        <GoalModal
          currentGoals={goals}
          onClose={() => setIsGoalModalOpen(false)}
          onSave={handleGoalSave}
        />
      )}
    </div>
  );
};

export default DashboardContent;
