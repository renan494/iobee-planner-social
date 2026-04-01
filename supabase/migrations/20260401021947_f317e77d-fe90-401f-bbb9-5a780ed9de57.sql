
ALTER TABLE public.clients
  ADD COLUMN monthly_posts integer DEFAULT 0,
  ADD COLUMN objective text,
  ADD COLUMN goal text;
