"use client";
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reviseLearningTask } from '@/server/actions/coaching';
import type { getWeeklyLearningPlan } from '@/server/actions/coaching';
type Task=Awaited<ReturnType<typeof getWeeklyLearningPlan>>['tasks'][number];
export interface CoachingResult {id:string;name:string;date:string;type:string;net:number;}
export function TaskOutcome({task,results}:{task:Task;results:CoachingResult[]}) {
 const before=results.find(r=>r.id===task.baselineResultId),after=results.find(r=>r.id===task.followupResultId);
 return <div><p className="learning-muted">{before?`Başlangıç: ${before.name} · ${before.date} · ${before.net} net`:'Başlangıç denemesi seçilmedi.'}{after?` / Takip: ${after.name} · ${after.date} · ${after.net} net`:''}</p>{before&&after&&<p>Gözlenen net farkı: {Number((after.net-before.net).toFixed(2)).toLocaleString('tr-TR')} · {before.type}. Deneme zorluğu ve diğer etkenler değişebilir; bu fark desteğin etkisini tek başına kanıtlamaz.</p>}{task.reviewNote&&<p><strong>Öğretmen değerlendirmesi:</strong> {task.reviewNote}</p>}</div>;
}
export default function LearningTaskEditor({task,results=[]}:{task:Task;results?:CoachingResult[]}) {
 const router=useRouter();const [pending,start]=useTransition();const [error,setError]=useState('');
 return <details><summary>Görev hedefini ve takibini düzenle</summary><form className="learning-edit-form" onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);setError('');start(async()=>{try{await reviseLearningTask({id:task.id,revision:task.revision,title:String(f.get('title')),subject:String(f.get('subject')),dueDate:String(f.get('dueDate')),baselineResultId:String(f.get('baseline')||''),followupResultId:String(f.get('followup')||''),reviewNote:String(f.get('review')||'')});router.refresh();}catch(e){setError(e instanceof Error?e.message:'Kaydedilemedi.');}});}}>
 <div className="learning-toolbar"><label>Çalışma hedefi<input name="title" required maxLength={300} defaultValue={task.title}/></label><label>Ders<input name="subject" maxLength={100} defaultValue={task.subject??''}/></label><label>Hedef tarihi<input type="date" name="dueDate" defaultValue={task.dueDate??''}/></label></div>
 {task.schoolId&&<><div className="learning-toolbar"><label>Başlangıç denemesi<select name="baseline" defaultValue={task.baselineResultId??''}><option value="">Seçilmedi</option>{results.map(r=><option key={r.id} value={r.id}>{r.date} · {r.type} · {r.name} · {r.net}</option>)}</select></label><label>Takip denemesi<select name="followup" defaultValue={task.followupResultId??''}><option value="">Henüz değerlendirilmedi</option>{results.map(r=><option key={r.id} value={r.id}>{r.date} · {r.type} · {r.name} · {r.net}</option>)}</select></label></div><label>Öğrenciyle paylaşılan değerlendirme<textarea name="review" maxLength={2000} defaultValue={task.reviewNote??''}/></label></>}
 {error&&<p role="alert">{error}</p>}<button disabled={pending}>{pending?'Kaydediliyor…':'Değişiklikleri kaydet'}</button></form></details>;
}
