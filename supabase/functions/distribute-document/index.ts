import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentId, documentTitle, documentSector, documentCode } = await req.json();

    if (!documentId || !documentTitle) {
      return new Response(JSON.stringify({ error: "documentId and documentTitle are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find users with access to the sector
    let targetUserIds: string[] = [];

    if (documentSector) {
      // Get users in groups with access to this sector
      const { data: sectorUsers } = await adminClient
        .from("user_group_access")
        .select(`
          user_id,
          access_group_sectors!inner(sector)
        `)
        .eq("access_group_sectors.sector", documentSector);

      if (sectorUsers) {
        targetUserIds = [...new Set(sectorUsers.map((u: any) => u.user_id))];
      }
    }

    // Also get all admins
    const { data: adminUsers } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (adminUsers) {
      targetUserIds = [...new Set([...targetUserIds, ...adminUsers.map((u: any) => u.user_id)])];
    }

    // Remove the user who published the document
    targetUserIds = targetUserIds.filter(id => id !== user.id);

    if (targetUserIds.length === 0) {
      return new Response(JSON.stringify({ message: "No users to notify", notified: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create notifications
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      title: "📄 Novo Documento Publicado",
      message: `O documento "${documentCode ? documentCode + ' - ' : ''}${documentTitle}" foi aprovado e publicado${documentSector ? ` no setor ${documentSector}` : ''}. Acesse para leitura e confirmação.`,
      type: "documento_publicado",
      module: "documents",
      reference_id: documentId,
    }));

    const { error: notifError } = await adminClient
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Notification error:", notifError);
      return new Response(JSON.stringify({ error: "Failed to create notifications" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Notifications sent", notified: targetUserIds.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Distribution error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
