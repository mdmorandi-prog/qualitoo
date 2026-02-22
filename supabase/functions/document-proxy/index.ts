import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, corsHeaders, AuthError } from "../_shared/auth-helper.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { userClient } = await requireAuth(authHeader);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Parse request
    const { storagePath, bucketName } = await req.json();

    if (!storagePath || !bucketName) {
      return new Response(
        JSON.stringify({ error: "storagePath and bucketName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate path — reject traversal attempts
    const normalizedPath = storagePath.replace(/\.\./g, '').replace(/\/\//g, '/');
    if (normalizedPath !== storagePath) {
      return new Response(
        JSON.stringify({ error: "Invalid path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authorize: verify user can access this document via RLS (exact match)
    const fullUrl = `${bucketName}/${storagePath}`;
    const { data: doc, error: docError } = await userClient
      .from("quality_documents")
      .select("id, file_url")
      .or(`file_url.eq.${fullUrl},file_url.eq.${storagePath}`)
      .limit(1)
      .maybeSingle();

    if (docError || !doc) {
      return new Response(
        JSON.stringify({ error: "Document not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download with service role (needed for private bucket access)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await adminClient.storage
      .from(bucketName)
      .download(storagePath);

    if (error) {
      console.error("Download error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to download document" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileBuffer = await data.arrayBuffer();
    const contentType = data.type || "application/pdf";

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${storagePath.split("/").pop()}"`,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
