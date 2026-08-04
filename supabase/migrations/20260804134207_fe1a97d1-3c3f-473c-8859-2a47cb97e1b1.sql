-- Vigilance classification + ANVISA fields on adverse_events
ALTER TABLE public.adverse_events
  ADD COLUMN IF NOT EXISTS vigilance_class text NOT NULL DEFAULT 'assistencial',
  ADD COLUMN IF NOT EXISTS patient_initials text,
  ADD COLUMN IF NOT EXISTS patient_birth_date date,
  ADD COLUMN IF NOT EXISTS patient_gender text,
  ADD COLUMN IF NOT EXISTS patient_weight_kg numeric,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS product_active_ingredient text,
  ADD COLUMN IF NOT EXISTS product_batch text,
  ADD COLUMN IF NOT EXISTS product_registry text,
  ADD COLUMN IF NOT EXISTS product_manufacturer text,
  ADD COLUMN IF NOT EXISTS product_expiry_date date,
  ADD COLUMN IF NOT EXISTS product_model text,
  ADD COLUMN IF NOT EXISTS product_serial text,
  ADD COLUMN IF NOT EXISTS drug_dose text,
  ADD COLUMN IF NOT EXISTS drug_route text,
  ADD COLUMN IF NOT EXISTS drug_indication text,
  ADD COLUMN IF NOT EXISTS reaction_outcome text,
  ADD COLUMN IF NOT EXISTS causality text;

CREATE INDEX IF NOT EXISTS idx_adverse_events_vigilance_class ON public.adverse_events(vigilance_class);

-- Submission log
CREATE TABLE IF NOT EXISTS public.regulatory_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.regulatory_reports(id) ON DELETE SET NULL,
  report_type text NOT NULL,
  format text NOT NULL DEFAULT 'xml',
  period_start date,
  period_end date,
  records_count integer NOT NULL DEFAULT 0,
  validation_status text NOT NULL DEFAULT 'pendente',
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  validation_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  submission_status text NOT NULL DEFAULT 'gerado',
  protocol text,
  file_name text,
  notes text,
  submitted_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.regulatory_submissions TO authenticated;
GRANT ALL ON public.regulatory_submissions TO service_role;

ALTER TABLE public.regulatory_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view submissions"
  ON public.regulatory_submissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can create submissions"
  ON public.regulatory_submissions FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());

CREATE POLICY "Admins can update submissions"
  ON public.regulatory_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete submissions"
  ON public.regulatory_submissions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_regulatory_submissions_updated_at
  BEFORE UPDATE ON public.regulatory_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();