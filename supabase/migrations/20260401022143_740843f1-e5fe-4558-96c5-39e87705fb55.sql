
ALTER TABLE public.clients
  ADD COLUMN instagram_handle text,
  ADD COLUMN facebook_url text,
  DROP COLUMN IF EXISTS monthly_posts,
  DROP COLUMN IF EXISTS goal;
