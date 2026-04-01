
ALTER TABLE public.posts ADD COLUMN art_url TEXT DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('post-arts', 'post-arts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view post arts"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'post-arts');

CREATE POLICY "Authenticated users can upload post arts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-arts');

CREATE POLICY "Authenticated users can update post arts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'post-arts');

CREATE POLICY "Authenticated users can delete post arts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-arts');
