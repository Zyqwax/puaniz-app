"use client";

import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Calendar,
  Edit2,
  Save,
  X,
  ArrowRight,
  BookOpen,
  BarChart3,
  Clock,
  Zap,
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
import { getUserExams } from "@/services/examService";
import { getUserProfile, updateUserGoals } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import Link from "next/link";

// ---------- Stat Card ----------
const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  gradient,
  onClick,
  actionIcon: ActionIcon,
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-xl p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/15 hover:shadow-2xl hover:shadow-${gradient.split('-')[1] || 'purple'}-500/10 ${onClick ? "cursor-pointer group" : ""}`}
      onClick={onClick}
    >
      {/* Refined Background glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-20 transition-opacity duration-500 group-hover:opacity-40 ${gradient}`}
      />

      <div className="relative flex items-start justify-between z-10">
        <div>
          <p className="text-slate-400/90 text-sm font-medium tracking-wide mb-2 uppercase">{title}</p>
          <h3 className="text-4xl font-extrabold text-white mb-2 tracking-tight">{value}</h3>
          <p
            className={`text-xs font-medium px-2 py-1 inline-flex items-center rounded-lg ${
              subtext && subtext.includes("+")
                ? "bg-green-500/10 text-green-400"
                : subtext && subtext.includes("ulaşıldı")
                  ? "bg-green-500/10 text-green-400"
                  : subtext && subtext.includes("kaldı")
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-slate-500/10 text-slate-400"
            }`}
          >
            {subtext}
          </p>
        </div>
        <div
          className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg flex items-center justify-center relative`}
        >
          <Icon size={24} className="text-white drop-shadow-md" />
          {ActionIcon && (
            <div className="absolute -bottom-1 -right-1 bg-slate-800 rounded-full p-1 border border-white/10">
               <ActionIcon size={12} className="text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Goal Modal ----------
const GoalModal = ({ currentGoals, onClose, onSave }) => {
  const [goals, setGoals] = useState(currentGoals);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold text-white mb-6">
          Hedeflerini Belirle
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
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
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
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
              className="glass-input w-full"
            />
          </div>

          <button
            onClick={() => onSave(goals)}
            className="glass-btn w-full flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <Save size={18} /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Last Exam Summary ----------
const LastExamCard = ({ exam }) => {
  if (!exam) return null;

  const subjectLabels = {
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

  const subjectColors = {
    turkce: "from-rose-500 to-red-600",
    matematik: "from-blue-500 to-indigo-600",
    geometri: "from-cyan-400 to-blue-500",
    fizik: "from-amber-400 to-orange-500",
    kimya: "from-emerald-400 to-teal-500",
    biyoloji: "from-teal-400 to-emerald-600",
    tarih: "from-orange-400 to-amber-600",
    cografya: "from-cyan-500 to-teal-500",
    felsefe: "from-indigo-400 to-violet-500",
    din: "from-red-400 to-rose-500",
    edebiyat: "from-pink-500 to-rose-500",
    tarih1: "from-orange-400 to-amber-600",
    cografya1: "from-cyan-500 to-teal-500",
    tarih2: "from-amber-500 to-orange-500",
    cografya2: "from-teal-500 to-cyan-500",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-xl p-6 md:p-8 shadow-2xl">
      {/* Refined Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 mb-4 shadow-inner">
            <Clock size={14} className="text-purple-400" />
            <span className="text-xs font-medium text-slate-300">En Son Çözülen Deneme</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2 tracking-tight">
            {exam.name}
          </h3>
          <p className="text-sm text-slate-400">
            {exam.date} tarihinde çözüldü
          </p>
        </div>
        
        <div className="flex items-center gap-6 md:text-right">
          <div>
            <p className="text-sm text-slate-500 mb-1">Deneme Türü</p>
            <span
              className={`inline-flex items-center px-4 py-1.5 rounded-xl text-sm font-bold shadow-sm ${
                exam.type === "TYT"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "bg-pink-500/20 text-pink-300 border border-pink-500/30"
              }`}
            >
              {exam.subtype || exam.type}
            </span>
          </div>
          <div className="w-px h-12 bg-white/10 hidden md:block"></div>
          <div>
            <p className="text-sm text-slate-500 mb-1">Toplam Net</p>
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              {exam.totalNet.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {Object.entries(exam.scores || {}).map(([sub, stats]) => (
          <div
            key={sub}
            className="group relative overflow-hidden bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-all duration-300"
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${subjectColors[sub] || "from-slate-400 to-slate-500"} opacity-60 group-hover:opacity-100 transition-opacity`}
            />
            <div className="flex items-center gap-2 mb-3 mt-1">
              <span className="text-xs font-semibold text-slate-300 truncate tracking-wide">
                {subjectLabels[sub] || sub}
              </span>
            </div>
            <p className="text-2xl font-bold text-white mb-2">
              {(stats.net || 0).toFixed(1)}
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400/90 bg-emerald-400/10 px-2 py-0.5 rounded-md">
                {stats.d || 0} D
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400/90 bg-rose-400/10 px-2 py-0.5 rounded-md">
                {stats.y || 0} Y
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Quick Links ----------
const QuickLinks = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {[
      {
        label: "Deneme Ekle",
        desc: "Yeni deneme sonuçlarını gir",
        href: "/dashboard/add-exam",
        icon: Zap,
        gradient: "from-purple-600 to-violet-600",
        shadow: "shadow-purple-500/20",
      },
      {
        label: "Detaylı Analiz",
        desc: "Ders bazlı analiz ve grafikler",
        href: "/dashboard/analysis",
        icon: BarChart3,
        gradient: "from-blue-600 to-cyan-600",
        shadow: "shadow-blue-500/20",
      },
      {
        label: "Konu Takip",
        desc: "Konuları, soruları ve tekrarları izle",
        href: "/dashboard/subjects",
        icon: BookOpen,
        gradient: "from-emerald-600 to-teal-600",
        shadow: "shadow-emerald-500/20",
      },
    ].map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className={`group relative flex items-center gap-5 p-5 rounded-3xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-1 hover:shadow-2xl ${link.shadow}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-[0.03] rounded-3xl transition-opacity duration-300`} />
        <div
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shrink-0 shadow-lg`}
        >
          <link.icon size={24} className="text-white drop-shadow-md" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
            {link.label}
          </p>
          <p className="text-xs text-slate-400 mt-1">{link.desc}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
          <ArrowRight
            size={16}
            className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0"
          />
        </div>
      </Link>
    ))}
  </div>
);

// ---------- Custom Tooltip ----------
const ChartTooltip = ({ active, payload, color = "purple" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-white/10 backdrop-blur-sm p-3 rounded-xl shadow-xl">
        <p className="font-semibold text-slate-200 text-sm mb-1">
          {payload[0].payload.trialName}
        </p>
        <p className={`text-${color}-400 font-bold text-lg`}>
          {payload[0].value} Net
        </p>
      </div>
    );
  }
  return null;
};

// ---------- Main Component ----------
const DashboardContent = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({ tyt: 0, ayt: 0 });
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [chartTab, setChartTab] = useState("TYT");
  const [stats, setStats] = useState({
    totalExams: 0,
    tytAvg: 0,
    aytAvg: 0,
  });
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Verilerin analiz ediliyor... 🚀",
  );
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userId = user.uid;

        const examData = await getUserExams(userId);
        const reversedData = [...examData].reverse();
        setExams(reversedData);

        const userProfile = await getUserProfile(userId);
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
                tytExams.reduce((acc, curr) => acc + curr.totalNet, 0) /
                tytExams.length
              ).toFixed(2)
            : 0;

        const aytAvg =
          aytExams.length > 0
            ? (
                aytExams.reduce((acc, curr) => acc + curr.totalNet, 0) /
                aytExams.length
              ).toFixed(2)
            : 0;

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

  const handleGoalSave = async (newGoals) => {
    if (user) {
      await updateUserGoals(user.uid, newGoals);
      setGoals(newGoals);
      setIsGoalModalOpen(false);
    }
  };

  const tytData = exams
    .filter((e) => e.type === "TYT")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({ trialName: e.name, date: e.date, net: e.totalNet }));

  const aytData = exams
    .filter((e) => e.type === "AYT")
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => ({ trialName: e.name, date: e.date, net: e.totalNet }));

  const activeChartData = chartTab === "TYT" ? tytData : aytData;
  const activeGoal = chartTab === "TYT" ? goals.tyt : goals.ayt;
  const chartColor = chartTab === "TYT" ? "#8b5cf6" : "#ec4899";
  const chartGradientId = chartTab === "TYT" ? "colorTyt" : "colorAyt";

  // Last exam (most recent by date)
  const lastExam = exams.length > 0 ? exams[0] : null;

  // TYT/AYT trend
  const getTrend = (type) => {
    const typedExams = exams
      .filter((e) => e.type === type)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (typedExams.length < 2) return null;
    const diff = typedExams[0].totalNet - typedExams[1].totalNet;
    return diff;
  };

  const tytTrend = getTrend("TYT");
  const aytTrend = getTrend("AYT");

  const getGoalStatus = (current, goal) => {
    if (!goal || goal === 0) return "Hedef ayarla";
    const diff = current - goal;
    if (diff >= 0) return "Hedefe ulaşıldı! 🎉";
    return `${Math.abs(diff).toFixed(2)} net kaldı`;
  };

  const getTrendText = (trend) => {
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
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-400 mb-2 tracking-tight">
                Genel Bakış
              </h1>
              <div className="text-sm font-medium text-slate-400 [&_p]:mb-1 [&_strong]:text-slate-200 [&_a]:text-purple-400 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-0.5">
                <Markdown>{welcomeMessage}</Markdown>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-xs font-medium text-slate-300">Sistem Aktif</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Toplam Deneme"
              value={stats.totalExams}
              subtext="Tüm zamanlar"
              icon={Calendar}
              gradient="from-blue-500/30 to-cyan-500/30"
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
              gradient="from-purple-500/30 to-violet-500/30"
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
              gradient="from-pink-500/30 to-rose-500/30"
            />
            <StatCard
              title="Hedef Netler"
              value={`${goals.tyt} / ${goals.ayt}`}
              subtext="Düzenlemek için tıkla"
              icon={Target}
              gradient="from-green-500/30 to-emerald-500/30"
              onClick={() => setIsGoalModalOpen(true)}
              actionIcon={Edit2}
            />
          </div>

          {/* Last Exam Summary */}
          <LastExamCard exam={lastExam} />

          {/* Quick Links */}
          <QuickLinks />

          {/* Chart with Tab Switcher */}
          {(tytData.length > 0 || aytData.length > 0) && (
            <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-xl p-6 md:p-8 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Net Değişim Grafiği
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Son denemelerindeki net artışını takip et</p>
                </div>
                <div className="flex gap-1.5 p-1.5 bg-slate-900/50 border border-white/5 rounded-2xl backdrop-blur-md">
                  {["TYT", "AYT"].map((tab) => {
                    const hasData =
                      tab === "TYT" ? tytData.length > 0 : aytData.length > 0;
                    return (
                      <button
                        key={tab}
                        onClick={() => hasData && setChartTab(tab)}
                        disabled={!hasData}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                          chartTab === tab
                            ? tab === "TYT"
                              ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-900/40"
                              : "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-900/40"
                            : hasData
                              ? "text-slate-400 hover:text-white hover:bg-white/5"
                              : "text-slate-600 cursor-not-allowed"
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
                      margin={{ top: 5, right: 5, bottom: 50, left: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id={chartGradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={chartColor}
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor={chartColor}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#475569"
                        tick={{
                          angle: -45,
                          textAnchor: "end",
                          fontSize: 11,
                          fill: "#64748b",
                        }}
                        tickFormatter={(value) => {
                          if (!value) return "";
                          const date = new Date(value);
                          return date.toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                          });
                        }}
                        height={60}
                      />
                      <YAxis
                        stroke="#475569"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => (
                          <ChartTooltip
                            active={active}
                            payload={payload}
                            color={chartTab === "TYT" ? "purple" : "pink"}
                          />
                        )}
                      />
                      {activeGoal > 0 && (
                        <ReferenceLine
                          y={activeGoal}
                          stroke="#22c55e"
                          strokeDasharray="6 4"
                          strokeWidth={1.5}
                          label={{
                            value: `Hedef: ${activeGoal}`,
                            fill: "#22c55e",
                            fontSize: 11,
                            position: "insideTopRight",
                          }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke={chartColor}
                        fillOpacity={1}
                        fill={`url(#${chartGradientId})`}
                        strokeWidth={4}
                        isAnimationActive={false}
                        dot={{
                          fill: chartColor,
                          r: 4,
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 8,
                          fill: chartColor,
                          stroke: "#fff",
                          strokeWidth: 3,
                        }}
                        name="Net"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-slate-500 text-sm">
                    Bu tür için henüz deneme verisi yok.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {tytData.length === 0 && aytData.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-800/30 text-center py-16 px-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
                <BarChart3 size={28} className="text-purple-400" />
              </div>
              <p className="text-white text-lg font-semibold mb-2">
                Henüz deneme verisi yok
              </p>
              <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                İlk denemeni ekledikten sonra grafikler ve analizler burada
                görünecek.
              </p>
              <Link
                href="/dashboard/add-exam"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-colors"
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
