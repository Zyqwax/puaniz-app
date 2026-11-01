import CommunityClient from './CommunityClient';
import { getForumCategories, getForumTopics, getForumNotifications } from '@/server/actions/forum';
export const metadata = { title: 'Topluluk', description: 'Puaniz forum: sorular, çözümler ve birlikte öğrenme.' };
export default async function CommunityPage({ searchParams }: {searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=await searchParams;
  const value=(key:string)=>typeof params[key]==='string'?params[key] as string:undefined;
  const filters={category:value('category'),q:value('q'),tab:value('tab'),tag:value('tag'),page:Number(value('page'))||1};
  const [categories,data,notifications]=await Promise.all([getForumCategories(),getForumTopics(filters),getForumNotifications()]);
  return <CommunityClient categories={categories} data={data} filters={filters} notifications={notifications}/>;
}
