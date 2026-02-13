
-- 1. Document read confirmations
CREATE TABLE public.document_read_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.quality_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);
ALTER TABLE public.document_read_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all confirmations" ON public.document_read_confirmations FOR SELECT USING (true);
CREATE POLICY "Users can insert own confirmations" ON public.document_read_confirmations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Document access history
CREATE TABLE public.document_access_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.quality_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL DEFAULT 'view',
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.document_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all access logs" ON public.document_access_log FOR SELECT USING (true);
CREATE POLICY "Users can insert own access logs" ON public.document_access_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. FMEA table
CREATE TABLE public.fmea_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  process TEXT,
  sector TEXT,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fmea_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage fmea" ON public.fmea_analyses FOR ALL USING (auth.uid() IS NOT NULL);

CREATE TABLE public.fmea_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fmea_id UUID NOT NULL REFERENCES public.fmea_analyses(id) ON DELETE CASCADE,
  failure_mode TEXT NOT NULL,
  effect TEXT,
  cause TEXT,
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity BETWEEN 1 AND 10),
  occurrence INTEGER NOT NULL DEFAULT 1 CHECK (occurrence BETWEEN 1 AND 10),
  detection INTEGER NOT NULL DEFAULT 1 CHECK (detection BETWEEN 1 AND 10),
  rpn INTEGER GENERATED ALWAYS AS (severity * occurrence * detection) STORED,
  current_controls TEXT,
  recommended_action TEXT,
  responsible TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fmea_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage fmea_items" ON public.fmea_items FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Dashboard sharing - add shared_with column
ALTER TABLE public.user_dashboard_configs ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.user_dashboard_configs ADD COLUMN IF NOT EXISTS shared_with_roles TEXT[] DEFAULT '{}';

-- 5. LGPD data mapping
CREATE TABLE public.lgpd_data_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_category TEXT NOT NULL,
  data_type TEXT NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  retention_period TEXT,
  storage_location TEXT,
  responsible TEXT,
  sector TEXT,
  is_sensitive BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ativo',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.lgpd_data_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage lgpd" ON public.lgpd_data_mappings FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. NC custom form fields
CREATE TABLE public.nc_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nc_type TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT false,
  options TEXT[],
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.nc_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view nc_custom_fields" ON public.nc_custom_fields FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage nc_custom_fields" ON public.nc_custom_fields FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 7. Composite indicators
ALTER TABLE public.quality_indicators ADD COLUMN IF NOT EXISTS formula TEXT;
ALTER TABLE public.quality_indicators ADD COLUMN IF NOT EXISTS source_indicator_ids UUID[];
ALTER TABLE public.quality_indicators ADD COLUMN IF NOT EXISTS is_composite BOOLEAN NOT NULL DEFAULT false;

-- Triggers for updated_at
CREATE TRIGGER update_fmea_analyses_updated_at BEFORE UPDATE ON public.fmea_analyses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lgpd_data_mappings_updated_at BEFORE UPDATE ON public.lgpd_data_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
