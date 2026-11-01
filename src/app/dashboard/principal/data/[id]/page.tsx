import SchoolResultEditor from '@/components/learning/SchoolResultEditor';
import {getSchoolResultDetail} from '@/server/actions/school-data';
export const metadata={title:'Sınav Sonucu Düzeltme ve Geçmiş'};
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {id}=await params;const p=await searchParams;const data=await getSchoolResultDetail(id,typeof p.historyPage==='string'?Number(p.historyPage):1);
 return <SchoolResultEditor key={`${data.result.id}-${data.result.revision}-${data.historyPage}`} data={data}/>;
}
