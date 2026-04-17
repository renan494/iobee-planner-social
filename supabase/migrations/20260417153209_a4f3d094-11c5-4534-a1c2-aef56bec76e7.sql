-- Refocus clients table on social media strategy
-- Remove ads/non-social fields
ALTER TABLE public.clients
  DROP COLUMN IF EXISTS website_url,
  DROP COLUMN IF EXISTS ticket_medio,
  DROP COLUMN IF EXISTS verba_mensal,
  DROP COLUMN IF EXISTS platforms,
  DROP COLUMN IF EXISTS gmb_url,
  DROP COLUMN IF EXISTS facebook_url,
  DROP COLUMN IF EXISTS linkedin_url;

-- Add social-media-focused fields
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS social_networks text[],
  ADD COLUMN IF NOT EXISTS content_pillars text,
  ADD COLUMN IF NOT EXISTS main_offer text,
  ADD COLUMN IF NOT EXISTS cta_preferences text,
  ADD COLUMN IF NOT EXISTS audience_pains text,
  ADD COLUMN IF NOT EXISTS banned_topics text,
  ADD COLUMN IF NOT EXISTS success_references text,
  ADD COLUMN IF NOT EXISTS hashtags_base text;
-- posting_frequency already exists