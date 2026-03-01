"use client";

import { EXAM_CONFIG } from "@/constants";
import React, { useEffect, useState, useMemo } from "react";
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
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-slate-900/40 p-5 md:p-6">
      <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Brain size={20} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-blue-100 mb-2">
            Yapay Zeka Koç Görüşü
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            &ldquo;{analysis}&rdquo;
          </p>
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
      <div className="rounded-2xl border border-green-500/20 bg-green-900/10 p-5">
        <h3 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2">
          <Shield size={16} />
          En Güçlü Dersler
        </h3>
        <div className="space-y-3">
          {top3.map((sub, i) => (
            <div key={sub} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-green-500/15 flex items-center justify-center text-xs font-bold text-green-400">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-200 font-medium">
                    {SUBJECT_LABELS[sub] || sub}
                  </span>
                  <span className="text-sm font-bold text-green-400">
                    {stats[sub].avg}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
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
      <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-5">
        <h3 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} />
          Geliştirilmesi Gereken
        </h3>
        <div className="space-y-3">
          {bottom3.map((sub, i) => (
            <div key={sub} className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-lg bg-red-500/15 flex items-center justify-center text-xs font-bold text-red-400">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-200 font-medium">
                    {SUBJECT_LABELS[sub] || sub}
                  </span>
                  <span className="text-sm font-bold text-red-400">
                    {stats[sub].avg}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400 transition-all duration-500"
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
    color: SUBJECT_COLORS[sub] || "#8b5cf6",
  }));

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-5 md:p-6">
      <h3 className="text-lg font-bold text-white mb-5">
        Ders Bazlı Ortalama Karşılaştırma
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ bottom: 60, left: 0, right: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1e293b"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tick={{
                angle: -45,
                textAnchor: "end",
                fontSize: 11,
                fill: "#64748b",
              }}
              height={60}
            />
            <YAxis stroke="#475569" tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-800/95 border border-white/10 backdrop-blur-sm p-3 rounded-xl shadow-xl">
                      <p className="font-semibold text-white text-sm mb-1">
                        {d.name}
                      </p>
                      <div className="space-y-0.5 text-xs">
                        <p>
                          <span className="text-slate-400">Ort: </span>
                          <span className="font-bold text-white">{d.avg}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Max: </span>
                          <span className="text-green-400">{d.max}</span>
                        </p>
                        <p>
                          <span className="text-slate-400">Min: </span>
                          <span className="text-red-400">{d.min}</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {barData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Cards Below */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-6">
        {sortedKeys.map((subject) => {
          const color = SUBJECT_COLORS[subject] || "#8b5cf6";
          return (
            <div
              key={subject}
              className="rounded-xl bg-white/5 border border-white/5 p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h4 className="text-xs font-medium text-slate-400 truncate">
                  {SUBJECT_LABELS[subject] || subject}
                </h4>
              </div>
              <p className="text-xl font-bold text-white">
                {stats[subject].avg}
              </p>
              <div className="flex justify-between mt-2 text-[10px] text-slate-500 border-t border-white/5 pt-1.5">
                <span>
                  Max:{" "}
                  <span className="text-green-400 font-medium">
                    {stats[subject].max}
                  </span>
                </span>
                <span>
                  Min:{" "}
                  <span className="text-red-400 font-medium">
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
  const radarData = useMemo(
    () => prepareRadarData(stats, currentType),
    [stats, currentType],
  );
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 size={28} className="text-purple-400" />
            Detaylı Analiz
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Ders bazlı istatistikler, güçlü/zayıf alanlar ve trendler
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
          {["TYT", "AYT", "REPORT"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "REPORT" ? "Rapor" : tab}
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
              <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-5">
                <h3 className="text-base font-bold text-white mb-4">
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
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#94a3b8", fontSize: 11 }}
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
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="#8b5cf6"
                        fillOpacity={0.25}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-800/95 border border-white/10 backdrop-blur-sm p-3 rounded-xl shadow-xl">
                                <p className="font-semibold text-white text-sm mb-1">
                                  {data.subject}
                                </p>
                                <p className="text-purple-400 font-bold">
                                  %{data.A}
                                </p>
                                <p className="text-slate-400 text-xs">
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
              <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-5">
                <h3 className="text-base font-bold text-white mb-4">
                  Genel Net Değişimi
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="#475569"
                        fontSize={11}
                        tick={{ fill: "#64748b" }}
                        tickFormatter={(val) =>
                          val.split("-").slice(1).join("/")
                        }
                      />
                      <YAxis
                        stroke="#475569"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-800/95 border border-white/10 backdrop-blur-sm p-3 rounded-xl shadow-xl">
                                <p className="font-semibold text-white text-sm mb-1">
                                  {payload[0].payload.examName}
                                </p>
                                <p className="text-pink-400 font-bold text-lg">
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
                        stroke="#ec4899"
                        strokeWidth={3}
                        dot={{ fill: "#ec4899", r: 4, strokeWidth: 0 }}
                        activeDot={{
                          r: 6,
                          fill: "#ec4899",
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
            <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-5 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-3">
                <h3 className="text-base font-bold text-white">
                  Ders Bazlı Net Değişimi
                </h3>

                <div className="flex flex-wrap gap-1.5">
                  {sortedStatsKeys.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => setSelectedChartSubject(subject)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedChartSubject === subject
                          ? "text-white shadow-lg"
                          : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                      style={
                        selectedChartSubject === subject
                          ? {
                              backgroundColor:
                                SUBJECT_COLORS[subject] || "#8b5cf6",
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
                            SUBJECT_COLORS[selectedChartSubject] || "#3b82f6"
                          }
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor={
                            SUBJECT_COLORS[selectedChartSubject] || "#3b82f6"
                          }
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
                      dataKey="name"
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
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-800/95 border border-white/10 backdrop-blur-sm p-3 rounded-xl shadow-xl">
                              <p className="font-semibold text-white text-sm mb-1">
                                {payload[0].payload.examName}
                              </p>
                              <p
                                className="font-bold text-lg"
                                style={{
                                  color:
                                    SUBJECT_COLORS[selectedChartSubject] ||
                                    "#3b82f6",
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
                      stroke={SUBJECT_COLORS[selectedChartSubject] || "#3b82f6"}
                      fillOpacity={1}
                      fill="url(#colorSubjectNet)"
                      strokeWidth={3}
                      dot={{
                        fill: SUBJECT_COLORS[selectedChartSubject] || "#3b82f6",
                        r: 4,
                        strokeWidth: 0,
                      }}
                      activeDot={{
                        r: 6,
                        fill: SUBJECT_COLORS[selectedChartSubject] || "#3b82f6",
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
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-800/30 text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
              <BarChart3 size={28} className="text-purple-400" />
            </div>
            <p className="text-white text-lg font-semibold mb-2">
              Henüz {activeTab} deneme verisi bulunamadı
            </p>
            <p className="text-slate-500 text-sm">
              Deneme ekledikten sonra analizler burada görünecek.
            </p>
          </div>
        )
      ) : (
        /* Report Generation View */
        <div className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white">Rapor Oluştur</h3>
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => handleReportFilterChange("TYT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === "TYT"
                      ? "bg-purple-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  TYT
                </button>
                <button
                  onClick={() => handleReportFilterChange("AYT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === "AYT"
                      ? "bg-pink-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  AYT
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={selectAllExams}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm transition-colors cursor-pointer"
              >
                Tümünü Seç
              </button>
              <button
                onClick={handleDownloadPDF}
                className="glass-btn flex items-center gap-2 cursor-pointer"
              >
                <FileDown size={18} />
                PDF İndir
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase bg-white/5 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Seç</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Deneme Adı</th>
                  <th className="px-4 py-3">Tür</th>
                  <th className="px-4 py-3 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {exams
                  .filter((e) => e.type === reportFilter)
                  .map((exam) => (
                    <tr
                      key={exam.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${selectedExams.includes(exam.id) ? "bg-purple-900/20" : ""}`}
                      onClick={() => toggleExamSelection(exam.id)}
                    >
                      <td className="px-4 py-3">
                        {selectedExams.includes(exam.id) ? (
                          <CheckSquare size={18} className="text-purple-400" />
                        ) : (
                          <Square size={18} />
                        )}
                      </td>
                      <td className="px-4 py-3">{exam.date}</td>
                      <td className="px-4 py-3 font-medium text-white">
                        {exam.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${exam.type === "TYT" ? "bg-purple-500/20 text-purple-300" : "bg-pink-500/20 text-pink-300"}`}
                        >
                          {exam.type} {exam.subtype && `(${exam.subtype})`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
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
