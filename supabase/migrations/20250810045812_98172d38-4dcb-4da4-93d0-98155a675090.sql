-- Smart (GA) token cache table
CREATE TABLE IF NOT EXISTS public.smart_auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and permissive policies similar to jubilee_auth_tokens
ALTER TABLE public.smart_auth_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow system access to smart auth tokens" ON public.smart_auth_tokens;
CREATE POLICY "Allow system access to smart auth tokens"
ON public.smart_auth_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_smart_auth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_smart_auth_tokens_updated_at ON public.smart_auth_tokens;
CREATE TRIGGER trg_smart_auth_tokens_updated_at
BEFORE UPDATE ON public.smart_auth_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_smart_auth_tokens_updated_at();