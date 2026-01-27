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
} from "recharts";
import { getUserExams } from "@/services/examService";
import { generateAnalysis } from "@/services/aiService";
import { getUserProfile, updateUserProfile } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import { calculateSubjectStats, prepareRadarData, prepareTrendData } from "@/utils/analysisHelpers";
import { FileDown, CheckSquare, Square } from "lucide-react";
import { generatePDF } from "@/utils/pdfGenerator";
import AnalysisReport from "@/components/AnalysisReport";
import AnalysisSkeleton from "@/components/analysis/AnalysisSkeleton";

const SUBJECT_ORDER = {
  TYT: ["turkce", "matematik", "geometri", "tarih", "cografya", "felsefe", "din", "fizik", "kimya", "biyoloji"],
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

        // Generate Analysis for the latest 5 exams
        if (data.length > 0) {
          const recentExams = data.slice(-5).map((e) => ({
            date: e.date,
            type: e.type,
            net: e.totalNet,
            correct: e.correct,
            incorrect: e.incorrect,
          }));

          const dataHash = JSON.stringify(recentExams);

          // Check existing profile first
          const profile = await getUserProfile(user.uid);

          if (profile && profile.lastAnalysisHash === dataHash && profile.analysisMessage) {
            setAiAnalysis(profile.analysisMessage);
          } else {
            // Generate new and save
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

  const currentType = activeTab === "REPORT" ? "TYT" : currentTabHelper(activeTab);

  // Helper to safely determine type if strictly needed, though logic below seems fine.
  // Actually checking original code: const currentType = activeTab === "REPORT" ? "TYT" : activeTab;
  function currentTabHelper(tab) {
    return tab;
  }

  const stats = useMemo(() => calculateSubjectStats(exams, currentType), [exams, currentType]);
  const radarData = useMemo(() => prepareRadarData(stats, currentType), [stats, currentType]);
  const trendData = useMemo(() => prepareTrendData(exams, currentType, "total"), [exams, currentType]);
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
  if (sortedStatsKeys.length > 0 && !sortedStatsKeys.includes(selectedChartSubject)) {
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
      // Deselect only visible ones
      const visibleIds = visibleExams.map((e) => e.id);
      setSelectedExams(selectedExams.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all visible ones
      const visibleIds = visibleExams.map((e) => e.id);
      setSelectedExams(visibleIds);
    }
  };

  const handleReportFilterChange = (type) => {
    setReportFilter(type);
    setSelectedExams([]); // Clear selection when switching type to enforce separation
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    await generatePDF(reportRef.current, `yks-analiz-raporu-${reportFilter.toLowerCase()}.pdf`);
  };

  const reportExams = useMemo(
    () => exams.filter((e) => selectedExams.includes(e.id) && e.type === reportFilter),
    [exams, selectedExams, reportFilter],
  );

  if (loading) return <AnalysisSkeleton />;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Detaylı Analiz</h1>
        <div className="bg-slate-800 p-1 rounded-lg flex">
          {["TYT", "AYT", "REPORT"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === tab ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab === "REPORT" ? "Rapor Oluştur" : tab}
            </button>
          ))}
        </div>
      </div>

      {aiAnalysis && (
        <div className="bg-linear-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 p-6 rounded-xl relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100"
              height="100"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-400"
            >
              <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5c0-5.523 4.477-10 10-10z" />
              <path d="M8 12h.01" />
              <path d="M16 12h.01" />
              <path d="M12 16c-2 0-3-1-3-1" />
            </svg>
          </div>
          <div className="flex items-start gap-4 z-10 relative">
            <div className="mt-1 min-w-[40px] h-[40px] rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-400"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-100 mb-2">Yapay Zeka Koç Görüşü</h3>
              <p className="text-slate-300 leading-relaxed italic">"{aiAnalysis}"</p>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "REPORT" ? (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="glass-card">
              <h3 className="text-lg font-bold text-white mb-4">Ders Bazlı Başarı Dağılımı</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Başarı Oranı"
                      dataKey="A"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="#8b5cf6"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                              <p className="font-bold text-white mb-1">{data.subject}</p>
                              <div className="space-y-1">
                                <p className="text-purple-400 font-bold">%{data.A} Başarı</p>
                                <p className="text-slate-400 text-xs">
                                  Net: {data.originalNet} / {data.fullMark}
                                </p>
                              </div>
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
            <div className="glass-card">
              <h3 className="text-lg font-bold text-white mb-4">Genel Net Değişimi</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(val) => val.split("-").slice(1).join("/")}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }}
                      labelStyle={{ color: "#94a3b8" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#ec4899"
                      strokeWidth={3}
                      dot={{ fill: "#ec4899" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Subject Stats Grid */}
          <h3 className="text-xl font-bold text-white mt-8 mb-4">Ders İstatistikleri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedStatsKeys.map((subject) => (
              <div key={subject} className="glass-card p-4">
                <h4 className="text-slate-300 font-medium capitalize mb-2">{subject}</h4>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-white">{stats[subject].avg}</span>
                  <span className="text-xs text-slate-500 mb-1">Ort. Net</span>
                </div>
                <div className="flex justify-between mt-3 text-xs text-slate-400 border-t border-white/5 pt-2">
                  <span>
                    Max: <span className="text-green-400">{stats[subject].max}</span>
                  </span>
                  <span>
                    Min: <span className="text-red-400">{stats[subject].min}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Subject Analysis Chart */}
          <div className="glass-card mt-6">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
              <h3 className="text-lg font-bold text-white">Ders Bazlı Net Değişimi</h3>

              <div className="flex flex-wrap justify-center gap-2">
                {sortedStatsKeys.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => setSelectedChartSubject(subject)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all capitalize ${
                      selectedChartSubject === subject
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={subjectTrendData} margin={{ bottom: 50 }}>
                  <defs>
                    <linearGradient id="colorSubjectNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ angle: -90, textAnchor: "end", fontSize: 12 }}
                    tickFormatter={(value) => {
                      if (!value) return "";
                      const date = new Date(value);
                      return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
                    }}
                    height={60}
                  />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl">
                            <p className="font-medium text-slate-200 mb-1">{payload[0].payload.examName}</p>
                            <p className="text-blue-400 font-bold capitalize">
                              {selectedChartSubject}: {payload[0].value} Net
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
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorSubjectNet)"
                    strokeWidth={3}
                    name="Net"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        /* Report Generation View */
        <div className="glass-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-white">Rapor Oluştur</h3>
              <div className="flex bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => handleReportFilterChange("TYT")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    reportFilter === "TYT" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  TYT
                </button>
                <button
                  onClick={() => handleReportFilterChange("AYT")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    reportFilter === "AYT" ? "bg-pink-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  AYT
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={selectAllExams}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-sm transition-colors"
              >
                Tümünü Seç
              </button>
              <button onClick={handleDownloadPDF} className="glass-btn flex items-center gap-2">
                <FileDown size={18} />
                PDF Olarak İndir
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs uppercase bg-slate-800/50 text-slate-200">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Seç</th>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Deneme Adı</th>
                  <th className="px-4 py-3">Tür</th>
                  <th className="px-4 py-3 rounded-tr-lg text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {exams
                  .filter((e) => e.type === reportFilter)
                  .map((exam) => (
                    <tr
                      key={exam.id}
                      className={`border-b border-slate-700/50 hover:bg-white/5 transition-colors cursor-pointer ${selectedExams.includes(exam.id) ? "bg-purple-900/20" : ""}`}
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
                      <td className="px-4 py-3 font-medium text-white">{exam.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${exam.type === "TYT" ? "bg-purple-500/20 text-purple-300" : "bg-pink-500/20 text-pink-300"}`}
                        >
                          {exam.type} {exam.subtype && `(${exam.subtype})`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">{exam.totalNet.toFixed(2)}</td>
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
