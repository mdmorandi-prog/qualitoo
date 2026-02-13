import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description, severity, sector } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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
            content: `Você é um especialista em Gestão da Qualidade Hospitalar e análise de causa raiz. 
Dado um problema (Não Conformidade ou CAPA), você deve retornar uma análise estruturada em JSON.

Responda APENAS com JSON válido no seguinte formato (sem markdown, sem code blocks):
{
  "root_cause_summary": "Resumo conciso da causa raiz em 2-3 frases",
  "five_whys": [
    {"question": "Por que isso aconteceu?", "answer": "..."},
    {"question": "Por que [resposta anterior]?", "answer": "..."},
    {"question": "Por que [resposta anterior]?", "answer": "..."},
    {"question": "Por que [resposta anterior]?", "answer": "..."},
    {"question": "Por que [resposta anterior]?", "answer": "..."}
  ],
  "ishikawa": {
    "mao_de_obra": ["causa 1", "causa 2"],
    "metodo": ["causa 1"],
    "maquina": ["causa 1"],
    "material": ["causa 1"],
    "meio_ambiente": ["causa 1"],
    "medida": ["causa 1"]
  },
  "corrective_action": "Sugestão de ação corretiva",
  "preventive_action": "Sugestão de ação preventiva"
}

Seja específico e técnico para o contexto hospitalar. Cada categoria do Ishikawa deve ter pelo menos 1 causa relevante.`
          },
          {
            role: "user",
            content: `Analise a seguinte Não Conformidade:
Título: ${title}
Descrição: ${description}
Severidade: ${severity || "não informada"}
Setor: ${sector || "não informado"}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente." }), {
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

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse the JSON response, handling potential markdown wrapping
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-root-cause error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
