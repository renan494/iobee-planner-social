
-- Revert posts to authenticated only
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can create posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can update posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can delete posts" ON public.posts;

CREATE POLICY "Authenticated users can view posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update posts" ON public.posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete posts" ON public.posts FOR DELETE TO authenticated USING (true);

-- Revert clients to authenticated only
DROP POLICY IF EXISTS "Anyone can view clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can create clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can update clients" ON public.clients;
DROP POLICY IF EXISTS "Anyone can delete clients" ON public.clients;

CREATE POLICY "Authenticated users can view clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients" ON public.clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete clients" ON public.clients FOR DELETE TO authenticated USING (true);

-- Revert analysts to authenticated only
DROP POLICY IF EXISTS "Anyone can view analysts" ON public.analysts;
DROP POLICY IF EXISTS "Anyone can create analysts" ON public.analysts;
DROP POLICY IF EXISTS "Anyone can update analysts" ON public.analysts;
DROP POLICY IF EXISTS "Anyone can delete analysts" ON public.analysts;

CREATE POLICY "Authenticated users can view analysts" ON public.analysts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create analysts" ON public.analysts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update analysts" ON public.analysts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete analysts" ON public.analysts FOR DELETE TO authenticated USING (true);

-- Revert activity_log to authenticated only
DROP POLICY IF EXISTS "Anyone can view activity" ON public.activity_log;
DROP POLICY IF EXISTS "Anyone can log activity" ON public.activity_log;
DROP POLICY IF EXISTS "Anyone can delete activity" ON public.activity_log;

CREATE POLICY "Authenticated users can view activity" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can log activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can delete activity logs" ON public.activity_log FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
