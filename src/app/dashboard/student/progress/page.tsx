import LearningWorkspace from '@/components/learning/LearningWorkspace';
import { getLearningWorkspace } from '@/server/actions/learning';
export const metadata = {title: 'Gelişim ve Takip'};
export default async function Page() {
 const data=await getLearningWorkspace('student');
 return <LearningWorkspace role="student" data={data}/>;
}
