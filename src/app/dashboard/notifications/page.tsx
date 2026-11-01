import LearningNotifications from '@/components/learning/LearningNotifications';
import { getLearningNotifications } from '@/server/actions/notifications';
export const metadata={title:'Gelişim Bildirimleri'};
export default async function Page({searchParams}:{searchParams:Promise<{page?:string;unread?:string}>}) {
 const params=await searchParams;const value=Number(params.page??1);const page=Number.isInteger(value)&&value>0&&value<=10000?value:1;const unread=params.unread==='1';
 return <LearningNotifications data={await getLearningNotifications(page,unread)} unreadOnly={unread}/>;
}
