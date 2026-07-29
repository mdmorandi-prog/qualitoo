-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.lgpd_request_type AS ENUM ('acesso','correcao','exclusao','portabilidade','revogacao_consentimento','anonimizacao','informacao_compartilhamento','oposicao');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lgpd_request_status AS ENUM ('recebida','em_analise','aguardando_titular','concluida','recusada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lgpd_incident_risk AS ENUM ('baixo','medio','alto','critico');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ 1. SOLICITAÇÕES DE TITULARES ============
CREATE TABLE IF NOT EXISTS public.lgpd_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol text NOT NULL UNIQUE DEFAULT ('LGPD-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6))),
  request_type public.lgpd_request_type NOT NULL,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  requester_document text,
  requester_phone text,
  relationship text,
  description text NOT NULL,
  status public.lgpd_request_status NOT NULL DEFAULT 'recebida',
  due_date date NOT NULL DEFAULT (CURRENT_DATE + 15),
  response text,
  responded_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.lgpd_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lgpd_requests TO authenticated;
GRANT ALL ON public.lgpd_requests TO service_role;

ALTER TABLE public.lgpd_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a data subject request"
  ON public.lgpd_requests FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Staff can view requests"
  ON public.lgpd_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'));

CREATE POLICY "Staff can update requests"
  ON public.lgpd_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'));

CREATE POLICY "Admins can delete requests"
  ON public.lgpd_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_lgpd_requests_updated_at
  BEFORE UPDATE ON public.lgpd_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- consulta pública somente por protocolo
CREATE OR REPLACE FUNCTION public.lookup_lgpd_request(p_protocol text)
RETURNS TABLE(protocol text, status public.lgpd_request_status, due_date date, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT r.protocol, r.status, r.due_date, r.created_at
  FROM public.lgpd_requests r
  WHERE r.protocol = p_protocol
$$;

REVOKE EXECUTE ON FUNCTION public.lookup_lgpd_request(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_lgpd_request(text) TO anon, authenticated;

-- ============ 2. CONSENTIMENTOS ============
CREATE TABLE IF NOT EXISTS public.lgpd_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name text NOT NULL,
  subject_document text,
  subject_email text,
  purpose text NOT NULL,
  legal_basis text,
  channel text,
  consent_text text,
  sector text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  evidence_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lgpd_consents TO authenticated;
GRANT ALL ON public.lgpd_consents TO service_role;

ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view consents"
  ON public.lgpd_consents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'));
CREATE POLICY "Staff can insert consents"
  ON public.lgpd_consents FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst')) AND created_by = auth.uid());
CREATE POLICY "Staff can update consents"
  ON public.lgpd_consents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'));
CREATE POLICY "Admins can delete consents"
  ON public.lgpd_consents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_lgpd_consents_updated_at
  BEFORE UPDATE ON public.lgpd_consents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. INCIDENTES DE DADOS ============
CREATE TABLE IF NOT EXISTS public.lgpd_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  occurred_at timestamptz,
  detected_at timestamptz NOT NULL DEFAULT now(),
  affected_data text,
  affected_subjects integer DEFAULT 0,
  risk public.lgpd_incident_risk NOT NULL DEFAULT 'medio',
  anpd_notified boolean NOT NULL DEFAULT false,
  anpd_notified_at timestamptz,
  subjects_notified boolean NOT NULL DEFAULT false,
  subjects_notified_at timestamptz,
  containment_measures text,
  corrective_measures text,
  sector text,
  responsible text,
  status text NOT NULL DEFAULT 'aberto',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lgpd_incidents TO authenticated;
GRANT ALL ON public.lgpd_incidents TO service_role;

ALTER TABLE public.lgpd_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view lgpd incidents"
  ON public.lgpd_incidents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'));
CREATE POLICY "Staff can insert lgpd incidents"
  ON public.lgpd_incidents FOR INSERT TO authenticated
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst')) AND created_by = auth.uid());
CREATE POLICY "Staff can update lgpd incidents"
  ON public.lgpd_incidents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'analyst'));
CREATE POLICY "Admins can delete lgpd incidents"
  ON public.lgpd_incidents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_lgpd_incidents_updated_at
  BEFORE UPDATE ON public.lgpd_incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();