
-- Add 'descartado' status
ALTER TYPE doc_status ADD VALUE IF NOT EXISTS 'descartado';

-- Retention fields on quality_documents
ALTER TABLE public.quality_documents
  ADD COLUMN IF NOT EXISTS retention_period_months integer,
  ADD COLUMN IF NOT EXISTS retention_basis text,
  ADD COLUMN IF NOT EXISTS retention_start_date date,
  ADD COLUMN IF NOT EXISTS disposal_eligible_at date,
  ADD COLUMN IF NOT EXISTS legal_hold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS legal_hold_reason text,
  ADD COLUMN IF NOT EXISTS disposed_at timestamptz,
  ADD COLUMN IF NOT EXISTS disposed_by uuid,
  ADD COLUMN IF NOT EXISTS disposal_reason text,
  ADD COLUMN IF NOT EXISTS disposal_method text;

-- Auto-calc disposal_eligible_at
CREATE OR REPLACE FUNCTION public.calc_disposal_eligible_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.retention_period_months IS NOT NULL THEN
    NEW.disposal_eligible_at := COALESCE(NEW.retention_start_date, CURRENT_DATE)
      + (NEW.retention_period_months || ' months')::interval;
  ELSE
    NEW.disposal_eligible_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_calc_disposal_eligible ON public.quality_documents;
CREATE TRIGGER trg_calc_disposal_eligible
  BEFORE INSERT OR UPDATE OF retention_period_months, retention_start_date
  ON public.quality_documents
  FOR EACH ROW EXECUTE FUNCTION public.calc_disposal_eligible_at();

-- Immutable disposal log
CREATE TABLE IF NOT EXISTS public.document_disposal_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.quality_documents(id) ON DELETE CASCADE,
  action text NOT NULL, -- 'retention_defined' | 'legal_hold_applied' | 'legal_hold_released' | 'disposal_authorized' | 'disposed'
  performed_by uuid NOT NULL,
  reason text,
  method text,
  retention_snapshot jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.document_disposal_log TO authenticated;
GRANT ALL ON public.document_disposal_log TO service_role;

ALTER TABLE public.document_disposal_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/analyst can view disposal log"
  ON public.document_disposal_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

CREATE POLICY "Authenticated can insert own disposal actions"
  ON public.document_disposal_log FOR INSERT
  WITH CHECK (auth.uid() = performed_by);

-- Prevent updates/deletes (immutability)
CREATE OR REPLACE FUNCTION public.prevent_disposal_log_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'document_disposal_log is immutable';
END;
$$;

DROP TRIGGER IF EXISTS trg_disposal_log_no_update ON public.document_disposal_log;
CREATE TRIGGER trg_disposal_log_no_update
  BEFORE UPDATE OR DELETE ON public.document_disposal_log
  FOR EACH ROW EXECUTE FUNCTION public.prevent_disposal_log_change();

CREATE INDEX IF NOT EXISTS idx_disposal_log_doc ON public.document_disposal_log(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qd_disposal_eligible ON public.quality_documents(disposal_eligible_at) WHERE disposed_at IS NULL;
