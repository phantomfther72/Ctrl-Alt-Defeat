
-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads"
  ON public.file_uploads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow delete on parsed_data (cascades from file_uploads, but also direct)
CREATE POLICY "Authenticated can delete parsed data"
  ON public.parsed_data FOR DELETE
  TO authenticated
  USING (true);

-- Allow users to delete their own storage objects
CREATE POLICY "Users can delete their own uploads from storage"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
