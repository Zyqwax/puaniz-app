CREATE TABLE IF NOT EXISTS forum_categories (slug text PRIMARY KEY, name text NOT NULL, description text NOT NULL, position integer NOT NULL DEFAULT 0, admin_only boolean NOT NULL DEFAULT false);
INSERT INTO forum_categories (slug, name, description, position, admin_only) VALUES
('duyurular','Duyurular','Puaniz’den haberler ve topluluk duyuruları.',0,true),
('tyt','TYT','Temel yeterlilik konuları, sorular ve çözümler.',1,false),
('ayt','AYT','Alan dersleri, sorular ve sınav hazırlığı.',2,false),
('calisma','Çalışma ve motivasyon','Programlar, kaynaklar ve birlikte çalışma.',3,false),
('tercihler','Üniversite ve tercihler','Bölümler, üniversiteler ve gelecek hedefleri.',4,false),
('genel','Genel sohbet','Topluluğun buluşma noktası.',5,false),
('destek','Öneri ve destek','Puaniz için fikirler ve hata bildirimleri.',6,false)
ON CONFLICT DO NOTHING;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS category_slug text NOT NULL DEFAULT 'genel' REFERENCES forum_categories(slug);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'discussion';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS locked boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS solution_id uuid;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;
UPDATE posts SET last_activity_at = greatest(created_at, coalesce((SELECT max(created_at) FROM comments WHERE post_id = posts.id), created_at)) WHERE last_activity_at IS NULL;
ALTER TABLE posts ALTER COLUMN last_activity_at SET DEFAULT now();
ALTER TABLE posts ALTER COLUMN last_activity_at SET NOT NULL;
CREATE INDEX IF NOT EXISTS forum_posts_activity_idx ON posts (last_activity_at DESC, id);
CREATE INDEX IF NOT EXISTS forum_posts_category_idx ON posts (category_slug, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS forum_posts_search_idx ON posts USING gin (to_tsvector('simple', title || ' ' || body));
CREATE TABLE IF NOT EXISTS forum_user_topics (user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE, following boolean NOT NULL DEFAULT false, bookmarked boolean NOT NULL DEFAULT false, read_at timestamptz, PRIMARY KEY(user_id, post_id));
CREATE TABLE IF NOT EXISTS forum_reports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), reporter_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE, comment_id uuid REFERENCES comments(id) ON DELETE SET NULL, reason text NOT NULL, resolved boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS forum_moderation_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id text REFERENCES users(id) ON DELETE SET NULL, post_id uuid REFERENCES posts(id) ON DELETE SET NULL, action text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS forum_notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE, comment_id uuid REFERENCES comments(id) ON DELETE SET NULL, message text NOT NULL, read boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now());

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_solution_id_comments_id_fk') THEN
    ALTER TABLE posts ADD CONSTRAINT posts_solution_id_comments_id_fk FOREIGN KEY (solution_id) REFERENCES comments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS forum_posts_user_created_idx ON posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS forum_comments_user_created_idx ON comments (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS forum_reply_likes (comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE, user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE, PRIMARY KEY(comment_id, user_id));
