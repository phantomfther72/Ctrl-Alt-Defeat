
-- Allow service role (via edge function) to delete from these tables
-- We need delete policies for clean_data, monthly_summary, predictions, model_metrics
CREATE POLICY "Allow authenticated delete on clean_data"
ON public.clean_data FOR DELETE TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on monthly_summary"
ON public.monthly_summary FOR DELETE TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on predictions"
ON public.predictions FOR DELETE TO authenticated
USING (true);

CREATE POLICY "Allow authenticated delete on model_metrics"
ON public.model_metrics FOR DELETE TO authenticated
USING (true);
