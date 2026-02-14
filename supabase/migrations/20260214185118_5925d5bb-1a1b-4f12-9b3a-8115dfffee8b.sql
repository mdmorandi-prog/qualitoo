
-- Fix 1: Restrict document_access_log and document_read_confirmations to admin/analyst
DROP POLICY IF EXISTS "Users can view all access logs" ON public.document_access_log;
DROP POLICY IF EXISTS "Users can view all confirmations" ON public.document_read_confirmations;

CREATE POLICY "Admin/analyst can view access logs" 
ON public.document_access_log 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

CREATE POLICY "Admin/analyst can view confirmations" 
ON public.document_read_confirmations 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));

-- Fix 2: Add minimum description length constraint for reports to prevent spam
ALTER TABLE public.reports ADD CONSTRAINT reports_description_min_length 
  CHECK (length(trim(description)) > 10);

-- Also add minimum location length
ALTER TABLE public.reports ADD CONSTRAINT reports_location_min_length 
  CHECK (length(trim(location)) > 2);
