export function calendarWeek(date:string) {
 const start=new Date(date+'T00:00:00Z');const day=start.getUTCDay();start.setUTCDate(start.getUTCDate()-((day+6)%7));
 return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setUTCDate(start.getUTCDate()+i);return d.toISOString().slice(0,10);});
}
export function shiftCalendarWeek(date:string,amount:number){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+amount*7);return d.toISOString().slice(0,10);}
