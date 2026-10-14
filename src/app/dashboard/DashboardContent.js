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
  iconBg = "bg-[#0F2A5C]",
  iconColor = "text-white",
  onClick,
}) => {
  const isPositive = subtext && subtext.includes("+");
  const isNegative = subtext && subtext.includes("-");

  return (
    <div
      className={`p-6 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm hover:shadow-md transition-all duration-300 flex items-start justify-between ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div>
        <p className="text-[#4A5B7A] text-[11px] font-bold tracking-wider mb-2 uppercase">
          {title}
        </p>
        <h3 className="text-4xl font-black text-[#0F2A5C] mb-3 tracking-tight">
          {value}
        </h3>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-flex items-center ${
            isPositive
              ? "bg-emerald-50 text-emerald-600"
              : isNegative
                ? "bg-rose-50 text-rose-500"
                : "bg-[#F4F7FC] text-[#4A5B7A]"
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
const GoalModal = ({ currentGoals, onClose, onSave }) => {
  const [goals, setGoals] = useState(currentGoals);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2A5C]/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-[#0F2A5C]/10 shadow-2xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#4A5B7A] hover:text-[#0F2A5C] hover:bg-[#F4F7FC] rounded-full transition-all cursor-pointer"
        >
          <X size={20} />
        </button>
        <h3 className="text-xl font-black text-[#0F2A5C] mb-6">
          Hedeflerini Belirle
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4A5B7A] uppercase mb-2">
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
              className="w-full bg-[#F4F7FC] border border-[#0F2A5C]/10 rounded-xl px-4 py-3 text-[#0F2A5C] font-bold focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#4A5B7A] uppercase mb-2">
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
              className="w-full bg-[#F4F7FC] border border-[#0F2A5C]/10 rounded-xl px-4 py-3 text-[#0F2A5C] font-bold focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40"
            />
          </div>

          <button
            onClick={() => onSave(goals)}
            className="w-full py-3.5 rounded-xl bg-[#2F6BFF] hover:bg-[#2558d4] text-white font-bold flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md shadow-[#2F6BFF]/25 transition-all"
          >
            <Save size={18} /> Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Last Exam Summary (Matching PDF page 8) ----------
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

  return (
    <div className="rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2F6BFF]/10 text-[#2F6BFF] text-xs font-bold mb-3">
            En Son Çözülen Deneme
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-[#0F2A5C] mb-1.5 tracking-tight">
            {exam.name}
          </h3>
          <p className="text-sm text-[#4A5B7A] font-medium">
            {exam.date} tarihinde çözüldü
          </p>
        </div>

        <div className="flex items-center gap-6 md:text-right">
          <div>
            <p className="text-xs font-semibold text-[#4A5B7A] mb-1">Deneme Türü</p>
            <span className="inline-flex items-center px-3.5 py-1 rounded-xl text-xs font-black bg-[#0F2A5C] text-white">
              {exam.subtype || exam.type}
            </span>
          </div>
          <div className="w-px h-10 bg-[#0F2A5C]/10 hidden md:block"></div>
          <div>
            <p className="text-xs font-semibold text-[#4A5B7A] mb-1">Toplam Net</p>
            <p className="text-4xl font-black text-[#0F2A5C] tracking-tight">
              {exam.totalNet.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Subject cards with blue/amber underline accent as in PDF */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {Object.entries(exam.scores || {}).map(([sub, stats]) => {
          const isWeak = (stats.net || 0) <= 2.0 && (stats.d || 0) <= 2;
          return (
            <div
              key={sub}
              className="bg-[#F4F7FC]/70 hover:bg-[#F4F7FC] rounded-2xl p-4 border border-[#0F2A5C]/[0.05] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-bold text-[#0F2A5C] truncate">
                    {subjectLabels[sub] || sub}
                  </span>
                  {isWeak && (
                    <span className="text-[9px] font-bold bg-[#FFB020]/25 text-[#0F2A5C] px-1.5 py-0.5 rounded-md">
                      Eksik
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-[#0F2A5C] mb-2 tracking-tight">
                  {(stats.net || 0).toFixed(1)}
                </p>
              </div>

              {/* Progress Bar line: Amber for weak, Blue for regular */}
              <div className="w-full h-1 bg-[#0F2A5C]/10 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${isWeak ? "bg-[#FFB020] w-1/3" : "bg-[#2F6BFF] w-3/4"}`}
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {stats.d || 0} D
                </span>
                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
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

// ---------- Quick Links (Matching PDF page 8) ----------
const QuickLinks = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
    {[
      {
        label: "Deneme Ekle",
        desc: "Yeni deneme sonuçlarını gir",
        href: "/dashboard/add-exam",
        icon: Zap,
        iconBg: "bg-[#2F6BFF]",
        iconColor: "text-white",
      },
      {
        label: "Detaylı Analiz",
        desc: "Ders bazlı analiz ve grafikler",
        href: "/dashboard/analysis",
        icon: BarChart3,
        iconBg: "bg-[#FFB020]",
        iconColor: "text-[#0F2A5C]",
      },
      {
        label: "Konu Takip",
        desc: "Konuları, soruları ve tekrarları izle",
        href: "/dashboard/subjects",
        icon: BookOpen,
        iconBg: "bg-[#0F2A5C]",
        iconColor: "text-white",
      },
    ].map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className="group flex items-center gap-4 p-5 rounded-3xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div
          className={`w-12 h-12 rounded-2xl ${link.iconBg} ${link.iconColor} flex items-center justify-center shrink-0 shadow-sm`}
        >
          <link.icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-[#0F2A5C] group-hover:text-[#2F6BFF] transition-colors">
            {link.label}
          </p>
          <p className="text-xs text-[#4A5B7A] mt-0.5 font-medium">{link.desc}</p>
        </div>
        <ArrowRight
          size={16}
          className="text-[#4A5B7A] group-hover:text-[#2F6BFF] group-hover:translate-x-1 transition-all shrink-0"
        />
      </Link>
    ))}
  </div>
);

// ---------- Custom Tooltip ----------
const ChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F2A5C] text-white p-3 rounded-2xl shadow-xl">
        <p className="font-semibold text-xs text-white/70 mb-1">
          {payload[0].payload.trialName}
        </p>
        <p className="text-[#FFB020] font-black text-lg">
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
              <h1 className="text-3xl md:text-4xl font-black text-[#0F2A5C] mb-1.5 tracking-tight">
                Genel Bakış
              </h1>
              <p className="text-xs font-semibold text-[#4A5B7A] mb-3">
                Deneme sonuçlarının güncel özeti
              </p>
              <div className="p-4 rounded-2xl bg-white border border-[#0F2A5C]/[0.08] shadow-sm flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2F6BFF] text-white flex items-center justify-center shrink-0">
                  <Zap size={18} />
                </div>
                <div className="text-xs font-medium text-[#4A5B7A] leading-relaxed [&_p]:mb-1 [&_strong]:text-[#0F2A5C]">
                  <Markdown>{welcomeMessage}</Markdown>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#0F2A5C]/[0.08] shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">Sistem Aktif</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Toplam Deneme"
              value={stats.totalExams}
              subtext="Tüm zamanlar"
              icon={Calendar}
              iconBg="bg-[#0F2A5C]"
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
              iconBg="bg-[#2F6BFF]"
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
              iconBg="bg-[#FFB020]"
              iconColor="text-[#0F2A5C]"
            />
            <StatCard
              title="Hedef Netler"
              value={`${goals.tyt} / ${goals.ayt}`}
              subtext="Düzenlemek için tıkla"
              icon={Target}
              iconBg="bg-[#0F2A5C]"
              iconColor="text-white"
              onClick={() => setIsGoalModalOpen(true)}
            />
          </div>

          {/* Last Exam Summary */}
          <LastExamCard exam={lastExam} />

          {/* Quick Links */}
          <QuickLinks />

          {/* Chart with Tab Switcher */}
          {(tytData.length > 0 || aytData.length > 0) && (
            <div className="rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-black text-[#0F2A5C] tracking-tight">
                    Net Değişim Grafiği
                  </h3>
                  <p className="text-xs text-[#4A5B7A] font-medium mt-1">
                    Son denemelerindeki net artışını takip et
                  </p>
                </div>
                <div className="flex gap-1.5 p-1 bg-[#F4F7FC] border border-[#0F2A5C]/[0.06] rounded-2xl">
                  {["TYT", "AYT"].map((tab) => {
                    const hasData =
                      tab === "TYT" ? tytData.length > 0 : aytData.length > 0;
                    return (
                      <button
                        key={tab}
                        onClick={() => hasData && setChartTab(tab)}
                        disabled={!hasData}
                        className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                          chartTab === tab
                            ? "bg-[#0F2A5C] text-white shadow-sm"
                            : "text-[#4A5B7A] hover:text-[#0F2A5C]"
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
                            stopOpacity={0.25}
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
                        stroke="#0F2A5C"
                        strokeOpacity={0.07}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        stroke="#4A5B7A"
                        tick={{
                          fontSize: 11,
                          fill: "#4A5B7A",
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
                        stroke="#4A5B7A"
                        tick={{ fontSize: 11, fill: "#4A5B7A", fontWeight: 500 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => (
                          <ChartTooltip
                            active={active}
                            payload={payload}
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
                            fill: "#0F2A5C",
                            fontSize: 11,
                            fontWeight: 700,
                            position: "insideTopRight",
                          }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="net"
                        stroke="#2F6BFF"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#2F6BFF", stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#FFB020", stroke: "#0F2A5C", strokeWidth: 2 }}
                        fillOpacity={1}
                        fill="url(#puanizChartGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <p className="text-[#4A5B7A] text-sm">
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
