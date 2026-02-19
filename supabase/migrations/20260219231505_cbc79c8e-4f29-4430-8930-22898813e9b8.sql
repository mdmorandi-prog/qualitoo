
-- ============================================
-- GAP 1: Histórico de Versões de Documentos
-- ============================================
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.quality_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  code TEXT,
  description TEXT,
  category TEXT,
  content TEXT,
  file_url TEXT,
  change_summary TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document versions" ON public.document_versions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert document versions" ON public.document_versions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_document_versions_doc ON public.document_versions(document_id, version_number DESC);

-- ============================================
-- GAP 2: Templates de Documento
-- ============================================
CREATE TABLE public.document_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  content_template TEXT NOT NULL,
  header_fields JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates" ON public.document_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage templates" ON public.document_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- GAP 3: Busca Full-Text (indexação de conteúdo)
-- ============================================
ALTER TABLE public.quality_documents ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.code, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.sector, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_update_document_search_vector
  BEFORE INSERT OR UPDATE ON public.quality_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_document_search_vector();

CREATE INDEX idx_quality_documents_search ON public.quality_documents USING GIN(search_vector);

-- Update existing documents to populate the search vector
UPDATE public.quality_documents SET updated_at = updated_at;

-- ============================================
-- GAP 4: Distribuição Automática (notificação na publicação)
-- ============================================
-- Utiliza a tabela notifications existente. A lógica de distribuição será implementada via Edge Function.

-- ============================================
-- GAP 5: Workflow Multi-Etapa Configurável
-- ============================================
CREATE TABLE public.document_workflow_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.quality_documents(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL DEFAULT 'approval', -- approval, review, validation
  assigned_to UUID,
  assigned_role TEXT, -- 'admin', 'analyst', or specific user role
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovado, rejeitado, pulado
  comments TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workflow steps" ON public.document_workflow_steps
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert workflow steps" ON public.document_workflow_steps
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own or assigned steps" ON public.document_workflow_steps
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      assigned_to = auth.uid() OR 
      has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE INDEX idx_document_workflow_steps_doc ON public.document_workflow_steps(document_id, step_order);

-- Workflow templates for configuring default approval flows per category
CREATE TABLE public.document_workflow_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- null means applies to all
  steps JSONB NOT NULL DEFAULT '[]', -- [{step_name, step_type, assigned_role}]
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_workflow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workflow templates" ON public.document_workflow_templates
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage workflow templates" ON public.document_workflow_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- GAP 6: Permissão por Documento Individual
-- ============================================
CREATE TABLE public.document_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.quality_documents(id) ON DELETE CASCADE,
  user_id UUID, -- specific user
  group_id UUID REFERENCES public.access_groups(id) ON DELETE CASCADE, -- or group-based
  permission_level TEXT NOT NULL DEFAULT 'read', -- read, write, admin
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT chk_permission_target CHECK (user_id IS NOT NULL OR group_id IS NOT NULL)
);

ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document permissions" ON public.document_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage document permissions" ON public.document_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doc owners can manage permissions" ON public.document_permissions
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM quality_documents qd 
      WHERE qd.id = document_id AND qd.created_by = auth.uid()
    )
  );

CREATE INDEX idx_document_permissions_doc ON public.document_permissions(document_id);
CREATE INDEX idx_document_permissions_user ON public.document_permissions(user_id);

-- Add is_restricted flag to documents for per-document permission control
ALTER TABLE public.quality_documents ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN NOT NULL DEFAULT false;

-- ============================================
-- GAP 7: Editor WYSIWYG - suporte a conteúdo HTML
-- ============================================
ALTER TABLE public.quality_documents ADD COLUMN IF NOT EXISTS content_html TEXT;
ALTER TABLE public.quality_documents ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'plain'; -- plain, html, template

-- Seed default templates
INSERT INTO public.document_templates (name, category, description, content_template, header_fields, created_by) VALUES
(
  'POP - Procedimento Operacional Padrão',
  'POP',
  'Template padrão para POPs hospitalares conforme RDC ANVISA',
  E'# PROCEDIMENTO OPERACIONAL PADRÃO\n\n## 1. OBJETIVO\n[Descreva o objetivo deste procedimento]\n\n## 2. ABRANGÊNCIA\n[Setores e profissionais envolvidos]\n\n## 3. DEFINIÇÕES E SIGLAS\n- **Termo**: Definição\n\n## 4. RESPONSABILIDADES\n| Função | Responsabilidade |\n|--------|------------------|\n| [Cargo] | [Descrição] |\n\n## 5. DESCRIÇÃO DO PROCEDIMENTO\n### 5.1 Materiais Necessários\n- Item 1\n- Item 2\n\n### 5.2 Procedimento\n1. Passo 1\n2. Passo 2\n3. Passo 3\n\n## 6. RISCOS E CUIDADOS ESPECIAIS\n[Descreva os riscos associados]\n\n## 7. AÇÕES CORRETIVAS\n[Descreva ações em caso de não conformidade]\n\n## 8. REFERÊNCIAS\n- [Norma/Legislação aplicável]\n\n## 9. HISTÓRICO DE REVISÕES\n| Revisão | Data | Descrição da Alteração |\n|---------|------|------------------------|\n| 01 | [Data] | Emissão inicial |',
  '{"revisao": "01", "tipo": "POP"}',
  '00000000-0000-0000-0000-000000000000'
),
(
  'IT - Instrução de Trabalho',
  'IT',
  'Template para instruções de trabalho detalhadas',
  E'# INSTRUÇÃO DE TRABALHO\n\n## 1. OBJETIVO\n[Objetivo desta instrução]\n\n## 2. CAMPO DE APLICAÇÃO\n[Onde e quando se aplica]\n\n## 3. PRÉ-REQUISITOS\n- [ ] Requisito 1\n- [ ] Requisito 2\n\n## 4. PASSO A PASSO\n### Etapa 1: [Nome]\n**Responsável:** [Cargo]\n**Tempo estimado:** [X minutos]\n\n1. Ação 1\n2. Ação 2\n\n> ⚠️ **ATENÇÃO:** [Ponto crítico de segurança]\n\n### Etapa 2: [Nome]\n1. Ação 1\n2. Ação 2\n\n## 5. REGISTROS\n| Registro | Responsável | Frequência |\n|----------|-------------|------------|\n| [Nome] | [Cargo] | [Diária] |\n\n## 6. ANEXOS\n- Anexo 1: [Descrição]',
  '{"revisao": "01", "tipo": "IT"}',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Manual da Qualidade',
  'Manual',
  'Template para manual da qualidade institucional',
  E'# MANUAL DA QUALIDADE\n\n## 1. APRESENTAÇÃO INSTITUCIONAL\n[Breve histórico e missão da instituição]\n\n## 2. ESCOPO DO SGQ\n[Processos e setores abrangidos]\n\n## 3. POLÍTICA DA QUALIDADE\n[Declaração da política]\n\n## 4. OBJETIVOS DA QUALIDADE\n| Objetivo | Indicador | Meta |\n|----------|-----------|------|\n| [Obj 1] | [Ind 1] | [Meta] |\n\n## 5. ESTRUTURA ORGANIZACIONAL\n[Organograma e responsabilidades]\n\n## 6. MAPA DE PROCESSOS\n[Descrição dos processos-chave]\n\n## 7. GESTÃO DE DOCUMENTOS\n[Regras de controle documental]\n\n## 8. GESTÃO DE NÃO CONFORMIDADES\n[Fluxo de tratamento]\n\n## 9. AUDITORIA INTERNA\n[Programa de auditorias]\n\n## 10. ANÁLISE CRÍTICA\n[Periodicidade e participantes]',
  '{"revisao": "01", "tipo": "Manual"}',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Protocolo Clínico',
  'Protocolo',
  'Template para protocolos clínicos e assistenciais',
  E'# PROTOCOLO CLÍNICO\n\n## 1. INTRODUÇÃO\n[Contextualização e justificativa clínica]\n\n## 2. OBJETIVO\n[Objetivo assistencial]\n\n## 3. POPULAÇÃO-ALVO\n- **Critérios de inclusão:** [Descreva]\n- **Critérios de exclusão:** [Descreva]\n\n## 4. DIAGNÓSTICO\n### 4.1 Critérios Diagnósticos\n[Critérios clínicos e laboratoriais]\n\n### 4.2 Exames Complementares\n| Exame | Indicação | Periodicidade |\n|-------|-----------|---------------|\n| [Exame] | [Quando] | [Frequência] |\n\n## 5. TRATAMENTO\n### 5.1 Medidas Gerais\n[Orientações não farmacológicas]\n\n### 5.2 Tratamento Farmacológico\n| Medicamento | Dose | Via | Frequência |\n|-------------|------|-----|------------|\n| [Nome] | [Dose] | [Via] | [Freq] |\n\n## 6. MONITORAMENTO\n[Parâmetros e frequência de acompanhamento]\n\n## 7. CRITÉRIOS DE ALTA/ENCAMINHAMENTO\n[Condições para alta ou referenciamento]\n\n## 8. FLUXOGRAMA\n[Algoritmo de decisão clínica]\n\n## 9. REFERÊNCIAS BIBLIOGRÁFICAS\n1. [Referência 1]\n2. [Referência 2]',
  '{"revisao": "01", "tipo": "Protocolo"}',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Formulário Padrão',
  'Formulário',
  'Template base para formulários do SGQ',
  E'# FORMULÁRIO\n\n**Código:** [FOR-XXX]\n**Revisão:** 01\n**Data:** [DD/MM/AAAA]\n\n---\n\n## DADOS DE IDENTIFICAÇÃO\n\n| Campo | Valor |\n|-------|-------|\n| Setor | |\n| Responsável | |\n| Data | |\n| Turno | |\n\n## REGISTRO\n\n| Item | Descrição | Conforme | Observação |\n|------|-----------|----------|------------|\n| 1 | | ☐ Sim ☐ Não | |\n| 2 | | ☐ Sim ☐ Não | |\n| 3 | | ☐ Sim ☐ Não | |\n\n## OBSERVAÇÕES\n\n[Espaço para observações adicionais]\n\n---\n\n**Responsável:** _________________________ **Data:** ___/___/______\n\n**Supervisor:** _________________________ **Data:** ___/___/______',
  '{"revisao": "01", "tipo": "Formulário"}',
  '00000000-0000-0000-0000-000000000000'
);

-- Insert default workflow templates
INSERT INTO public.document_workflow_templates (name, category, steps, created_by) VALUES
(
  'Aprovação Padrão (2 etapas)',
  NULL,
  '[{"step_name":"Revisão Técnica","step_type":"review","assigned_role":"analyst"},{"step_name":"Aprovação Final","step_type":"approval","assigned_role":"admin"}]',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Aprovação POP (3 etapas)',
  'POP',
  '[{"step_name":"Revisão Técnica","step_type":"review","assigned_role":"analyst"},{"step_name":"Validação do Setor","step_type":"validation","assigned_role":"analyst"},{"step_name":"Aprovação Gerencial","step_type":"approval","assigned_role":"admin"}]',
  '00000000-0000-0000-0000-000000000000'
),
(
  'Aprovação Protocolo Clínico (4 etapas)',
  'Protocolo',
  '[{"step_name":"Revisão Técnica","step_type":"review","assigned_role":"analyst"},{"step_name":"Revisão Corpo Clínico","step_type":"review","assigned_role":"analyst"},{"step_name":"Validação Diretoria Clínica","step_type":"validation","assigned_role":"admin"},{"step_name":"Aprovação Diretoria","step_type":"approval","assigned_role":"admin"}]',
  '00000000-0000-0000-0000-000000000000'
);
