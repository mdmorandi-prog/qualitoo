
CREATE OR REPLACE FUNCTION public.get_user_actions(_user_id uuid)
RETURNS TABLE(sector text, actions text[])
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ags.sector,
         COALESCE(
           uga.permission_actions,
           CASE uga.permission_level
             WHEN 'admin' THEN ARRAY['read','create','update','delete','approve','export']
             WHEN 'write' THEN ARRAY['read','create','update','export']
             ELSE ARRAY['read']
           END
         )::text[] AS actions
  FROM user_group_access uga
  JOIN access_group_sectors ags ON ags.group_id = uga.group_id
  JOIN access_groups ag ON ag.id = uga.group_id
  WHERE uga.user_id = _user_id
    AND ag.is_active = true
    AND (uga.expires_at IS NULL OR uga.expires_at > now())
$$;

REVOKE ALL ON FUNCTION public.get_user_actions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_actions(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_action_permission(_user_id uuid, _sector text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(_user_id, 'admin')
      OR EXISTS (
        SELECT 1 FROM public.get_user_actions(_user_id) ua
        WHERE ua.sector = _sector AND _action = ANY(ua.actions)
      )
$$;

REVOKE ALL ON FUNCTION public.has_action_permission(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_action_permission(uuid, text, text) TO authenticated, service_role;

CREATE TABLE IF NOT EXISTS public.supplier_portal_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid REFERENCES public.supplier_portal_tokens(id) ON DELETE CASCADE,
  supplier_id uuid,
  action text NOT NULL,
  ip_address text,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.supplier_portal_access_log TO authenticated;
GRANT ALL ON public.supplier_portal_access_log TO service_role;

ALTER TABLE public.supplier_portal_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view supplier portal access log"
ON public.supplier_portal_access_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_supplier_portal_access_log_token
ON public.supplier_portal_access_log(token_id, created_at DESC);
