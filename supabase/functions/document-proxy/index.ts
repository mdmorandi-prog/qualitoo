import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Parse request
    const { storagePath, bucketName } = await req.json();

    if (!storagePath || !bucketName) {
      return new Response(
        JSON.stringify({ error: "storagePath and bucketName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Authorize: verify user can access this document via RLS
    // Check if the file_url or storage path matches a document the user can see
    const { data: doc, error: docError } = await userClient
      .from("quality_documents")
      .select("id")
      .or(`file_url.ilike.%${storagePath}%`)
      .limit(1)
      .maybeSingle();

    if (docError || !doc) {
      return new Response(
        JSON.stringify({ error: "Document not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Download with service role (needed for private bucket access)
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
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
