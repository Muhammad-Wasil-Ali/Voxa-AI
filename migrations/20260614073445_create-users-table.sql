CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  auth_provider TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_signed_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users can read own profile'
  ) THEN
    CREATE POLICY "users can read own profile" ON public.users
      FOR SELECT TO authenticated
      USING (id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users can insert own profile'
  ) THEN
    CREATE POLICY "users can insert own profile" ON public.users
      FOR INSERT TO authenticated
      WITH CHECK (id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND policyname = 'users can update own profile'
  ) THEN
    CREATE POLICY "users can update own profile" ON public.users
      FOR UPDATE TO authenticated
      USING (id = (SELECT auth.uid()))
      WITH CHECK (id = (SELECT auth.uid()));
  END IF;
END $$;

REVOKE ALL ON TABLE public.users FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON TABLE public.users TO authenticated;
GRANT UPDATE (
  email,
  name,
  avatar_url,
  auth_provider,
  email_verified,
  profile,
  last_signed_in_at,
  updated_at
) ON public.users TO authenticated;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();
