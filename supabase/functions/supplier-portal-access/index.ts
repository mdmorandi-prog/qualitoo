import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MAX_REQUESTS_PER_HOUR = 30;

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const action = typeof body.action === "string" ? body.action : "portal_access";

    if (!token || token.length < 16 || token.length > 128 || !/^[a-zA-Z0-9-]+$/.test(token)) {
      return json({ error: "Token inválido" }, 400);
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const { data: row } = await admin
      .from("supplier_portal_tokens")
      .select("id, supplier_id, email, is_active, expires_at, access_count")
      .eq("token", token)
      .maybeSingle();

    if (!row || !row.is_active || row.revoked_at) {
      return json({ error: "Acesso revogado ou inexistente" }, 401);
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return json({ error: "Token expirado. Solicite um novo acesso." }, 401);
    }

    // Rate limit: máximo de acessos por hora por token
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("supplier_portal_access_log")
      .select("id", { count: "exact", head: true })
      .eq("token_id", row.id)
      .gte("created_at", since);

    if ((count ?? 0) >= MAX_REQUESTS_PER_HOUR) {
      await admin.from("supplier_portal_access_log").insert({
        token_id: row.id, supplier_id: row.supplier_id, action: "rate_limited",
        ip_address: ip, user_agent: userAgent,
      });
      return json({ error: "Limite de acessos por hora excedido. Tente mais tarde." }, 429);
    }

    await admin.from("supplier_portal_access_log").insert({
      token_id: row.id, supplier_id: row.supplier_id, action,
      ip_address: ip, user_agent: userAgent,
    });
    await admin
      .from("supplier_portal_tokens")
      .update({
        last_accessed_at: new Date().toISOString(),
        last_ip: ip,
        access_count: (row.access_count ?? 0) + 1,
      })
      .eq("id", row.id);

    const { data: supplier } = await admin
      .from("suppliers").select("id, name").eq("id", row.supplier_id).maybeSingle();
    const { data: docs } = await admin
      .from("supplier_portal_documents")
      .select("id, document_name, document_type, status, uploaded_at")
      .eq("supplier_id", row.supplier_id)
      .order("uploaded_at", { ascending: false });

    return json({ supplier, documents: docs ?? [], email: row.email });
  } catch (err) {
    console.error("supplier-portal-access error", err);
    return json({ error: "Erro interno" }, 500);
  }
});
