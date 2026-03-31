
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client TEXT NOT NULL,
  analyst TEXT NOT NULL,
  title TEXT NOT NULL,
  headline TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('static', 'carousel', 'reels', 'stories')),
  funnel_stage TEXT NOT NULL CHECK (funnel_stage IN ('topo', 'meio', 'fundo')),
  date DATE NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  legend TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update posts" ON public.posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete posts" ON public.posts FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Analysts table
CREATE TABLE public.analysts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analysts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view analysts" ON public.analysts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create analysts" ON public.analysts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete analysts" ON public.analysts FOR DELETE TO authenticated USING (true);

-- Activity log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  analyst TEXT,
  client TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view activity" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can log activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Seed default analysts
INSERT INTO public.analysts (name) VALUES ('Maria Julya'), ('Julia');
