"use client";

import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import {
  Target,
  Save,
  ArrowRight,
  Flame,
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
import { getTopicTracking } from "@/server/actions/subject";
import { getMySchoolExams, getMySchoolInfo } from "@/server/actions/student-school";
import { getMyStudyStats } from "@/server/actions/study";
import PomodoroWidget from "@/components/study/PomodoroWidget";
import { TYT_SUBJECTS, AYT_SUBJECTS } from "@/data/subjectTopics";
import { useAuth } from "@/context/AuthContext";
import { EXAM_CONFIG } from "@/constants";
import { StudentSection, StudentMetric, StudentSegments, StudentEmpty, StudentModal, StudentNotice, StudentHeaderActions, StudentLoading, studentInput, studentPrimary, studentButton } from "@/components/student/StudentUI";
import Link from "next/link";
import type {
  ExamRecord,
  SchoolMemberInfo,
  SchoolStudentExamResult,
  StudyStats,
  UserProfile,
} from "@/types";

const subjectLabels:Record<string,string>={turkce:"Türkçe",matematik:"Matematik",geometri:"Geometri",fizik:"Fizik",kimya:"Kimya",biyoloji:"Biyoloji",tarih:"Tarih",cografya:"Coğrafya",felsefe:"Felsefe",din:"Din kültürü",edebiyat:"Edebiyat",tarih1:"Tarih-1",cografya1:"Coğrafya-1",tarih2:"Tarih-2",cografya2:"Coğrafya-2"};
interface GoalModalProps { currentGoals:{tyt:number;ayt:number}; onClose:()=>void; onSave:(goals:{tyt:number;ayt:number})=>Promise<void>; }
function GoalModal({currentGoals,onClose,onSave}:GoalModalProps){
  const [draft,setDraft]=useState(currentGoals);const [saving,setSaving]=useState(false);const [error,setError]=useState("");
  return <StudentModal title="Net hedeflerini düzenle" description="Gelişim grafiklerinde bu hedefler gösterilir." onClose={()=>{if(!saving)onClose();}}><form className="space-y-5" onSubmit={async event=>{event.preventDefault();setSaving(true);try{await onSave(draft);}catch{setError("Hedeflerin kaydedilemedi.");}finally{setSaving(false);}}}>{error&&<StudentNotice error>{error}</StudentNotice>}<div className="grid grid-cols-2 gap-4">{(["tyt","ayt"] as const).map(type=><label key={type} className="student-field">{type.toUpperCase()} net hedefi<input className={studentInput} required type="number" min={0} max={type==="tyt"?120:80} step="0.25" value={draft[type]} onChange={event=>setDraft({...draft,[type]:Number(event.target.value)})}/></label>)}</div><div className="flex justify-end gap-3"><button type="button" disabled={saving} onClick={onClose} className={studentButton}>Vazgeç</button><button disabled={saving} className={studentPrimary}><Save size={15}/>{saving?"Kaydediliyor…":"Hedefleri kaydet"}</button></div></form></StudentModal>;
}

// ---------- Custom Tooltip ----------
interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ value: number; payload: { trialName: string; date: string; net: number } }>;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--surface-3)] border border-[var(--border-strong)] text-[var(--text)] p-3 rounded-lg shadow-xl">
        <p className="font-semibold text-xs text-[var(--text-muted)] mb-1">
          {payload[0].payload.trialName}
        </p>
        <p className="text-[var(--accent)] font-semibold text-lg">
          {payload[0].value} Net
        </p>
      </div>
    );
  }
  return null;
};

// ---------- Main Component ----------
const DashboardContent: React.FC = () => {
  const [loadError,setLoadError]=useState("");
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState({ tyt: 0, ayt: 0 });
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolMemberInfo | null>(null);
  const [schoolExams, setSchoolExams] = useState<SchoolStudentExamResult[]>([]);
  const [topicSummary, setTopicSummary] = useState({
    completed: 0,
    total: 0,
    questions: 0,
    repeats: 0,
  });
  const [studyStats, setStudyStats] = useState<StudyStats>({
    todayMinutes: 0,
    todayQuestions: 0,
    totalMinutes: 0,
    totalQuestions: 0,
    currentStreak: 0,
    recentSessions: [],
  });
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

  const reloadStudyStats = async () => {
    try {
      const updated = await getMyStudyStats();
      setStudyStats(updated);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const [examData, userProfile, topicData, mySchool, mySchoolExams, myStudyStats] =
          await Promise.all([
            getUserExams(),
            getUserProfile(),
            getTopicTracking(),
            getMySchoolInfo(),
            getMySchoolExams(),
            getMyStudyStats(),
          ]);

        // examData is already ordered desc(date), desc(createdAt) — index 0 is newest
        setExams(examData);
        setProfileData(userProfile);
        setSchoolInfo(mySchool);
        setSchoolExams(mySchoolExams);
        setStudyStats(myStudyStats);

        const totalTytTopics = Object.values(TYT_SUBJECTS).reduce(
          (acc, s) => acc + s.topics.length,
          0,
        );
        const totalAytTopics = Object.values(AYT_SUBJECTS).reduce(
          (acc, s) => acc + s.topics.length,
          0,
        );
        let completed = 0;
        let questions = 0;
        let repeats = 0;
        Object.values(topicData || {}).forEach((t) => {
          if (t.completed) completed++;
          questions += t.questionCount || 0;
          repeats += t.repeatCount || 0;
        });
        setTopicSummary({
          completed,
          total: totalTytTopics + totalAytTopics,
          questions,
          repeats,
        });

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
    if (user) void fetchData().catch(()=>setLoadError("Özet verileri yüklenemedi. Sayfayı yenileyerek tekrar dene.")).finally(()=>setLoading(false));
  }, [user]);

  const handleGoalSave = async (newGoals: { tyt: number; ayt: number }) => {
    if (user) {
      const result=await updateUserGoals(newGoals);
      if(!result.success)throw new Error(result.error||"Hedef kaydedilemedi.");
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

  const getTrendText = (trend: number | null) => {
    if (trend === null) return "Trend verisi yok";
    if (trend > 0) return `+${trend.toFixed(2)} son denemede`;
    if (trend < 0) return `${trend.toFixed(2)} son denemede`;
    return "Değişim yok";
  };

  const daysUntilYKS = Math.max(
    0,
    Math.ceil(
      (new Date("2026-06-20T10:15:00+03:00").getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  if(loading) return <StudentLoading/>;
  const topicPercent=topicSummary.total?Math.min(100,Math.round(topicSummary.completed/topicSummary.total*100)):0;
  const average=Number(chartTab==="TYT"?stats.tytAvg:stats.aytAvg);
  const latest=activeChartData.at(-1);
  const remaining=activeGoal?Math.max(0,activeGoal-average):null;
  const priority=lastExam?Object.entries(lastExam.scores||{}).map(([key,score])=>({key,net:score.net||0,limit:(EXAM_CONFIG[lastExam.type as keyof typeof EXAM_CONFIG] as Record<string,number>)[key]||40})).sort((a,b)=>a.net/a.limit-b.net/b.limit).slice(0,3):[];
  return <div className="student-page">
    <StudentHeaderActions><button className={studentButton} onClick={()=>setIsGoalModalOpen(true)}><Target size={15}/> Hedefleri düzenle</button></StudentHeaderActions>
    {loadError&&<StudentNotice error>{loadError}</StudentNotice>}
    <div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-[var(--text-muted)]">Bugünkü çalışma özeti</p><p className="mt-1 font-medium">{studyStats.todayMinutes} dakika odaklanma · {studyStats.todayQuestions} soru</p></div><div className="flex flex-wrap items-center gap-3"><span className="student-badge"><Flame size={14}/>{studyStats.currentStreak} günlük seri</span>{daysUntilYKS>0&&<span className="text-sm text-[var(--text-muted)]">YKS’ye {daysUntilYKS} gün</span>}</div></div>
    <div className="student-metrics"><StudentMetric label="Toplam deneme" value={stats.totalExams} detail={schoolExams.length?`Ayrıca ${schoolExams.length} okul denemesi`:"Kişisel deneme kayıtların"}/><StudentMetric label={`Son ${chartTab} neti`} value={latest?latest.net.toFixed(2):"—"} detail={getTrendText(chartTab==="TYT"?tytTrend:aytTrend)}/><StudentMetric label={`${chartTab} ortalaması`} value={activeChartData.length?average.toFixed(2):"—"} tone="accent" detail={`${activeChartData.length} deneme üzerinden`}/><StudentMetric label="Hedefe kalan net" value={remaining===null?"—":remaining.toFixed(2)} detail={activeGoal?`Hedef: ${activeGoal} net`:"Önce net hedefini belirle"}/></div>
    <div className="student-overview-grid">
      <StudentSection title="Net gelişimin" description="Denemelerindeki değişimi ve hedef çizgisini takip et." actions={<StudentSegments value={chartTab} onChange={setChartTab} label="Grafik sınav türü" options={[{value:"TYT",label:"TYT"},{value:"AYT",label:"AYT"}]}/> }>
        {activeChartData.length?<div className="student-panel"><div className="h-[300px]">                  <ResponsiveContainer width="100%" height="100%">
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
                            payload={payload as ChartTooltipProps["payload"]}
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
                  </ResponsiveContainer></div></div>:<StudentEmpty title={`Henüz ${chartTab} denemesi yok`} description="İlk denemeni eklediğinde gelişim grafiğin burada oluşacak." action={<Link href="/dashboard/student/add-exam" className={studentPrimary}>Deneme ekle <ArrowRight size={15}/></Link>}/>}
      </StudentSection>
      <StudentSection title="Hedefin ve ilerlemen" description="Çalışmanın nereye ulaştığını gör.">
        <div className="student-panel space-y-6"><div><p className="text-xs text-[var(--text-muted)]">Üniversite / bölüm hedefi</p><p className="mt-2 font-semibold">{profileData?.targetUniversity||"Henüz hedef belirlemedin"}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{profileData?.targetDepartment||"Hedefini profil ayarlarından ekleyebilirsin."}</p>{profileData?.targetRanking&&<p className="mt-2 text-sm text-[var(--link)]">İlk {profileData.targetRanking.toLocaleString("tr-TR")}</p>}<Link href="/dashboard/settings" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--link)]">Hedefi düzenle <ArrowRight size={13}/></Link></div><div className="border-t border-[var(--border)] pt-5"><div className="mb-3 flex justify-between text-sm"><span>Konu ilerlemesi</span><strong>%{topicPercent}</strong></div><div className="student-progress"><div style={{width:`${topicPercent}%`}}/></div><p className="mt-3 text-xs text-[var(--text-muted)]">{topicSummary.completed}/{topicSummary.total} konu · {topicSummary.questions.toLocaleString("tr-TR")} soru · {topicSummary.repeats} tekrar</p><Link href="/dashboard/student/subjects" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--link)]">Çizelgeyi aç <ArrowRight size={13}/></Link></div></div>
      </StudentSection>
    </div>
    <StudentSection title="Çalışma önceliklerin" description={lastExam?`Son ${lastExam.type} denemene göre net oranı en düşük dersler.`:"Deneme sonuçlarına göre çalışma önceliklerin burada gösterilecek."}>
      {priority.length?<div className="grid gap-5 sm:grid-cols-3">{priority.map((item,index)=><div key={item.key} className="border-l-2 border-[var(--border-strong)] pl-4"><p className="text-xs text-[var(--text-muted)]">Öncelik {index+1}</p><h3 className="mt-1 font-semibold">{subjectLabels[item.key]||item.key}</h3><p className="mt-1 text-sm text-[var(--text-muted)]">{item.net.toFixed(2)} / {item.limit} net</p><Link href="/dashboard/student/subjects" className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--link)]">Konu çalış <ArrowRight size={13}/></Link></div>)}</div>:<p className="text-sm text-[var(--text-muted)]">İlk denemeni ekleyerek sana özel öncelikleri gör.</p>}
      <details className="student-ai-note mt-6"><summary>Çalışma önerisini oku</summary><Markdown>{welcomeMessage}</Markdown></details>
    </StudentSection>
    <StudentSection title="Son denemelerin" description="Son beş kişisel denemenin kısa özeti." actions={<Link href="/dashboard/student/history" className={studentButton}>Tüm kayıtlar <ArrowRight size={15}/></Link>}>
      {exams.length?<div className="student-table-wrap"><table className="student-table"><thead><tr><th>Deneme</th><th>Sınav</th><th>Tarih</th><th className="numeric">Net</th></tr></thead><tbody>{exams.slice(0,5).map(exam=><tr key={exam.id}><td className="font-medium"><Link href="/dashboard/student/history">{exam.name}</Link></td><td><span className="student-badge">{exam.type}</span></td><td className="whitespace-nowrap">{new Date(exam.date).toLocaleDateString("tr-TR")}</td><td className="numeric font-semibold">{exam.totalNet.toFixed(2)}</td></tr>)}</tbody></table></div>:<StudentEmpty title="Henüz deneme kaydın yok" description="Deneme sonuçlarını ekleyerek gelişimini takip etmeye başla." action={<Link href="/dashboard/student/add-exam" className={studentPrimary}>İlk denemeni ekle</Link>}/>}
    </StudentSection>
    <StudentSection title="Çalışma alanın" description="Odaklanma oturumunu başlat, günlük çalışmanı kaydet.">
      <div className="grid items-start gap-6 lg:grid-cols-2"><PomodoroWidget onSessionLogged={reloadStudyStats}/><div className="space-y-5"><div className="flex gap-8 border-b border-[var(--border)] pb-4"><div><p className="text-xs text-[var(--text-muted)]">Toplam süre</p><p className="mt-1 text-xl font-semibold">{Math.round(studyStats.totalMinutes/60)} saat</p></div><div><p className="text-xs text-[var(--text-muted)]">Toplam soru</p><p className="mt-1 text-xl font-semibold">{studyStats.totalQuestions.toLocaleString("tr-TR")}</p></div></div><h3 className="text-sm font-semibold">Son çalışma kayıtları</h3>{studyStats.recentSessions.length?studyStats.recentSessions.slice(0,3).map(session=><div key={session.id} className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-3 text-sm"><span>{session.subject}</span><span className="text-[var(--text-muted)]">{session.durationMinutes} dk · {session.questionCount} soru</span></div>):<p className="text-sm text-[var(--text-muted)]">Henüz çalışma oturumu kaydetmedin.</p>}<div className="border-t border-[var(--border)] pt-4"><p className="text-sm font-semibold">{schoolInfo?.schoolName||"Okuluna bağlan"}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{schoolInfo?`${schoolInfo.className||"Sınıf atanmadı"} · ${schoolExams.length} okul denemesi`:"Sınıf kodunla okul sınavlarını ve öğretmen notlarını hesabına ekle."}</p><Link href="/dashboard/student/school-exams" className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--link)]">{schoolInfo?"Okul sonuçlarına git":"Sınıfa katıl"}<ArrowRight size={13}/></Link></div></div></div>
    </StudentSection>
    {isGoalModalOpen&&<GoalModal currentGoals={goals} onClose={()=>setIsGoalModalOpen(false)} onSave={handleGoalSave}/>}
  </div>;

};

export default DashboardContent;
