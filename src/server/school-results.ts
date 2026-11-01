import 'server-only';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db';
export async function recalculateSchoolRanks(tx:Pick<typeof db,'execute'>,examId:string) {
 await tx.execute(sql`with ranked as (select id,rank() over (order by total_net desc) as school_rank,case when class_id is not null then rank() over (partition by class_id order by total_net desc) end as class_rank from school_exam_results where school_exam_id=${examId}) update school_exam_results r set rank_in_school=ranked.school_rank,rank_in_class=ranked.class_rank from ranked where r.id=ranked.id`);
}
