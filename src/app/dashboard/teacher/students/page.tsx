import SchoolStudentDirectory from '@/components/learning/SchoolStudentDirectory';
import {getSchoolStudentPage} from '@/server/actions/school-data';
export const metadata={title:'Öğrenci Dizini'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;const page=typeof params.page==='string'?Number(params.page):1;
 const data=await getSchoolStudentPage('teacher',{page,q:typeof params.q==='string'?params.q:'',classId:typeof params.classId==='string'?params.classId:''});
 return <SchoolStudentDirectory data={data} role="teacher"/>;
}
