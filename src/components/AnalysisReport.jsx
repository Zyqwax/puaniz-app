"use client";

import React, { forwardRef, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { EXAM_CONFIG } from "../constants";

const AnalysisReport = React.memo(
  forwardRef(({ exams, type, userName }, ref) => {
    // Sort exams by date
    const sortedExams = useMemo(() => {
      return [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [exams]);

    // Constants
    const subjectList = useMemo(() => {
      return EXAM_CONFIG[type] ? Object.keys(EXAM_CONFIG[type]) : [];
    }, [type]);

    // Format Helper
    const formatDate = (dateStr) => {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      return date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    // Prepare trend data
    const trendData = useMemo(() => {
      return sortedExams.map((e) => ({
        name: formatDate(e.date),
        date: formatDate(e.date),
        net: e.totalNet,
        examName: e.name,
      }));
    }, [sortedExams]);

    const getSubjectMax = React.useCallback(
      (subject) => {
        if (EXAM_CONFIG[type] && EXAM_CONFIG[type][subject]) {
          return EXAM_CONFIG[type][subject];
        }
        // Fallback defaults if not in config
        if (subject === "fen") return 20;
        if (subject === "sosyal") return 20;
        return 40;
      },
      [type],
    );

    const calculateSuccessRate = (net, max) => {
      if (max <= 0) return 0;
      const rate = (net / max) * 100;
      return Math.max(0, Math.min(100, rate)); // Clamp between 0-100
    };

    // Prepare Average Success Data for the final chart
    const averageSuccessData = useMemo(() => {
      if (sortedExams.length === 0) return [];

      const stats = {};
      // Initialize
      subjectList.forEach((sub) => {
        stats[sub] = { sumRate: 0, count: 0 };
      });

      sortedExams.forEach((exam) => {
        subjectList.forEach((sub) => {
          const sData = exam.scores && exam.scores[sub];
          if (sData) {
            const max = getSubjectMax(sub);
            const rate = calculateSuccessRate(sData.net, max);
            stats[sub].sumRate += rate;
            stats[sub].count += 1;
          }
        });
      });

      return subjectList.map((sub) => ({
        subject: sub.charAt(0).toUpperCase() + sub.slice(1),
        basari: stats[sub].count ? (stats[sub].sumRate / stats[sub].count).toFixed(1) : 0,
      }));
    }, [sortedExams, subjectList, getSubjectMax]);
    // Calculate Subject Stats (Max, Min, Avg)
    const subjectStats = useMemo(() => {
      if (sortedExams.length === 0) return [];

      return subjectList.map((subject) => {
        let max = -Infinity;
        let min = Infinity;
        let sum = 0;
        let count = 0;

        sortedExams.forEach((exam) => {
          if (exam.scores && exam.scores[subject]) {
            const val = exam.scores[subject].net;
            if (val > max) max = val;
            if (val < min) min = val;
            sum += val;
            count++;
          }
        });

        return {
          subject,
          max: count > 0 ? max.toFixed(2) : "-",
          min: count > 0 ? min.toFixed(2) : "-",
          avg: count > 0 ? (sum / count).toFixed(2) : "-",
        };
      });
    }, [sortedExams, subjectList]);

    return (
      <div
        ref={ref}
        className="bg-slate-50 min-h-screen p-8 text-slate-900 font-sans"
        style={{ width: "1000px" }} // Fixed width for consistent PDF output
      >
        {/* Header */}
        <div className="flex justify-between items-end border-b-2 border-purple-600 pb-6 mb-8 pdf-section">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">YKS Performans Analizi</h1>
            <p className="text-slate-500 mt-2 text-lg">{type} Deneme Sınavları Raporu</p>
          </div>
          <div className="text-right">
            <p className="text-slate-900 font-bold text-xl">{userName || "Öğrenci"}</p>
            <p className="text-slate-500 text-sm">
              {new Date().toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-6 mb-10 pdf-section">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Toplam Deneme</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">{sortedExams.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Ortalama Net</p>
            <p className="text-4xl font-bold text-blue-600 mt-2">
              {(sortedExams.reduce((acc, e) => acc + e.totalNet, 0) / (sortedExams.length || 1)).toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">En Yüksek Net</p>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {Math.max(...sortedExams.map((e) => e.totalNet)).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Detailed Exam List */}
        <div className="space-y-8 mb-10">
          <h2 className="text-2xl font-bold text-slate-800 border-l-4 border-purple-500 pl-4">Detaylı Sınav Raporu</h2>

          {sortedExams.map((exam, index) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid pdf-section"
            >
              {/* Exam Header */}
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">{exam.name}</h3>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{formatDate(exam.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold">Toplam Net</p>
                  <p className="text-2xl font-bold text-slate-900">{exam.totalNet.toFixed(2)}</p>
                </div>
              </div>

              {/* Subject Breakdown - ORDERED */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {subjectList.map((subject) => {
                    const rawStats =
                      exam.scores && exam.scores[subject] ? exam.scores[subject] : { d: 0, y: 0, net: 0 };

                    // Safely handle missing or string values
                    // Data might use 'd'/'y' (from AddExam) or 'correct'/'incorrect' (legacy/other sources)
                    const correctVal = rawStats.d !== undefined ? rawStats.d : rawStats.correct;
                    const incorrectVal = rawStats.y !== undefined ? rawStats.y : rawStats.incorrect;

                    const stats = {
                      correct: Number(correctVal) || 0,
                      incorrect: Number(incorrectVal) || 0,
                      net: Number(rawStats.net) || 0,
                    };

                    const max = getSubjectMax(subject);

                    // Calculate blanks: Max - (Correct + Incorrect)
                    const empty = Math.max(0, max - (stats.correct + stats.incorrect));

                    const successRate = calculateSuccessRate(stats.net, max);

                    // If max is 0 (legacy or bug)
                    if (max === 0) return null;

                    return (
                      <div key={subject} className="flex flex-col mb-2">
                        <div className="flex justify-between items-end mb-1">
                          <span className="capitalize text-slate-700 font-semibold text-sm">{subject}</span>
                          <div className="text-xs space-x-2 flex items-center">
                            <span className="text-green-700 font-bold bg-green-100 px-1.5 py-0.5 rounded border border-green-200">
                              {stats.correct} D
                            </span>
                            <span className="text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded border border-red-200">
                              {stats.incorrect} Y
                            </span>
                            <span className="text-slate-600 font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {empty} B
                            </span>
                            <span className="text-slate-900 font-extrabold ml-1">{stats.net} Net</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              successRate > 75
                                ? "bg-green-500"
                                : successRate > 50
                                  ? "bg-blue-500"
                                  : successRate > 25
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                            }`}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                        <div className="text-right mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">
                            %{successRate.toFixed(0)} Başarı
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Charts Section */}
        <div className="break-inside-avoid pdf-section">
          <h2 className="text-2xl font-bold text-slate-800 border-l-4 border-blue-500 pl-4 mb-6">
            Genel Analiz Grafikleri
          </h2>

          {/* Row of Charts */}
          <div className="space-y-8">
            {/* 1. Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-700 mb-4">Genel Net Değişimi</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <Area
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="net"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorNet)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Average Subject Success Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-700 mb-4">Ortalama Ders Başarısı (%)</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={averageSuccessData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={12} unit="%" />
                    <Bar isAnimationActive={false} dataKey="basari" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                      {averageSuccessData.map((entry, index) => (
                        <cell
                          key={`cell-${index}`}
                          fill={
                            entry.basari > 75
                              ? "#22c55e"
                              : entry.basari > 50
                                ? "#3b82f6"
                                : entry.basari > 25
                                  ? "#fbbf24"
                                  : "#ef4444"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. Detailed Subject Statistics Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">Ders Bazlı Net İstatistikleri</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Ders</th>
                    <th className="px-6 py-3 font-semibold text-center text-green-600">En Yüksek</th>
                    <th className="px-6 py-3 font-semibold text-center text-blue-600">Ortalama</th>
                    <th className="px-6 py-3 font-semibold text-center text-red-600">En Düşük</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectStats.map((stat, idx) => (
                    <tr
                      key={stat.subject}
                      className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <td className="px-6 py-3 font-medium text-slate-900 capitalize text-base">{stat.subject}</td>
                      <td className="px-6 py-3 text-center font-bold text-green-600">{stat.max}</td>
                      <td className="px-6 py-3 text-center font-bold text-blue-600">{stat.avg}</td>
                      <td className="px-6 py-3 text-center font-bold text-red-500">{stat.min}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }),
);

export default AnalysisReport;
