import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuth, corsHeaders, AuthError } from "../_shared/auth-helper.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const { userId } = await requireAuth(authHeader);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    targetUserIds = targetUserIds.filter(id => id !== userId);

    if (targetUserIds.length === 0) {
      return new Response(JSON.stringify({ message: "No users to notify", notified: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create notifications
    const notifications = targetUserIds.map(uid => ({
      user_id: uid,
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
    if (error instanceof AuthError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("Distribution error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
