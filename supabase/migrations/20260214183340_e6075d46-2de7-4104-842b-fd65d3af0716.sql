
-- Fix 1: Make documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Fix 2: Drop overly permissive SELECT policy and replace with authenticated-only
DROP POLICY IF EXISTS "Anyone can view documents" ON storage.objects;

CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
