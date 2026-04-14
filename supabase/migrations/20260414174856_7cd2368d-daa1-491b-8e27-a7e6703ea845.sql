
-- Drop all existing policies and recreate with public access (anon + authenticated)

-- posts
DROP POLICY IF EXISTS "Authenticated users can view posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can update posts" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can delete posts" ON public.posts;

CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create posts" ON public.posts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update posts" ON public.posts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete posts" ON public.posts FOR DELETE TO anon, authenticated USING (true);

-- clients
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can create clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients;

CREATE POLICY "Anyone can view clients" ON public.clients FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create clients" ON public.clients FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update clients" ON public.clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete clients" ON public.clients FOR DELETE TO anon, authenticated USING (true);

-- analysts
DROP POLICY IF EXISTS "Authenticated users can view analysts" ON public.analysts;
DROP POLICY IF EXISTS "Authenticated users can create analysts" ON public.analysts;
DROP POLICY IF EXISTS "Authenticated users can update analysts" ON public.analysts;
DROP POLICY IF EXISTS "Authenticated users can delete analysts" ON public.analysts;

CREATE POLICY "Anyone can view analysts" ON public.analysts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can create analysts" ON public.analysts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update analysts" ON public.analysts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete analysts" ON public.analysts FOR DELETE TO anon, authenticated USING (true);

-- activity_log
DROP POLICY IF EXISTS "Authenticated users can view activity" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated users can log activity" ON public.activity_log;
DROP POLICY IF EXISTS "Admins can delete activity logs" ON public.activity_log;

CREATE POLICY "Anyone can view activity" ON public.activity_log FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can log activity" ON public.activity_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete activity" ON public.activity_log FOR DELETE TO anon, authenticated USING (true);
