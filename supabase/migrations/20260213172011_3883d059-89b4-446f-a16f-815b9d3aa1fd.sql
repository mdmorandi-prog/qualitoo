
-- =============================================
-- 3.2 Metrologia / Calibração
-- =============================================
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tag_number TEXT,
  serial_number TEXT,
  manufacturer TEXT,
  model TEXT,
  sector TEXT,
  location TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'ativo',
  acquisition_date DATE,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view equipment" ON public.equipment FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert equipment" ON public.equipment FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update equipment" ON public.equipment FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete equipment" ON public.equipment FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.calibrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  calibration_date DATE NOT NULL,
  next_calibration_date DATE,
  performed_by TEXT,
  certificate_number TEXT,
  certificate_url TEXT,
  result TEXT NOT NULL DEFAULT 'aprovado',
  deviation TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calibrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view calibrations" ON public.calibrations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert calibrations" ON public.calibrations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update calibrations" ON public.calibrations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete calibrations" ON public.calibrations FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_calibrations_updated_at BEFORE UPDATE ON public.calibrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3.3 Gestão de Mudanças
-- =============================================
CREATE TABLE public.change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  justification TEXT,
  impact_analysis TEXT,
  affected_processes TEXT,
  affected_documents TEXT,
  risk_assessment TEXT,
  sector TEXT,
  priority TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'rascunho',
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view change_requests" ON public.change_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert change_requests" ON public.change_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update change_requests" ON public.change_requests FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete change_requests" ON public.change_requests FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON public.change_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
