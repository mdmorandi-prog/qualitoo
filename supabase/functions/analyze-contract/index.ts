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
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
1. **Fragilidades identificadas**: Pontos de risco ou lacunas no contrato. Para cada fragilidade, cite o artigo de lei específico que fundamenta o alerta (ex: "Art. 421 do Código Civil", "Art. 18 da LGPD - Lei 13.709/2018", "Art. 35 do CDC - Lei 8.078/1990", "RDC nº 36/2013 da ANVISA, Art. X").
2. **Cláusulas recomendadas**: Cláusulas que deveriam ser incluídas, citando o fundamento legal de cada recomendação (artigo e lei específica).
3. **Conformidade regulatória**: Adequação à legislação vigente, indicando artigo por artigo quais normas se aplicam (RDCs ANVISA com número e artigo, LGPD com artigo, CDC com artigo, Código Civil com artigo, Lei 8.666/1993 ou Lei 14.133/2021 com artigo quando aplicável).
4. **Riscos financeiros**: Potenciais exposições financeiras, citando as penalidades previstas em lei quando aplicável (ex: "multa de até 2% do faturamento conforme Art. 52 da LGPD").
5. **Recomendações de melhoria**: Sugestões concretas para fortalecer o contrato, cada uma com a respectiva base legal.
6. **Score de risco**: De 1 (baixo risco) a 10 (alto risco)

**IMPORTANTE**: Toda recomendação, alerta ou melhoria DEVE obrigatoriamente citar o artigo específico da lei em que se baseia, no formato: (Art. X da Lei Y/Ano). Nunca faça uma recomendação sem fundamentação legal.

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
- Código Civil Brasileiro (Lei 10.406/2002) - especialmente Livro I, Título V (Dos Contratos)
- Lei de Licitações (Lei 14.133/2021 e Lei 8.666/1993)
- LGPD (Lei 13.709/2018) aplicada à saúde
- Código de Defesa do Consumidor (Lei 8.078/1990)
- RDCs da ANVISA (RDC 36/2013, RDC 63/2011, RDC 302/2005, RDC 50/2002, etc.)
- Resoluções ANS
- Lei dos Planos de Saúde (Lei 9.656/1998)
- CLT (Decreto-Lei 5.452/1943) para contratos trabalhistas
- Marco Civil da Internet (Lei 12.965/2014) para contratos de tecnologia

REGRA FUNDAMENTAL: Toda recomendação, alerta ou melhoria que você fizer DEVE OBRIGATORIAMENTE citar o artigo específico da lei que a fundamenta. Use o formato: (Art. X da Lei Y/Ano) ou (Art. X da RDC nº Z/Ano da ANVISA). Jamais faça afirmações jurídicas sem citar a base legal precisa.

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
