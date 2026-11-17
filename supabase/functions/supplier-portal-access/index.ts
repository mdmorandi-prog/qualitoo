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
      .select("id, supplier_id, email, is_active, expires_at, access_count, revoked_at")
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

    if (action === "upload") {
      const name = typeof body.document_name === "string" ? body.document_name.trim().slice(0, 200) : "";
      const type = typeof body.document_type === "string" ? body.document_type.trim().slice(0, 80) : "outros";
      const fileName = typeof body.file_name === "string" ? body.file_name : "";
      const b64 = typeof body.file_base64 === "string" ? body.file_base64 : "";
      const contentType = typeof body.content_type === "string" ? body.content_type : "application/octet-stream";
      const notes = typeof body.notes === "string" ? body.notes.slice(0, 1000) : null;
      const allowed = ["application/pdf", "image/png", "image/jpeg", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!name || !b64 || !fileName) return json({ error: "Dados do documento incompletos" }, 400);
      if (!allowed.includes(contentType)) return json({ error: "Tipo de arquivo não permitido (PDF, imagem ou Word)" }, 400);
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      if (bytes.length > 10 * 1024 * 1024) return json({ error: "Arquivo maior que 10 MB" }, 400);
      const ext = (fileName.split(".").pop() ?? "bin").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
      const path = `${row.supplier_id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await admin.storage.from("supplier-docs").upload(path, bytes, { contentType });
      if (upErr) { console.error(upErr); return json({ error: "Falha no envio do arquivo" }, 500); }
      const { error: insErr } = await admin.from("supplier_portal_documents").insert({
        supplier_id: row.supplier_id, document_name: name, document_type: type,
        file_url: path, status: "pendente", notes,
      });
      if (insErr) { console.error(insErr); return json({ error: "Falha ao registrar documento" }, 500); }
    }

    const { data: supplier } = await admin
      .from("suppliers").select("id, name").eq("id", row.supplier_id).maybeSingle();
    const { data: docs } = await admin
      .from("supplier_portal_documents")
      .select("id, document_name, document_type, status, uploaded_at")
      .eq("supplier_id", row.supplier_id)
      .order("uploaded_at", { ascending: false });

    return json({ supplier, documents: docs ?? [], email: row.email, expires_at: row.expires_at });
  } catch (err) {
    console.error("supplier-portal-access error", err);
    return json({ error: "Erro interno" }, 500);
  }
});
