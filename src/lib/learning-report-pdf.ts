import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { reportNumber,type LearningReport } from './learning-report';
const pdfNumber=(n:number|null)=>n===null?'-':reportNumber(n);
/** Text-based, paginated A4 report. The bundled font preserves Turkish glyphs. */
export function buildLearningReportPdf(report:LearningReport,fontBase64:string) {
 const doc=new jsPDF();doc.addFileToVFS('DejaVuSans.ttf',fontBase64);doc.addFont('DejaVuSans.ttf','DejaVu','normal');doc.setFont('DejaVu');
 doc.setFontSize(18);doc.text('Puaniz · Dönem gelişim raporu',14,20);
 doc.setFontSize(10);const headerLines=doc.splitTextToSize(`${report.schoolName}\n${report.filters.from} - ${report.filters.to} · ${report.filters.type}\nHazırlayan: ${report.authorName} · ${new Date(report.generatedAt).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul'})}`,180);doc.text(headerLines,14,29);const summaryY=34+headerLines.length*5;
 const common={styles:{font:'DejaVu',fontStyle:'normal' as const,fontSize:9,cellPadding:3},headStyles:{fontStyle:'normal' as const,fillColor:[47,107,255] as [number,number,number]},margin:{left:14,right:14,top:18,bottom:18}};
 autoTable(doc,{...common,startY:summaryY,head:[['Sonuç','Öğrenci','Ortalama','Medyan','Önceki ort.','Fark']],body:[[String(report.current.count),String(report.current.students),pdfNumber(report.current.average),pdfNumber(report.current.median),pdfNumber(report.previous.average),pdfNumber(report.delta)]]});
 const tableRows=report.groups.length?report.groups.map(g=>[g.name,String(g.count),String(g.students),pdfNumber(g.average),pdfNumber(g.median)]):report.trend.map(g=>[g.date,String(g.count),String(g.students),pdfNumber(g.average),pdfNumber(g.median)]);
 autoTable(doc,{...common,startY:(doc as unknown as {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+10,head:[[report.groups.length?'Sınıf':'Tarih','Sonuç','Öğrenci','Ortalama net','Medyan net']],body:tableRows.length?tableRows:[['Sonuç bulunamadı','0','0','-','-']]});
 doc.addPage();doc.setFont('DejaVu');doc.setFontSize(13);doc.setTextColor(20);doc.text('Kapsam ve hesaplama notları',14,22);doc.setFontSize(10);
 const notes=[report.privacyNote,`Sınıf: ${report.filters.classId?report.classes.find(c=>c.id===report.filters.classId)?.name??'Seçili sınıf':'Tüm yetkili sınıflar'} · Kademe: ${report.filters.grade||'Tümü'} · Alan: ${report.filters.field||'Tümü'} · Kaynak: ${report.role==='student'?report.filters.source||'Tümü':'Okul'}`,'Ortalama ve medyan sonuç satırları üzerinden hesaplanır. Öğrenci sayısı dönem içindeki farklı öğrenci kayıtlarını ifade eder. Önceki dönem eşit uzunlukta ve hemen önceki tarih aralığıdır.','Farklı denemelerin zorluğu ve katılımı değişebilir. Net değişimi tek başına öğrenme kazanımı veya verilen desteğin etkisi değildir. Sınıfı olmayan okul sonuçları personel raporuna dahil edilmez.'];
 let y=34;for(const note of notes){const lines=doc.splitTextToSize(note,180);doc.text(lines,14,y);y+=lines.length*5+8;}
 const all=doc.getNumberOfPages();for(let page=1;page<=all;page++){doc.setPage(page);doc.setFillColor(255,255,255);doc.rect(12,284,186,10,'F');doc.setFont('DejaVu');doc.setFontSize(8);doc.setTextColor(85);doc.text(`Puaniz · ${page} / ${all} · Eksik veya gizlenmiş değerler: -`,14,289);}
 return doc;
}
