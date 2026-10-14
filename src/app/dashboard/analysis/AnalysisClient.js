"use client";

import { EXAM_CONFIG } from "@/constants";
import React, { useEffect, useState, useMemo } from "react";
import Markdown from "react-markdown";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { getUserExams } from "@/services/examService";
import { generateAnalysis } from "@/services/aiService";
import { getUserProfile, updateUserProfile } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import {
  calculateSubjectStats,
  prepareRadarData,
  prepareTrendData,
} from "@/utils/analysisHelpers";
import {
  FileDown,
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Shield,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { generatePDF } from "@/utils/pdfGenerator";
import AnalysisReport from "@/components/AnalysisReport";
import AnalysisSkeleton from "@/components/analysis/AnalysisSkeleton";

const SUBJECT_ORDER = {
  TYT: [
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
  ],
  AYT: [
    "edebiyat",
    "tarih1",
    "cografya1",
    "tarih2",
    "cografya2",
    "felsefe",
    "din",
    "matematik",
    "geometri",
    "fizik",
    "kimya",
    "biyoloji",
  ],
};

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

const SUBJECT_COLORS = {
  turkce: "#ef4444",
  matematik: "#3b82f6",
  geometri: "#06b6d4",
  fizik: "#eab308",
  kimya: "#22c55e",
  biyoloji: "#10b981",
  tarih: "#f59e0b",
  cografya: "#14b8a6",
  felsefe: "#6366f1",
  din: "#f97316",
  edebiyat: "#ec4899",
  tarih1: "#f59e0b",
  cografya1: "#14b8a6",
  tarih2: "#d97706",
  cografya2: "#0d9488",
};

// ---------- AI Analysis Card ----------
const AIAnalysisCard = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0F2A5C] text-white p-6 md:p-8 shadow-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2F6BFF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="relative flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
          <Brain size={24} className="text-[#FFB020]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#FFB020]">AI Koç</span>
            <span className="text-white/40">·</span>
            <h3 className="text-lg font-bold text-white">
              Yapay Zeka Görüşü & Strateji
            </h3>
          </div>
          <div className="text-sm text-white/90 leading-relaxed [&_p]:mb-2 [&_a]:text-[#7FB0FF] [&_strong]:text-white [&_strong]:font-bold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-[#FFB020] [&_h3]:mb-1">
            <Markdown>{analysis}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Strength & Weakness Cards ----------
const StrengthWeaknessCards = ({ stats, sortedKeys }) => {
  if (sortedKeys.length < 2) return null;

  const sorted = [...sortedKeys].sort(
    (a, b) => parseFloat(stats[b].avg) - parseFloat(stats[a].avg),
  );

  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3).reverse();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Strong */}
      <div className="rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#0F2A5C] mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Shield size={18} />
          </div>
          En Güçlü Olduğun Dersler
        </h3>
        <div className="space-y-4">
          {top3.map((sub, i) => (
            <div key={sub} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-xs font-bold text-emerald-600 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#0F2A5C] font-semibold">
                    {SUBJECT_LABELS[sub] || sub}
                  </span>
                  <span className="text-sm font-bold text-emerald-600">
                    {stats[sub].avg} Net
                  </span>
                </div>
                <div className="w-full bg-[#F4F7FC] rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (parseFloat(stats[sub].avg) / (stats[sub].max || 40)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak */}
      <div className="rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-[#0F2A5C] mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFB020]/15 flex items-center justify-center text-[#FFB020]">
            <AlertTriangle size={18} />
          </div>
          Geliştirilmesi Gereken Dersler
        </h3>
        <div className="space-y-4">
          {bottom3.map((sub, i) => (
            <div key={sub} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center text-xs font-bold text-[#FFB020] shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#0F2A5C] font-semibold">
                    {SUBJECT_LABELS[sub] || sub}
                  </span>
                  <span className="text-sm font-bold text-[#FFB020]">
                    {stats[sub].avg} Net
                  </span>
                </div>
                <div className="w-full bg-[#F4F7FC] rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-[#FFB020] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (parseFloat(stats[sub].avg) / (stats[sub].max || 40)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ---------- Subject Stats Grid ----------
const SubjectStatsGrid = ({ stats, sortedKeys }) => {
  // Prepare bar chart data
  const barData = sortedKeys.map((sub) => ({
    name: SUBJECT_LABELS[sub] || sub,
    avg: parseFloat(stats[sub].avg),
    max: stats[sub].max,
    min: stats[sub].min,
    color: SUBJECT_COLORS[sub] || "#2F6BFF",
  }));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[#0F2A5C]">
            Ders Bazlı Ortalama Karşılaştırma
          </h3>
          <p className="text-xs text-[#4A5B7A] mt-0.5">Tüm dersler için ortalama net başarı dağılımı</p>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ bottom: 60, left: 0, right: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#0F2A5C"
              strokeOpacity={0.06}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#4A5B7A"
              tick={{
                angle: -45,
                textAnchor: "end",
                fontSize: 11,
                fill: "#4A5B7A",
              }}
              height={60}
            />
            <YAxis stroke="#4A5B7A" tick={{ fontSize: 11, fill: "#4A5B7A" }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#0F2A5C]/[0.08] p-3 rounded-2xl shadow-lg">
                      <p className="font-bold text-[#0F2A5C] text-sm mb-1.5">
                        {d.name}
                      </p>
                      <div className="space-y-0.5 text-xs">
                        <p>
                          <span className="text-[#4A5B7A]">Ortalama: </span>
                          <span className="font-bold text-[#0F2A5C]">{d.avg} Net</span>
                        </p>
                        <p>
                          <span className="text-[#4A5B7A]">En Yüksek: </span>
                          <span className="text-emerald-600 font-bold">{d.max}</span>
                        </p>
                        <p>
                          <span className="text-[#4A5B7A]">En Düşük: </span>
                          <span className="text-[#FFB020] font-bold">{d.min}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="avg" radius={[8, 8, 0, 0]} maxBarSize={36} isAnimationActive={false}>
              {barData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Cards Below */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
        {sortedKeys.map((subject) => {
          const color = SUBJECT_COLORS[subject] || "#2F6BFF";
          return (
            <div
              key={subject}
              className="rounded-2xl bg-[#F4F7FC] border border-[#0F2A5C]/[0.05] p-3.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h4 className="text-xs font-bold text-[#4A5B7A] truncate">
                  {SUBJECT_LABELS[subject] || subject}
                </h4>
              </div>
              <p className="text-xl font-extrabold text-[#0F2A5C]">
                {stats[subject].avg}
              </p>
              <div className="flex justify-between mt-2 text-[10px] text-[#4A5B7A] border-t border-[#0F2A5C]/[0.06] pt-1.5 font-medium">
                <span>
                  Max:{" "}
                  <span className="text-emerald-600 font-bold">
                    {stats[subject].max}
                  </span>
                </span>
                <span>
                  Min:{" "}
                  <span className="text-[#FFB020] font-bold">
                    {stats[subject].min}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Main Component ----------
const AnalysisClient = () => {
  const reportRef = React.useRef();
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState("TYT");
  const [reportFilter, setReportFilter] = useState("TYT");
  const [loading, setLoading] = useState(true);
  const [selectedExams, setSelectedExams] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [selectedChartSubject, setSelectedChartSubject] = useState("turkce");

  const { user } = useAuth();

  useEffect(() => {
    const fetchExams = async () => {
      if (user) {
        const data = await getUserExams(user.uid);
        data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setExams(data);

        if (data.length > 0) {
          const recentExams = data.slice(-5).map((e) => ({
            date: e.date,
            type: e.type,
            net: e.totalNet,
            correct: e.correct,
            incorrect: e.incorrect,
          }));

          const dataHash = JSON.stringify(recentExams);

          const profile = await getUserProfile(user.uid);

          if (
            profile &&
            profile.lastAnalysisHash === dataHash &&
            profile.analysisMessage
          ) {
            setAiAnalysis(profile.analysisMessage);
          } else {
            generateAnalysis(recentExams).then(async (res) => {
              setAiAnalysis(res);
              await updateUserProfile(user.uid, {
                analysisMessage: res,
                lastAnalysisHash: dataHash,
              });
            });
          }
        }
      }
      setLoading(false);
    };
    if (user) fetchExams();
  }, [user]);

  const currentType = activeTab === "REPORT" ? "TYT" : activeTab;

  const stats = useMemo(
    () => calculateSubjectStats(exams, currentType),
    [exams, currentType],
  );
  const radarData = useMemo(() => {
    const data = prepareRadarData(stats, currentType);
    const order = SUBJECT_ORDER[currentType] || [];

    return data
      .map((item) => ({
        ...item,
        subject: SUBJECT_LABELS[item.subjectId] || item.subject,
      }))
      .sort((a, b) => {
        const indexA = order.indexOf(a.subjectId);
        const indexB = order.indexOf(b.subjectId);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
  }, [stats, currentType]);
  const trendData = useMemo(
    () => prepareTrendData(exams, currentType, "total"),
    [exams, currentType],
  );
  const subjectTrendData = useMemo(
    () => prepareTrendData(exams, currentType, selectedChartSubject),
    [exams, currentType, selectedChartSubject],
  );

  const sortedStatsKeys = useMemo(() => {
    const keys = Object.keys(stats);
    const order = SUBJECT_ORDER[currentType] || [];
    return keys.sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });
  }, [stats, currentType]);

  // Ensure selected subject is valid when data changes
  if (
    sortedStatsKeys.length > 0 &&
    !sortedStatsKeys.includes(selectedChartSubject)
  ) {
    setSelectedChartSubject(sortedStatsKeys[0]);
  }

  const toggleExamSelection = (id) => {
    if (selectedExams.includes(id)) {
      setSelectedExams(selectedExams.filter((exId) => exId !== id));
    } else {
      setSelectedExams([...selectedExams, id]);
    }
  };

  const selectAllExams = () => {
    const visibleExams = exams.filter((e) => e.type === reportFilter);
    const allSelected = visibleExams.every((e) => selectedExams.includes(e.id));

    if (allSelected) {
      const visibleIds = visibleExams.map((e) => e.id);
      setSelectedExams(selectedExams.filter((id) => !visibleIds.includes(id)));
    } else {
      const visibleIds = visibleExams.map((e) => e.id);
      setSelectedExams(visibleIds);
    }
  };

  const handleReportFilterChange = (type) => {
    setReportFilter(type);
    setSelectedExams([]);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    await generatePDF(
      reportRef.current,
      `yks-analiz-raporu-${reportFilter.toLowerCase()}.pdf`,
    );
  };

  const reportExams = useMemo(
    () =>
      exams.filter(
        (e) => selectedExams.includes(e.id) && e.type === reportFilter,
      ),
    [exams, selectedExams, reportFilter],
  );

  if (loading) return <AnalysisSkeleton />;

  return (
    <div className="space-y-6 pb-20">
      {/* Header + Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F2A5C] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2F6BFF]/10 flex items-center justify-center text-[#2F6BFF]">
              <BarChart3 size={24} />
            </div>
            Detaylı Analiz
          </h1>
          <p className="text-[#4A5B7A] text-sm mt-1">
            Ders bazlı istatistikler, güçlü/zayıf alanlar ve gelişim grafikleri
          </p>
        </div>
        <div className="flex gap-1.5 p-1.5 bg-white rounded-2xl border border-[#0F2A5C]/[0.08] shadow-xs w-fit">
          {["TYT", "AYT", "REPORT"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#0F2A5C] text-white shadow-xs"
                  : "text-[#4A5B7A] hover:text-[#0F2A5C] hover:bg-[#F4F7FC]"
              }`}
            >
              {tab === "REPORT" ? "Rapor İndir" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* AI Analysis */}
      <AIAnalysisCard analysis={aiAnalysis} />

      {activeTab !== "REPORT" ? (
        exams.filter((e) => e.type === activeTab).length > 0 ? (
          <>
            {/* Strength / Weakness */}
            <StrengthWeaknessCards stats={stats} sortedKeys={sortedStatsKeys} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Radar Chart */}
              <div className="relative overflow-hidden rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#0F2A5C] mb-4">
                  Ders Başarı Dağılımı
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      data={radarData}
                    >
                      <PolarGrid stroke="#0F2A5C" strokeOpacity={0.08} />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#4A5B7A", fontSize: 11, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Başarı Oranı"
                        dataKey="A"
                        stroke="#2F6BFF"
                        strokeWidth={2}
                        fill="#2F6BFF"
                        fillOpacity={0.2}
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border border-[#0F2A5C]/[0.08] p-3 rounded-2xl shadow-lg">
                                <p className="font-bold text-[#0F2A5C] text-sm mb-1">
                                  {data.subject}
                                </p>
                                <p className="text-[#2F6BFF] font-bold">
                                  %{data.A} Başarı
                                </p>
                                <p className="text-[#4A5B7A] text-xs">
                                  Net: {data.originalNet} / {data.fullMark}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="relative overflow-hidden rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-[#0F2A5C] mb-4">
                  Genel Net Değişimi
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#0F2A5C"
                        strokeOpacity={0.06}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#4A5B7A"
                        fontSize={11}
                        tick={{ fill: "#4A5B7A" }}
                        tickFormatter={(val) =>
                          val.split("-").slice(1).join("/")
                        }
                      />
                      <YAxis
                        stroke="#4A5B7A"
                        tick={{ fontSize: 11, fill: "#4A5B7A" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white border border-[#0F2A5C]/[0.08] p-3 rounded-2xl shadow-lg">
                                <p className="font-bold text-[#0F2A5C] text-sm mb-1">
                                  {payload[0].payload.examName}
                                </p>
                                <p className="text-[#2F6BFF] font-bold text-lg">
                                  {payload[0].value} Net
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2F6BFF"
                        strokeWidth={3}
                        isAnimationActive={false}
                        dot={{ fill: "#2F6BFF", r: 4, strokeWidth: 0 }}
                        activeDot={{
                          r: 6,
                          fill: "#2F6BFF",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Subject Stats Bar Chart + Grid */}
            <SubjectStatsGrid stats={stats} sortedKeys={sortedStatsKeys} />

            {/* Subject Analysis Chart */}
            <div className="relative overflow-hidden rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-3">
                <h3 className="text-base font-bold text-[#0F2A5C]">
                  Ders Bazlı Net Değişimi
                </h3>

                <div className="flex flex-wrap gap-1.5">
                  {sortedStatsKeys.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => setSelectedChartSubject(subject)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedChartSubject === subject
                          ? "text-white shadow-xs"
                          : "bg-[#F4F7FC] text-[#4A5B7A] hover:text-[#0F2A5C]"
                      }`}
                      style={
                        selectedChartSubject === subject
                          ? {
                              backgroundColor:
                                SUBJECT_COLORS[subject] || "#2F6BFF",
                            }
                          : {}
                      }
                    >
                      {SUBJECT_LABELS[subject] || subject}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={subjectTrendData} margin={{ bottom: 50 }}>
                    <defs>
                      <linearGradient
                        id="colorSubjectNet"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={
                            SUBJECT_COLORS[selectedChartSubject] || "#2F6BFF"
                          }
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor={
                            SUBJECT_COLORS[selectedChartSubject] || "#2F6BFF"
                          }
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#0F2A5C"
                      strokeOpacity={0.06}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#4A5B7A"
                      tick={{
                        angle: -45,
                        textAnchor: "end",
                        fontSize: 11,
                        fill: "#4A5B7A",
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
                      stroke="#4A5B7A"
                      tick={{ fontSize: 11, fill: "#4A5B7A" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white border border-[#0F2A5C]/[0.08] p-3 rounded-2xl shadow-lg">
                              <p className="font-bold text-[#0F2A5C] text-sm mb-1">
                                {payload[0].payload.examName}
                              </p>
                              <p
                                className="font-bold text-lg"
                                style={{
                                  color:
                                    SUBJECT_COLORS[selectedChartSubject] ||
                                    "#2F6BFF",
                                }}
                              >
                                {SUBJECT_LABELS[selectedChartSubject] ||
                                  selectedChartSubject}
                                : {payload[0].value} Net
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={SUBJECT_COLORS[selectedChartSubject] || "#2F6BFF"}
                      fillOpacity={1}
                      fill="url(#colorSubjectNet)"
                      strokeWidth={3}
                      isAnimationActive={false}
                      dot={{
                        fill: SUBJECT_COLORS[selectedChartSubject] || "#2F6BFF",
                        r: 4,
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 6,
                        fill: SUBJECT_COLORS[selectedChartSubject] || "#2F6BFF",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                      name="Net"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#0F2A5C]/[0.15] bg-white text-center py-16 p-6">
            <div className="w-16 h-16 rounded-2xl bg-[#2F6BFF]/10 flex items-center justify-center mx-auto mb-4 text-[#2F6BFF]">
              <BarChart3 size={32} />
            </div>
            <p className="text-[#0F2A5C] text-lg font-bold mb-1">
              Henüz {activeTab} deneme verisi bulunamadı
            </p>
            <p className="text-[#4A5B7A] text-sm">
              Deneme ekledikten sonra ders bazlı analizler ve grafikler burada listelenecek.
            </p>
          </div>
        )
      ) : (
        /* Report Generation View */
        <div className="relative overflow-hidden rounded-3xl border border-[#0F2A5C]/[0.08] bg-white p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-[#0F2A5C]">PDF Raporu Oluştur</h3>
              <div className="flex gap-1 p-1 bg-[#F4F7FC] rounded-xl border border-[#0F2A5C]/[0.06]">
                <button
                  onClick={() => handleReportFilterChange("TYT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === "TYT"
                      ? "bg-[#0F2A5C] text-white shadow-xs"
                      : "text-[#4A5B7A] hover:text-[#0F2A5C]"
                  }`}
                >
                  TYT
                </button>
                <button
                  onClick={() => handleReportFilterChange("AYT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === "AYT"
                      ? "bg-[#0F2A5C] text-white shadow-xs"
                      : "text-[#4A5B7A] hover:text-[#0F2A5C]"
                  }`}
                >
                  AYT
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAllExams}
                className="px-4 py-2 bg-[#F4F7FC] hover:bg-[#e8edf7] border border-[#0F2A5C]/[0.08] rounded-xl text-[#0F2A5C] text-sm font-semibold transition-colors cursor-pointer"
              >
                Tümünü Seç
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F6BFF] hover:bg-[#2558d6] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <FileDown size={18} />
                PDF İndir
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#0F2A5C]/[0.08]">
            <table className="w-full text-left text-sm text-[#4A5B7A]">
              <thead className="text-xs uppercase bg-[#F4F7FC] text-[#0F2A5C] font-bold">
                <tr>
                  <th className="px-4 py-3.5">Seç</th>
                  <th className="px-4 py-3.5">Tarih</th>
                  <th className="px-4 py-3.5">Deneme Adı</th>
                  <th className="px-4 py-3.5">Tür</th>
                  <th className="px-4 py-3.5 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F2A5C]/[0.06]">
                {exams
                  .filter((e) => e.type === reportFilter)
                  .map((exam) => (
                    <tr
                      key={exam.id}
                      className={`hover:bg-[#F4F7FC]/70 transition-colors cursor-pointer ${selectedExams.includes(exam.id) ? "bg-[#2F6BFF]/5" : ""}`}
                      onClick={() => toggleExamSelection(exam.id)}
                    >
                      <td className="px-4 py-3.5">
                        {selectedExams.includes(exam.id) ? (
                          <CheckSquare size={18} className="text-[#2F6BFF]" />
                        ) : (
                          <Square size={18} className="text-[#4A5B7A]/50" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium">{exam.date}</td>
                      <td className="px-4 py-3.5 font-bold text-[#0F2A5C]">
                        {exam.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${exam.type === "TYT" ? "bg-[#2F6BFF]/10 text-[#2F6BFF]" : "bg-[#FFB020]/15 text-[#c48208]"}`}
                        >
                          {exam.type} {exam.subtype && `(${exam.subtype})`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-[#0F2A5C]">
                        {exam.totalNet.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden Report Component for PDF Generation */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <AnalysisReport
          ref={reportRef}
          exams={reportExams}
          type={reportFilter}
          userName={user ? user.displayName : "Öğrenci"}
        />
      </div>
    </div>
  );
};

export default AnalysisClient;
