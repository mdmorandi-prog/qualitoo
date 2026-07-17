import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function client(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "create_nonconformity",
  title: "Registrar não conformidade",
  description: "Registra uma nova não conformidade (NC) no Qualitoo em nome do usuário autenticado.",
  inputSchema: {
    title: z.string().min(3).max(200).describe("Título curto da NC."),
    description: z.string().min(5).describe("Descrição detalhada."),
    severity: z.enum(["low", "medium", "high", "critical"]).describe("Severidade da NC."),
    sector: z.string().optional().describe("Setor/área hospitalar (ex.: UTI, Emergência)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, description, severity, sector }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Não autenticado" }], isError: true };
    const { data, error } = await client(ctx)
      .from("non_conformities")
      .insert({
        title,
        description,
        severity,
        sector: sector ?? null,
        status: "open",
        created_by: ctx.getUserId(),
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `NC criada: ${data.id}` }],
      structuredContent: { non_conformity: data },
    };
  },
});
