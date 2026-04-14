
-- Add briefing fields to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS niche text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS tone_of_voice text,
  ADD COLUMN IF NOT EXISTS competitors text[],
  ADD COLUMN IF NOT EXISTS differentials text,
  ADD COLUMN IF NOT EXISTS products_services text,
  ADD COLUMN IF NOT EXISTS posting_frequency text,
  ADD COLUMN IF NOT EXISTS brand_values text,
  ADD COLUMN IF NOT EXISTS current_social_presence text;

-- Create strategies table
CREATE TABLE public.strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own strategies
CREATE POLICY "Users can view own strategies"
  ON public.strategies FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create strategies"
  ON public.strategies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies"
  ON public.strategies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies"
  ON public.strategies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON public.strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
