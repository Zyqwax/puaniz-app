import SchoolDataList from '@/components/learning/SchoolDataList';
import {getSchoolDataPage} from '@/server/actions/school-data';
export const metadata={title:'Okul Verisi ve Sonuç Düzeltme'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const p=await searchParams;const data=await getSchoolDataPage({page:typeof p.page==='string'?Number(p.page):1,q:typeof p.q==='string'?p.q:'',examId:typeof p.examId==='string'?p.examId:'',unmatched:p.unmatched==='1'});
 return <SchoolDataList data={data}/>;
}
