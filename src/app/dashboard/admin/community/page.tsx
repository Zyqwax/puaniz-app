import { getForumCategories, getForumModeration } from '@/server/actions/forum';
import ModerationClient from './ModerationClient';
export const metadata={title:'Forum Yönetimi'};
export default async function ForumAdminPage(){const [data,categories]=await Promise.all([getForumModeration(),getForumCategories()]);return <ModerationClient data={data} categories={categories}/>;}
