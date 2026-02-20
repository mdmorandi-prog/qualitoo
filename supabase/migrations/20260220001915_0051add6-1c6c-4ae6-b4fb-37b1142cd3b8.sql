
-- ========================================
-- GAP 1: Checklist de Auditoria
-- ========================================
CREATE TABLE public.audit_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  standard TEXT DEFAULT 'ISO 9001',
  total_score NUMERIC DEFAULT 0,
  max_score NUMERIC DEFAULT 0,
  compliance_percentage NUMERIC DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID NOT NULL REFERENCES public.audit_checklists(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  clause TEXT,
  status TEXT NOT NULL DEFAULT 'nao_avaliado',
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 10,
  evidence_notes TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated SELECT audit_checklists" ON public.audit_checklists FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Analyst INSERT audit_checklists" ON public.audit_checklists FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/Analyst UPDATE audit_checklists" ON public.audit_checklists FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin DELETE audit_checklists" ON public.audit_checklists FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated SELECT audit_checklist_items" ON public.audit_checklist_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Analyst INSERT audit_checklist_items" ON public.audit_checklist_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/Analyst UPDATE audit_checklist_items" ON public.audit_checklist_items FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin DELETE audit_checklist_items" ON public.audit_checklist_items FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ========================================
-- GAP 2: Scoring de Fornecedores (critérios ponderados)
-- ========================================
CREATE TABLE public.supplier_scoring_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_scoring_criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated SELECT supplier_scoring_criteria" ON public.supplier_scoring_criteria FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin manage supplier_scoring_criteria" ON public.supplier_scoring_criteria FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default criteria
INSERT INTO public.supplier_scoring_criteria (name, description, weight) VALUES
  ('Qualidade', 'Qualidade dos produtos/serviços entregues', 0.30),
  ('Prazo de Entrega', 'Cumprimento dos prazos acordados', 0.25),
  ('Conformidade', 'Conformidade com requisitos e certificações', 0.20),
  ('Custo-Benefício', 'Relação custo-benefício e competitividade', 0.15),
  ('Atendimento', 'Qualidade do suporte e comunicação', 0.10);

-- Add classification column to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS classification TEXT DEFAULT 'C';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS weighted_score NUMERIC DEFAULT 0;

-- ========================================
-- GAP 3: Análise Crítica pela Direção (ISO 9.3)
-- ========================================
CREATE TABLE public.management_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  review_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'rascunho',
  participants TEXT,
  sector TEXT,
  -- Inputs ISO 9.3
  input_nc_summary TEXT,
  input_audit_results TEXT,
  input_indicator_performance TEXT,
  input_customer_feedback TEXT,
  input_risk_assessment TEXT,
  input_supplier_performance TEXT,
  input_previous_actions TEXT,
  input_changes TEXT,
  input_improvement_opportunities TEXT,
  -- Outputs
  output_decisions TEXT,
  output_resources TEXT,
  output_improvements TEXT,
  output_action_items TEXT,
  -- Auto-aggregated data (JSON snapshots)
  aggregated_data JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.management_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated SELECT management_reviews" ON public.management_reviews FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Analyst INSERT management_reviews" ON public.management_reviews FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/Analyst UPDATE management_reviews" ON public.management_reviews FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin DELETE management_reviews" ON public.management_reviews FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ========================================
-- GAP 4: BSC/SWOT Estratégico
-- ========================================
CREATE TABLE public.strategic_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'bsc',
  status TEXT NOT NULL DEFAULT 'ativo',
  period_start DATE,
  period_end DATE,
  sector TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.bsc_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.strategic_plans(id) ON DELETE CASCADE,
  perspective TEXT NOT NULL,
  objective TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT DEFAULT '%',
  indicator_id UUID REFERENCES public.quality_indicators(id),
  action_plan_id UUID REFERENCES public.action_plans(id),
  status TEXT DEFAULT 'em_andamento',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.swot_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.strategic_plans(id) ON DELETE CASCADE,
  quadrant TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'media',
  linked_action_plan_id UUID REFERENCES public.action_plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bsc_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swot_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated SELECT strategic_plans" ON public.strategic_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Analyst INSERT strategic_plans" ON public.strategic_plans FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/Analyst UPDATE strategic_plans" ON public.strategic_plans FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin DELETE strategic_plans" ON public.strategic_plans FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated SELECT bsc_objectives" ON public.bsc_objectives FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Analyst INSERT bsc_objectives" ON public.bsc_objectives FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/Analyst UPDATE bsc_objectives" ON public.bsc_objectives FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin DELETE bsc_objectives" ON public.bsc_objectives FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated SELECT swot_items" ON public.swot_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/Analyst INSERT swot_items" ON public.swot_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/Analyst UPDATE swot_items" ON public.swot_items FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin DELETE swot_items" ON public.swot_items FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ========================================
-- GAP 6: Portal do Fornecedor
-- ========================================
CREATE TABLE public.supplier_portal_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.supplier_portal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT DEFAULT 'certificado',
  file_url TEXT,
  status TEXT DEFAULT 'pendente',
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID
);

ALTER TABLE public.supplier_portal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_portal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage supplier_portal_tokens" ON public.supplier_portal_tokens FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin/Analyst SELECT supplier_portal_documents" ON public.supplier_portal_documents FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/Analyst manage supplier_portal_documents" ON public.supplier_portal_documents FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Insert supplier_portal_documents" ON public.supplier_portal_documents FOR INSERT WITH CHECK (true);

-- ========================================
-- GAP 7: Relatórios Agendados
-- ========================================
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'dashboard',
  frequency TEXT NOT NULL DEFAULT 'semanal',
  recipients TEXT[] DEFAULT '{}',
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  include_modules TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage scheduled_reports" ON public.scheduled_reports FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated SELECT scheduled_reports" ON public.scheduled_reports FOR SELECT USING (auth.uid() IS NOT NULL);

-- Storage bucket for audit evidence
INSERT INTO storage.buckets (id, name, public) VALUES ('audit-evidence', 'audit-evidence', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Auth users upload audit evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audit-evidence' AND auth.uid() IS NOT NULL);
CREATE POLICY "Auth users view audit evidence" ON storage.objects FOR SELECT USING (bucket_id = 'audit-evidence' AND auth.uid() IS NOT NULL);

-- Storage bucket for supplier portal docs
INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-docs', 'supplier-docs', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Anyone can upload supplier docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'supplier-docs');
CREATE POLICY "Auth users view supplier docs" ON storage.objects FOR SELECT USING (bucket_id = 'supplier-docs' AND auth.uid() IS NOT NULL);
