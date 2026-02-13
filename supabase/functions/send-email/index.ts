import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmailViaResend(to: string, subject: string, htmlBody: string) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "SGQ Hospitalar <onboarding@resend.dev>",
      to: [to],
      subject,
      html: htmlBody,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || JSON.stringify(data));
  }
  return data;
}

function buildEmailHtml(subject: string, body: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #0f766e, #0d9488); padding: 24px 32px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">SGQ Hospitalar</h1>
        <p style="color: #ccfbf1; margin: 4px 0 0; font-size: 13px;">Sistema de Gestão da Qualidade</p>
      </div>
      <div style="padding: 32px;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 16px;">${subject}</h2>
        <div style="color: #475569; font-size: 15px; line-height: 1.6;">${body}</div>
      </div>
      <div style="background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">Este é um e-mail automático do SGQ Hospitalar. Não responda.</p>
      </div>
    </div>
  `;
}

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

      // Send email immediately
      if (user_id) {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(user_id);

        if (authUser?.email) {
          const htmlBody = buildEmailHtml(subject, body);

          try {
            await sendEmailViaResend(authUser.email, subject, htmlBody);

            await supabase.from("email_queue").insert({
              to_user_id: user_id,
              to_email: authUser.email,
              subject,
              body,
              status: "sent",
              sent_at: new Date().toISOString(),
            });
          } catch (emailError) {
            // Queue for retry if sending fails
            await supabase.from("email_queue").insert({
              to_user_id: user_id,
              to_email: authUser.email,
              subject,
              body,
              status: "failed",
              error_message: emailError.message,
            });
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process pending/failed emails (called by cron or manually)
    if (action === "process_queue") {
      const { data: pending } = await supabase
        .from("email_queue")
        .select("*")
        .in("status", ["pending", "failed"])
        .limit(50);

      let sent = 0;
      let errors = 0;

      if (pending && pending.length > 0) {
        for (const email of pending) {
          try {
            const htmlBody = buildEmailHtml(email.subject, email.body);
            await sendEmailViaResend(email.to_email, email.subject, htmlBody);

            await supabase
              .from("email_queue")
              .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
              .eq("id", email.id);
            sent++;
          } catch (err) {
            await supabase
              .from("email_queue")
              .update({ status: "failed", error_message: err.message })
              .eq("id", email.id);
            errors++;
          }
        }
      }

      return new Response(JSON.stringify({ success: true, sent, errors }), {
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
