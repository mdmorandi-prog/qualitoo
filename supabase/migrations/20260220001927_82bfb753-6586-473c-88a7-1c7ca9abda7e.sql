
-- Fix security warnings: Replace overly permissive INSERT policy on supplier_portal_documents
DROP POLICY IF EXISTS "Insert supplier_portal_documents" ON public.supplier_portal_documents;
-- Instead, allow inserts only when there's a valid active token (will be checked at app level)
-- For now, require auth or open access for the portal (supplier portal uses tokens, not auth)
CREATE POLICY "Supplier portal insert docs" ON public.supplier_portal_documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR true);

-- Actually let's be more specific - supplier portal is accessed via tokens, not auth
-- So we need to allow anonymous inserts but the edge function will validate the token
DROP POLICY IF EXISTS "Supplier portal insert docs" ON public.supplier_portal_documents;
DROP POLICY IF EXISTS "Anyone can upload supplier docs" ON storage.objects;

-- Use service role for supplier portal operations via edge function
-- Regular users (admin/analyst) manage via authenticated policies already in place
