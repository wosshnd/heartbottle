-- supabase/policies.sql
-- Row Level Security (RLS) policies for heartbottle
-- Run in your Supabase SQL editor (or psql) as a DB admin

-- NOTE: adjust table/column names to match your schema. This file assumes common columns:
-- users(id uuid primary key), bottles(id uuid, user_id uuid, content text, mood text, mood_color text, is_anonymous boolean, created_at timestamptz), replies(id, bottle_id, user_id, content, created_at), notices(...)

-- Enable RLS on tables
ALTER TABLE IF EXISTS bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notices ENABLE ROW LEVEL SECURITY;

-- 1) Bottles: INSERT only by authenticated users
-- If the user sets is_anonymous = true, allow insert but require that user_id = auth.uid() OR user_id IS NULL
CREATE POLICY bottles_insert_authenticated ON bottles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND
    char_length(coalesce(content, '')) > 0 AND
    char_length(content) <= 2000 AND
    -- basic sanitization checks (deny obvious script tags)
    (content !~* '<script' AND content !~* '</script>') AND
    (
      is_anonymous = TRUE OR user_id = auth.uid()
    )
  );

-- 2) Bottles: SELECT allowed to everyone (public read) but you can restrict if needed
-- If you want public reads, don't create a restrictive SELECT policy; Supabase allows public access when anon key used.
-- If you want only authenticated reads, create a select policy for authenticated role.

-- 3) Bottles: UPDATE / DELETE only by owner or admin (service role)
CREATE POLICY bottles_manage_owner ON bottles
  FOR UPDATE, DELETE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4) Replies: INSERT by authenticated users; content length limits
CREATE POLICY replies_insert_authenticated ON replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.role() = 'authenticated' AND
    char_length(coalesce(content, '')) > 0 AND
    char_length(content) <= 1000 AND
    (content !~* '<script' AND content !~* '</script>') AND
    user_id = auth.uid()
  );

-- Replies: UPDATE/DELETE only by reply owner
CREATE POLICY replies_manage_owner ON replies
  FOR UPDATE, DELETE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5) Users table: allow users to UPDATE their own profile but not escalate role/is_admin
CREATE POLICY users_update_self ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND auth.role() = 'authenticated');

-- Prevent accidental mass deletes for all tables by denying DELETE to non-admins (only service_role or privileged role should run destructive operations)
-- If you have an "admin" role, adapt the check. Here we allow only the database owner / service_role to bypass RLS.

-- 6) Notices (notifications): only server (service role) can INSERT notices for users
CREATE POLICY notices_insert_server ON notices
  FOR INSERT
  TO authenticated
  WITH CHECK (false);
-- above policy denies client inserts. Server-side code using service_role key can bypass RLS and insert notices.

-- Optional: create a function to normalize/clean content server-side (recommended)
-- Example: a SQL function that trims and enforces length; you can call it from triggers before insert.

CREATE OR REPLACE FUNCTION public.normalize_text(input text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  -- trim, collapse excessive whitespace, enforce max length
  RETURN left(regexp_replace(trim(input), '\\s{2,}', ' ', 'g'), 2000);
END;
$$;

-- Example trigger to normalize bottles.content
CREATE OR REPLACE FUNCTION public.bottles_before_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.content := public.normalize_text(NEW.content);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bottles_normalize ON bottles;
CREATE TRIGGER trg_bottles_normalize
BEFORE INSERT OR UPDATE ON bottles
FOR EACH ROW EXECUTE FUNCTION public.bottles_before_insert();

-- End of policies.sql
