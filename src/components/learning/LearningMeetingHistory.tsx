import type { getWeeklyLearningPlan } from '@/server/actions/coaching';
type History=Awaited<ReturnType<typeof getWeeklyLearningPlan>>['meetings'][number]['history'];
export default function LearningMeetingHistory({history}:{history:History}) {
 if(!history.length)return null;
 return <details><summary>Düzeltme geçmişi · {history.length}</summary>{history.map(h=><div key={h.id} className="learning-task"><strong>Sürüm {h.revision} · {h.editorName||'Silinmiş kullanıcı'}</strong><p className="learning-muted">{new Date(h.createdAt).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})} · Gerekçe: {h.reason}</p><div className="learning-snapshots"><div><strong>Önceki kayıt</strong><p>{h.before.meetingDate} · Takip: {h.before.followupDate||'Yok'}</p><p style={{whiteSpace:'pre-wrap'}}>{h.before.note}</p></div><div><strong>Düzeltilmiş kayıt</strong><p>{h.after.meetingDate} · Takip: {h.after.followupDate||'Yok'}</p><p style={{whiteSpace:'pre-wrap'}}>{h.after.note}</p></div></div></div>)}</details>;
}
