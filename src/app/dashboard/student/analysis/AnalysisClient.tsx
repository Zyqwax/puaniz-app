"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Markdown from "react-markdown";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { getUserExams } from "@/server/actions/exam";
import { generateAnalysis } from "@/server/actions/ai";
import { getUserProfile, updateUserProfile } from "@/server/actions/profile";
import { useAuth } from "@/context/AuthContext";
import {
  calculateSubjectStats,
  prepareTrendData,
} from "@/utils/analysisHelpers";
import {
  FileDown,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { filterStudentExams, summarizeStudentPeriod } from "@/lib/student-exams";
import { generatePDF } from "@/utils/pdfGenerator";
import AnalysisReport from "@/components/AnalysisReport";
import { StudentSection, StudentMetric, StudentSegments, StudentHeaderActions, StudentEmpty, StudentNotice, StudentLoading, studentButton, studentPrimary, studentInput } from "@/components/student/StudentUI";
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

  return <details className="student-ai-note"><summary>AI koçun çalışma önerisi</summary><p className="text-xs">Son denemelerine göre genel değerlendirme. Tarih filtresinden bağımsızdır.</p><div className="[&_ul]:list-disc [&_ul]:pl-5"><Markdown>{analysis}</Markdown></div></details>;
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
      <div className="min-w-0 border-t border-[var(--border)] pt-5">
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
      <div className="min-w-0 border-t border-[var(--border)] pt-5">
        <h3 className="text-base font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFB020]/15 flex items-center justify-center text-[var(--accent-text)]">
            <AlertTriangle size={18} />
          </div>
          Geliştirilmesi Gereken Dersler
        </h3>
        <div className="space-y-4">
          {bottom3.map((sub, i) => (
            <div key={sub} className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-xs font-bold text-[var(--accent-text)] shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text)] font-semibold">
                    {SUBJECT_LABELS[sub] || sub}
                  </span>
                  <span className="text-sm font-bold text-[var(--accent-text)]">
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
  return <StudentSection title="Ders bazında karşılaştırma" description="Seçtiğin dönemdeki ortalama, en yüksek ve en düşük netler."><div className="student-table-wrap"><table className="student-table"><thead><tr><th>Ders</th><th className="numeric">Ortalama</th><th className="numeric">En yüksek</th><th className="numeric">En düşük</th></tr></thead><tbody>{sortedKeys.map(subject=><tr key={subject}><td className="font-medium">{SUBJECT_LABELS[subject]||subject}</td><td className="numeric font-semibold text-[var(--link)]">{stats[subject].avg}</td><td className="numeric">{stats[subject].max.toFixed(2)}</td><td className="numeric">{stats[subject].min.toFixed(2)}</td></tr>)}</tbody></table></div></StudentSection>;
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
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [exporting,setExporting]=useState(false);
  const [error,setError]=useState("");
  const analysisExams=useMemo(()=>filterStudentExams(exams,dateFrom,dateTo),[exams,dateFrom,dateTo]);

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
    if (user) void fetchExams().catch(()=>setError("Analiz verileri yüklenemedi. Lütfen tekrar dene.")).finally(()=>setLoading(false));
  }, [user]);

  const currentType: ExamType = activeTab === "REPORT" ? "TYT" : activeTab;

  const stats = useMemo(
    () => calculateSubjectStats(analysisExams, currentType),
    [analysisExams, currentType],
  );
  const trendData = useMemo(
    () => prepareTrendData(analysisExams, currentType, "total"),
    [analysisExams, currentType],
  );
  const subjectTrendData = useMemo(
    () => prepareTrendData(analysisExams, currentType, selectedChartSubject),
    [analysisExams, currentType, selectedChartSubject],
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
    if(!reportRef.current||exporting)return;
    setExporting(true);setError("");
    try{await generatePDF(reportRef.current,`yks-analiz-raporu-${reportFilter.toLowerCase()}.pdf`);}catch{setError("PDF oluşturulamadı. Tekrar deneyebilirsin.");}finally{setExporting(false);}
  };

  const reportExams = useMemo(
    () =>
      exams.filter(
        (e) => selectedExams.includes(e.id) && e.type === reportFilter,
      ),
    [exams, selectedExams, reportFilter],
  );

  const {period:periodExams,average:periodAverage,previousAverage,comparison}=summarizeStudentPeriod(exams,currentType,dateFrom,dateTo);
  if (loading) return <StudentLoading />;

  return (
    <div className="student-page">
      <StudentHeaderActions><button className={studentButton} onClick={()=>setActiveTab(activeTab==="REPORT"?"TYT":"REPORT")}><FileDown size={16}/>{activeTab==="REPORT"?"Analize dön":"Rapor oluştur"}</button></StudentHeaderActions>
      {error&&<StudentNotice error>{error}</StudentNotice>}
      {activeTab!=="REPORT"&&<>
        <div className="student-toolbar"><StudentSegments value={activeTab} onChange={setActiveTab} label="Sınav türü" options={[{value:"TYT",label:"TYT"},{value:"AYT",label:"AYT"}]}/><div className="ml-auto flex flex-wrap items-center gap-3"><label className="student-field">Başlangıç<input className={studentInput} type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/></label><label className="student-field">Bitiş<input className={studentInput} type="date" min={dateFrom} value={dateTo} onChange={e=>setDateTo(e.target.value)}/></label>{(dateFrom||dateTo)&&<button className={studentButton} onClick={()=>{setDateFrom("");setDateTo("");}}>Tüm zamanlar</button>}</div></div>
        <div className="student-metrics"><StudentMetric label="Dönemdeki deneme" value={periodExams.length}/><StudentMetric label="Ortalama net" value={periodExams.length?periodAverage.toFixed(2):"—"} tone="accent"/><StudentMetric label="En yüksek net" value={periodExams.length?Math.max(...periodExams.map(exam=>exam.totalNet)).toFixed(2):"—"}/><StudentMetric label={previousAverage===null?"Son iki deneme farkı":"Önceki döneme göre"} value={comparison===null?"—":`${comparison>0?"+":""}${comparison.toFixed(2)}`} detail={previousAverage===null?"Aynı sınav türündeki son iki kayıt":"Aynı uzunluktaki önceki dönemle karşılaştırma"}/></div>
      </>}
      {activeTab !== "REPORT" ? (
        analysisExams.filter((e) => e.type === activeTab).length > 0 ? (
          <>
            {/* Charts Grid */}
            <div>
                {/* Trend Chart */}
              <div className="student-panel">
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
                        fontSize={12}
                        tick={{ fill: "var(--text-muted)" }}
                        tickFormatter={(val: string) =>
                          val.split("-").slice(1).join("/")
                        }
                      />
                      <YAxis
                        stroke="var(--text-subtle)"
                        tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload as { examName: string; value: number };
                            return (
                              <div className="bg-[var(--surface-3)] border border-[var(--border-strong)] p-3 rounded-lg shadow-lg">
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

            <StrengthWeaknessCards stats={stats} sortedKeys={sortedStatsKeys} />

            {/* Subject Stats Bar Chart + Grid */}
            <SubjectStatsGrid stats={stats} sortedKeys={sortedStatsKeys} />

            {/* Subject Analysis Chart */}
            <div className="student-panel">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-5 gap-3">
                <h3 className="text-base font-bold text-[var(--text)]">
                  Ders Bazlı Net Değişimi
                </h3>

                <label className="student-field w-full sm:max-w-60"><span className="sr-only">Grafikte gösterilecek ders</span><select className={studentInput} value={selectedChartSubject} onChange={event=>setSelectedChartSubject(event.target.value)}>{sortedStatsKeys.map(subject=><option key={subject} value={subject}>{SUBJECT_LABELS[subject]||subject}</option>)}</select></label>
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
                        fontSize: 12,
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
                      tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload as { examName: string };
                          return (
                            <div className="bg-[var(--surface-3)] border border-[var(--border-strong)] p-3 rounded-lg shadow-lg">
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
          <StudentEmpty title={`Bu dönemde ${activeTab} denemesi yok`} description="Tarih aralığını genişletebilir veya yeni bir deneme ekleyebilirsin."/>
        )
      ) : (
        <StudentSection title="Analiz raporu oluştur" description="Rapora eklenecek denemeleri seç. Rapor seçtiğin sınav türü ve kayıtlarla hazırlanır." actions={<button className={studentButton} onClick={()=>setActiveTab("TYT")}>Analize dön</button>}>
          <div className="student-toolbar mb-5"><StudentSegments value={reportFilter} onChange={handleReportFilterChange} label="Rapor sınav türü" options={[{value:"TYT",label:"TYT"},{value:"AYT",label:"AYT"}]}/><button className={studentButton} onClick={selectAllExams}>Tümünü seç / bırak</button><span className="mr-auto text-sm text-[var(--text-muted)]">{reportExams.length} deneme seçildi</span><button disabled={!reportExams.length||exporting} className={studentPrimary} onClick={handleDownloadPDF}><FileDown size={16}/>{exporting?"Hazırlanıyor…":"PDF indir"}</button></div>
          {exams.some(exam=>exam.type===reportFilter)?<div className="student-table-wrap"><table className="student-table"><thead><tr><th><span className="sr-only">Seçim</span></th><th>Tarih</th><th>Deneme</th><th>Sınav</th><th className="numeric">Net</th></tr></thead><tbody>{exams.filter(exam=>exam.type===reportFilter).map(exam=><tr key={exam.id}><td><input type="checkbox" aria-label={`${exam.name} denemesini rapora ekle`} checked={selectedExams.includes(exam.id)} onChange={()=>toggleExamSelection(exam.id)} className="h-4 w-4 accent-[var(--link)]"/></td><td className="whitespace-nowrap">{new Date(exam.date).toLocaleDateString("tr-TR")}</td><td>{exam.name}</td><td><span className="student-badge">{exam.type}{exam.subtype?` / ${exam.subtype}`:""}</span></td><td className="numeric font-semibold">{exam.totalNet.toFixed(2)}</td></tr>)}</tbody></table></div>:<StudentEmpty title="Rapora eklenecek deneme yok" description="Bu sınav türünde bir deneme ekleyerek rapor hazırlayabilirsin."/>}
        </StudentSection>
      )}

      {activeTab!=="REPORT"&&<AIAnalysisCard analysis={aiAnalysis}/> }

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
