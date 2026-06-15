CREATE TABLE IF NOT EXISTS public.user_credit_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 1250 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  related_record_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voice_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  sample_audio_url TEXT NOT NULL,
  sample_audio_key TEXT NOT NULL,
  cloned_voice_ref TEXT,
  cloned_voice_artifact_url TEXT,
  cloned_voice_artifact_key TEXT,
  cloned_voice_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider TEXT NOT NULL DEFAULT 'replicate',
  model TEXT NOT NULL,
  trigger_run_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.voice_tts_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voice_source TEXT NOT NULL CHECK (voice_source IN ('custom', 'deepgram-default')),
  voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  input_text TEXT NOT NULL,
  character_count INTEGER NOT NULL CHECK (character_count BETWEEN 1 AND 2000),
  credits_charged INTEGER NOT NULL CHECK (credits_charged >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  audio_url TEXT,
  audio_key TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  trigger_run_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS credit_ledger_user_created_idx
  ON public.credit_ledger (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS voice_clones_user_created_idx
  ON public.voice_clones (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS voice_clones_trigger_run_id_idx
  ON public.voice_clones (trigger_run_id);

CREATE INDEX IF NOT EXISTS voice_tts_results_user_created_idx
  ON public.voice_tts_results (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS voice_tts_results_trigger_run_id_idx
  ON public.voice_tts_results (trigger_run_id);

ALTER TABLE public.user_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_tts_results ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_credit_balances'
      AND policyname = 'users can read own credit balance'
  ) THEN
    CREATE POLICY "users can read own credit balance" ON public.user_credit_balances
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'credit_ledger'
      AND policyname = 'users can read own credit ledger'
  ) THEN
    CREATE POLICY "users can read own credit ledger" ON public.credit_ledger
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_clones'
      AND policyname = 'users can read own voice clones'
  ) THEN
    CREATE POLICY "users can read own voice clones" ON public.voice_clones
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_clones'
      AND policyname = 'users can insert own voice clones'
  ) THEN
    CREATE POLICY "users can insert own voice clones" ON public.voice_clones
      FOR INSERT TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_clones'
      AND policyname = 'users can update own voice clones'
  ) THEN
    CREATE POLICY "users can update own voice clones" ON public.voice_clones
      FOR UPDATE TO authenticated
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_clones'
      AND policyname = 'users can delete own voice clones'
  ) THEN
    CREATE POLICY "users can delete own voice clones" ON public.voice_clones
      FOR DELETE TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_tts_results'
      AND policyname = 'users can read own voice tts results'
  ) THEN
    CREATE POLICY "users can read own voice tts results" ON public.voice_tts_results
      FOR SELECT TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_tts_results'
      AND policyname = 'users can insert own voice tts results'
  ) THEN
    CREATE POLICY "users can insert own voice tts results" ON public.voice_tts_results
      FOR INSERT TO authenticated
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_tts_results'
      AND policyname = 'users can update own voice tts results'
  ) THEN
    CREATE POLICY "users can update own voice tts results" ON public.voice_tts_results
      FOR UPDATE TO authenticated
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'voice_tts_results'
      AND policyname = 'users can delete own voice tts results'
  ) THEN
    CREATE POLICY "users can delete own voice tts results" ON public.voice_tts_results
      FOR DELETE TO authenticated
      USING (user_id = (SELECT auth.uid()));
  END IF;
END $$;

REVOKE ALL ON TABLE public.user_credit_balances FROM anon, authenticated;
REVOKE ALL ON TABLE public.credit_ledger FROM anon, authenticated;
REVOKE ALL ON TABLE public.voice_clones FROM anon, authenticated;
REVOKE ALL ON TABLE public.voice_tts_results FROM anon, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE public.user_credit_balances TO authenticated;
GRANT SELECT ON TABLE public.credit_ledger TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.voice_clones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.voice_tts_results TO authenticated;

CREATE OR REPLACE FUNCTION public.deduct_voice_tts_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_result_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  next_balance INTEGER;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Cannot deduct credits for another user.';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Credit amount must be positive.';
  END IF;

  INSERT INTO public.user_credit_balances (user_id, balance)
  VALUES (p_user_id, 1250)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credit_balances
  SET balance = balance - p_amount
  WHERE user_id = p_user_id
    AND balance >= p_amount
  RETURNING balance INTO next_balance;

  IF next_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits.';
  END IF;

  INSERT INTO public.credit_ledger (
    user_id,
    amount,
    reason,
    related_record_id,
    metadata
  )
  VALUES (
    p_user_id,
    -p_amount,
    'voice_tts_generation',
    p_result_id,
    jsonb_build_object('resultId', p_result_id)
  );

  RETURN next_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_voice_tts_credits(UUID, INTEGER, UUID) TO authenticated;

CREATE TRIGGER user_credit_balances_updated_at
  BEFORE UPDATE ON public.user_credit_balances
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER voice_clones_updated_at
  BEFORE UPDATE ON public.voice_clones
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER voice_tts_results_updated_at
  BEFORE UPDATE ON public.voice_tts_results
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();
