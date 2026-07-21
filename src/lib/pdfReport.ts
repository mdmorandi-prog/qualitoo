// Reusable branded PDF report generator (Qualitoo).
// Opens a new window with a professional print-ready HTML template that
// the browser exports to PDF via window.print().

export interface ReportKpi {
  label: string;
  value: string | number;
  hint?: string;
}

export interface ReportColumn<T = any> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  align?: "left" | "right" | "center";
  width?: string; // css width
}

export interface ReportOptions<T = any> {
  /** Module name / report title, e.g. "Não Conformidades" */
  title: string;
  subtitle?: string;
  /** Optional filters summary text (period, sector, status…) */
  filters?: string;
  kpis?: ReportKpi[];
  columns: ReportColumn<T>[];
  rows: T[];
  /** Optional raw HTML block appended after the table (e.g. inline SVG chart, notes) */
  extraHtml?: string;
  /** Optional footer text */
  footer?: string;
  /** Auto-print when the window loads (default true) */
  autoPrint?: boolean;
  /** Landscape orientation for wide tables */
  landscape?: boolean;
}

const escape = (v: unknown): string => {
  if (v === null || v === undefined) return "—";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

export const generateModuleReport = <T,>(opts: ReportOptions<T>): void => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR");

  const kpisHtml = opts.kpis?.length
    ? `<section class="kpis">${opts.kpis
        .map(
          (k) => `
        <div class="kpi">
          <p class="kpi-label">${escape(k.label)}</p>
          <p class="kpi-value">${escape(k.value)}</p>
          ${k.hint ? `<p class="kpi-hint">${escape(k.hint)}</p>` : ""}
        </div>`
        )
        .join("")}</section>`
    : "";

  const headHtml = opts.columns
    .map(
      (c) =>
        `<th style="text-align:${c.align ?? "left"}${
          c.width ? `;width:${c.width}` : ""
        }">${escape(c.header)}</th>`
    )
    .join("");

  const rowsHtml = opts.rows.length
    ? opts.rows
        .map(
          (r) =>
            `<tr>${opts.columns
              .map(
                (c) =>
                  `<td style="text-align:${c.align ?? "left"}">${escape(
                    c.accessor(r)
                  )}</td>`
              )
              .join("")}</tr>`
        )
        .join("")
    : `<tr><td colspan="${opts.columns.length}" class="empty">Sem registros para os filtros aplicados.</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Qualitoo — ${escape(opts.title)}</title>
<style>
  @page { size: A4 ${opts.landscape ? "landscape" : "portrait"}; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #0f172a; margin: 0; font-size: 11px; line-height: 1.4; }
  header.brand { display:flex; align-items:center; justify-content:space-between; border-bottom: 3px solid #0891b2; padding-bottom: 10px; margin-bottom: 16px; }
  .brand-name { font-size: 20px; font-weight: 800; color: #0e7490; letter-spacing: -0.02em; }
  .brand-tag { font-size: 10px; color: #64748b; margin-top: 2px; }
  .meta { text-align: right; font-size: 10px; color: #475569; }
  h1 { font-size: 18px; margin: 0 0 4px 0; color: #0f172a; }
  .subtitle { font-size: 11px; color: #64748b; margin: 0 0 6px 0; }
  .filters { font-size: 10px; color: #475569; background: #f1f5f9; padding: 6px 10px; border-radius: 6px; margin: 8px 0 14px 0; }
  section.kpis { display:grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
  .kpi { border: 1px solid #e2e8f0; border-left: 4px solid #0891b2; padding: 8px 10px; border-radius: 6px; background: #f8fafc; }
  .kpi-label { margin: 0; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 600; }
  .kpi-value { margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #0f172a; }
  .kpi-hint { margin: 2px 0 0 0; font-size: 9px; color: #94a3b8; }
  table.report { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  table.report th { background: #0e7490; color: #fff; padding: 6px 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; font-size: 9.5px; }
  table.report td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
  table.report tr:nth-child(even) td { background: #f8fafc; }
  td.empty { text-align:center; color:#94a3b8; padding: 24px 0; }
  .extra { margin-top: 18px; }
  footer.doc-footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8; }
  .badge { display:inline-block; padding:2px 6px; border-radius:4px; font-size:9px; font-weight:600; background:#e2e8f0; color:#0f172a; }
  @media print { .no-print { display:none } }
</style>
</head>
<body>
  <header class="brand">
    <div>
      <div class="brand-name">Qualitoo</div>
      <div class="brand-tag">Sistema de Gestão da Qualidade Hospitalar</div>
    </div>
    <div class="meta">
      Emitido em ${dateStr} às ${timeStr}<br/>
      Documento gerado automaticamente
    </div>
  </header>

  <h1>${escape(opts.title)}</h1>
  ${opts.subtitle ? `<p class="subtitle">${escape(opts.subtitle)}</p>` : ""}
  ${opts.filters ? `<div class="filters"><strong>Filtros:</strong> ${escape(opts.filters)}</div>` : ""}

  ${kpisHtml}

  <table class="report">
    <thead><tr>${headHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  ${opts.extraHtml ? `<div class="extra">${opts.extraHtml}</div>` : ""}

  <footer class="doc-footer">
    ${escape(opts.footer ?? "Qualitoo — Relatório oficial. As informações refletem o banco de dados no momento da emissão.")}
  </footer>

  <script>
    ${opts.autoPrint === false ? "" : "window.addEventListener('load', () => setTimeout(() => window.print(), 350));"}
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    console.warn("Popup bloqueado. Não foi possível gerar o PDF.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
};

/**
 * Build an inline SVG line chart (small, print-ready). Used to embed SPC charts
 * inside a PDF report as `extraHtml`.
 */
export const buildSpcSvg = (opts: {
  title: string;
  points: { label: string; value: number }[];
  mean: number;
  ucl: number;
  lcl: number;
  target?: number;
  unit?: string;
  width?: number;
  height?: number;
}): string => {
  const w = opts.width ?? 720;
  const h = opts.height ?? 260;
  const pad = { top: 30, right: 60, bottom: 40, left: 50 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;
  const values = opts.points.map((p) => p.value);
  const min = Math.min(...values, opts.lcl, opts.target ?? Infinity);
  const max = Math.max(...values, opts.ucl, opts.target ?? -Infinity);
  const span = max - min || 1;
  const pMin = min - span * 0.1;
  const pMax = max + span * 0.1;
  const y = (v: number) => pad.top + ph - ((v - pMin) / (pMax - pMin)) * ph;
  const x = (i: number) =>
    pad.left + (opts.points.length === 1 ? pw / 2 : (i / (opts.points.length - 1)) * pw);

  const line = opts.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");

  const dots = opts.points
    .map((p, i) => {
      const outOfControl = p.value > opts.ucl || p.value < opts.lcl;
      const color = outOfControl ? "#dc2626" : "#0891b2";
      return `<circle cx="${x(i)}" cy="${y(p.value)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="1"/>`;
    })
    .join("");

  const labels = opts.points
    .map((p, i) => `<text x="${x(i)}" y="${h - 10}" font-size="9" text-anchor="middle" fill="#64748b">${escape(p.label)}</text>`)
    .join("");

  const hline = (v: number, color: string, dash: string, label: string) =>
    `<line x1="${pad.left}" x2="${w - pad.right}" y1="${y(v)}" y2="${y(v)}" stroke="${color}" stroke-width="1" stroke-dasharray="${dash}"/>
     <text x="${w - pad.right + 4}" y="${y(v) + 3}" font-size="9" fill="${color}">${label} (${v.toFixed(2)})</text>`;

  return `
  <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-top:10px;background:#fff">
    <p style="margin:0 0 6px 0;font-weight:600;font-size:11px;color:#0e7490">${escape(opts.title)}${opts.unit ? ` (${escape(opts.unit)})` : ""}</p>
    <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;background:#f8fafc">
      <rect x="${pad.left}" y="${pad.top}" width="${pw}" height="${ph}" fill="#fff" stroke="#e2e8f0"/>
      ${hline(opts.ucl, "#dc2626", "4 3", "LSC")}
      ${hline(opts.mean, "#0891b2", "0", "Média")}
      ${hline(opts.lcl, "#dc2626", "4 3", "LIC")}
      ${opts.target !== undefined ? hline(opts.target, "#16a34a", "2 2", "Meta") : ""}
      <path d="${line}" fill="none" stroke="#0f172a" stroke-width="1.5"/>
      ${dots}
      ${labels}
    </svg>
    <p style="margin:6px 0 0 0;font-size:9px;color:#64748b">
      Gráfico de Controle de Processo (Shewhart X). Limites calculados como média ± 3σ. Pontos em vermelho indicam causa especial de variação.
    </p>
  </div>`;
};
