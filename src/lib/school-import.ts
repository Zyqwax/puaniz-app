/** Versioned school templates use grouped TYT tests and complete AYT tests. */
export const SCHOOL_IMPORT_VERSION = '2026-1';
export const SCHOOL_TESTS = {
 TYT: { 'Türkçe':40, 'Sosyal Bilimler':20, 'Temel Matematik':40, 'Fen Bilimleri':20 },
 AYT: { 'Matematik':40, 'Fizik':14, 'Kimya':13, 'Biyoloji':13, 'Edebiyat':24, 'Tarih-1':10, 'Coğrafya-1':6, 'Tarih-2':11, 'Coğrafya-2':11, 'Felsefe Grubu':12, 'Din Kültürü':6 },
} as const;
export type SchoolImportType = keyof typeof SCHOOL_TESTS;
export interface SchoolImportRow { studentNumber:string; studentName:string; className?:string; scores:Record<string,{d:number;y:number;net:number}>; totalNet:number; }
export interface ImportIssue { row:number; field:string; message:string; }
export function validCalendarDate(value:string) {
 return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
export function validateSchoolRows(rows:SchoolImportRow[],type:SchoolImportType) {
 const issues:ImportIssue[]=[];const normalized:SchoolImportRow[]=[];const seen=new Set<string>();
 for(const [i,row] of rows.entries()) {
  const index=i+2;const studentNumber=String(row.studentNumber??'').trim(); const studentName=String(row.studentName??'').trim();
  if(!studentNumber || studentNumber.length>50) issues.push({row:index,field:'Okul No',message:'Okul numarası zorunlu ve en fazla 50 karakter olmalı.'});
  if(seen.has(studentNumber)) issues.push({row:index,field:'Okul No',message:'Aynı okul numarası dosyada birden fazla kez yer alıyor.'});seen.add(studentNumber);
  if(!studentName || studentName.length>200) issues.push({row:index,field:'Ad Soyad',message:'Ad soyad zorunlu ve en fazla 200 karakter olmalı.'});
  const scores:SchoolImportRow['scores']={}; const limits:Record<string,number>=SCHOOL_TESTS[type];
  if(!row.scores || !Object.keys(row.scores).length) issues.push({row:index,field:'Dersler',message:'En az bir testin doğru/yanlış sütunu gerekli.'});
  for(const [key,value] of Object.entries(row.scores??{})) {
   const max=limits[key];
   if(!Object.prototype.hasOwnProperty.call(limits,key)){issues.push({row:index,field:key,message:'Bu sınav türünde tanımlı test değil.'});continue;}
   if(!value || !Number.isInteger(value.d)||!Number.isInteger(value.y)||value.d<0||value.y<0||value.d+value.y>max){issues.push({row:index,field:key,message:`Doğru ve yanlış tam sayı olmalı; toplamı 0–${max} arasında olmalı.`});continue;}
   scores[key]={d:value.d,y:value.y,net:value.d-value.y/4};
  }
  if(type==='AYT') {
   const active=Object.entries(scores).filter(([,s])=>s.d+s.y>0).map(([key])=>key);
   const fields=[['Matematik','Fizik','Kimya','Biyoloji'],['Matematik','Edebiyat','Tarih-1','Coğrafya-1'],['Edebiyat','Tarih-1','Coğrafya-1','Tarih-2','Coğrafya-2','Felsefe Grubu','Din Kültürü']];
   if(!fields.some(keys=>active.every(key=>keys.includes(key)))) issues.push({row:index,field:'AYT alanı',message:'Bir satırda yalnızca SAY, EA veya SÖZ test sonuçları bulunabilir.'});
  }
  normalized.push({studentNumber,studentName,className:row.className?.trim(),scores,totalNet:Object.values(scores).reduce((sum,s)=>sum+s.net,0)});
 }
 return {rows:normalized,issues};
}
function cells(text:string) {
 const delimiter=text.split(/\r?\n/)[0].includes(';')?';':',';
 const result:string[][]=[];let row:string[]=[];let cell='';let quoted=false;
 for(let i=0;i<text.length;i++) {
  const ch=text[i];
  if(ch==='"') {if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}
  else if(ch===delimiter&&!quoted){row.push(cell.trim());cell='';}
  else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))result.push(row);row=[];cell='';}
  else cell+=ch;
 }
 row.push(cell.trim());if(row.some(Boolean))result.push(row);
 if(quoted) throw new Error('Kapanmamış çift tırnak var. CSV dosyasını kontrol edin.');
 return result;
}
const normalize=(s:string)=>s.replace(/^\uFEFF/,'').toLocaleLowerCase('tr-TR').replace(/\s+/g,' ').trim();
export function parseSchoolCsv(text:string,type:SchoolImportType):{rows:SchoolImportRow[];issues:ImportIssue[]} {
 if(text.length>5_000_000)return {rows:[],issues:[{row:1,field:'Dosya',message:'Dosya en fazla 5 MB olmalı.'}]};
 try {
 const grid=cells(text);if(grid.length<2)return {rows:[],issues:[{row:1,field:'Dosya',message:'Başlık ve en az bir öğrenci satırı gerekli.'}]};
 const headers=grid[0].map(normalize);const issues:ImportIssue[]=[];
 for(const h of ['Okul No','Ad Soyad','Sınıf'])if(!headers.includes(normalize(h)))issues.push({row:1,field:h,message:'Gerekli başlık eksik.'});
 if(new Set(headers).size!==headers.length)issues.push({row:1,field:'Başlık',message:'Yinelenen sütun başlığı var.'});
 const tests=Object.keys(SCHOOL_TESTS[type]).filter(key=>headers.includes(normalize(key+' D'))||headers.includes(normalize(key+' Y')));
 if(!tests.length)issues.push({row:1,field:'Dersler',message:'Şablondaki test sütunları bulunamadı.'});
 const allowed=['Okul No','Ad Soyad','Sınıf',...Object.keys(SCHOOL_TESTS[type]).flatMap(k=>[k+' D',k+' Y'])].map(normalize);
 for(const h of headers)if(!allowed.includes(h))issues.push({row:1,field:h,message:'Tanınmayan sütun. Güncel şablonu kullanın.'});
 for(const t of tests)for(const suffix of [' D',' Y'])if(!headers.includes(normalize(t+suffix)))issues.push({row:1,field:t+suffix,message:'Testin doğru ve yanlış sütunları birlikte bulunmalı.'});
 const rows=grid.slice(1).map((line,i)=>{
  if(line.length!==headers.length)issues.push({row:i+2,field:'Satır',message:`${headers.length} sütun bekleniyor, ${line.length} bulundu.`});
  const get=(h:string)=>line[headers.indexOf(normalize(h))]??'';
  const scores:SchoolImportRow['scores']={};for(const key of tests)scores[key]={d:get(key+' D')===''?NaN:Number(get(key+' D')),y:get(key+' Y')===''?NaN:Number(get(key+' Y')),net:0};
  return {studentNumber:get('Okul No'),studentName:get('Ad Soyad'),className:get('Sınıf'),scores,totalNet:0};
 });
 const checked=validateSchoolRows(rows,type);return {rows,issues:[...issues,...checked.issues]};
 } catch(e){return {rows:[],issues:[{row:1,field:'Dosya',message:e instanceof Error?e.message:'CSV okunamadı.'}]};}
}
export function schoolCsvTemplate(type:SchoolImportType) {
 const tests=Object.keys(SCHOOL_TESTS[type]);
 return '\uFEFF'+[['Okul No','Ad Soyad','Sınıf',...tests.flatMap(t=>[t+' D',t+' Y'])],['101','Örnek Öğrenci','12-A',...tests.flatMap(()=>['0','0'])]].map(r=>r.join(';')).join('\r\n');
}
