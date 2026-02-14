-- Fix: Minimize data exposed by lookup_report_by_protocol
DROP FUNCTION IF EXISTS public.lookup_report_by_protocol(text);

CREATE FUNCTION public.lookup_report_by_protocol(p_protocol TEXT)
RETURNS TABLE (protocol TEXT, status report_status)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT r.protocol, r.status
  FROM public.reports r
  WHERE r.protocol = p_protocol
$$;