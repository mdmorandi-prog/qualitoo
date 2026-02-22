import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch current system data
    const [ncRes, indRes, measRes, riskRes, capaRes, audRes, planRes, evRes] = await Promise.all([
      admin.from("non_conformities").select("title, severity, status, sector, created_at").order("created_at", { ascending: false }).limit(50),
      admin.from("quality_indicators").select("name, target_value, unit, sector").eq("is_active", true).limit(30),
      admin.from("indicator_measurements").select("indicator_id, value, period_date").order("period_date", { ascending: false }).limit(100),
      admin.from("risks").select("title, risk_level, status, sector").order("risk_level", { ascending: false }).limit(30),
      admin.from("capas").select("title, status, capa_type, is_effective").limit(20),
      admin.from("audits").select("title, status, scheduled_date").limit(15),
      admin.from("action_plans").select("title, status, progress").limit(30),
      admin.from("adverse_events").select("title, severity, status").limit(20),
    ]);

    const summary = {
      ncs: ncRes.data || [],
      indicators: indRes.data || [],
      measurements: measRes.data || [],
      risks: riskRes.data || [],
      capas: capaRes.data || [],
      audits: audRes.data || [],
      plans: planRes.data || [],
      events: evRes.data || [],
    };

    const ncOpen = summary.ncs.filter((n: any) => n.status !== "concluida").length;
    const ncCritical = summary.ncs.filter((n: any) => (n.severity === "alta" || n.severity === "critica") && n.status !== "concluida").length;
    const risksCritical = summary.risks.filter((r: any) => (r.risk_level || 0) >= 15).length;
    const capasPending = summary.capas.filter((c: any) => c.status !== "encerrada").length;
    const plansOverdue = summary.plans.filter((p: any) => p.status === "atrasado").length;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é o diretor de qualidade de um hospital. Gere um relatório executivo narrativo em português brasileiro, formatado em markdown, com as seguintes seções:
## 📊 Relatório Executivo do SGQ
### Resumo Geral
### Não Conformidades
### Indicadores de Desempenho
### Gestão de Riscos
### CAPAs e Ações Corretivas
### Auditorias
### Planos de Ação
### Eventos Adversos
### Recomendações Estratégicas
### Conclusão

Use tom profissional e analítico. Inclua insights acionáveis e recomendações baseadas nos dados.`,
          },
          {
            role: "user",
            content: `Dados atuais do SGQ:
- NCs: ${summary.ncs.length} total, ${ncOpen} abertas, ${ncCritical} críticas
- Indicadores: ${summary.indicators.length} ativos
- Riscos: ${summary.risks.length} mapeados, ${risksCritical} críticos
- CAPAs: ${summary.capas.length} total, ${capasPending} pendentes
- Auditorias: ${summary.audits.length} registradas
- Planos de Ação: ${summary.plans.length} total, ${plansOverdue} atrasados
- Eventos Adversos: ${summary.events.length} registrados

Detalhes das NCs recentes: ${JSON.stringify(summary.ncs.slice(0, 10))}
Detalhes dos riscos: ${JSON.stringify(summary.risks.slice(0, 10))}
Detalhes dos planos: ${JSON.stringify(summary.plans.slice(0, 10))}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Erro ao gerar relatório" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "Não foi possível gerar o relatório.";

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("executive report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
