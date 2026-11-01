import StudentCoaching from '@/components/learning/StudentCoaching';
import { getStudentCoaching } from '@/server/actions/coaching';
export const metadata = {title:'Öğrenci Gelişim Profili'};
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{page?:string}>}) {
 const [{id},{page}]=await Promise.all([params,searchParams]);
 return <StudentCoaching data={await getStudentCoaching(id,Number(page)||1)}/>;
}
