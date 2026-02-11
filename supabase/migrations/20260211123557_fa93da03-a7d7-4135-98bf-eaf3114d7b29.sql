
-- =============================================
-- 1. EVENTOS ADVERSOS (Adverse Events / Incidents)
-- =============================================
CREATE TYPE public.event_severity AS ENUM ('leve', 'moderado', 'grave', 'sentinela');
CREATE TYPE public.event_type AS ENUM ('evento_adverso', 'near_miss', 'incidente', 'queixa_tecnica');
CREATE TYPE public.event_status AS ENUM ('notificado', 'em_investigacao', 'acao_corretiva', 'encerrado');

CREATE TABLE public.adverse_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type public.event_type NOT NULL DEFAULT 'evento_adverso',
  severity public.event_severity NOT NULL DEFAULT 'leve',
  status public.event_status NOT NULL DEFAULT 'notificado',
  event_date DATE NOT NULL,
  sector TEXT,
  location TEXT,
  patient_involved BOOLEAN NOT NULL DEFAULT false,
  patient_outcome TEXT,
  immediate_actions TEXT,
  reported_by TEXT NOT NULL,
  responsible_id UUID,
  capa_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.adverse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/analyst can manage adverse_events" ON public.adverse_events
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE TRIGGER update_adverse_events_updated_at
  BEFORE UPDATE ON public.adverse_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. CAPA (Corrective and Preventive Actions)
-- =============================================
CREATE TYPE public.capa_type AS ENUM ('corretiva', 'preventiva', 'melhoria');
CREATE TYPE public.capa_status AS ENUM ('identificacao', 'analise_causa', 'plano_acao', 'implementacao', 'verificacao_eficacia', 'encerrada');

CREATE TABLE public.capas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  capa_type public.capa_type NOT NULL DEFAULT 'corretiva',
  status public.capa_status NOT NULL DEFAULT 'identificacao',
  origin_type TEXT DEFAULT 'manual',
  origin_id UUID,
  origin_title TEXT,
  sector TEXT,
  root_cause_analysis TEXT,
  ishikawa_data JSONB,
  five_whys JSONB,
  corrective_action TEXT,
  preventive_action TEXT,
  verification_method TEXT,
  verification_date DATE,
  verification_result TEXT,
  is_effective BOOLEAN,
  responsible_id UUID,
  deadline DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.capas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/analyst can manage capas" ON public.capas
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE TRIGGER update_capas_updated_at
  BEFORE UPDATE ON public.capas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link adverse_events.capa_id to capas
ALTER TABLE public.adverse_events
  ADD CONSTRAINT adverse_events_capa_id_fkey FOREIGN KEY (capa_id) REFERENCES public.capas(id);

-- =============================================
-- 3. NOTIFICATIONS (system alerts)
-- =============================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  module TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- 4. COMPETENCY MATRIX
-- =============================================
CREATE TABLE public.competencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sector TEXT,
  required_for_roles TEXT[],
  related_training_ids UUID[],
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/analyst can manage competencies" ON public.competencies
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));

CREATE TRIGGER update_competencies_updated_at
  BEFORE UPDATE ON public.competencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.competency_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  sector TEXT,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  evaluated_by UUID NOT NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competency_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/analyst can manage evaluations" ON public.competency_evaluations
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'));
