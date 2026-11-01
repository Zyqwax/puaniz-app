export type LearningReportRole='student'|'teacher'|'principal';
export interface LearningReportFilters {type:'TYT'|'AYT';from:string;to:string;classId:string;grade:string;field:string;source:string;}
export interface LearningReportMetric {count:number;students:number;average:number|null;median:number|null;minimum:number|null;maximum:number|null;suppressed:boolean;}
export interface LearningReport {
 role:LearningReportRole;filters:LearningReportFilters;generatedAt:string;schoolName:string;authorName:string;
 classes:{id:string;name:string;grade:string;field:string|null}[];
 current:LearningReportMetric;previous:LearningReportMetric;delta:number|null;
 groups:(LearningReportMetric&{name:string;classId:string})[];trend:(LearningReportMetric&{date:string})[];
 privacyNote:string;
}
export const reportNumber=(value:number|null)=>value===null?'—':value.toLocaleString('tr-TR',{maximumFractionDigits:2});
export function reportCsv(report:LearningReport) {
 const rows:unknown[][]=[['Puaniz dönem raporu'],['Dönem',report.filters.from,report.filters.to],['Tür',report.filters.type],['Kurum',report.schoolName],['Hazırlayan',report.authorName],['Sınıf',report.classes.find(c=>c.id===report.filters.classId)?.name??'Tümü'],['Kademe',report.filters.grade||'Tümü'],['Alan',report.filters.field||'Tümü'],['Kaynak',report.role==='student'?report.filters.source||'Tümü':'Okul'],['Gizlilik',report.privacyNote],['Genel ortalama',report.current.average],['Önceki dönem ortalaması',report.previous.average],['Fark',report.delta],['Grup','Sonuç sayısı','Öğrenci sayısı','Ortalama','Medyan','En düşük','En yüksek'],...report.groups.map(g=>[g.name,g.count,g.students,g.average,g.median,g.minimum,g.maximum])];
 if(!report.groups.length)rows.push(['Genel',report.current.count,report.current.students,report.current.average,report.current.median,report.current.minimum,report.current.maximum]);
 const escape=(v:unknown)=>'"'+(typeof v==='number'?String(v).replace('.',','):String(v??'').replace(/^[\s]*[=+@\-]/,"'$&")).replaceAll('"','""')+'"';
 return '\uFEFF'+rows.map(row=>row.map(escape).join(';')).join('\r\n');
}
