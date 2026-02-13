
-- ============================================================
-- 1. GESTÃO DE FORNECEDORES
-- ============================================================

-- Enum para criticidade do fornecedor
CREATE TYPE public.supplier_criticality AS ENUM ('baixa', 'media', 'alta', 'critica');

-- Enum para status do fornecedor
CREATE TYPE public.supplier_status AS ENUM ('ativo', 'inativo', 'em_avaliacao', 'bloqueado');

-- Tabela principal de fornecedores
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT NULL,
  category TEXT NULL,
  contact_name TEXT NULL,
  contact_email TEXT NULL,
  contact_phone TEXT NULL,
  address TEXT NULL,
  criticality supplier_criticality NOT NULL DEFAULT 'media',
  status supplier_status NOT NULL DEFAULT 'ativo',
  qualification_date DATE NULL,
  next_evaluation_date DATE NULL,
  notes TEXT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view suppliers"
ON public.suppliers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update suppliers"
ON public.suppliers FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete suppliers"
ON public.suppliers FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de avaliações de fornecedores
CREATE TABLE public.supplier_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quality_score INTEGER NOT NULL DEFAULT 5 CHECK (quality_score >= 1 AND quality_score <= 10),
  delivery_score INTEGER NOT NULL DEFAULT 5 CHECK (delivery_score >= 1 AND delivery_score <= 10),
  compliance_score INTEGER NOT NULL DEFAULT 5 CHECK (compliance_score >= 1 AND compliance_score <= 10),
  cost_score INTEGER NOT NULL DEFAULT 5 CHECK (cost_score >= 1 AND cost_score <= 10),
  overall_score NUMERIC GENERATED ALWAYS AS ((quality_score + delivery_score + compliance_score + cost_score) / 4.0) STORED,
  notes TEXT NULL,
  evaluated_by UUID NOT NULL,
  non_conformities_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supplier evaluations"
ON public.supplier_evaluations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create supplier evaluations"
ON public.supplier_evaluations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update supplier evaluations"
ON public.supplier_evaluations FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Trigger de updated_at para suppliers
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. PESQUISA DE SATISFAÇÃO
-- ============================================================

CREATE TYPE public.survey_type AS ENUM ('nps', 'csat', 'custom');
CREATE TYPE public.survey_status AS ENUM ('rascunho', 'ativa', 'encerrada');

CREATE TABLE public.satisfaction_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NULL,
  survey_type survey_type NOT NULL DEFAULT 'nps',
  status survey_status NOT NULL DEFAULT 'rascunho',
  sector TEXT NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  questions JSONB NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view surveys"
ON public.satisfaction_surveys FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create surveys"
ON public.satisfaction_surveys FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update surveys"
ON public.satisfaction_surveys FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete surveys"
ON public.satisfaction_surveys FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON public.satisfaction_surveys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Respostas das pesquisas (acesso público para respondentes)
CREATE TABLE public.survey_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  survey_id UUID NOT NULL REFERENCES public.satisfaction_surveys(id) ON DELETE CASCADE,
  respondent_name TEXT NULL,
  respondent_sector TEXT NULL,
  score INTEGER NULL,
  answers JSONB NULL DEFAULT '{}'::jsonb,
  comments TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Respostas podem ser inseridas por qualquer um (pesquisa anônima)
CREATE POLICY "Anyone can submit survey responses"
ON public.survey_responses FOR INSERT
WITH CHECK (true);

-- Apenas autenticados podem ver resultados
CREATE POLICY "Authenticated users can view survey responses"
ON public.survey_responses FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================================
-- 3. RELATÓRIOS REGULATÓRIOS - Tabela de logs de exportação
-- ============================================================

CREATE TABLE public.regulatory_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type TEXT NOT NULL DEFAULT 'notivisa',
  title TEXT NOT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  records_count INTEGER NOT NULL DEFAULT 0,
  exported_data JSONB NULL,
  generated_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.regulatory_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/analyst can manage regulatory reports"
ON public.regulatory_reports FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'analyst'::app_role));

-- ============================================================
-- 4. NOTIFICAÇÕES POR E-MAIL - Tabela de fila de e-mails
-- ============================================================

CREATE TABLE public.email_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_user_id UUID NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can manage email queue"
ON public.email_queue FOR ALL
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));
