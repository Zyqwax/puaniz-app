import assert from 'node:assert/strict';
import { filterStudentExams, summarizeStudentPeriod } from '../src/lib/student-exams.ts';
const exams = [
  { type:'TYT', date:'2026-10-01', totalNet:40 },
  { type:'TYT', date:'2026-10-03', totalNet:60 },
  { type:'AYT', date:'2026-10-05', totalNet:80 },
  { type:'TYT', date:'2026-10-04', totalNet:65 },
  { type:'TYT', date:'2026-10-06', totalNet:75 },
];
const before = JSON.stringify(exams);
assert.equal(filterStudentExams(exams,'2026-10-04','2026-10-06').length,3);
assert.equal(filterStudentExams(exams,'2026-10-06','2026-10-01').length,0);
assert.equal(filterStudentExams(exams,'2026-10-06').length,1);
const summary = summarizeStudentPeriod(exams,'TYT','2026-10-04','2026-10-06');
assert.equal(summary.period.length,2);
assert.equal(summary.average,70);
assert.equal(summary.previousAverage,50);
assert.equal(summary.comparison,20);
assert.equal(summarizeStudentPeriod(exams,'TYT').comparison,10);
assert.equal(summarizeStudentPeriod([], 'TYT').comparison,null);
assert.equal(summarizeStudentPeriod([{type:'TYT',date:'2026-10-01',totalNet:0}],'TYT').average,0);
assert.equal(JSON.stringify(exams),before);
console.log('Öğrenci ekranları: tarih sınırları, dönem karşılaştırması, sınav türü ayrımı, boş veri ve veri değişmezliği kontrolleri başarılı.');
