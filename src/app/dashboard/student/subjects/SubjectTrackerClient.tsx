"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { CheckCircle2, Circle, ChevronDown, Plus, Minus, RefreshCw } from "lucide-react";
import { StudentSection, StudentMetric, StudentSegments, StudentEmpty, StudentNotice, StudentModal, StudentLoading, studentButton, studentDanger, studentInput } from "@/components/student/StudentUI";
import { TYT_SUBJECTS, AYT_SUBJECTS, SubjectGroup } from "@/data/subjectTopics";
import {
  getTopicTracking,
  updateTopicData,
  bulkUpdateTopics,
  incrementRepeat,
  updateQuestionCount,
} from "@/server/actions/subject";
import { useAuth } from "@/context/AuthContext";
import { TopicTrackingItem } from "@/types";

// ---------- Repeat Badge ----------
const RepeatBadge: React.FC<{ count: number }> = ({ count }) => {
  let bgColor: string, textColor: string, borderColor: string;

  if (count === 0) {
    bgColor = "bg-[var(--surface-2)]";
    textColor = "text-[var(--text-subtle)]";
    borderColor = "border-[var(--border)]";
  } else if (count === 1) {
    bgColor = "bg-[var(--accent-soft)]";
    textColor = "text-[var(--accent-text)]";
    borderColor = "border-[#FFB020]/30";
  } else if (count === 2) {
    bgColor = "bg-[var(--ok-bg)]";
    textColor = "text-[var(--ok)]";
    borderColor = "border-[var(--ok)]/30";
  } else {
    bgColor = "bg-[var(--brand-soft)]";
    textColor = "text-[var(--link)]";
    borderColor = "border-[var(--link)]/30";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${bgColor} ${textColor} ${borderColor}`}
    >
      <RefreshCw size={10} />
      {count}×
    </span>
  );
};

// ---------- Overall Stats Bar ----------
interface OverallStatsProps {
  topicTracking: Record<string, TopicTrackingItem>;
  subjects: Record<string, SubjectGroup>;
  examType: string;
}

const OverallStats: React.FC<OverallStatsProps> = ({
  topicTracking,
  subjects,
  examType,
}) => {
  let totalTopics = 0;
  let completedCount = 0;
  let totalQuestions = 0;
  let totalRepeats = 0;

  Object.entries(subjects).forEach(([key, subject]) => {
    totalTopics += subject.topics.length;
    subject.topics.forEach((_: string, idx: number) => {
      const topicKey = `${examType}_${key}_${idx}`;
      const data = topicTracking[topicKey];
      if (data) {
        if (data.completed) completedCount++;
        totalQuestions += data.questionCount || 0;
        totalRepeats += data.repeatCount || 0;
      }
    });
  });

  const percent =
    totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  return <div className="student-metrics"><StudentMetric label="Genel ilerleme" value={`%${percent}`} tone="accent" detail={`${examType.toUpperCase()} konu çizelgesi`}/><StudentMetric label="Tamamlanan konu" value={completedCount} detail={`${totalTopics} konudan`}/><StudentMetric label="Çözülen soru" value={totalQuestions.toLocaleString("tr-TR")}/><StudentMetric label="Toplam tekrar" value={totalRepeats}/></div>;
};

// ---------- Question Count Input ----------
interface QuestionInputProps {
  value: number;
  onUpdate: (count: number) => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ value, onUpdate }) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [previousValue,setPreviousValue]=useState(value);
  if(previousValue!==value){setPreviousValue(value);setLocalValue(value.toString());}
  useEffect(()=>()=>{if(debounceRef.current)clearTimeout(debounceRef.current);},[]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d+$/.test(val)) {
      setLocalValue(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const num = parseInt(val) || 0;
        if (num !== value) {
          onUpdate(num);
        }
      }, 600);
    }
  };

  const handleBlur = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const num = parseInt(localValue) || 0;
    setLocalValue(num.toString());
    if (num !== value) {
      onUpdate(num);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        aria-label="Çözülen soru sayısı"
        type="text"
        inputMode="numeric"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onClick={(e) => e.stopPropagation()}
        className="w-14 h-8 text-center text-sm font-medium bg-[var(--surface)] border border-[var(--border-strong)] rounded-lg text-[var(--text)] focus:outline-none focus:border-[#7FB0FF] focus:ring-1 focus:ring-[#7FB0FF]/25 transition-all"
        placeholder="0"
      />
      <span className="text-xs text-[var(--text-muted)] hidden sm:inline">
        soru
      </span>
    </div>
  );
};

// ---------- Repeat Counter ----------
interface RepeatCounterProps {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

const RepeatCounter: React.FC<RepeatCounterProps> = ({
  count,
  onIncrement,
  onDecrement,
}) => {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (count > 0) onDecrement();
        }}
        aria-label="Tekrar sayısını azalt"
        disabled={count === 0}
        className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
      >
        <Minus size={12} />
      </button>
      <RepeatBadge count={count} />
      <button aria-label="Tekrar sayısını artır"
        onClick={(e) => {
          e.stopPropagation();
          onIncrement();
        }}
        className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-strong)] transition-all cursor-pointer"
      >
        <Plus size={12} />
      </button>
    </div>
  );
};

interface SubjectCardProps {
  subjectKey:string; subject:SubjectGroup; examType:string; topicTracking:Record<string,TopicTrackingItem>;
  search:string; status:string; selected:string[]; onSelect:(key:string)=>void;
  onToggleComplete:(key:string,value:boolean)=>void; onUpdateQuestions:(key:string,count:number)=>void;
  onIncrementRepeat:(key:string,count:number)=>void; onDecrementRepeat:(key:string,count:number)=>void;
}
const SubjectCard = ({subjectKey,subject,examType,topicTracking,search,status,selected,onSelect,onToggleComplete,onUpdateQuestions,onIncrementRepeat,onDecrementRepeat}:SubjectCardProps) => {
  const rows=subject.topics.map((name,index)=>({name,key:`${examType}_${subjectKey}_${index}`}));
  const completed=rows.filter(row=>topicTracking[row.key]?.completed).length;
  const visible=rows.filter(row=>{
    const data=topicTracking[row.key];
    const matches=!search||`${subject.name} ${row.name}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR"));
    return matches&&(status==="all"||(status==="done"?data?.completed:!data?.completed));
  });
  if(!visible.length)return null;
  return <details className="group border-b border-[var(--border)]" open={Boolean(search)||status!=="all"}>
    <summary className="flex cursor-pointer list-none items-center gap-5 py-5"><div className="min-w-0 flex-1"><h3 className="text-base font-semibold">{subject.name}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{completed} / {rows.length} konu tamamlandı</p></div><div className="hidden w-36 sm:block"><div className="student-progress"><div style={{width:`${Math.round(completed/rows.length*100)}%`}}/></div></div><span className="text-sm tabular-nums text-[var(--text-muted)]">%{Math.round(completed/rows.length*100)}</span><ChevronDown size={17} className="transition-transform group-open:rotate-180"/></summary>
    <div className="pb-5"><div className="hidden grid-cols-[32px_1fr_110px_130px] items-center gap-3 border-y border-[var(--border)] py-3 text-xs text-[var(--text-muted)] sm:grid"><span>Seç</span><span>Konu / son çalışma</span><span>Soru sayısı</span><span>Tekrar</span></div><div className="divide-y divide-[var(--border)]">{visible.map(row=>{const data=topicTracking[row.key]||{};return <div key={row.key} className="grid grid-cols-[24px_minmax(0,1fr)] items-center gap-3 py-4 sm:grid-cols-[32px_1fr_110px_130px]"><input type="checkbox" aria-label={`${row.name} konusunu toplu işlem için seç`} checked={selected.includes(row.key)} onChange={()=>onSelect(row.key)} className="h-4 w-4 accent-[var(--link)]"/><button aria-pressed={Boolean(data.completed)} onClick={()=>onToggleComplete(row.key,!data.completed)} className="flex items-center gap-3 text-left">{data.completed?<CheckCircle2 size={19} className="shrink-0 text-[var(--ok)]"/>:<Circle size={19} className="shrink-0 text-[var(--text-muted)]"/>}<span><span className={`text-sm ${data.completed?"text-[var(--ok)]":"text-[var(--text)]"}`}>{row.name}</span><span className="mt-1 block text-xs text-[var(--text-muted)]">{data.lastStudied?`Son çalışma: ${new Date(data.lastStudied).toLocaleDateString("tr-TR")}`:"Henüz çalışılmadı"}</span></span></button><div className="col-start-2 flex items-center gap-3 sm:col-auto sm:block"><span className="text-xs text-[var(--text-muted)] sm:hidden">Soru</span><QuestionInput value={data.questionCount||0} onUpdate={count=>onUpdateQuestions(row.key,count)}/></div><div className="col-start-2 flex items-center gap-3 sm:col-auto sm:block"><span className="text-xs text-[var(--text-muted)] sm:hidden">Tekrar</span><RepeatCounter count={data.repeatCount||0} onIncrement={()=>onIncrementRepeat(row.key,data.repeatCount||0)} onDecrement={()=>onDecrementRepeat(row.key,data.repeatCount||0)}/></div></div>;})}</div></div>
  </details>;
};

// ---------- Main Component ----------
const SubjectTrackerClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"tyt" | "ayt">("tyt");
  const [topicTracking, setTopicTracking] = useState<
    Record<string, TopicTrackingItem>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState<"all"|"pending"|"done">("all");
  const [selected,setSelected]=useState<string[]>([]);
  const [resetOpen,setResetOpen]=useState(false);
  const [error,setError]=useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const data = await getTopicTracking();
        setTopicTracking(data);
      }
      setLoading(false);
    };
    if (user) void fetchData().catch(()=>setError("Konu bilgileri yüklenemedi. Lütfen tekrar dene.")).finally(()=>setLoading(false));
  }, [user]);

  const handleToggleComplete = useCallback(
    async (topicKey: string, isCompleted: boolean) => {
      if (!user) return;
      setTopicTracking((prev) => ({
        ...prev,
        [topicKey]: {
          ...(prev[topicKey] || { questionCount: 0, repeatCount: 0 }),
          completed: isCompleted,
          lastStudied: new Date().toISOString(),
        },
      }));
      const result = await updateTopicData(topicKey, {
        completed: isCompleted,
      });
      if (!result.success) {
        setError("Değişiklik kaydedilemedi. Lütfen tekrar dene.");
        setTopicTracking((prev) => ({
          ...prev,
          [topicKey]: {
            ...(prev[topicKey] || {}),
            completed: !isCompleted,
          },
        }));
      }
    },
    [user]
  );

  const handleUpdateQuestions = useCallback(
    async (topicKey: string, count: number) => {
      if (!user) return;
      const prevCount = topicTracking[topicKey]?.questionCount || 0;
      setTopicTracking((prev) => ({
        ...prev,
        [topicKey]: {
          ...(prev[topicKey] || { completed: false, repeatCount: 0 }),
          questionCount: count,
          lastStudied: new Date().toISOString(),
        },
      }));
      const result = await updateQuestionCount(topicKey, count);
      if (!result.success) {
        setError("Değişiklik kaydedilemedi. Lütfen tekrar dene.");
        setTopicTracking((prev) => ({
          ...prev,
          [topicKey]: {
            ...(prev[topicKey] || {}),
            questionCount: prevCount,
          },
        }));
      }
    },
    [user, topicTracking]
  );

  const handleIncrementRepeat = useCallback(
    async (topicKey: string, currentCount: number) => {
      if (!user) return;
      setTopicTracking((prev) => ({
        ...prev,
        [topicKey]: {
          ...(prev[topicKey] || { completed: false, questionCount: 0 }),
          repeatCount: currentCount + 1,
          lastStudied: new Date().toISOString(),
        },
      }));
      const result = await incrementRepeat(topicKey);
      if (!result.success) {
        setError("Değişiklik kaydedilemedi. Lütfen tekrar dene.");
        setTopicTracking((prev) => ({
          ...prev,
          [topicKey]: {
            ...(prev[topicKey] || {}),
            repeatCount: currentCount,
          },
        }));
      }
    },
    [user]
  );

  const handleDecrementRepeat = useCallback(
    async (topicKey: string, currentCount: number) => {
      if (!user || currentCount <= 0) return;
      const newCount = currentCount - 1;
      setTopicTracking((prev) => ({
        ...prev,
        [topicKey]: {
          ...(prev[topicKey] || { completed: false, questionCount: 0 }),
          repeatCount: newCount,
          lastStudied: new Date().toISOString(),
        },
      }));
      const result = await updateTopicData(topicKey, {
        repeatCount: newCount,
      });
      if (!result.success) {
        setError("Değişiklik kaydedilemedi. Lütfen tekrar dene.");
        setTopicTracking((prev) => ({
          ...prev,
          [topicKey]: {
            ...(prev[topicKey] || {}),
            repeatCount: currentCount,
          },
        }));
      }
    },
    [user]
  );

  const handleBulkToggle = useCallback(
    async (topicKeys: string[], isCompleted: boolean) => {
      if (!user) return;
      const prevState: Record<string, TopicTrackingItem | null> = {};
      topicKeys.forEach((k) => {
        prevState[k] = topicTracking[k] || null;
      });

      setTopicTracking((prev) => {
        const next = { ...prev };
        topicKeys.forEach((k) => {
          if (isCompleted) {
            next[k] = {
              ...(prev[k] || { questionCount: 0, repeatCount: 0 }),
              completed: true,
              lastStudied: new Date().toISOString(),
            };
          } else {
            next[k] = {
              completed: false,
              questionCount: 0,
              repeatCount: 0,
              lastStudied: null,
            };
          }
        });
        return next;
      });

      const result = await bulkUpdateTopics(topicKeys, isCompleted);
      if (!result.success) {
        setError("Değişiklik kaydedilemedi. Lütfen tekrar dene.");
        setTopicTracking((prev) => {
          const next = { ...prev };
          topicKeys.forEach((k) => {
            if (prevState[k]) {
              next[k] = prevState[k]!;
            } else {
              delete next[k];
            }
          });
          return next;
        });
      }
    },
    [user, topicTracking]
  );

  const subjects = activeTab === "tyt" ? TYT_SUBJECTS : AYT_SUBJECTS;

  const hasVisible=Object.entries(subjects).some(([key,subject])=>subject.topics.some((name,index)=>{
    const data=topicTracking[`${activeTab}_${key}_${index}`];
    return (!search||`${subject.name} ${name}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")))&&(status==="all"||(status==="done"?data?.completed:!data?.completed));
  }));
  if (loading) return <StudentLoading/>;
  return <div className="student-page">
    {error&&<StudentNotice error>{error}</StudentNotice>}
    <div className="student-toolbar"><StudentSegments value={activeTab} onChange={tab=>{setActiveTab(tab);setSelected([]);}} label="Sınav türü" options={[{value:"tyt",label:"TYT"},{value:"ayt",label:"AYT"}]}/><p className="text-sm text-[var(--text-muted)]">İlerlemen otomatik kaydedilir.</p></div>
    <OverallStats topicTracking={topicTracking} subjects={subjects} examType={activeTab}/>
    <StudentSection title="Çalışma çizelgen" description="Dersleri açarak konularını takip et. Soru sayısı ve tekrarlarını aynı satırdan güncelle.">
      <div className="student-toolbar mb-5"><input aria-label="Ders veya konu ara" className={`${studentInput} !w-auto min-w-48 flex-1`} placeholder="Ders veya konu ara…" value={search} onChange={event=>setSearch(event.target.value)}/><StudentSegments value={status} onChange={setStatus} label="Konu durumu" options={[{value:"all",label:"Tümü"},{value:"pending",label:"Çalışılacak"},{value:"done",label:"Tamamlanan"}]}/></div>
      {selected.length>0&&<div className="student-toolbar mb-4 rounded-lg bg-[var(--brand-soft)] p-3"><span className="mr-auto text-sm">{selected.length} konu seçildi</span><button className={studentButton} onClick={()=>{void handleBulkToggle(selected,true);setSelected([]);}}>Tamamlandı işaretle</button><button className={studentDanger} onClick={()=>setResetOpen(true)}>İlerlemeyi sıfırla</button><button className={studentButton} onClick={()=>setSelected([])}>Seçimi temizle</button></div>}
      <div className="border-t border-[var(--border)]">{Object.entries(subjects).map(([key,subject])=><SubjectCard key={`${activeTab}_${key}`} subjectKey={key} subject={subject} examType={activeTab} topicTracking={topicTracking} search={search} status={status} selected={selected} onSelect={key=>setSelected(prev=>prev.includes(key)?prev.filter(item=>item!==key):[...prev,key])} onToggleComplete={handleToggleComplete} onUpdateQuestions={handleUpdateQuestions} onIncrementRepeat={handleIncrementRepeat} onDecrementRepeat={handleDecrementRepeat}/>)}</div>
      {!hasVisible&&<StudentEmpty title="Bu filtrelerle konu bulunamadı" description="Aramanı veya durum filtresini değiştirerek tekrar dene."/>}
    </StudentSection>
    {resetOpen&&<StudentModal title="Seçili konuların ilerlemesi sıfırlansın mı?" description={`${selected.length} konunun tamamlanma durumu, soru ve tekrar sayıları sıfırlanacak.`} onClose={()=>setResetOpen(false)}><div className="flex justify-end gap-3"><button className={studentButton} onClick={()=>setResetOpen(false)}>Vazgeç</button><button className={studentDanger} onClick={()=>{void handleBulkToggle(selected,false);setSelected([]);setResetOpen(false);}}>İlerlemeyi sıfırla</button></div></StudentModal>}
  </div>;

};

export default SubjectTrackerClient;
