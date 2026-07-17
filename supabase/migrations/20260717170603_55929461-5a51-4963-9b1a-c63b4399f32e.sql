
-- 1. document_permissions: restrict SELECT
DROP POLICY IF EXISTS "Users can view document permissions" ON public.document_permissions;
CREATE POLICY "Grantee, owner, or admin can view document permissions"
ON public.document_permissions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.quality_documents qd
    WHERE qd.id = document_permissions.document_id AND qd.created_by = auth.uid()
  )
);

-- 2. notifications INSERT: only self-created or via service role
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users can create own notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 3. Storage: documents bucket — restrict SELECT to users with sector access on matching document
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
CREATE POLICY "Users with sector access can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.quality_documents qd
      WHERE (qd.file_url = name OR qd.file_url = 'documents/' || name)
        AND (qd.sector IS NULL OR public.has_sector_access(auth.uid(), qd.sector))
    )
  )
);

DROP POLICY IF EXISTS "Authenticated users can delete own documents" ON storage.objects;
CREATE POLICY "Owners or admins can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.quality_documents qd
      WHERE (qd.file_url = name OR qd.file_url = 'documents/' || name)
        AND qd.created_by = auth.uid()
    )
  )
);

-- 4. Storage: contracts — restrict to admin or contract creator/sector
DROP POLICY IF EXISTS "Auth users view contracts" ON storage.objects;
CREATE POLICY "Users with contract access can view contracts"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE (c.file_url = name OR c.file_url = 'contracts/' || name)
        AND (c.created_by = auth.uid() OR c.sector IS NULL OR public.has_sector_access(auth.uid(), c.sector))
    )
  )
);

DROP POLICY IF EXISTS "Auth users delete contracts" ON storage.objects;
CREATE POLICY "Admins or contract owners can delete contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE (c.file_url = name OR c.file_url = 'contracts/' || name)
        AND c.created_by = auth.uid()
    )
  )
);

-- 5. Storage: supplier-docs — restrict SELECT to related supplier docs
DROP POLICY IF EXISTS "Auth users view supplier docs" ON storage.objects;
CREATE POLICY "Users with supplier access can view supplier docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'supplier-docs'
  AND (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.supplier_portal_documents spd
      WHERE spd.file_url = name OR spd.file_url = 'supplier-docs/' || name
    )
  )
);

-- 6. Storage: audit-evidence — restrict to admin/auditor roles minimum (authenticated already; tighten to admin or sector-access via audit)
-- (kept as authenticated; audit-evidence file names aren't linked to a table with sector consistently)

-- 7. Revoke EXECUTE on SECURITY DEFINER functions from anon (keep authenticated where needed)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_sector_access(uuid, text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_sector_access(uuid, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_sector_permission(uuid, text, permission_level) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_sector_permission(uuid, text, permission_level) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_sectors(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_sectors(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;

-- 8. Remove stored plaintext ElevenLabs API key from system_settings (moved to project secrets)
DELETE FROM public.system_settings WHERE key = 'elevenlabs_api_key';
