
-- Distribution events table for seasonal indicators
CREATE TABLE public.distribution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_type text NOT NULL DEFAULT 'holiday',
  start_date date NOT NULL,
  end_date date NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.distribution_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Events readable by authenticated"
  ON public.distribution_events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Events insertable by authenticated"
  ON public.distribution_events FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Events updatable by authenticated"
  ON public.distribution_events FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Events deletable by authenticated"
  ON public.distribution_events FOR DELETE TO authenticated
  USING (true);

-- Trend analysis results table
CREATE TABLE public.trend_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_type text NOT NULL DEFAULT 'demand',
  period text,
  location text,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  trend_direction text,
  insight text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.trend_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trend analysis readable by authenticated"
  ON public.trend_analysis FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Trend analysis insertable by authenticated"
  ON public.trend_analysis FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Trend analysis deletable by authenticated"
  ON public.trend_analysis FOR DELETE TO authenticated
  USING (true);
