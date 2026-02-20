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

    const { audit_id, audit_title, audit_type, sector, scope } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch relevant data for the audit sector
    const sectorFilter = sector ? `.eq("sector", "${sector}")` : "";
    const [ncRes, riskRes, docRes, prevAudRes, capaRes] = await Promise.all([
      admin.from("non_conformities").select("title, severity, status, sector").order("created_at", { ascending: false }).limit(20),
      admin.from("risks").select("title, risk_level, status, sector, category").order("risk_level", { ascending: false }).limit(20),
      admin.from("quality_documents").select("title, status, category, sector, valid_until").limit(20),
      admin.from("audits").select("title, status, conclusion, findings, sector").order("scheduled_date", { ascending: false }).limit(10),
      admin.from("capas").select("title, status, sector, is_effective").limit(15),
    ]);

    const context = {
      ncs: (ncRes.data || []).filter((n: any) => !sector || n.sector === sector),
      risks: (riskRes.data || []).filter((r: any) => !sector || r.sector === sector),
      docs: (docRes.data || []).filter((d: any) => !sector || d.sector === sector),
      prevAudits: (prevAudRes.data || []).filter((a: any) => !sector || a.sector === sector),
      capas: (capaRes.data || []).filter((c: any) => !sector || c.sector === sector),
    };

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
            content: `Você é um auditor líder experiente em qualidade hospitalar. Gere um briefing de preparação para auditoria em markdown com:
## 🔍 Briefing de Auditoria: [título]
### Pontos de Atenção Prioritários
### NCs Abertas no Setor (verificar tratamento)
### Riscos Críticos (verificar controles)
### Documentos a Verificar (validade e conformidade)
### Achados de Auditorias Anteriores (acompanhamento)
### CAPAs Pendentes (verificar eficácia)
### Checklist Sugerido de Verificação
### Dicas para o Auditor

Seja prático e acionável. Foque nos pontos que o auditor deve verificar in loco.`,
          },
          {
            role: "user",
            content: `Auditoria: ${audit_title}
Tipo: ${audit_type}
Setor: ${sector || "Geral"}
Escopo: ${scope || "Não definido"}

NCs do setor: ${JSON.stringify(context.ncs.slice(0, 10))}
Riscos: ${JSON.stringify(context.risks.slice(0, 10))}
Documentos: ${JSON.stringify(context.docs.slice(0, 10))}
Auditorias anteriores: ${JSON.stringify(context.prevAudits.slice(0, 5))}
CAPAs: ${JSON.stringify(context.capas.slice(0, 10))}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Erro ao gerar briefing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const briefing = data.choices?.[0]?.message?.content || "Não foi possível gerar o briefing.";

    return new Response(JSON.stringify({ briefing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("audit briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
