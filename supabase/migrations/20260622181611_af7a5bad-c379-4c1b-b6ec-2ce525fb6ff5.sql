
CREATE TABLE public.saved_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX saved_prompts_user_updated_idx ON public.saved_prompts (user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_prompts TO authenticated;
GRANT ALL ON public.saved_prompts TO service_role;

ALTER TABLE public.saved_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved prompts"
  ON public.saved_prompts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved prompts"
  ON public.saved_prompts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved prompts"
  ON public.saved_prompts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved prompts"
  ON public.saved_prompts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_saved_prompts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER saved_prompts_set_updated_at
  BEFORE UPDATE ON public.saved_prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_saved_prompts_updated_at();
