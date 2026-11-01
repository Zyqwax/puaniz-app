"use client";
import Form from 'next/form';
import { useState,useTransition } from 'react';
import { exportLearningReport } from '@/server/actions/learning-report';
import { reportNumber,reportCsv,type LearningReport } from '@/lib/learning-report';
import './learning.css';
export default function LearningPeriodReport({report}:{report:LearningReport}) {
 const [pending,start]=useTransition();const [error,setError]=useState('');
 const download=(format:'pdf'|'csv')=>{setError('');start(async()=>{try{
  // Generate from fresh, authorized server data instead of stale browser state.
  const fresh=await exportLearningReport(report.role,report.filters,format);
  if(format==='csv') {
   const url=URL.createObjectURL(new Blob([reportCsv(fresh)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`puaniz-${fresh.filters.type}-${fresh.filters.from}-${fresh.filters.to}.csv`;a.click();URL.revokeObjectURL(url);
  }else {
   const response=await fetch('/fonts/DejaVuSans.ttf');if(!response.ok)throw new Error('PDF yazı tipi yüklenemedi.');
   const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   const {buildLearningReportPdf}=await import('@/lib/learning-report-pdf');buildLearningReportPdf(fresh,btoa(binary)).save(`puaniz-${fresh.filters.type}-${fresh.filters.from}-${fresh.filters.to}.pdf`);
  }
 }catch(e){setError(e instanceof Error?e.message:'Rapor oluşturulamadı.');}});};
 const f=report.filters;const staff=report.role!=='student';
 return <div className="learning-page"><Form action="" className="learning-toolbar"><label>Tür<select name="type" defaultValue={f.type}><option>TYT</option><option>AYT</option></select></label><label>Başlangıç<input type="date" name="from" required defaultValue={f.from}/></label><label>Bitiş<input type="date" name="to" required defaultValue={f.to}/></label>{staff?<><label>Sınıf<select name="classId" defaultValue={f.classId}><option value="">Tüm yetkili sınıflar</option>{report.classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Kademe<select name="grade" defaultValue={f.grade}><option value="">Tümü</option>{[...new Set(report.classes.map(c=>c.grade))].sort().map(g=><option key={g}>{g}</option>)}</select></label><label>Alan<select name="field" defaultValue={f.field}><option value="">Tümü</option>{[...new Set(report.classes.map(c=>c.field).filter((v):v is string=>!!v))].sort().map(g=><option key={g}>{g}</option>)}</select></label></>:<label>Kaynak<select name="source" defaultValue={f.source}><option value="">Tümü</option><option>Kişisel</option><option>Okul</option></select></label>}<button>Raporu güncelle</button></Form>
 <div><h2>{report.schoolName}</h2><p className="learning-muted">{f.from} – {f.to} · {f.type} · {new Date(report.generatedAt).toLocaleString('tr-TR',{timeZone:'Europe/Istanbul'})}</p><p className="learning-muted">{report.privacyNote}</p></div>{error&&<p role="alert">{error}</p>}<div className="learning-toolbar"><button disabled={pending||!report.current.count} onClick={()=>download('pdf')}>{pending?'Hazırlanıyor…':'PDF indir'}</button><button disabled={pending||!report.current.count} onClick={()=>download('csv')}>CSV indir</button></div>
 <div className="learning-metrics"><div><span>Sonuç sayısı</span><strong>{report.current.count}</strong></div><div><span>Farklı öğrenci</span><strong>{report.current.students}</strong></div><div><span>Ortalama net</span><strong>{reportNumber(report.current.average)}</strong></div><div><span>Önceki döneme göre</span><strong>{reportNumber(report.delta)}</strong></div></div>
 <p className="learning-muted">Önceki eşit uzunluktaki dönemde {report.previous.count} sonuç; ortalama {reportNumber(report.previous.average)}. Ortalama ve medyan sonuç satırları üzerinden hesaplanır. Eksik veya gizlenmiş değerler “—” olarak gösterilir.</p>{report.current.suppressed&&<p role="status">Küçük grupları korumak için net istatistikleri gizlendi.</p>}
 {staff&&<section><h2>Sınıf ve kademe görünümü</h2><div className="learning-table"><table><thead><tr><th>Sınıf</th><th>Sonuç</th><th>Öğrenci</th><th>Ortalama</th><th>Medyan</th><th>En düşük / yüksek</th></tr></thead><tbody>{report.groups.map(g=><tr key={g.classId}><td>{g.name}{g.suppressed?' · Küçük grup':''}</td><td>{g.count}</td><td>{g.students}</td><td>{reportNumber(g.average)}</td><td>{reportNumber(g.median)}</td><td>{reportNumber(g.minimum)} / {reportNumber(g.maximum)}</td></tr>)}</tbody></table></div>{!report.groups.length&&<p>Bu filtrelerde sınıf sonucu bulunamadı.</p>}</section>}
 <section><h2>Dönem eğilimi</h2><div className="learning-table"><table><thead><tr><th>Tarih</th><th>Sonuç</th><th>Öğrenci</th><th>Ortalama</th><th>Medyan</th></tr></thead><tbody>{report.trend.map(g=><tr key={g.date}><td>{g.date}</td><td>{g.count}</td><td>{g.students}</td><td>{reportNumber(g.average)}</td><td>{reportNumber(g.median)}</td></tr>)}</tbody></table></div>{!report.trend.length&&<p>Dönemde sonuç bulunamadı.</p>}</section>
 <p className="learning-muted">Farklı denemelerin zorluğu ve katılımı değişebilir. Net farkı tek başına kazanım veya destek etkisi değildir. Sınıfı olmayan okul sonuçları personel raporuna dahil edilmez. Dönem en fazla 731 gün olabilir.</p></div>;
}
