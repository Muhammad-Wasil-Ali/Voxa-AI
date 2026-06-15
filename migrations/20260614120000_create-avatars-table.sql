CREATE TABLE IF NOT EXISTS public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  style TEXT NOT NULL,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  source_image_url TEXT NOT NULL,
  source_image_key TEXT NOT NULL,
  landscape_image_url TEXT,
  landscape_image_key TEXT,
  portrait_image_url TEXT,
  portrait_image_key TEXT,
  provider TEXT NOT NULL DEFAULT 'google-gemini',
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash-image',
  trigger_run_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS avatars_user_created_idx
  ON public.avatars (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS avatars_trigger_run_id_idx
  ON public.avatars (trigger_run_id);

ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'avatars'
      AND policyname = 'users can read own avatars'
  ) THEN
    CREATE POLICY "users can read own avatars" ON public.avatars
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'avatars'
      AND policyname = 'users can insert own avatars'
  ) THEN
    CREATE POLICY "users can insert own avatars" ON public.avatars
      FOR INSERT TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'avatars'
      AND policyname = 'users can update own avatars'
  ) THEN
    CREATE POLICY "users can update own avatars" ON public.avatars
      FOR UPDATE TO authenticated
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'avatars'
      AND policyname = 'users can delete own avatars'
  ) THEN
    CREATE POLICY "users can delete own avatars" ON public.avatars
      FOR DELETE TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

REVOKE ALL ON TABLE public.avatars FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.avatars TO authenticated;

CREATE TRIGGER avatars_updated_at
  BEFORE UPDATE ON public.avatars
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();
