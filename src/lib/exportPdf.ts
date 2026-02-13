import { supabase } from "@/integrations/supabase/client";

export const generateSignatureBlockHtml = async (documentId: string): Promise<string> => {
  const { data: sigs } = await supabase
    .from("document_signatures")
    .select("signer_name, signer_email, signature_hash, signed_at, signature_role, is_verified")
    .eq("document_id", documentId)
    .is("revoked_at", null)
    .order("signed_at", { ascending: true });

  const signatures = (sigs as any[]) ?? [];
  const roles = [
    { key: "elaborado", label: "ELABORADO POR" },
    { key: "aprovado", label: "APROVADO POR" },
    { key: "validado", label: "VALIDADO POR" },
  ];

  return `
    <div style="margin-top:40px;border-top:2px solid #1a5f73;padding-top:16px">
      <p style="font-size:13px;font-weight:bold;color:#1a5f73;margin-bottom:12px">Controle de Assinaturas Eletrônicas</p>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr>
          ${roles.map(r => {
            const sig = signatures.find(s => s.signature_role === r.key);
            return `<td style="width:33.3%;vertical-align:top;padding:8px;border:1px solid #ddd">
              <p style="font-weight:bold;color:#1a5f73;margin:0 0 8px 0;font-size:10px;letter-spacing:1px">${r.label}</p>
              ${sig ? `
                <p style="margin:0 0 2px 0;font-weight:bold">${sig.signer_name}</p>
                <p style="margin:0 0 2px 0;color:#666">${sig.signer_email}</p>
                <p style="margin:0 0 6px 0;color:#666">${new Date(sig.signed_at).toLocaleString("pt-BR")}</p>
                <div style="background:#f5f5f5;padding:4px 6px;border-radius:3px;word-break:break-all">
                  <p style="margin:0 0 2px 0;font-size:9px;color:#999;font-weight:bold">Hash SHA-256:</p>
                  <p style="margin:0;font-family:monospace;font-size:8px;color:#333">${sig.signature_hash}</p>
                </div>
                ${sig.is_verified ? '<p style="margin:4px 0 0 0;color:#16a34a;font-size:10px">✓ Identidade verificada</p>' : ''}
              ` : `
                <div style="text-align:center;padding:16px 0;color:#ccc">
                  <p style="margin:0;font-size:24px">—</p>
                  <p style="margin:4px 0 0 0;font-size:10px">Pendente</p>
                </div>
              `}
            </td>`;
          }).join("")}
        </tr>
      </table>
      <p style="text-align:center;font-size:9px;color:#999;margin-top:8px">
        Assinaturas eletrônicas com integridade garantida por hash criptográfico SHA-256
      </p>
    </div>`;
};

export const exportDashboardPdf = async () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");

  const [ncRes, indRes, measRes, docRes, audRes, planRes, riskRes, trainRes, evRes, capaRes] = await Promise.all([
    supabase.from("non_conformities").select("id, status, severity"),
    supabase.from("quality_indicators").select("id, target_value, name"),
    supabase.from("indicator_measurements").select("indicator_id, value").order("period_date", { ascending: false }),
    supabase.from("quality_documents").select("id, status, valid_until"),
    supabase.from("audits").select("id, status, scheduled_date"),
    supabase.from("action_plans").select("id, status, progress"),
    supabase.from("risks").select("id, risk_level, status"),
    supabase.from("trainings").select("id, status, expiry_date"),
    supabase.from("adverse_events").select("id, severity, status"),
    supabase.from("capas").select("id, status"),
  ]);

  const ncs = (ncRes.data as any[]) ?? [];
  const inds = (indRes.data as any[]) ?? [];
  const meas = (measRes.data as any[]) ?? [];
  const docs = (docRes.data as any[]) ?? [];
  const auds = (audRes.data as any[]) ?? [];
  const plans = (planRes.data as any[]) ?? [];
  const risks = (riskRes.data as any[]) ?? [];
  const trains = (trainRes.data as any[]) ?? [];
  const events = (evRes.data as any[]) ?? [];
  const capas = (capaRes.data as any[]) ?? [];

  const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30);

  const indBelow = inds.filter(ind => {
    const last = meas.find(m => m.indicator_id === ind.id);
    return last && last.value < ind.target_value;
  }).length;

  const sections = [
    {
      title: "Não Conformidades",
      items: [
        `Total: ${ncs.length}`,
        `Abertas: ${ncs.filter(n => n.status !== "concluida").length}`,
        `Críticas (abertas): ${ncs.filter(n => (n.severity === "alta" || n.severity === "critica") && n.status !== "concluida").length}`,
        `Concluídas: ${ncs.filter(n => n.status === "concluida").length}`,
      ],
    },
    {
      title: "Indicadores de Qualidade",
      items: [
        `Total de indicadores: ${inds.length}`,
        `Abaixo da meta: ${indBelow}`,
        `Na meta ou acima: ${inds.length - indBelow}`,
      ],
    },
    {
      title: "Documentos",
      items: [
        `Total: ${docs.length}`,
        `A vencer (30 dias): ${docs.filter(d => d.status === "aprovado" && d.valid_until && new Date(d.valid_until) < thirtyDays).length}`,
        `Aprovados: ${docs.filter(d => d.status === "aprovado").length}`,
      ],
    },
    {
      title: "Auditorias",
      items: [
        `Total: ${auds.length}`,
        `Planejadas: ${auds.filter(a => a.status === "planejada").length}`,
        `Em Andamento: ${auds.filter(a => a.status === "em_andamento").length}`,
        `Concluídas: ${auds.filter(a => a.status === "concluida").length}`,
      ],
    },
    {
      title: "Planos de Ação",
      items: [
        `Total: ${plans.length}`,
        `Pendentes: ${plans.filter(p => p.status === "pendente").length}`,
        `Em Andamento: ${plans.filter(p => p.status === "em_andamento").length}`,
        `Concluídos: ${plans.filter(p => p.status === "concluido").length}`,
      ],
    },
    {
      title: "Gestão de Riscos",
      items: [
        `Total: ${risks.length}`,
        `Críticos (≥15): ${risks.filter(r => (r.risk_level ?? 0) >= 15).length}`,
        `Altos (10-14): ${risks.filter(r => { const l = r.risk_level ?? 0; return l >= 10 && l < 15; }).length}`,
      ],
    },
    {
      title: "Treinamentos",
      items: [
        `Total: ${trains.length}`,
        `A vencer (30 dias): ${trains.filter(t => t.expiry_date && new Date(t.expiry_date) < thirtyDays && new Date(t.expiry_date) > now).length}`,
      ],
    },
    {
      title: "Eventos Adversos",
      items: [
        `Total: ${events.length}`,
        `Graves/Sentinela abertos: ${events.filter(e => (e.severity === "grave" || e.severity === "sentinela") && e.status !== "encerrado").length}`,
        `Encerrados: ${events.filter(e => e.status === "encerrado").length}`,
      ],
    },
    {
      title: "CAPA",
      items: [
        `Total: ${capas.length}`,
        `Abertas: ${capas.filter(c => c.status !== "encerrada").length}`,
        `Encerradas: ${capas.filter(c => c.status === "encerrada").length}`,
      ],
    },
  ];

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Relatório SGQ - ${dateStr}</title>
<style>
  body{font-family:Arial,sans-serif;margin:40px;color:#1a3a4a}
  h1{font-size:22px;border-bottom:2px solid #1a5f73;padding-bottom:8px;margin-bottom:4px}
  .date{color:#666;font-size:13px;margin-bottom:24px}
  h2{font-size:16px;color:#1a5f73;margin-top:24px;margin-bottom:8px;border-left:4px solid #1a5f73;padding-left:8px}
  ul{margin:0 0 8px 0;padding-left:20px}
  li{font-size:13px;line-height:1.8}
  .footer{margin-top:40px;border-top:1px solid #ccc;padding-top:8px;font-size:11px;color:#999;text-align:center}
  @media print{body{margin:20px}}
</style></head><body>
<h1>Relatório Consolidado — SGQ Hospitalar</h1>
<p class="date">Gerado em: ${dateStr} às ${now.toLocaleTimeString("pt-BR")}</p>
${sections.map(s => `<h2>${s.title}</h2><ul>${s.items.map(i => `<li>${i}</li>`).join("")}</ul>`).join("")}
<div class="footer">Sistema de Gestão da Qualidade — Relatório gerado automaticamente</div>
</body></html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
};
