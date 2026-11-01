export interface SchoolResultSnapshot {
 studentNumber:string;studentName:string;studentUserId:string|null;classId:string|null;
 scores:Record<string,{d:number;y:number;net:number}>;totalNet:string;
}
export function schoolResultSnapshot(row:SchoolResultSnapshot):SchoolResultSnapshot {
 return {studentNumber:row.studentNumber,studentName:row.studentName,studentUserId:row.studentUserId,classId:row.classId,scores:row.scores,totalNet:row.totalNet};
}
export function literalSearch(value:string){return value.replace(/[\\%_]/g,'\\$&');}
export function checkedPage(value=1){if(!Number.isInteger(value)||value<1||value>10000)throw new Error('Geçersiz sayfa.');return value;}
