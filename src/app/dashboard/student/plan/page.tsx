import WeeklyLearningPlan from '@/components/learning/WeeklyLearningPlan';
import { getWeeklyLearningPlan } from '@/server/actions/coaching';
export const metadata = {title:'Haftalık Çalışma Planım'};
export default async function Page(){return <WeeklyLearningPlan data={await getWeeklyLearningPlan()}/>;}
