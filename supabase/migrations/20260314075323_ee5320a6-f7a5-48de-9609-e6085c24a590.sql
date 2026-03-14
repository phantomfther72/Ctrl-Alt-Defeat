
-- Table to store parsed rows from uploaded files
CREATE TABLE public.parsed_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_upload_id UUID NOT NULL REFERENCES public.file_uploads(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.parsed_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read parsed data"
  ON public.parsed_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert parsed data"
  ON public.parsed_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_parsed_data_file_upload_id ON public.parsed_data(file_upload_id);

-- Also update file_uploads to allow service role updates (for status changes from edge function)
CREATE POLICY "Service can update any upload"
  ON public.file_uploads FOR UPDATE
  TO authenticated
  USING (true);
