-- =========================================================
-- 1. GRANULAR PERMISSIONS
-- =========================================================
ALTER TABLE public.user_group_access
  ADD COLUMN IF NOT EXISTS permission_actions text[] NOT NULL DEFAULT ARRAY['read']::text[];

UPDATE public.user_group_access SET permission_actions =
  CASE permission_level
    WHEN 'admin' THEN ARRAY['read','create','update','delete','approve','export']
    WHEN 'write' THEN ARRAY['read','create','update','export']
    ELSE ARRAY['read']
  END;

CREATE OR REPLACE FUNCTION public.has_action_permission(_user_id uuid, _sector text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1
      FROM user_group_access uga
      JOIN access_group_sectors ags ON ags.group_id = uga.group_id
      JOIN access_groups ag ON ag.id = uga.group_id
      WHERE uga.user_id = _user_id
        AND (_sector IS NULL OR ags.sector = _sector)
        AND ag.is_active = true
        AND (uga.expires_at IS NULL OR uga.expires_at > now())
        AND _action = ANY (uga.permission_actions)
    )
$$;

REVOKE EXECUTE ON FUNCTION public.has_action_permission(uuid, text, text) FROM anon;

CREATE OR REPLACE FUNCTION public.get_user_actions(_user_id uuid)
RETURNS TABLE(sector text, actions text[])
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ags.sector, uga.permission_actions
  FROM user_group_access uga
  JOIN access_group_sectors ags ON ags.group_id = uga.group_id
  JOIN access_groups ag ON ag.id = uga.group_id
  WHERE uga.user_id = _user_id
    AND ag.is_active = true
    AND (uga.expires_at IS NULL OR uga.expires_at > now())
$$;

REVOKE EXECUTE ON FUNCTION public.get_user_actions(uuid) FROM anon;

-- =========================================================
-- 2. GENERIC WORKFLOW ENGINE (document steps migration)
-- =========================================================
ALTER TABLE public.workflow_approval_requests
  ALTER COLUMN rule_id DROP NOT NULL,
  ALTER COLUMN step_id DROP NOT NULL;

ALTER TABLE public.workflow_approval_requests
  ADD COLUMN IF NOT EXISTS step_order integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS step_name text,
  ADD COLUMN IF NOT EXISTS step_type text NOT NULL DEFAULT 'approval',
  ADD COLUMN IF NOT EXISTS approver_role text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS due_at timestamptz;

INSERT INTO public.workflow_approval_requests
  (module, record_id, record_title, step_order, step_name, step_type, approver_role,
   assigned_to, status, requested_at, requested_by, decided_at, decided_by, decision_notes)
SELECT
  'quality_documents',
  s.document_id,
  d.title,
  s.step_order,
  s.step_name,
  s.step_type,
  s.assigned_role,
  s.assigned_to,
  CASE s.status WHEN 'aprovado' THEN 'approved' WHEN 'rejeitado' THEN 'rejected'
                WHEN 'pulado' THEN 'skipped' ELSE 'pending' END,
  s.created_at,
  NULL,
  s.completed_at,
  s.completed_by,
  s.comments
FROM public.document_workflow_steps s
LEFT JOIN public.quality_documents d ON d.id = s.document_id;

DROP TABLE public.document_workflow_steps;

CREATE INDEX IF NOT EXISTS idx_approval_requests_module_record
  ON public.workflow_approval_requests(module, record_id, step_order);

-- =========================================================
-- 3. SUPPLIER PORTAL TOKEN HARDENING
-- =========================================================
ALTER TABLE public.supplier_portal_tokens
  ADD COLUMN IF NOT EXISTS access_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_ip text,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE OR REPLACE FUNCTION public.enforce_supplier_token_expiry()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  max_expiry timestamptz := now() + interval '7 days';
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at > max_expiry THEN
    NEW.expires_at := max_expiry;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supplier_token_expiry ON public.supplier_portal_tokens;
CREATE TRIGGER trg_supplier_token_expiry
BEFORE INSERT ON public.supplier_portal_tokens
FOR EACH ROW EXECUTE FUNCTION public.enforce_supplier_token_expiry();

UPDATE public.supplier_portal_tokens
SET expires_at = LEAST(COALESCE(expires_at, now() + interval '7 days'), now() + interval '7 days')
WHERE is_active = true;

CREATE TABLE IF NOT EXISTS public.supplier_portal_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.supplier_portal_tokens(id) ON DELETE SET NULL,
  supplier_id uuid,
  token_prefix text,
  action text NOT NULL,
  success boolean NOT NULL DEFAULT true,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.supplier_portal_access_log TO authenticated;
GRANT ALL ON public.supplier_portal_access_log TO service_role;

ALTER TABLE public.supplier_portal_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read supplier portal access log"
  ON public.supplier_portal_access_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_portal_access_log_created
  ON public.supplier_portal_access_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_access_log_token
  ON public.supplier_portal_access_log(token_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.check_supplier_portal_rate_limit(_token_prefix text, _ip text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT count(*) FROM public.supplier_portal_access_log
    WHERE created_at > now() - interval '15 minutes'
      AND (token_prefix = _token_prefix OR ip_address = _ip)
  ), 0) < 20
$$;

REVOKE EXECUTE ON FUNCTION public.check_supplier_portal_rate_limit(text, text) FROM anon, authenticated;

-- =========================================================
-- 4. ICP-BRASIL CERTIFICATE SIGNATURES
-- =========================================================
ALTER TABLE public.document_signatures
  ADD COLUMN IF NOT EXISTS cert_subject text,
  ADD COLUMN IF NOT EXISTS cert_issuer text,
  ADD COLUMN IF NOT EXISTS cert_serial text,
  ADD COLUMN IF NOT EXISTS cert_cpf_cnpj text,
  ADD COLUMN IF NOT EXISTS cert_valid_from date,
  ADD COLUMN IF NOT EXISTS cert_valid_to date,
  ADD COLUMN IF NOT EXISTS cert_policy text,
  ADD COLUMN IF NOT EXISTS cert_file_url text;