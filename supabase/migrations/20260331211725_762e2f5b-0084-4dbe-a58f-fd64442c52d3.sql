
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-avatars', 'client-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view client avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-avatars');

CREATE POLICY "Authenticated users can upload client avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-avatars');

CREATE POLICY "Authenticated users can update client avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-avatars');

CREATE POLICY "Authenticated users can delete client avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-avatars');
