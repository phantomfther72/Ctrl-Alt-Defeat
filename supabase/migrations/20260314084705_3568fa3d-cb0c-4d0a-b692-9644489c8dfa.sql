
-- Add scenario and confidence columns to forecast_data
ALTER TABLE public.forecast_data
  ADD COLUMN IF NOT EXISTS scenario text NOT NULL DEFAULT 'baseline',
  ADD COLUMN IF NOT EXISTS upper_bound integer,
  ADD COLUMN IF NOT EXISTS lower_bound integer,
  ADD COLUMN IF NOT EXISTS growth_rate numeric,
  ADD COLUMN IF NOT EXISTS generated_by text DEFAULT 'manual';

-- Allow update and delete for forecast management
CREATE POLICY "Authenticated can update forecast_data"
ON public.forecast_data FOR UPDATE TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete forecast_data"
ON public.forecast_data FOR DELETE TO authenticated
USING (true);
