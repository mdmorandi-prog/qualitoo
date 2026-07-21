// Qualitoo — Scheduler / Alert Runner
// Runs periodically via pg_cron. Handles:
//  1. Scheduled reports (scheduled_reports.next_send_at)
//  2. Expiry alerts: contracts, trainings, calibrations, quality_documents, capas, action_plans
// Public endpoint protected by SCHEDULER_SECRET header.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-scheduler-secret, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function getSchedulerToken(): Promise<string> {
  const { data } = await supabase.from("system_settings").select("value").eq("key", "scheduler_token").maybeSingle();
  return (data?.value as string) ?? "";
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

function esc(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function wrap(subject: string, bodyHtml: string) {
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0f766e,#0d9488);padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:20px">Qualitoo</h1>
      <p style="color:#ccfbf1;margin:4px 0 0;font-size:13px">Sistema de Gestão da Qualidade</p>
    </div>
    <div style="padding:28px 32px;color:#1e293b">
      <h2 style="font-size:17px;margin:0 0 14px">${esc(subject)}</h2>
      <div style="color:#475569;font-size:14px;line-height:1.6">${bodyHtml}</div>
    </div>
    <div style="background:#f8fafc;padding:14px 32px;border-top:1px solid #e2e8f0">
      <p style="color:#94a3b8;font-size:12px;margin:0">E-mail automático do Qualitoo. Não responda.</p>
    </div>
  </div>`;
}

async function sendMail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Qualitoo <sgq@hbsc.com.br>", to: [to], subject, html }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Resend ${r.status}: ${t}`);
  }
  return r.json();
}

async function logQueued(to: string, subject: string, body: string, status: string, err?: string) {
  await supabase.from("email_queue").insert({
    to_email: to, subject, body, status, error_message: err ?? null,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });
}

function nextSendAt(frequency: string, from = new Date()): Date {
  const d = new Date(from);
  switch ((frequency || "").toLowerCase()) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly":
    case "annually": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setDate(d.getDate() + 1);
  }
  return d;
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// ---------- Scheduled reports ----------
async function processScheduledReports() {
  const nowIso = new Date().toISOString();
  const { data: due } = await supabase
    .from("scheduled_reports")
    .select("*")
    .eq("is_active", true)
    .lte("next_send_at", nowIso)
    .limit(50);

  let sent = 0, failed = 0;
  for (const rep of due ?? []) {
    try {
      // Build a quick summary snapshot
      const [{ count: nc }, { count: capa }, { count: risk }, { count: ev }] = await Promise.all([
        supabase.from("non_conformities").select("id", { count: "exact", head: true }),
        supabase.from("capas").select("id", { count: "exact", head: true }).neq("status", "concluida"),
        supabase.from("risks").select("id", { count: "exact", head: true }),
        supabase.from("adverse_events").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
      ]);

      const html = wrap(rep.title, `
        <p>Relatório periódico (<strong>${esc(rep.frequency)}</strong>) do Qualitoo.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0">
          <tr><td style="padding:8px;border:1px solid #e2e8f0">Não Conformidades (total)</td><td style="padding:8px;border:1px solid #e2e8f0"><strong>${nc ?? 0}</strong></td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0">CAPAs abertas</td><td style="padding:8px;border:1px solid #e2e8f0"><strong>${capa ?? 0}</strong></td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0">Riscos cadastrados</td><td style="padding:8px;border:1px solid #e2e8f0"><strong>${risk ?? 0}</strong></td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0">Eventos adversos (30d)</td><td style="padding:8px;border:1px solid #e2e8f0"><strong>${ev ?? 0}</strong></td></tr>
        </table>
        <p style="color:#64748b;font-size:12px">Acesse o Qualitoo para o detalhamento completo.</p>
      `);

      for (const email of (rep.recipients ?? [])) {
        try {
          await sendMail(email, rep.title, html);
          await logQueued(email, rep.title, "Relatório agendado", "sent");
          sent++;
        } catch (e) {
          await logQueued(email, rep.title, "Relatório agendado", "failed", (e as Error).message);
          failed++;
        }
      }

      await supabase.from("scheduled_reports").update({
        last_sent_at: nowIso,
        next_send_at: nextSendAt(rep.frequency).toISOString(),
      }).eq("id", rep.id);
    } catch (e) {
      console.error("scheduled_report error", rep.id, e);
      failed++;
    }
  }
  return { sent, failed, due: due?.length ?? 0 };
}

// ---------- Expiry alerts ----------
// Prevents duplicate notifications for same module+reference+bucket day.
async function alreadyAlerted(module: string, referenceId: string, bucket: number): Promise<boolean> {
  const since = new Date(Date.now() - 20 * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("module", module)
    .eq("reference_id", referenceId)
    .ilike("title", `%${bucket}d%`)
    .gte("created_at", since)
    .limit(1);
  return !!data && data.length > 0;
}

async function adminEmails(): Promise<string[]> {
  const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  const emails: string[] = [];
  for (const r of roles ?? []) {
    const { data } = await supabase.auth.admin.getUserById(r.user_id);
    if (data?.user?.email) emails.push(data.user.email);
  }
  return emails;
}

async function notifyAdmins(module: string, referenceId: string, subject: string, bodyHtml: string, bucket: number) {
  if (await alreadyAlerted(module, referenceId, bucket)) return 0;

  const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
  const notifTitle = `[${bucket}d] ${subject}`;
  const notifRows = (roles ?? []).map((r) => ({
    user_id: r.user_id,
    title: notifTitle,
    message: subject,
    type: bucket <= 0 ? "error" : bucket <= 7 ? "warning" : "info",
    module,
    reference_id: referenceId,
  }));
  if (notifRows.length) await supabase.from("notifications").insert(notifRows);

  const emails = await adminEmails();
  const html = wrap(subject, bodyHtml);
  let sent = 0;
  for (const email of emails) {
    try {
      await sendMail(email, subject, html);
      await logQueued(email, subject, subject, "sent");
      sent++;
    } catch (e) {
      await logQueued(email, subject, subject, "failed", (e as Error).message);
    }
  }
  return sent;
}

const ALERT_BUCKETS = [30, 15, 7, 1, 0];

async function scanExpiries() {
  const results: Record<string, number> = {};

  // Contracts (end_date, alert_days_before)
  const { data: contracts } = await supabase
    .from("contracts").select("id,title,contract_number,counterparty,end_date,alert_days_before,status")
    .neq("status", "encerrado").not("end_date", "is", null);
  let c = 0;
  for (const r of contracts ?? []) {
    const d = daysUntil(r.end_date);
    if (d === null) continue;
    const threshold = r.alert_days_before ?? 30;
    const bucket = ALERT_BUCKETS.find((b) => d === b && b <= threshold);
    if (bucket === undefined) continue;
    c += await notifyAdmins(
      "contracts", r.id,
      `Contrato "${r.title}" vence em ${d} dia(s)`,
      `<p>O contrato <strong>${esc(r.title)}</strong> (${esc(r.contract_number ?? "s/nº")}) com <strong>${esc(r.counterparty ?? "-")}</strong> vence em <strong>${d} dia(s)</strong> (${esc(r.end_date)}).</p>`,
      bucket,
    );
  }
  results.contracts = c;

  // Trainings expiry_date
  const { data: trainings } = await supabase
    .from("trainings").select("id,title,sector,expiry_date").not("expiry_date", "is", null);
  c = 0;
  for (const r of trainings ?? []) {
    const d = daysUntil(r.expiry_date);
    if (d === null) continue;
    const bucket = ALERT_BUCKETS.find((b) => d === b);
    if (bucket === undefined) continue;
    c += await notifyAdmins(
      "trainings", r.id,
      `Reciclagem de treinamento "${r.title}" em ${d} dia(s)`,
      `<p>O treinamento <strong>${esc(r.title)}</strong> (setor ${esc(r.sector ?? "-")}) precisa de reciclagem em <strong>${d} dia(s)</strong>.</p>`,
      bucket,
    );
  }
  results.trainings = c;

  // Calibrations next_calibration_date
  const { data: cals } = await supabase
    .from("calibrations").select("id,equipment_id,next_calibration_date").not("next_calibration_date", "is", null);
  c = 0;
  for (const r of cals ?? []) {
    const d = daysUntil(r.next_calibration_date);
    if (d === null) continue;
    const bucket = ALERT_BUCKETS.find((b) => d === b);
    if (bucket === undefined) continue;
    c += await notifyAdmins(
      "calibrations", r.id,
      `Calibração vence em ${d} dia(s)`,
      `<p>Existe uma calibração de equipamento com vencimento em <strong>${d} dia(s)</strong> (${esc(r.next_calibration_date)}).</p>`,
      bucket,
    );
  }
  results.calibrations = c;

  // Quality documents valid_until
  const { data: docs } = await supabase
    .from("quality_documents").select("id,title,code,valid_until,status").not("valid_until", "is", null);
  c = 0;
  for (const r of docs ?? []) {
    const d = daysUntil(r.valid_until);
    if (d === null) continue;
    const bucket = ALERT_BUCKETS.find((b) => d === b);
    if (bucket === undefined) continue;
    c += await notifyAdmins(
      "quality_documents", r.id,
      `Documento "${r.title}" vence em ${d} dia(s)`,
      `<p>O documento <strong>${esc(r.title)}</strong> (${esc(r.code ?? "-")}) vence em <strong>${d} dia(s)</strong> e precisa de revisão.</p>`,
      bucket,
    );
  }
  results.documents = c;

  // CAPAs deadline
  const { data: capas } = await supabase
    .from("capas").select("id,title,deadline,status").neq("status", "concluida").not("deadline", "is", null);
  c = 0;
  for (const r of capas ?? []) {
    const d = daysUntil(r.deadline);
    if (d === null) continue;
    const bucket = ALERT_BUCKETS.find((b) => d === b);
    if (bucket === undefined) continue;
    c += await notifyAdmins(
      "capas", r.id,
      `CAPA "${r.title}" com prazo em ${d} dia(s)`,
      `<p>A CAPA <strong>${esc(r.title)}</strong> tem prazo em <strong>${d} dia(s)</strong>.</p>`,
      bucket,
    );
  }
  results.capas = c;

  // Action plans when_end
  const { data: aps } = await supabase
    .from("action_plans").select("id,title,when_end,status").neq("status", "concluido").not("when_end", "is", null);
  c = 0;
  for (const r of aps ?? []) {
    const d = daysUntil(r.when_end);
    if (d === null) continue;
    const bucket = ALERT_BUCKETS.find((b) => d === b);
    if (bucket === undefined) continue;
    c += await notifyAdmins(
      "action_plans", r.id,
      `Plano de ação "${r.title}" com prazo em ${d} dia(s)`,
      `<p>O plano de ação <strong>${esc(r.title)}</strong> tem prazo em <strong>${d} dia(s)</strong>.</p>`,
      bucket,
    );
  }
  results.action_plans = c;

  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: require scheduler secret header (used by pg_cron) OR admin JWT
  const provided = req.headers.get("x-scheduler-secret") ?? "";
  const isCron = SCHEDULER_SECRET && provided === SCHEDULER_SECRET;

  if (!isCron) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await anon.auth.getClaims(token);
    if (!claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", claims.claims.sub).eq("role", "admin").maybeSingle();
    if (!role) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  try {
    const reports = await processScheduledReports();
    const expiries = await scanExpiries();
    return new Response(JSON.stringify({ success: true, reports, expiries, ranAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scheduler error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
