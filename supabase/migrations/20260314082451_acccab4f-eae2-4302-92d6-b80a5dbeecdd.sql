
CREATE POLICY "Users can update their own uploads in storage"
ON storage.objects FOR UPDATE
TO authenticated
USING ((bucket_id = 'uploads'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]));
