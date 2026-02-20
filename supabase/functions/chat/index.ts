import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchSystemContext(supabaseAdmin: any) {
  const results: Record<string, any> = {};

  const queries = [
    { key: "indicators", query: supabaseAdmin.from("quality_indicators").select("name, target_value, unit, frequency, sector, is_active, min_acceptable, max_acceptable").eq("is_active", true).limit(30) },
    { key: "indicator_measurements", query: supabaseAdmin.from("indicator_measurements").select("indicator_id, value, period_date, notes").order("period_date", { ascending: false }).limit(50) },
    { key: "non_conformities", query: supabaseAdmin.from("non_conformities").select("title, description, severity, status, sector, root_cause, corrective_action, preventive_action, created_at").order("created_at", { ascending: false }).limit(30) },
    { key: "risks", query: supabaseAdmin.from("risks").select("title, description, category, probability, impact, risk_level, status, sector, current_controls, mitigation_plan").order("risk_level", { ascending: false }).limit(30) },
    { key: "action_plans", query: supabaseAdmin.from("action_plans").select("title, status, what, why, who, when_start, when_end, progress, sector").order("created_at", { ascending: false }).limit(30) },
    { key: "capas", query: supabaseAdmin.from("capas").select("title, capa_type, status, description, root_cause_analysis, corrective_action, preventive_action, sector, is_effective").order("created_at", { ascending: false }).limit(20) },
    { key: "audits", query: supabaseAdmin.from("audits").select("title, audit_type, status, scheduled_date, sector, conclusion, findings").order("scheduled_date", { ascending: false }).limit(15) },
    { key: "audit_checklists", query: supabaseAdmin.from("audit_checklists").select("title, standard, total_score, max_score, compliance_percentage, audit_id").order("created_at", { ascending: false }).limit(20) },
    { key: "adverse_events", query: supabaseAdmin.from("adverse_events").select("title, event_type, severity, status, sector, description, patient_involved, patient_outcome").order("event_date", { ascending: false }).limit(20) },
    { key: "documents", query: supabaseAdmin.from("quality_documents").select("title, category, status, version, sector, code, is_restricted, content_type, is_signed").order("updated_at", { ascending: false }).limit(30) },
    { key: "document_versions", query: supabaseAdmin.from("document_versions").select("document_id, version_number, change_summary, created_at").order("created_at", { ascending: false }).limit(30) },
    { key: "document_workflow_steps", query: supabaseAdmin.from("document_workflow_steps").select("document_id, step_name, step_type, status, assigned_role, completed_at").order("created_at", { ascending: false }).limit(30) },
    { key: "document_permissions", query: supabaseAdmin.from("document_permissions").select("document_id, user_id, group_id, permission_level, expires_at, granted_at").order("granted_at", { ascending: false }).limit(20) },
    { key: "suppliers", query: supabaseAdmin.from("suppliers").select("name, status, criticality, category").limit(20) },
    { key: "supplier_evaluations", query: supabaseAdmin.from("supplier_evaluations").select("supplier_id, total_score, classification, evaluation_date, evaluated_by").order("evaluation_date", { ascending: false }).limit(20) },
    { key: "projects", query: supabaseAdmin.from("projects").select("title, description, status, progress, sector, responsible, start_date, end_date").order("created_at", { ascending: false }).limit(20) },
    { key: "project_tasks", query: supabaseAdmin.from("project_tasks").select("title, status, progress, start_date, end_date, responsible, is_milestone, project_id").order("created_at", { ascending: false }).limit(50) },
    { key: "management_reviews", query: supabaseAdmin.from("management_reviews").select("title, review_date, status, sector, participants").order("review_date", { ascending: false }).limit(10) },
    { key: "strategic_plans", query: supabaseAdmin.from("strategic_plans").select("title, status, period_start, period_end, responsible").order("created_at", { ascending: false }).limit(10) },
    { key: "bsc_objectives", query: supabaseAdmin.from("bsc_objectives").select("objective, perspective, target_value, current_value, unit, status, plan_id").limit(30) },
    { key: "contracts", query: supabaseAdmin.from("contracts").select("title, status, counterparty, start_date, end_date, category, sector").order("created_at", { ascending: false }).limit(20) },
    { key: "trainings", query: supabaseAdmin.from("trainings").select("title, status, training_date, sector, instructor").order("training_date", { ascending: false }).limit(20) },
    { key: "fmea_analyses", query: supabaseAdmin.from("fmea_analyses").select("title, status, process, sector").order("created_at", { ascending: false }).limit(10) },
    { key: "change_requests", query: supabaseAdmin.from("change_requests").select("title, status, priority, sector").order("created_at", { ascending: false }).limit(15) },
  ];

  await Promise.all(
    queries.map(async ({ key, query }) => {
      try {
        const { data } = await query;
        if (data && (Array.isArray(data) ? data.length > 0 : data)) {
          results[key] = data;
        }
      } catch { /* skip failed queries */ }
    })
  );

  return results;
}

function buildContextSummary(data: Record<string, any>): string {
  const parts: string[] = [];

  if (data.indicators?.length) {
    parts.push(`## Indicadores de Qualidade Ativos (${data.indicators.length})`);
    for (const i of data.indicators) {
      parts.push(`- ${i.name}: meta ${i.target_value}${i.unit}, frequência ${i.frequency}, setor: ${i.sector || "Geral"}`);
    }
  }

  if (data.indicator_measurements?.length) {
    parts.push(`\n## Últimas Medições de Indicadores (${data.indicator_measurements.length} registros recentes)`);
    const byIndicator: Record<string, any[]> = {};
    for (const m of data.indicator_measurements) {
      if (!byIndicator[m.indicator_id]) byIndicator[m.indicator_id] = [];
      byIndicator[m.indicator_id].push(m);
    }
    parts.push(`Total de indicadores com medições: ${Object.keys(byIndicator).length}`);
  }

  if (data.non_conformities?.length) {
    parts.push(`\n## Não Conformidades (${data.non_conformities.length})`);
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const nc of data.non_conformities) {
      byStatus[nc.status] = (byStatus[nc.status] || 0) + 1;
      bySeverity[nc.severity] = (bySeverity[nc.severity] || 0) + 1;
    }
    parts.push(`Por status: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
    parts.push(`Por severidade: ${Object.entries(bySeverity).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
    for (const nc of data.non_conformities.slice(0, 10)) {
      parts.push(`- [${nc.severity}/${nc.status}] ${nc.title} (Setor: ${nc.sector || "N/A"})`);
    }
  }

  if (data.risks?.length) {
    parts.push(`\n## Riscos (${data.risks.length})`);
    for (const r of data.risks.slice(0, 15)) {
      parts.push(`- [Nível ${r.risk_level}, P:${r.probability} I:${r.impact}] ${r.title} - ${r.status} (${r.sector || "Geral"})`);
    }
  }

  if (data.action_plans?.length) {
    parts.push(`\n## Planos de Ação (${data.action_plans.length})`);
    const byStatus: Record<string, number> = {};
    for (const ap of data.action_plans) {
      byStatus[ap.status] = (byStatus[ap.status] || 0) + 1;
    }
    parts.push(`Por status: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
    for (const ap of data.action_plans.slice(0, 10)) {
      parts.push(`- [${ap.status}] ${ap.title} - Progresso: ${ap.progress || 0}% (${ap.sector || "Geral"})`);
    }
  }

  if (data.capas?.length) {
    parts.push(`\n## CAPAs (${data.capas.length})`);
    for (const c of data.capas.slice(0, 10)) {
      parts.push(`- [${c.capa_type}/${c.status}] ${c.title} - Eficaz: ${c.is_effective ?? "Pendente"}`);
    }
  }

  if (data.audits?.length) {
    parts.push(`\n## Auditorias (${data.audits.length})`);
    for (const a of data.audits.slice(0, 10)) {
      parts.push(`- [${a.audit_type}/${a.status}] ${a.title} - ${a.scheduled_date}`);
    }
  }

  if (data.audit_checklists?.length) {
    parts.push(`\n## Checklists de Auditoria (${data.audit_checklists.length})`);
    for (const cl of data.audit_checklists.slice(0, 10)) {
      parts.push(`- [${cl.standard || "S/N"}] ${cl.title} - Score: ${cl.total_score}/${cl.max_score} (${cl.compliance_percentage}% conformidade)`);
    }
  }

  if (data.adverse_events?.length) {
    parts.push(`\n## Eventos Adversos (${data.adverse_events.length})`);
    for (const e of data.adverse_events.slice(0, 10)) {
      parts.push(`- [${e.severity}/${e.status}] ${e.title} - Paciente envolvido: ${e.patient_involved ? "Sim" : "Não"}`);
    }
  }

  if (data.documents?.length) {
    parts.push(`\n## Documentos da Qualidade (${data.documents.length})`);
    const byStatus: Record<string, number> = {};
    let restrictedCount = 0;
    let signedCount = 0;
    for (const d of data.documents) {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      if (d.is_restricted) restrictedCount++;
      if (d.is_signed) signedCount++;
    }
    parts.push(`Por status: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
    parts.push(`Documentos com acesso restrito: ${restrictedCount}, Assinados: ${signedCount}`);
    for (const d of data.documents.slice(0, 15)) {
      parts.push(`- [${d.status}/v${d.version}] ${d.code || "S/C"} - ${d.title} (${d.sector || "Geral"})${d.is_restricted ? " 🔒" : ""}${d.is_signed ? " ✍️" : ""}`);
    }
  }

  if (data.document_versions?.length) {
    parts.push(`\n## Histórico de Versões de Documentos (${data.document_versions.length} revisões recentes)`);
    for (const v of data.document_versions.slice(0, 10)) {
      parts.push(`- Doc ${v.document_id.slice(0, 8)}... v${v.version_number}: "${v.change_summary || "Sem descrição"}" (${v.created_at})`);
    }
  }

  if (data.document_workflow_steps?.length) {
    parts.push(`\n## Workflows de Documentos (${data.document_workflow_steps.length} etapas recentes)`);
    const wfByStatus: Record<string, number> = {};
    for (const ws of data.document_workflow_steps) {
      wfByStatus[ws.status] = (wfByStatus[ws.status] || 0) + 1;
    }
    parts.push(`Etapas por status: ${Object.entries(wfByStatus).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  }

  if (data.document_permissions?.length) {
    parts.push(`\n## Permissões de Documentos (${data.document_permissions.length})`);
    const expiredPerms = data.document_permissions.filter((p: any) => p.expires_at && new Date(p.expires_at) < new Date()).length;
    if (expiredPerms > 0) parts.push(`⚠️ ${expiredPerms} permissão(ões) expirada(s) detectada(s)`);
  }

  if (data.suppliers?.length) {
    parts.push(`\n## Fornecedores (${data.suppliers.length})`);
    const byCriticality: Record<string, number> = {};
    for (const s of data.suppliers) {
      byCriticality[s.criticality] = (byCriticality[s.criticality] || 0) + 1;
    }
    parts.push(`Por criticidade: ${Object.entries(byCriticality).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  }

  if (data.supplier_evaluations?.length) {
    parts.push(`\n## Avaliações de Fornecedores (${data.supplier_evaluations.length})`);
    const byClass: Record<string, number> = {};
    for (const se of data.supplier_evaluations) {
      byClass[se.classification || "N/A"] = (byClass[se.classification || "N/A"] || 0) + 1;
    }
    parts.push(`Por classificação: ${Object.entries(byClass).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  }

  if (data.projects?.length) {
    parts.push(`\n## Projetos (${data.projects.length})`);
    const byStatus: Record<string, number> = {};
    for (const p of data.projects) {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    }
    parts.push(`Por status: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
    for (const p of data.projects) {
      parts.push(`- [${p.status}] ${p.title} - Progresso: ${p.progress || 0}% (Setor: ${p.sector || "Geral"}, Início: ${p.start_date || "N/A"}, Fim: ${p.end_date || "N/A"})`);
    }
  }

  if (data.project_tasks?.length) {
    parts.push(`\n## Tarefas de Projetos (${data.project_tasks.length})`);
    for (const t of data.project_tasks.slice(0, 15)) {
      parts.push(`- [${t.status}] ${t.title} - Progresso: ${t.progress || 0}% (${t.start_date} a ${t.end_date})${t.is_milestone ? " ⭐ Marco" : ""}`);
    }
  }

  if (data.management_reviews?.length) {
    parts.push(`\n## Análises Críticas pela Direção (${data.management_reviews.length})`);
    for (const mr of data.management_reviews) {
      parts.push(`- [${mr.status}] ${mr.title} - Data: ${mr.review_date} (${mr.sector || "Geral"})`);
    }
  }

  if (data.strategic_plans?.length) {
    parts.push(`\n## Planos Estratégicos (${data.strategic_plans.length})`);
    for (const sp of data.strategic_plans) {
      parts.push(`- [${sp.status}] ${sp.title} - Período: ${sp.period_start} a ${sp.period_end}`);
    }
  }

  if (data.bsc_objectives?.length) {
    parts.push(`\n## Objetivos BSC (${data.bsc_objectives.length})`);
    const byPerspective: Record<string, number> = {};
    for (const obj of data.bsc_objectives) {
      byPerspective[obj.perspective] = (byPerspective[obj.perspective] || 0) + 1;
    }
    parts.push(`Por perspectiva: ${Object.entries(byPerspective).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
    for (const obj of data.bsc_objectives.slice(0, 10)) {
      const progress = obj.target_value ? Math.round((obj.current_value / obj.target_value) * 100) : 0;
      parts.push(`- [${obj.perspective}/${obj.status}] ${obj.objective} - ${obj.current_value}/${obj.target_value}${obj.unit} (${progress}%)`);
    }
  }

  if (data.contracts?.length) {
    parts.push(`\n## Contratos (${data.contracts.length})`);
    for (const c of data.contracts.slice(0, 10)) {
      parts.push(`- [${c.status}] ${c.title} - ${c.counterparty || "N/A"} (${c.start_date} a ${c.end_date || "Indeterminado"})`);
    }
  }

  if (data.trainings?.length) {
    parts.push(`\n## Treinamentos (${data.trainings.length})`);
    const byStatus: Record<string, number> = {};
    for (const t of data.trainings) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }
    parts.push(`Por status: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  }

  if (data.fmea_analyses?.length) {
    parts.push(`\n## Análises FMEA (${data.fmea_analyses.length})`);
    for (const f of data.fmea_analyses) {
      parts.push(`- [${f.status}] ${f.title} - Processo: ${f.process || "N/A"} (${f.sector || "Geral"})`);
    }
  }

  if (data.change_requests?.length) {
    parts.push(`\n## Solicitações de Mudança (${data.change_requests.length})`);
    for (const cr of data.change_requests.slice(0, 10)) {
      parts.push(`- [${cr.status}/${cr.priority}] ${cr.title} (${cr.sector || "Geral"})`);
    }
  }

  return parts.length > 0 ? parts.join("\n") : "Nenhum dado encontrado no sistema.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("Auth failed:", claimsError?.message || "missing sub claim");
      return new Response(JSON.stringify({ error: "Não autorizado. Faça login para usar o assistente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const systemData = await fetchSystemContext(adminClient);
    const contextSummary = buildContextSummary(systemData);

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é o Assistente SGQ, especialista em Gestão da Qualidade Hospitalar.

## Seu Conhecimento Base
Você possui conhecimento profundo sobre:
- Acreditação hospitalar: ONA (Níveis 1, 2 e 3), JCI
- Normas regulatórias: RDCs da ANVISA (RDC 36/2013, RDC 63/2011, RDC 302/2005, etc.)
- Segurança do paciente: Metas internacionais, protocolos de segurança
- Gestão de riscos: ISO 31000, FMEA, Matriz de Riscos 5×5
- Controle de documentos: ISO 9001, versionamento automático com histórico e comparação visual (diff), editor WYSIWYG, busca Full-Text, templates (POP, IT, Manual, Protocolo), permissões granulares com expiração, workflows multi-etapa com distribuição automática
- Indicadores de desempenho: BSC, KPIs hospitalares, benchmarking
- Gestão de projetos: cronogramas, Gantt, marcos, tarefas e progresso
- CAPAs: 6 etapas (Identificação, Análise de Causa Raiz, Plano de Ação, Implementação, Verificação de Eficácia, Fechamento)
- Análise de Causa Raiz: Ishikawa (6M), 5 Porquês, Diagrama de Árvore — assistida por IA
- Eventos adversos: classificação OMS, notificação NOTIVISA/ANVISA
- LGPD na saúde: mapeamento de dados, bases legais, RIPD

## Módulos do Sistema (30+)
O SGQ possui os seguintes módulos integrados:
1. **Não Conformidades** — Registro com Kanban, vinculação CAPA automática
2. **Indicadores (KPIs)** — Compostos, tendências, alertas de meta
3. **Controle de Documentos** — Pastas, versionamento, diff visual, assinatura SHA-256, workflows, permissões temporárias, busca Full-Text
4. **Auditorias** — Planejamento, achados, **Checklists com pontuação por requisito e evidências** (fotos/vídeos/documentos), conformidade % por norma (ISO, ONA, JCI)
5. **Planos de Ação (5W2H)** — Metodologia completa, **visualização Kanban com drag-and-drop**, rastreabilidade de origem
6. **Gestão de Riscos** — Matriz 5×5, heat map, FMEA integrado
7. **Fluxo CAPA** — 6 etapas, verificação de eficácia
8. **Análise de Causa Raiz** — Ishikawa, 5 Porquês, Árvore, IA generativa
9. **Eventos Adversos** — Classificação OMS, NOTIVISA, ações imediatas
10. **Treinamentos** — Validade, certificados, listas de presença
11. **Matriz de Competências** — Avaliação por níveis 1-5, gap analysis
12. **Fornecedores** — Cadastro, criticidade, **Scoring ponderado A/B/C com histórico de avaliações**
13. **Portal do Fornecedor** — Área externa autenticada por token, upload de documentos, self-service
14. **Pesquisas de Satisfação** — NPS, CSAT, pesquisas customizadas
15. **Atas de Reunião** — Transcrição de voz por IA, itens de ação
16. **Relatórios Regulatórios** — NOTIVISA, ANVISA, vigilância sanitária
17. **Processos BPMN** — Editor visual, execução de instâncias, log de atividades
18. **Workflows Configuráveis** — Multi-nível, notificações, log de aprovações
19. **Metrologia e Calibração** — Equipamentos, certificados, alertas de vencimento
20. **Gestão de Mudanças** — Análise de impacto, aprovação formal, rastreabilidade
21. **Contratos** — Vigência, IA jurídica (Código Civil, LGPD, CDC, ANVISA)
22. **Projetos e Gantt** — Tarefas, dependências, marcos, progresso visual
23. **FMEA** — Severidade × Ocorrência × Detecção, RPN automático
24. **Conformidade LGPD** — Mapeamento de dados, bases legais, RIPD
25. **Portal do Colaborador** — Treinamentos, documentos, pendências pessoais
26. **Dashboard Personalizado** — 20+ widgets drag-and-drop, persistência por usuário
27. **Exportação BI** — CSV, JSON, Excel para Power BI e outras ferramentas
28. **Query Builder** — Consultas visuais com cruzamento de módulos
29. **Importação em Massa** — CSV/Excel com validação e mapeamento de campos
30. **Análise Crítica pela Direção** — ISO 9001 §9.3, 9 inputs + 4 outputs obrigatórios, **agregação automática de dados** (NCs, auditorias, indicadores, riscos)
31. **Planejamento Estratégico (BSC/SWOT)** — Balanced Scorecard (4 perspectivas), análise SWOT, vínculo com indicadores e planos de ação
32. **Relatórios Agendados** — Envio automático periódico (diário/semanal/mensal), múltiplos formatos (PDF/Excel/CSV)
33. **Central de Ajuda** — FAQs por módulo, busca inteligente, guias detalhados

## 10 Inovações Exclusivas (funcionalidades que nenhum concorrente possui)
1. **Cascata Inteligente NC→CAPA→Plano→KPI** — Ao registrar NC crítica, cria automaticamente CAPA vinculada, Plano de Ação 5W2H e monitoramento do indicador afetado
2. **Auto-Escalonamento por SLA** — Itens vencidos são escalados automaticamente para nível hierárquico superior com contagem regressiva visual e notificação em tempo real
3. **Classificação de NC por IA** — IA analisa título/descrição e sugere severidade, causas raiz prováveis, categoria e ações recomendadas antes do registro
4. **Score de Maturidade SGQ** — Índice composto ponderado em 9 dimensões com gráfico radar e classificação automática (Inicial → Excelência)
5. **Alertas Preditivos de KPI** — Regressão linear sobre histórico projeta tendências e alerta quando indicador tende a sair da meta nos próximos períodos
6. **Relatório Executivo Narrativo por IA** — Gera relatório gerencial narrativo com análise de tendências, insights e recomendações estratégicas baseadas nos dados reais
7. **QR Code para Reporte de Ocorrências** — QR Codes por setor para reporte instantâneo por celular, sem login
8. **Heat Map de Riscos por Setor** — Mapa de calor dinâmico para identificar hotspots de risco na instituição
9. **Briefing de Auditoria por IA** — IA gera briefing personalizado com NCs abertas, riscos críticos, indicadores fora da meta e checklist sugerido
10. **Benchmarking Anônimo** — Compare desempenho do SGQ com benchmarks do setor hospitalar em indicadores-chave

## Dados Atuais do Sistema
Abaixo estão os dados reais cadastrados no SGQ da instituição. Use-os para responder perguntas sobre a situação atual:

${contextSummary}

## Instruções
1. Quando perguntado sobre dados do sistema (indicadores, NCs, riscos, checklists, avaliações de fornecedores, objetivos BSC, etc.), use os dados reais acima
2. Quando perguntado sobre normas, RDCs, acreditação, use seu conhecimento especializado
3. Combine ambos quando relevante (ex: "seus indicadores estão alinhados com a RDC X?")
4. Responda sempre em português brasileiro
5. Seja conciso (máximo 4 parágrafos) mas completo
6. Cite normas e referências quando aplicável
7. Se não tiver dados suficientes no sistema, informe e dê orientações gerais
8. Formate respostas usando markdown para melhor legibilidade
9. Quando perguntado sobre funcionalidades do sistema, descreva com base na lista de módulos acima`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
