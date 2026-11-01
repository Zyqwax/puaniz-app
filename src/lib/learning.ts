export interface LearningResult { date: string; type: string; net: number; studentId: string; classId: string | null; source: string; scores: Record<string, { d: number; y: number; net: number }>; }
export function summarizeLearning(rows: LearningResult[], type: string, from: string, to: string) {
 const selected = rows.filter(r => r.type === type && (!from || r.date >= from) && (!to || r.date <= to)).sort((a,b)=>a.date.localeCompare(b.date));
 const values = selected.map(r=>r.net).sort((a,b)=>a-b);
 const average = values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
 const median = values.length ? (values[Math.floor((values.length-1)/2)] + values[Math.floor(values.length/2)])/2 : null;
 let previousAverage: number | null = null;
 if (from && to && from <= to) {
  const start = Date.parse(from+'T00:00:00Z'), length = Date.parse(to+'T00:00:00Z')-start+86400000;
  const previous=rows.filter(r=>r.type===type && Date.parse(r.date+'T00:00:00Z')>=start-length && r.date<from);
  if(previous.length) previousAverage=previous.reduce((a,b)=>a+b.net,0)/previous.length;
 }
 const delta=average!==null && previousAverage!==null ? average-previousAverage : null;
 return { selected, average, median, previousAverage, delta };
}
export function learningSignals(rows: LearningResult[], today: string) {
 const signals: string[]=[];
 for(const type of ['TYT','AYT']) {
  const recent=rows.filter(r=>r.type===type).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  if(recent.length===3 && recent[0].date>recent[1].date && recent[1].date>recent[2].date && recent[0].net<recent[1].net && recent[1].net<recent[2].net) signals.push(`${type}: Son üç farklı tarihli denemede net düşüşü (${recent[2].net} → ${recent[1].net} → ${recent[0].net}).`);
 }
 const latest=rows.map(r=>r.date).sort().at(-1);
 if(!latest) signals.push('Henüz sonuç verisi yok.');
 else if(Date.parse(today+'T00:00:00Z')-Date.parse(latest+'T00:00:00Z')>14*86400000) signals.push(`Son sonuç ${latest} tarihli; 14 gündür yeni sonuç yok.`);
 return signals;
}
