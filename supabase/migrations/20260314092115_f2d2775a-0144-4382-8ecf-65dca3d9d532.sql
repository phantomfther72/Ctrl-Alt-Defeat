
-- predictions table
CREATE TABLE public.predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id text NOT NULL,
  shop_name text,
  month text NOT NULL,
  predicted_sales numeric NOT NULL DEFAULT 0,
  actual_sales numeric,
  predicted_returns numeric DEFAULT 0,
  actual_returns numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions readable by authenticated"
  ON public.predictions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Predictions insertable by authenticated"
  ON public.predictions FOR INSERT TO authenticated
  WITH CHECK (true);

-- monthly_summary table
CREATE TABLE public.monthly_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  total_sales numeric NOT NULL DEFAULT 0,
  total_returns numeric NOT NULL DEFAULT 0,
  sell_through_pct numeric DEFAULT 0,
  return_rate_pct numeric DEFAULT 0,
  revenue numeric DEFAULT 0,
  forecast_revenue numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Monthly summary readable by authenticated"
  ON public.monthly_summary FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Monthly summary insertable by authenticated"
  ON public.monthly_summary FOR INSERT TO authenticated
  WITH CHECK (true);

-- clean_data table
CREATE TABLE public.clean_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id text NOT NULL,
  shop_name text,
  month text NOT NULL,
  quantity_sold integer DEFAULT 0,
  quantity_returned integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clean_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clean data readable by authenticated"
  ON public.clean_data FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Clean data insertable by authenticated"
  ON public.clean_data FOR INSERT TO authenticated
  WITH CHECK (true);

-- model_metrics table
CREATE TABLE public.model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL DEFAULT 0,
  model_version text DEFAULT 'v1',
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Model metrics readable by authenticated"
  ON public.model_metrics FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Model metrics insertable by authenticated"
  ON public.model_metrics FOR INSERT TO authenticated
  WITH CHECK (true);
