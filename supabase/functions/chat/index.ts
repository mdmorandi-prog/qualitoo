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
    { key: "adverse_events", query: supabaseAdmin.from("adverse_events").select("title, event_type, severity, status, sector, description, patient_involved, patient_outcome").order("event_date", { ascending: false }).limit(20) },
    { key: "documents", query: supabaseAdmin.from("quality_documents").select("title, category, status, version, sector, code").order("updated_at", { ascending: false }).limit(30) },
    { key: "suppliers", query: supabaseAdmin.from("suppliers").select("name, status, criticality, category").limit(20) },
    { key: "trainings", query: supabaseAdmin.rpc("has_role", { _user_id: "00000000-0000-0000-0000-000000000000", _role: "admin" }).then(() => null).catch(() => null) },
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

  if (data.adverse_events?.length) {
    parts.push(`\n## Eventos Adversos (${data.adverse_events.length})`);
    for (const e of data.adverse_events.slice(0, 10)) {
      parts.push(`- [${e.severity}/${e.status}] ${e.title} - Paciente envolvido: ${e.patient_involved ? "Sim" : "Não"}`);
    }
  }

  if (data.documents?.length) {
    parts.push(`\n## Documentos da Qualidade (${data.documents.length})`);
    const byStatus: Record<string, number> = {};
    for (const d of data.documents) {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    }
    parts.push(`Por status: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
  }

  if (data.suppliers?.length) {
    parts.push(`\n## Fornecedores (${data.suppliers.length})`);
    const byCriticality: Record<string, number> = {};
    for (const s of data.suppliers) {
      byCriticality[s.criticality] = (byCriticality[s.criticality] || 0) + 1;
    }
    parts.push(`Por criticidade: ${Object.entries(byCriticality).map(([k, v]) => `${k}: ${v}`).join(", ")}`);
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

    // Verify user auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to fetch system data
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
- Gestão de riscos: ISO 31000, FMEA, Matriz de Riscos
- Controle de documentos: ISO 9001, boas práticas de gestão documental
- Indicadores de desempenho: BSC, KPIs hospitalares, benchmarking
- CAPAs, 5 Porquês, Ishikawa, PDCA, A3, 5W2H
- Eventos adversos: classificação, notificação NOTIVISA
- LGPD na saúde

## Dados Atuais do Sistema
Abaixo estão os dados reais cadastrados no SGQ da instituição. Use-os para responder perguntas sobre a situação atual:

${contextSummary}

## Instruções
1. Quando perguntado sobre dados do sistema (indicadores, NCs, riscos, etc.), use os dados reais acima
2. Quando perguntado sobre normas, RDCs, acreditação, use seu conhecimento especializado
3. Combine ambos quando relevante (ex: "seus indicadores estão alinhados com a RDC X?")
4. Responda sempre em português brasileiro
5. Seja conciso (máximo 4 parágrafos) mas completo
6. Cite normas e referências quando aplicável
7. Se não tiver dados suficientes no sistema, informe e dê orientações gerais
8. Formate respostas usando markdown para melhor legibilidade`;

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
