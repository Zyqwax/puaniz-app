import 'server-only';
import { inArray } from 'drizzle-orm';
import { db } from '@/server/db';
import { learningNotifications, learningNotificationPreferences } from '@/server/db/schema';
type Event=Omit<typeof learningNotifications.$inferInsert,'id'|'createdAt'|'read'>;
/** Called inside the originating transaction: preferences and event deduplication apply together. */
export async function notifyLearning(executor:Pick<typeof db,'select'|'insert'>,events:Event[],actorId:string) {
 const recipients=[...new Set(events.filter(e=>e.userId!==actorId).map(e=>e.userId))];
 for(let i=0;i<recipients.length;i+=200) {
  const ids=recipients.slice(i,i+200);
  const preferences=await executor.select().from(learningNotificationPreferences).where(inArray(learningNotificationPreferences.userId,ids));
  const values=events.filter(e=>ids.includes(e.userId)&&e.userId!==actorId).filter(e=>{const p=preferences.find(p=>p.userId===e.userId);return !p||p[e.category];});
  if(values.length)await executor.insert(learningNotifications).values(values).onConflictDoNothing();
 }
}
