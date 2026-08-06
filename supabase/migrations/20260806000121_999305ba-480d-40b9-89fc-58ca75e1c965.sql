
-- Drop function to allow return type change
DROP FUNCTION IF EXISTS public.lookup_lgpd_request(text);

-- Recreate lookup_lgpd_request with restricted return columns
CREATE OR REPLACE FUNCTION public.lookup_lgpd_request(p_protocol text)
RETURNS TABLE(
  protocol text,
  status public.lgpd_request_status,
  created_at timestamptz,
  due_date date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT protocol, status, created_at, due_date
  FROM public.lgpd_requests
  WHERE protocol = p_protocol
  LIMIT 1;
$$;

-- Ensure get_user_actions (which already had correct logic in a recent migration) 
-- has correct grants and is explicitly set to authenticated only.
REVOKE EXECUTE ON FUNCTION public.get_user_actions(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_user_actions(uuid) TO authenticated, service_role;

-- Grants for lookup_lgpd_request
REVOKE EXECUTE ON FUNCTION public.lookup_lgpd_request(text) FROM public;
GRANT EXECUTE ON FUNCTION public.lookup_lgpd_request(text) TO authenticated, service_role, anon;
