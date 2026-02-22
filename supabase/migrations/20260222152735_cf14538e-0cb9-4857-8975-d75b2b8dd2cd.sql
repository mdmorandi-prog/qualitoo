-- Fix: Remove anonymous upload policy on supplier-docs bucket
DROP POLICY IF EXISTS "Anyone can upload supplier docs" ON storage.objects;

-- Replace with authenticated-only upload policy
CREATE POLICY "Authenticated users can upload supplier docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'supplier-docs');
