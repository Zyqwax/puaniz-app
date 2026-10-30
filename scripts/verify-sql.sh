#!/usr/bin/env bash
# Exercises the SQL layer for the test user: exams CRUD, topic upsert,
# community post/comment/like, and cascade delete on account removal.
set -uo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env.local; set +a
export PGPASSWORD=puaniz_dev
PSQL="psql -h localhost -U puaniz -d puaniz -tAq"

UID_=$($PSQL -c "select id from users where email='test@test.com'")
echo "user=$UID_"

# clean slate
$PSQL -c "delete from exams where user_id='$UID_'" >/dev/null
$PSQL -c "delete from posts where user_id='$UID_'" >/dev/null

# exam insert mirroring addExam()
$PSQL -c "insert into exams (user_id,name,date,type,total_net,scores)
 values ('$UID_','Deneme 1','2026-10-01','TYT','52.5',
 '{\"turkce\":{\"d\":30,\"y\":5,\"net\":28.75}}'::jsonb)" >/dev/null
echo "exams: $($PSQL -c "select count(*) from exams where user_id='$UID_'")"

# topic upsert twice (ON CONFLICT path)
$PSQL -c "insert into user_topic_progress (user_id,topic_key,completed)
 values ('$UID_','tyt_matematik_0',true)
 on conflict (user_id,topic_key) do update set completed=true" >/dev/null
$PSQL -c "insert into user_topic_progress (user_id,topic_key,completed,question_count)
 values ('$UID_','tyt_matematik_0',true,10)
 on conflict (user_id,topic_key) do update set question_count=10" >/dev/null
echo "topic rows (expect 1): $($PSQL -c "select count(*) from user_topic_progress where user_id='$UID_'")"

# post + tag + like + comment
POST=$($PSQL -c "insert into posts (user_id,title,body) values ('$UID_','Test','#TYT soru') returning id")
$PSQL -c "insert into post_tags (post_id,tag) values ('$POST','TYT') on conflict do nothing" >/dev/null
$PSQL -c "insert into post_likes (post_id,user_id) values ('$POST','$UID_') on conflict do nothing" >/dev/null
$PSQL -c "insert into comments (post_id,user_id,body) values ('$POST','$UID_','yorum')" >/dev/null
echo "post joined view: $($PSQL -c "
  select (select count(*) from post_likes where post_id=p.id) || ' likes, ' ||
         (select count(*) from comments where post_id=p.id) || ' comments, tags=' ||
         coalesce((select string_agg(tag,',') from post_tags where post_id=p.id),'')
  from posts p where p.id='$POST'")"

# ownership guard: a different user cannot touch the row
$PSQL -c "insert into users (id,name,email,email_verified) values ('00000000-0000-0000-0000-00000000beef','Other','other@test.local',true) on conflict do nothing" >/dev/null
AFFECTED=$($PSQL -c "with u as (update exams set name='hacked' where id=(select id from exams where user_id='$UID_' limit 1) and user_id='00000000-0000-0000-0000-00000000beef' returning 1) select count(*) from u")
echo "cross-user update affected rows (expect 0): $AFFECTED"
$PSQL -c "delete from users where id='00000000-0000-0000-0000-00000000beef'" >/dev/null

# cascade: deleting the user removes everything
$PSQL -c "insert into users (id,name,email,email_verified) values ('00000000-0000-0000-0000-00000000cafe','Cascade','cascade@test.local',true)" >/dev/null
$PSQL -c "insert into exams (user_id,name,date,type,total_net,scores) values ('00000000-0000-0000-0000-00000000cafe','x','2026-10-01','TYT','1','{}'::jsonb)" >/dev/null
$PSQL -c "insert into posts (user_id,title,body) values ('00000000-0000-0000-0000-00000000cafe','p','b')" >/dev/null
$PSQL -c "delete from users where id='00000000-0000-0000-0000-00000000cafe'" >/dev/null
echo "leftover rows after cascade (expect 0): $($PSQL -c "select
  (select count(*) from exams where user_id='00000000-0000-0000-0000-00000000cafe')
+ (select count(*) from posts where user_id='00000000-0000-0000-0000-00000000cafe')")"

# cleanup
$PSQL -c "delete from posts where user_id='$UID_'" >/dev/null
$PSQL -c "delete from exams where user_id='$UID_'" >/dev/null
$PSQL -c "delete from user_topic_progress where user_id='$UID_'" >/dev/null
echo "done"
