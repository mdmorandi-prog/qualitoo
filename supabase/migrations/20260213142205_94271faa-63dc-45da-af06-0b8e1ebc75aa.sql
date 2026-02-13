
-- Workflow rules configuration
CREATE TABLE public.workflow_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trigger_event TEXT NOT NULL DEFAULT 'status_change',
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval workflow steps
CREATE TABLE public.workflow_approval_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 1,
  approver_role TEXT NOT NULL DEFAULT 'admin',
  approver_user_id UUID,
  required_approvals INTEGER NOT NULL DEFAULT 1,
  timeout_hours INTEGER,
  escalation_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval requests (instances)
CREATE TABLE public.workflow_approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.workflow_rules(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.workflow_approval_steps(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  record_id UUID NOT NULL,
  record_title TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'escalado', 'expirado')),
  requested_by TEXT,
  decided_by TEXT,
  decision_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ
);

-- Workflow execution log
CREATE TABLE public.workflow_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.workflow_rules(id) ON DELETE SET NULL,
  rule_name TEXT,
  module TEXT NOT NULL,
  record_id UUID,
  trigger_event TEXT,
  conditions_met BOOLEAN NOT NULL DEFAULT true,
  actions_executed JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- RLS
ALTER TABLE public.workflow_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_execution_log ENABLE ROW LEVEL SECURITY;

-- Policies: rules managed by admin/analyst, viewable by authenticated
CREATE POLICY "Authenticated can view workflow rules" ON public.workflow_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/analyst can manage workflow rules" ON public.workflow_rules
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/analyst can update workflow rules" ON public.workflow_rules
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin can delete workflow rules" ON public.workflow_rules
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view approval steps" ON public.workflow_approval_steps
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/analyst can manage approval steps" ON public.workflow_approval_steps
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/analyst can update approval steps" ON public.workflow_approval_steps
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin can delete approval steps" ON public.workflow_approval_steps
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view approval requests" ON public.workflow_approval_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create approval requests" ON public.workflow_approval_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update approval requests" ON public.workflow_approval_requests
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can view execution log" ON public.workflow_execution_log
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can create execution log" ON public.workflow_execution_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_workflow_rules_updated_at
  BEFORE UPDATE ON public.workflow_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
