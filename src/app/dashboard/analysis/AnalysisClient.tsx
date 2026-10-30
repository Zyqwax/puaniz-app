"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
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
import { getUserExams } from "@/server/actions/exam";
import { generateAnalysis } from "@/server/actions/ai";
import { getUserProfile, updateUserProfile } from "@/server/actions/profile";
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
  Brain,
  Shield,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { generatePDF } from "@/utils/pdfGenerator";
import AnalysisReport from "@/components/AnalysisReport";
import AnalysisSkeleton from "@/components/analysis/AnalysisSkeleton";
import type { ExamRecord, ExamType } from "@/types";

const SUBJECT_ORDER: Record<string, string[]> = {
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

const SUBJECT_LABELS: Record<string, string> = {
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

const SUBJECT_COLORS: Record<string, string> = {
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
const AIAnalysisCard: React.FC<{ analysis: string | null }> = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16244A] to-[#0F2A5C] text-white p-6 md:p-8 shadow-sm border border-[var(--border-strong)]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2F6BFF]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

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
interface StrengthWeaknessCardsProps {
  stats: Record<string, { avg: string; max: number; min: number }>;
  sortedKeys: string[];
}

const StrengthWeaknessCards: React.FC<StrengthWeaknessCardsProps> = ({ stats, sortedKeys }) => {
  if (sortedKeys.length < 2) return null;

  const sorted = [...sortedKeys].sort(
    (a, b) => parseFloat(stats[b]?.avg || "0") - parseFloat(stats[a]?.avg || "0"),
  );

  const top3 = sorted.slice(0, 3);
  const bottom3 = sorted.slice(-3).reverse();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Strong */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h3 className="text-base font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500">
            <Shield size={18} />
          </div>
          En Güçlü Olduğun Dersler
        </h3>
        <div className="space-y-4">
          {top3.map((sub, i) => (
            <div key={sub} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center text-xs font-bold text-emerald-500 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text)] font-semibold">
                    {SUBJECT_LABELS[sub] || sub}
                  </span>
                  <span className="text-sm font-bold text-[var(--ok)]">
                    {stats[sub]?.avg} Net
                  </span>
                </div>
                <div className="w-full bg-[var(--surface-3)] rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (parseFloat(stats[sub]?.avg || "0") / (stats[sub]?.max || 40)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak */}
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h3 className="text-base font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFB020]/15 flex items-center justify-center text-[#FFB020]">
            <AlertTriangle size={18} />
          </div>
          Geliştirilmesi Gereken Dersler
        </h3>
        <div className="space-y-4">
          {bottom3.map((sub, i) => (
            <div key={sub} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-xs font-bold text-[#FFB020] shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text)] font-semibold">
                    {SUBJECT_LABELS[sub] || sub}
                  </span>
                  <span className="text-sm font-bold text-[#FFB020]">
                    {stats[sub]?.avg} Net
                  </span>
                </div>
                <div className="w-full bg-[var(--surface-3)] rounded-full h-2">
                  <div
                    className="h-full rounded-full bg-[#FFB020] transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (parseFloat(stats[sub]?.avg || "0") / (stats[sub]?.max || 40)) * 100)}%`,
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
interface SubjectStatsGridProps {
  stats: Record<string, { avg: string; max: number; min: number }>;
  sortedKeys: string[];
}

const SubjectStatsGrid: React.FC<SubjectStatsGridProps> = ({ stats, sortedKeys }) => {
  const barData = sortedKeys.map((sub) => ({
    name: SUBJECT_LABELS[sub] || sub,
    avg: parseFloat(stats[sub]?.avg || "0"),
    max: stats[sub]?.max,
    min: stats[sub]?.min,
    color: SUBJECT_COLORS[sub] || "#2F6BFF",
  }));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-[var(--text)]">
            Ders Bazlı Ortalama Karşılaştırma
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Tüm dersler için ortalama net başarı dağılımı</p>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ bottom: 60, left: 0, right: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.8}
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="var(--text-subtle)"
              tick={{
                angle: -45,
                textAnchor: "end",
                fontSize: 11,
                fill: "var(--text-muted)",
              }}
              height={60}
            />
            <YAxis stroke="var(--text-subtle)" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as { name: string; avg: number; max: number; min: number };
                  return (
                    <div className="bg-[var(--surface-3)] border border-[var(--border-strong)] p-3 rounded-2xl shadow-lg">
                      <p className="font-bold text-[var(--text)] text-sm mb-1.5">
                        {d.name}
                      </p>
                      <div className="space-y-0.5 text-xs">
                        <p>
                          <span className="text-[var(--text-muted)]">Ortalama: </span>
                          <span className="font-bold text-[var(--text)]">{d.avg} Net</span>
                        </p>
                        <p>
                          <span className="text-[var(--text-muted)]">En Yüksek: </span>
                          <span className="text-[var(--ok)] font-bold">{d.max}</span>
                        </p>
                        <p>
                          <span className="text-[var(--text-muted)]">En Düşük: </span>
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
              className="rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] p-3.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <h4 className="text-xs font-bold text-[var(--text-muted)] truncate">
                  {SUBJECT_LABELS[subject] || subject}
                </h4>
              </div>
              <p className="text-xl font-extrabold text-[var(--text)]">
                {stats[subject]?.avg}
              </p>
              <div className="flex justify-between mt-2 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] pt-1.5 font-medium">
                <span>
                  Max:{" "}
                  <span className="text-[var(--ok)] font-bold">
                    {stats[subject]?.max}
                  </span>
                </span>
                <span>
                  Min:{" "}
                  <span className="text-[#FFB020] font-bold">
                    {stats[subject]?.min}
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
const AnalysisClient: React.FC = () => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"TYT" | "AYT" | "REPORT">("TYT");
  const [reportFilter, setReportFilter] = useState<ExamType>("TYT");
  const [loading, setLoading] = useState(true);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [selectedChartSubject, setSelectedChartSubject] = useState("turkce");

  const { user } = useAuth();

  useEffect(() => {
    const fetchExams = async () => {
      if (user) {
        const data = await getUserExams();
        data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setExams(data);

        if (data.length > 0) {
          const recentExams = data.slice(-5).map((e) => ({
            date: e.date,
            type: e.type,
            net: e.totalNet,
            correct: (e as unknown as { correct?: number }).correct || 0,
            incorrect: (e as unknown as { incorrect?: number }).incorrect || 0,
          }));

          const dataHash = JSON.stringify(recentExams);
          const profile = await getUserProfile();

          if (
            profile &&
            profile.lastAnalysisHash === dataHash &&
            profile.analysisMessage
          ) {
            setAiAnalysis(profile.analysisMessage);
          } else {
            generateAnalysis(recentExams).then(async (res) => {
              setAiAnalysis(res);
              await updateUserProfile({
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

  const currentType: ExamType = activeTab === "REPORT" ? "TYT" : activeTab;

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

  if (
    sortedStatsKeys.length > 0 &&
    !sortedStatsKeys.includes(selectedChartSubject)
  ) {
    setSelectedChartSubject(sortedStatsKeys[0]);
  }

  const toggleExamSelection = (id: string) => {
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

  const handleReportFilterChange = (type: ExamType) => {
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
          <h1 className="text-3xl font-bold text-[var(--text)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center text-[var(--link)]">
              <BarChart3 size={24} />
            </div>
            Detaylı Analiz
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Ders bazlı istatistikler, güçlü/zayıf alanlar ve gelişim grafikleri
          </p>
        </div>
        <div className="flex gap-1.5 p-1.5 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] w-fit">
          {(["TYT", "AYT", "REPORT"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[var(--brand)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
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
              <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <h3 className="text-base font-bold text-[var(--text)] mb-4">
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
                      <PolarGrid stroke="var(--border)" strokeOpacity={0.8} />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "var(--text-muted)", fontSize: 11, fontWeight: 500 }}
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
                        stroke="#7FB0FF"
                        strokeWidth={2}
                        fill="#2F6BFF"
                        fillOpacity={0.32}
                        isAnimationActive={false}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as { subject: string; A: number; originalNet: number; fullMark: number };
                            return (
                              <div className="bg-[var(--surface-3)] border border-[var(--border-strong)] p-3 rounded-2xl shadow-lg">
                                <p className="font-bold text-[var(--text)] text-sm mb-1">
                                  {data.subject}
                                </p>
                                <p className="text-[var(--link)] font-bold">
                                  %{data.A} Başarı
                                </p>
                                <p className="text-[var(--text-muted)] text-xs">
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
              <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                <h3 className="text-base font-bold text-[var(--text)] mb-4">
                  Genel Net Değişimi
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        strokeOpacity={0.8}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        stroke="var(--text-subtle)"
                        fontSize={11}
                        tick={{ fill: "var(--text-muted)" }}
                        tickFormatter={(val: string) =>
                          val.split("-").slice(1).join("/")
                        }
                      />
                      <YAxis
                        stroke="var(--text-subtle)"
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as { examName: string; value: number };
                            return (
                              <div className="bg-[var(--surface-3)] border border-[var(--border-strong)] p-3 rounded-2xl shadow-lg">
                                <p className="font-bold text-[var(--text)] text-sm mb-1">
                                  {d.examName}
                                </p>
                                <p className="text-[var(--link)] font-bold text-lg">
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
                        stroke="#5B8CFF"
                        strokeWidth={3}
                        isAnimationActive={false}
                        dot={{ fill: "var(--surface)", stroke: "#5B8CFF", r: 4, strokeWidth: 2 }}
                        activeDot={{
                          r: 6,
                          fill: "#FFB020",
                          stroke: "#0F2A5C",
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
            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-3">
                <h3 className="text-base font-bold text-[var(--text)]">
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
                          : "bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]"
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
                          stopOpacity={0.3}
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
                      stroke="var(--border)"
                      strokeOpacity={0.8}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="var(--text-subtle)"
                      tick={{
                        angle: -45,
                        textAnchor: "end",
                        fontSize: 11,
                        fill: "var(--text-muted)",
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
                      stroke="var(--text-subtle)"
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as { examName: string };
                          return (
                            <div className="bg-[var(--surface-3)] border border-[var(--border-strong)] p-3 rounded-2xl shadow-lg">
                              <p className="font-bold text-[var(--text)] text-sm mb-1">
                                {d.examName}
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
                        fill: "var(--surface)",
                        stroke: SUBJECT_COLORS[selectedChartSubject] || "#2F6BFF",
                        r: 4,
                        strokeWidth: 2,
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
          <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] text-center py-16 p-6">
            <div className="w-16 h-16 rounded-2xl bg-[var(--brand-soft)] flex items-center justify-center mx-auto mb-4 text-[var(--link)]">
              <BarChart3 size={32} />
            </div>
            <p className="text-[var(--text)] text-lg font-bold mb-1">
              Henüz {activeTab} deneme verisi bulunamadı
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              Deneme ekledikten sonra ders bazlı analizler ve grafikler burada listelenecek.
            </p>
          </div>
        )
      ) : (
        /* Report Generation View */
        <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-[var(--text)]">PDF Raporu Oluştur</h3>
              <div className="flex gap-1 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <button
                  onClick={() => handleReportFilterChange("TYT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === "TYT"
                      ? "bg-[var(--brand)] text-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  TYT
                </button>
                <button
                  onClick={() => handleReportFilterChange("AYT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportFilter === "AYT"
                      ? "bg-[var(--brand)] text-white shadow-xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  AYT
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={selectAllExams}
                className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-xl text-[var(--text)] text-sm font-semibold transition-colors cursor-pointer"
              >
                Tümünü Seç
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <FileDown size={18} />
                PDF İndir
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-left text-sm text-[var(--text-muted)]">
              <thead className="text-xs uppercase bg-[var(--surface-2)] text-[var(--text)] font-bold">
                <tr>
                  <th className="px-4 py-3.5">Seç</th>
                  <th className="px-4 py-3.5">Tarih</th>
                  <th className="px-4 py-3.5">Deneme Adı</th>
                  <th className="px-4 py-3.5">Tür</th>
                  <th className="px-4 py-3.5 text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {exams
                  .filter((e) => e.type === reportFilter)
                  .map((exam) => (
                    <tr
                      key={exam.id}
                      className={`hover:bg-[var(--surface-2)] transition-colors cursor-pointer ${selectedExams.includes(exam.id) ? "bg-[var(--brand-soft)]" : ""}`}
                      onClick={() => toggleExamSelection(exam.id)}
                    >
                      <td className="px-4 py-3.5">
                        {selectedExams.includes(exam.id) ? (
                          <CheckSquare size={18} className="text-[var(--link)]" />
                        ) : (
                          <Square size={18} className="text-[var(--text-subtle)]" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium">{exam.date}</td>
                      <td className="px-4 py-3.5 font-bold text-[var(--text)]">
                        {exam.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${exam.type === "TYT" ? "bg-[var(--brand-soft)] text-[var(--link)]" : "bg-[var(--accent-soft)] text-[#FFB020]"}`}
                        >
                          {exam.type} {exam.subtype && `(${exam.subtype})`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-[var(--text)]">
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
          userName={user ? (user.displayName || "Öğrenci") : "Öğrenci"}
        />
      </div>
    </div>
  );
};

export default AnalysisClient;
