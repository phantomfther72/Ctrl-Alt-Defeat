
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Analytics data table (pageviews, sessions, etc.)
CREATE TABLE public.analytics_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  pageviews INTEGER NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics data is publicly readable"
  ON public.analytics_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated can insert analytics"
  ON public.analytics_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Traffic sources table
CREATE TABLE public.traffic_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.traffic_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Traffic sources readable by authenticated"
  ON public.traffic_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Insert traffic sources"
  ON public.traffic_sources FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- File uploads table
CREATE TABLE public.file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'error')),
  row_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all uploads"
  ON public.file_uploads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own uploads"
  ON public.file_uploads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads"
  ON public.file_uploads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_file_uploads_updated_at
  BEFORE UPDATE ON public.file_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insights table
CREATE TABLE public.insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'neutral' CHECK (type IN ('positive', 'negative', 'warning', 'neutral')),
  metric TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insights readable by authenticated"
  ON public.insights FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Insert insights"
  ON public.insights FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TRIGGER update_insights_updated_at
  BEFORE UPDATE ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Forecast data table
CREATE TABLE public.forecast_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  actual INTEGER,
  forecast INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.forecast_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forecast data readable"
  ON public.forecast_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Insert forecast data"
  ON public.forecast_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false);

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
