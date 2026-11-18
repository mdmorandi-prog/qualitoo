CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('access_groups','Authenticated users can view active groups'),
    ('document_templates','Authenticated users can view templates'),
    ('fmea_items','Users can delete fmea_items'),
    ('strategic_plans','Authenticated SELECT strategic_plans'),
    ('management_reviews','Authenticated SELECT management_reviews'),
    ('audit_checklists','Authenticated SELECT audit_checklists'),
    ('document_workflow_templates','Authenticated users can view workflow templates'),
    ('workflow_rules','Authenticated can view workflow rules'),
    ('project_tasks','Authenticated users can delete project tasks'),
    ('scheduled_reports','Authenticated SELECT scheduled_reports'),
    ('regulatory_submissions','Authenticated can view submissions'),
    ('ona_compliance_evidence','Users can view all evidence')
  ) v(t,p) LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated USING (public.is_staff(auth.uid()))', r.p, r.t);
  END LOOP;

  FOR r IN SELECT * FROM (VALUES
    ('workflow_approval_requests','Authenticated can update approval requests'),
    ('bpmn_process_instances','Authenticated users can update instances'),
    ('supplier_evaluations','Authenticated users can update supplier evaluations')
  ) v(t,p) LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()))', r.p, r.t);
  END LOOP;

  FOR r IN SELECT * FROM (VALUES
    ('meeting_minutes','Authenticated users can create meeting minutes'),
    ('risks','Authenticated users can create risks'),
    ('document_versions','Users can insert document versions'),
    ('calibrations','Authenticated users can insert calibrations'),
    ('satisfaction_surveys','Authenticated users can create surveys'),
    ('trainings','Authenticated users can create trainings'),
    ('suppliers','Authenticated users can create suppliers'),
    ('ona_compliance_evidence','Users can insert evidence')
  ) v(t,p) LOOP
    EXECUTE format('ALTER POLICY %I ON public.%I TO authenticated WITH CHECK (public.is_staff(auth.uid()))', r.p, r.t);
  END LOOP;
END $$;

ALTER POLICY "Auth users view audit evidence" ON storage.objects TO authenticated
  USING (bucket_id = 'audit-evidence' AND public.is_staff(auth.uid()));
ALTER POLICY "Users with supplier access can view supplier docs" ON storage.objects TO authenticated
  USING (bucket_id = 'supplier-docs' AND public.is_staff(auth.uid()) AND (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.supplier_portal_documents spd WHERE spd.file_url = objects.name OR spd.file_url = 'supplier-docs/' || objects.name)));