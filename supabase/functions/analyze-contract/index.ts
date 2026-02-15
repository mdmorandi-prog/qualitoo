import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { contractTitle, contractDescription, counterparty, category, durationMonths, notes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Analise o seguinte contrato e forneça uma avaliação jurídica detalhada:

**Título:** ${contractTitle || "Não informado"}
**Contraparte:** ${counterparty || "Não informada"}
**Categoria:** ${category || "Geral"}
**Duração:** ${durationMonths || 12} meses
**Descrição:** ${contractDescription || "Não informada"}
**Observações adicionais:** ${notes || "Nenhuma"}

Por favor, analise os seguintes aspectos:
1. **Fragilidades identificadas**: Pontos de risco ou lacunas no contrato
2. **Cláusulas recomendadas**: Cláusulas que deveriam ser incluídas
3. **Conformidade regulatória**: Adequação à legislação vigente (especialmente para contratos hospitalares - RDC ANVISA, LGPD, CDC)
4. **Riscos financeiros**: Potenciais exposições financeiras
5. **Recomendações de melhoria**: Sugestões concretas para fortalecer o contrato
6. **Score de risco**: De 1 (baixo risco) a 10 (alto risco)

Responda em português brasileiro, de forma estruturada usando markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um advogado especialista em contratos hospitalares e da área da saúde no Brasil. 
Possui profundo conhecimento em:
- Direito contratual brasileiro (Código Civil, Lei de Licitações)
- Regulamentação da saúde (ANVISA, ANS, RDCs)
- LGPD aplicada à saúde
- Contratos com fornecedores de materiais e equipamentos médicos
- Contratos de prestação de serviços hospitalares
- Contratos de manutenção de equipamentos
- Compliance e governança corporativa hospitalar

Analise sempre sob a ótica de proteção da instituição de saúde.`
          },
          { role: "user", content: prompt }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("analyze-contract error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
