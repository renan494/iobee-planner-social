-- Extensões para cron job
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Tabela de contas Instagram conectadas por cliente
CREATE TABLE public.instagram_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ig_business_id TEXT NOT NULL,
  ig_username TEXT,
  page_id TEXT NOT NULL,
  page_name TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_by UUID,
  auto_publish BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view IG accounts"
  ON public.instagram_accounts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create IG accounts"
  ON public.instagram_accounts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update IG accounts"
  ON public.instagram_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete IG accounts"
  ON public.instagram_accounts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_instagram_accounts_updated_at
  BEFORE UPDATE ON public.instagram_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Log de publicações
CREATE TABLE public.instagram_publish_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID,
  client_id UUID,
  status TEXT NOT NULL,
  ig_media_id TEXT,
  error_message TEXT,
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.instagram_publish_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view publish log"
  ON public.instagram_publish_log FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert publish log"
  ON public.instagram_publish_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admins can delete publish log"
  ON public.instagram_publish_log FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Novos campos em posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS scheduled_time TIME NOT NULL DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS auto_publish_instagram BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS instagram_status TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_auto_publish 
  ON public.posts (date, scheduled_time) 
  WHERE auto_publish_instagram = true AND (instagram_status IS NULL OR instagram_status = 'pending');