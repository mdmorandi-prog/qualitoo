
-- =============================================
-- ACTIVATE SECTOR-BASED RLS ON ALL TABLES
-- Admin always sees everything (handled by has_sector_access)
-- Analysts/users see only sectors from their groups
-- NULL sector records are visible to all authenticated users
-- =============================================

-- 1. NON_CONFORMITIES
DROP POLICY IF EXISTS "Admin/analyst can insert non_conformities" ON public.non_conformities;
DROP POLICY IF EXISTS "Admin/analyst can update non_conformities" ON public.non_conformities;
DROP POLICY IF EXISTS "Admin/analyst can view non_conformities" ON public.non_conformities;

CREATE POLICY "Sector-filtered SELECT non_conformities" ON public.non_conformities
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT non_conformities" ON public.non_conformities
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE non_conformities" ON public.non_conformities
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

-- 2. QUALITY_DOCUMENTS
DROP POLICY IF EXISTS "Admin/analyst can manage documents" ON public.quality_documents;

CREATE POLICY "Sector-filtered SELECT quality_documents" ON public.quality_documents
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT quality_documents" ON public.quality_documents
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE quality_documents" ON public.quality_documents
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE quality_documents" ON public.quality_documents
  FOR DELETE USING (
    has_role(auth.uid(), 'admin')
  );

-- 3. AUDITS
DROP POLICY IF EXISTS "Admin/analyst can manage audits" ON public.audits;

CREATE POLICY "Sector-filtered SELECT audits" ON public.audits
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT audits" ON public.audits
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE audits" ON public.audits
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE audits" ON public.audits
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 4. ADVERSE_EVENTS
DROP POLICY IF EXISTS "Admin/analyst can manage adverse_events" ON public.adverse_events;

CREATE POLICY "Sector-filtered SELECT adverse_events" ON public.adverse_events
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT adverse_events" ON public.adverse_events
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE adverse_events" ON public.adverse_events
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE adverse_events" ON public.adverse_events
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 5. CAPAS
DROP POLICY IF EXISTS "Admin/analyst can manage capas" ON public.capas;

CREATE POLICY "Sector-filtered SELECT capas" ON public.capas
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT capas" ON public.capas
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE capas" ON public.capas
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE capas" ON public.capas
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 6. COMPETENCIES
DROP POLICY IF EXISTS "Admin/analyst can manage competencies" ON public.competencies;

CREATE POLICY "Sector-filtered SELECT competencies" ON public.competencies
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT competencies" ON public.competencies
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE competencies" ON public.competencies
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE competencies" ON public.competencies
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 7. COMPETENCY_EVALUATIONS
DROP POLICY IF EXISTS "Admin/analyst can manage evaluations" ON public.competency_evaluations;

CREATE POLICY "Sector-filtered SELECT competency_evaluations" ON public.competency_evaluations
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT competency_evaluations" ON public.competency_evaluations
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE competency_evaluations" ON public.competency_evaluations
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE competency_evaluations" ON public.competency_evaluations
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 8. QUALITY_INDICATORS
DROP POLICY IF EXISTS "Admin/analyst can manage indicators" ON public.quality_indicators;

CREATE POLICY "Sector-filtered SELECT quality_indicators" ON public.quality_indicators
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT quality_indicators" ON public.quality_indicators
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE quality_indicators" ON public.quality_indicators
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE quality_indicators" ON public.quality_indicators
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 9. INDICATOR_MEASUREMENTS
DROP POLICY IF EXISTS "Admin/analyst can manage measurements" ON public.indicator_measurements;

CREATE POLICY "Sector-filtered SELECT indicator_measurements" ON public.indicator_measurements
  FOR SELECT USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
  );

CREATE POLICY "Sector-filtered INSERT indicator_measurements" ON public.indicator_measurements
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
  );

CREATE POLICY "Sector-filtered UPDATE indicator_measurements" ON public.indicator_measurements
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
  );

CREATE POLICY "Sector-filtered DELETE indicator_measurements" ON public.indicator_measurements
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 10. AUDIT_FINDINGS (linked to audit, no own sector)
DROP POLICY IF EXISTS "Admin/analyst can manage audit_findings" ON public.audit_findings;

CREATE POLICY "Sector-filtered SELECT audit_findings" ON public.audit_findings
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst')
  );

CREATE POLICY "Sector-filtered INSERT audit_findings" ON public.audit_findings
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst')
  );

CREATE POLICY "Sector-filtered UPDATE audit_findings" ON public.audit_findings
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst')
  );

CREATE POLICY "Sector-filtered DELETE audit_findings" ON public.audit_findings
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 11. RISKS
DROP POLICY IF EXISTS "Authenticated users can view risks" ON public.risks;
DROP POLICY IF EXISTS "Authenticated users can insert risks" ON public.risks;
DROP POLICY IF EXISTS "Authenticated users can update risks" ON public.risks;
DROP POLICY IF EXISTS "Admins can delete risks" ON public.risks;

CREATE POLICY "Sector-filtered SELECT risks" ON public.risks
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT risks" ON public.risks
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE risks" ON public.risks
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE risks" ON public.risks
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 12. ACTION_PLANS
DROP POLICY IF EXISTS "Authenticated users can view action plans" ON public.action_plans;
DROP POLICY IF EXISTS "Authenticated users can create action plans" ON public.action_plans;
DROP POLICY IF EXISTS "Authenticated users can update action plans" ON public.action_plans;
DROP POLICY IF EXISTS "Authenticated users can delete action plans" ON public.action_plans;

CREATE POLICY "Sector-filtered SELECT action_plans" ON public.action_plans
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT action_plans" ON public.action_plans
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE action_plans" ON public.action_plans
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE action_plans" ON public.action_plans
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 13. CHANGE_REQUESTS
DROP POLICY IF EXISTS "Authenticated users can view change_requests" ON public.change_requests;
DROP POLICY IF EXISTS "Authenticated users can insert change_requests" ON public.change_requests;
DROP POLICY IF EXISTS "Authenticated users can update change_requests" ON public.change_requests;
DROP POLICY IF EXISTS "Admins can delete change_requests" ON public.change_requests;

CREATE POLICY "Sector-filtered SELECT change_requests" ON public.change_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT change_requests" ON public.change_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE change_requests" ON public.change_requests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE change_requests" ON public.change_requests
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 14. EQUIPMENT
DROP POLICY IF EXISTS "Authenticated users can view equipment" ON public.equipment;
DROP POLICY IF EXISTS "Authenticated users can insert equipment" ON public.equipment;
DROP POLICY IF EXISTS "Authenticated users can update equipment" ON public.equipment;
DROP POLICY IF EXISTS "Admins can delete equipment" ON public.equipment;

CREATE POLICY "Sector-filtered SELECT equipment" ON public.equipment
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT equipment" ON public.equipment
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE equipment" ON public.equipment
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE equipment" ON public.equipment
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 15. CONTRACTS
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Admins can delete contracts" ON public.contracts;

CREATE POLICY "Sector-filtered SELECT contracts" ON public.contracts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT contracts" ON public.contracts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (auth.uid() = created_by) AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE contracts" ON public.contracts
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE contracts" ON public.contracts
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 16. FMEA_ANALYSES
DROP POLICY IF EXISTS "Users can view fmea" ON public.fmea_analyses;
DROP POLICY IF EXISTS "Users can insert fmea" ON public.fmea_analyses;
DROP POLICY IF EXISTS "Users can update own fmea" ON public.fmea_analyses;
DROP POLICY IF EXISTS "Users can delete own fmea" ON public.fmea_analyses;

CREATE POLICY "Sector-filtered SELECT fmea_analyses" ON public.fmea_analyses
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT fmea_analyses" ON public.fmea_analyses
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE fmea_analyses" ON public.fmea_analyses
  FOR UPDATE USING (
    (auth.uid() = created_by OR has_role(auth.uid(), 'admin'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE fmea_analyses" ON public.fmea_analyses
  FOR DELETE USING (
    auth.uid() = created_by OR has_role(auth.uid(), 'admin')
  );

-- 17. LGPD_DATA_MAPPINGS
DROP POLICY IF EXISTS "Users can view lgpd" ON public.lgpd_data_mappings;
DROP POLICY IF EXISTS "Users can insert lgpd" ON public.lgpd_data_mappings;
DROP POLICY IF EXISTS "Users can update own lgpd" ON public.lgpd_data_mappings;
DROP POLICY IF EXISTS "Admins can delete lgpd" ON public.lgpd_data_mappings;

CREATE POLICY "Sector-filtered SELECT lgpd_data_mappings" ON public.lgpd_data_mappings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT lgpd_data_mappings" ON public.lgpd_data_mappings
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE lgpd_data_mappings" ON public.lgpd_data_mappings
  FOR UPDATE USING (
    (auth.uid() = created_by OR has_role(auth.uid(), 'admin'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE lgpd_data_mappings" ON public.lgpd_data_mappings
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 18. BPMN_PROCESSES
DROP POLICY IF EXISTS "Authenticated users can view processes" ON public.bpmn_processes;
DROP POLICY IF EXISTS "Admin/analyst can create processes" ON public.bpmn_processes;
DROP POLICY IF EXISTS "Admin/analyst can update processes" ON public.bpmn_processes;
DROP POLICY IF EXISTS "Admin can delete processes" ON public.bpmn_processes;

CREATE POLICY "Sector-filtered SELECT bpmn_processes" ON public.bpmn_processes
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT bpmn_processes" ON public.bpmn_processes
  FOR INSERT WITH CHECK (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE bpmn_processes" ON public.bpmn_processes
  FOR UPDATE USING (
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'analyst'))
    AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE bpmn_processes" ON public.bpmn_processes
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 19. PROJECTS
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON public.projects;

CREATE POLICY "Sector-filtered SELECT projects" ON public.projects
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT projects" ON public.projects
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE projects" ON public.projects
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered DELETE projects" ON public.projects
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 20. DOCUMENT_FOLDERS
DROP POLICY IF EXISTS "Authenticated users can view folders" ON public.document_folders;
DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.document_folders;
DROP POLICY IF EXISTS "Admins can update folders" ON public.document_folders;
DROP POLICY IF EXISTS "Admins can delete folders" ON public.document_folders;

CREATE POLICY "Sector-filtered SELECT document_folders" ON public.document_folders
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered INSERT document_folders" ON public.document_folders
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (sector IS NULL OR has_sector_permission(auth.uid(), sector, 'write'))
  );

CREATE POLICY "Sector-filtered UPDATE document_folders" ON public.document_folders
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') AND (sector IS NULL OR has_sector_access(auth.uid(), sector))
  );

CREATE POLICY "Sector-filtered DELETE document_folders" ON public.document_folders
  FOR DELETE USING (has_role(auth.uid(), 'admin'));
