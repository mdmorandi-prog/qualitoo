import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, user_id, subject, body, module, reference_id } = await req.json();

    if (action === "notify") {
      // Create in-app notification
      if (user_id) {
        await supabase.from("notifications").insert({
          user_id,
          title: subject,
          message: body,
          type: "info",
          module: module || null,
          reference_id: reference_id || null,
        });
      }

      // Queue email (for future SMTP integration)
      if (user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user_id)
          .maybeSingle();

        // Get user email from auth
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user_id);
        
        if (authUser?.email) {
          await supabase.from("email_queue").insert({
            to_user_id: user_id,
            to_email: authUser.email,
            subject,
            body,
            status: "pending",
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process pending emails (called by cron or manually)
    if (action === "process_queue") {
      const { data: pending } = await supabase
        .from("email_queue")
        .select("*")
        .eq("status", "pending")
        .limit(50);

      // For now, mark as "queued" - SMTP integration can be added later
      if (pending && pending.length > 0) {
        const ids = pending.map((e: any) => e.id);
        await supabase
          .from("email_queue")
          .update({ status: "queued" })
          .in("id", ids);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        processed: pending?.length ?? 0,
        message: "Emails queued. Configure SMTP for actual delivery." 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
