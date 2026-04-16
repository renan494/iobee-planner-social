-- Table: copies (copies geradas por framework, salvas por cliente)
CREATE TABLE public.copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  format TEXT,
  produto TEXT,
  publico_alvo TEXT,
  sections JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_copy TEXT,
  campaign_type TEXT DEFAULT 'ongoing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.copies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view copies" ON public.copies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create copies" ON public.copies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own copies" ON public.copies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own copies" ON public.copies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_copies_updated_at BEFORE UPDATE ON public.copies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_copies_client_id ON public.copies(client_id);
CREATE INDEX idx_copies_user_id ON public.copies(user_id);

-- Table: reverse_engineered_copies (variações geradas via engenharia reversa)
CREATE TABLE public.reverse_engineered_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  transcript TEXT NOT NULL,
  contexto_extra TEXT,
  analise JSONB NOT NULL DEFAULT '{}'::jsonb,
  variacao JSONB NOT NULL DEFAULT '{}'::jsonb,
  hooks_alternativos JSONB,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reverse_engineered_copies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reverse copies" ON public.reverse_engineered_copies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create reverse copies" ON public.reverse_engineered_copies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reverse copies" ON public.reverse_engineered_copies FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reverse copies" ON public.reverse_engineered_copies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_rev_copies_updated_at BEFORE UPDATE ON public.reverse_engineered_copies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_rev_copies_client_id ON public.reverse_engineered_copies(client_id);
CREATE INDEX idx_rev_copies_user_id ON public.reverse_engineered_copies(user_id);