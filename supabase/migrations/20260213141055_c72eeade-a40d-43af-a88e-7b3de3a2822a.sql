
-- Tabela de processos BPMN
CREATE TABLE public.bpmn_processes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  sector TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Instâncias de execução de processos
CREATE TABLE public.bpmn_process_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  process_id UUID NOT NULL REFERENCES public.bpmn_processes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'cancelada', 'pausada')),
  current_node_ids TEXT[] NOT NULL DEFAULT '{}',
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_by TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Log de execução (trilha de auditoria)
CREATE TABLE public.bpmn_execution_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES public.bpmn_process_instances(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_label TEXT,
  action TEXT NOT NULL,
  performed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.bpmn_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpmn_process_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bpmn_execution_log ENABLE ROW LEVEL SECURITY;

-- Policies para processos
CREATE POLICY "Authenticated users can view processes" ON public.bpmn_processes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin/analyst can create processes" ON public.bpmn_processes
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin/analyst can update processes" ON public.bpmn_processes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'analyst'));
CREATE POLICY "Admin can delete processes" ON public.bpmn_processes
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Policies para instâncias
CREATE POLICY "Authenticated users can view instances" ON public.bpmn_process_instances
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create instances" ON public.bpmn_process_instances
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update instances" ON public.bpmn_process_instances
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policies para log
CREATE POLICY "Authenticated users can view logs" ON public.bpmn_execution_log
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create logs" ON public.bpmn_execution_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_bpmn_processes_updated_at
  BEFORE UPDATE ON public.bpmn_processes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bpmn_instances_updated_at
  BEFORE UPDATE ON public.bpmn_process_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
