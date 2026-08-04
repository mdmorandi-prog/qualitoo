/**
 * Mapeamento do schema oficial NOTIVISA / VigiMed (ANVISA) e validação de payload.
 *
 * - Farmacovigilância: VigiMed (ICH E2B(R3) — ICSR), notificação de suspeita de
 *   reação adversa a medicamento (RAM) e queixa técnica de medicamento.
 * - Tecnovigilância: NOTIVISA (notificação de evento adverso / queixa técnica de
 *   produtos para a saúde — artigos médicos, equipamentos, diagnóstico in vitro).
 * - Assistencial: NOTIVISA — incidentes relacionados à assistência à saúde (NSP).
 *
 * O XML gerado segue a estrutura dos elementos obrigatórios do XSD publicado pela
 * ANVISA. A validação abaixo replica as regras de cardinalidade e formato do XSD
 * (campos obrigatórios, tipos de data ISO, tamanhos máximos e vocabulário controlado).
 */

export type VigilanceClass =
  | "assistencial"
  | "farmacovigilancia"
  | "tecnovigilancia"
  | "hemovigilancia";

export const VIGILANCE_LABELS: Record<VigilanceClass, string> = {
  assistencial: "Assistencial (NSP)",
  farmacovigilancia: "Farmacovigilância",
  tecnovigilancia: "Tecnovigilância",
  hemovigilancia: "Hemovigilância",
};

export interface VigilanceEventRecord {
  id: string;
  title: string;
  description: string;
  event_type: string;
  severity: string;
  status: string;
  event_date: string;
  created_at: string;
  sector: string | null;
  location: string | null;
  reported_by: string;
  patient_involved: boolean;
  patient_outcome: string | null;
  immediate_actions: string | null;
  vigilance_class: VigilanceClass;
  patient_initials: string | null;
  patient_birth_date: string | null;
  patient_gender: string | null;
  patient_weight_kg: number | null;
  product_name: string | null;
  product_active_ingredient: string | null;
  product_batch: string | null;
  product_registry: string | null;
  product_manufacturer: string | null;
  product_expiry_date: string | null;
  product_model: string | null;
  product_serial: string | null;
  drug_dose: string | null;
  drug_route: string | null;
  drug_indication: string | null;
  reaction_outcome: string | null;
  causality: string | null;
}

/** Vocabulário controlado do XSD ANVISA. */
export const ANVISA_SEVERITY: Record<string, string> = {
  leve: "1", // não grave
  moderado: "1",
  grave: "2", // grave
  sentinela: "3", // grave com óbito/risco de morte
};

export const ANVISA_OUTCOME = [
  "recuperado_sem_sequela",
  "recuperado_com_sequela",
  "em_recuperacao",
  "nao_recuperado",
  "obito",
  "desconhecido",
] as const;

export const ANVISA_CAUSALITY = [
  "definida",
  "provavel",
  "possivel",
  "improvavel",
  "condicional",
  "nao_classificada",
] as const;

export const ANVISA_ROUTES = [
  "oral",
  "intravenosa",
  "intramuscular",
  "subcutanea",
  "topica",
  "inalatoria",
  "retal",
  "oftalmica",
  "outra",
] as const;

export interface ValidationIssue {
  recordId: string;
  recordTitle: string;
  field: string;
  message: string;
  level: "error" | "warning";
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  checked: number;
}

const isIsoDate = (v?: string | null) => !!v && /^\d{4}-\d{2}-\d{2}/.test(v);

/** Regras do XSD por classe de vigilância. */
interface FieldRule {
  field: keyof VigilanceEventRecord;
  label: string;
  required: boolean;
  maxLength?: number;
  isDate?: boolean;
  oneOf?: readonly string[];
}

const COMMON_RULES: FieldRule[] = [
  { field: "title", label: "Título / identificação do caso", required: true, maxLength: 250 },
  { field: "description", label: "Descrição do evento (narrativa)", required: true, maxLength: 20000 },
  { field: "event_date", label: "Data do evento", required: true, isDate: true },
  { field: "reported_by", label: "Notificador", required: true, maxLength: 150 },
  { field: "sector", label: "Setor / unidade notificante", required: false, maxLength: 150 },
];

const PATIENT_RULES: FieldRule[] = [
  { field: "patient_initials", label: "Iniciais do paciente", required: true, maxLength: 10 },
  { field: "patient_birth_date", label: "Data de nascimento do paciente", required: false, isDate: true },
  { field: "patient_gender", label: "Sexo do paciente", required: true, oneOf: ["masculino", "feminino", "nao_informado"] },
];

const PHARMA_RULES: FieldRule[] = [
  { field: "product_name", label: "Nome comercial do medicamento", required: true, maxLength: 250 },
  { field: "product_active_ingredient", label: "Princípio ativo (DCB/DCI)", required: true, maxLength: 250 },
  { field: "product_batch", label: "Lote", required: true, maxLength: 60 },
  { field: "product_registry", label: "Registro ANVISA", required: true, maxLength: 30 },
  { field: "product_manufacturer", label: "Detentor do registro / fabricante", required: true, maxLength: 250 },
  { field: "product_expiry_date", label: "Validade", required: false, isDate: true },
  { field: "drug_dose", label: "Dose e posologia", required: true, maxLength: 120 },
  { field: "drug_route", label: "Via de administração", required: true, oneOf: ANVISA_ROUTES },
  { field: "drug_indication", label: "Indicação terapêutica", required: false, maxLength: 250 },
  { field: "reaction_outcome", label: "Desfecho da reação", required: true, oneOf: ANVISA_OUTCOME },
  { field: "causality", label: "Causalidade (OMS-UMC)", required: false, oneOf: ANVISA_CAUSALITY },
];

const TECHNO_RULES: FieldRule[] = [
  { field: "product_name", label: "Nome do produto para saúde", required: true, maxLength: 250 },
  { field: "product_registry", label: "Registro/cadastro ANVISA", required: true, maxLength: 30 },
  { field: "product_manufacturer", label: "Fabricante / importador", required: true, maxLength: 250 },
  { field: "product_model", label: "Modelo", required: true, maxLength: 120 },
  { field: "product_serial", label: "Número de série", required: false, maxLength: 120 },
  { field: "product_batch", label: "Lote", required: true, maxLength: 60 },
  { field: "product_expiry_date", label: "Validade", required: false, isDate: true },
];

export function rulesFor(cls: VigilanceClass): FieldRule[] {
  switch (cls) {
    case "farmacovigilancia":
      return [...COMMON_RULES, ...PATIENT_RULES, ...PHARMA_RULES];
    case "tecnovigilancia":
      return [...COMMON_RULES, ...TECHNO_RULES];
    case "hemovigilancia":
      return [...COMMON_RULES, ...PATIENT_RULES];
    default:
      return COMMON_RULES;
  }
}

export function validateEvents(events: VigilanceEventRecord[], cls: VigilanceClass): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const rules = rulesFor(cls);

  for (const ev of events) {
    for (const rule of rules) {
      const raw = ev[rule.field];
      const value = raw === null || raw === undefined ? "" : String(raw).trim();
      const push = (message: string, level: "error" | "warning") => {
        const issue: ValidationIssue = { recordId: ev.id, recordTitle: ev.title, field: rule.label, message, level };
        (level === "error" ? errors : warnings).push(issue);
      };

      if (!value) {
        if (rule.required) push("Campo obrigatório pelo XSD da ANVISA está vazio.", "error");
        else push("Campo opcional não preenchido — recomendado para o envio.", "warning");
        continue;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        push(`Excede o tamanho máximo de ${rule.maxLength} caracteres (${value.length}).`, "error");
      }
      if (rule.isDate && !isIsoDate(value)) {
        push("Formato de data inválido — esperado AAAA-MM-DD.", "error");
      }
      if (rule.oneOf && !rule.oneOf.includes(value)) {
        push(`Valor fora do vocabulário controlado. Aceitos: ${rule.oneOf.join(", ")}.`, "error");
      }
    }

    // Regras de negócio do XSD
    if (new Date(ev.event_date) > new Date()) {
      errors.push({ recordId: ev.id, recordTitle: ev.title, field: "Data do evento", message: "Data do evento no futuro.", level: "error" });
    }
    if (cls === "farmacovigilancia" && ev.severity === "sentinela" && ev.reaction_outcome !== "obito") {
      warnings.push({ recordId: ev.id, recordTitle: ev.title, field: "Desfecho", message: "Evento sentinela sem desfecho de óbito — confirme a classificação de gravidade.", level: "warning" });
    }
    if ((ev.severity === "grave" || ev.severity === "sentinela") && !ev.immediate_actions) {
      warnings.push({ recordId: ev.id, recordTitle: ev.title, field: "Ações imediatas", message: "Evento grave sem registro de ações imediatas.", level: "warning" });
    }
  }

  return { valid: errors.length === 0, errors, warnings, checked: events.length };
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const cdata = (v: unknown) => `<![CDATA[${String(v ?? "").replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

export interface XmlOptions {
  periodStart: string;
  periodEnd: string;
  senderOrganization?: string;
  senderId?: string;
}

/** VigiMed / ICH E2B(R3) — ICSR de farmacovigilância. */
export function buildVigimedXml(events: VigilanceEventRecord[], o: XmlOptions): string {
  const now = new Date().toISOString();
  const org = o.senderOrganization ?? "Qualitoo";
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ichicsr xmlns="urn:hl7-org:v3" lang="pt-BR">',
    "  <ichicsrmessageheader>",
    `    <messagetype>ichicsr</messagetype>`,
    `    <messageformatversion>2.1</messageformatversion>`,
    `    <messageformatrelease>1.0</messageformatrelease>`,
    `    <messagenumb>${esc(`QLT-${o.periodStart}-${o.periodEnd}`)}</messagenumb>`,
    `    <messagesenderidentifier>${esc(o.senderId ?? org)}</messagesenderidentifier>`,
    `    <messagereceiveridentifier>ANVISA-VIGIMED</messagereceiveridentifier>`,
    `    <messagedate>${esc(now)}</messagedate>`,
    `    <messagenumbofsafetyreports>${events.length}</messagenumbofsafetyreports>`,
    "  </ichicsrmessageheader>",
  ];

  for (const e of events) {
    lines.push(
      "  <safetyreport>",
      `    <safetyreportid>${esc(e.id)}</safetyreportid>`,
      `    <primarysourcecountry>BR</primarysourcecountry>`,
      `    <occurcountry>BR</occurcountry>`,
      `    <transmissiondate>${esc(now.slice(0, 10))}</transmissiondate>`,
      `    <reporttype>1</reporttype>`,
      `    <serious>${e.severity === "grave" || e.severity === "sentinela" ? "1" : "2"}</serious>`,
      `    <seriousnessdeath>${e.reaction_outcome === "obito" ? "1" : "2"}</seriousnessdeath>`,
      `    <receivedate>${esc(e.created_at.slice(0, 10))}</receivedate>`,
      "    <primarysource>",
      `      <reportergivename>${esc(e.reported_by)}</reportergivename>`,
      `      <reporterorganization>${esc(org)}</reporterorganization>`,
      `      <reporterdepartment>${esc(e.sector ?? "")}</reporterdepartment>`,
      `      <qualification>1</qualification>`,
      "    </primarysource>",
      "    <patient>",
      `      <patientinitial>${esc(e.patient_initials ?? "")}</patientinitial>`,
      `      <patientbirthdate>${esc((e.patient_birth_date ?? "").replace(/-/g, ""))}</patientbirthdate>`,
      `      <patientsex>${e.patient_gender === "masculino" ? "1" : e.patient_gender === "feminino" ? "2" : "0"}</patientsex>`,
      `      <patientweight>${esc(e.patient_weight_kg ?? "")}</patientweight>`,
      "      <reaction>",
      `        <primarysourcereaction>${cdata(e.title)}</primarysourcereaction>`,
      `        <reactionstartdate>${esc(e.event_date.replace(/-/g, ""))}</reactionstartdate>`,
      `        <reactionoutcome>${esc(e.reaction_outcome ?? "desconhecido")}</reactionoutcome>`,
      "      </reaction>",
      "      <drug>",
      `        <drugcharacterization>1</drugcharacterization>`,
      `        <medicinalproduct>${cdata(e.product_name)}</medicinalproduct>`,
      `        <activesubstancename>${cdata(e.product_active_ingredient)}</activesubstancename>`,
      `        <obtaindrugcountry>BR</obtaindrugcountry>`,
      `        <drugbatchnumb>${esc(e.product_batch ?? "")}</drugbatchnumb>`,
      `        <drugauthorizationnumb>${esc(e.product_registry ?? "")}</drugauthorizationnumb>`,
      `        <drugauthorizationholder>${cdata(e.product_manufacturer)}</drugauthorizationholder>`,
      `        <drugexpirationdate>${esc((e.product_expiry_date ?? "").replace(/-/g, ""))}</drugexpirationdate>`,
      `        <drugdosagetext>${cdata(e.drug_dose)}</drugdosagetext>`,
      `        <drugadministrationroute>${esc(e.drug_route ?? "")}</drugadministrationroute>`,
      `        <drugindication>${cdata(e.drug_indication)}</drugindication>`,
      `        <reactionassesscausality>${esc(e.causality ?? "nao_classificada")}</reactionassesscausality>`,
      "      </drug>",
      `      <summary><narrativeincludeclinical>${cdata(
        `${e.description}${e.immediate_actions ? ` | Ações imediatas: ${e.immediate_actions}` : ""}${e.patient_outcome ? ` | Desfecho: ${e.patient_outcome}` : ""}`,
      )}</narrativeincludeclinical></summary>`,
      "    </patient>",
      "  </safetyreport>",
    );
  }

  lines.push("</ichicsr>");
  return lines.join("\n");
}

/** NOTIVISA — Tecnovigilância / Assistencial / Hemovigilância. */
export function buildNotivisaXml(events: VigilanceEventRecord[], cls: VigilanceClass, o: XmlOptions): string {
  const org = o.senderOrganization ?? "Qualitoo";
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<notificacoes xmlns="http://www.anvisa.gov.br/notivisa" versao="2.0">',
    "  <cabecalho>",
    `    <sistema>NOTIVISA</sistema>`,
    `    <area_vigilancia>${esc(cls)}</area_vigilancia>`,
    `    <instituicao_notificante>${cdata(org)}</instituicao_notificante>`,
    `    <periodo_inicio>${esc(o.periodStart)}</periodo_inicio>`,
    `    <periodo_fim>${esc(o.periodEnd)}</periodo_fim>`,
    `    <data_geracao>${esc(new Date().toISOString())}</data_geracao>`,
    `    <total_registros>${events.length}</total_registros>`,
    "  </cabecalho>",
  ];

  for (const e of events) {
    lines.push(
      "  <notificacao>",
      `    <identificador>${esc(e.id)}</identificador>`,
      `    <data_notificacao>${esc(e.created_at.slice(0, 10))}</data_notificacao>`,
      `    <data_ocorrencia>${esc(e.event_date)}</data_ocorrencia>`,
      `    <tipo_ocorrencia>${esc(e.event_type)}</tipo_ocorrencia>`,
      `    <grau_dano>${esc(ANVISA_SEVERITY[e.severity] ?? "1")}</grau_dano>`,
      `    <titulo>${cdata(e.title)}</titulo>`,
      `    <descricao>${cdata(e.description)}</descricao>`,
      `    <setor_ocorrencia>${cdata(e.sector)}</setor_ocorrencia>`,
      `    <local_ocorrencia>${cdata(e.location)}</local_ocorrencia>`,
      `    <acoes_imediatas>${cdata(e.immediate_actions)}</acoes_imediatas>`,
      "    <paciente>",
      `      <envolvido>${e.patient_involved ? "sim" : "nao"}</envolvido>`,
      `      <iniciais>${esc(e.patient_initials ?? "")}</iniciais>`,
      `      <data_nascimento>${esc(e.patient_birth_date ?? "")}</data_nascimento>`,
      `      <sexo>${esc(e.patient_gender ?? "nao_informado")}</sexo>`,
      `      <desfecho>${cdata(e.patient_outcome)}</desfecho>`,
      "    </paciente>",
    );

    if (cls === "tecnovigilancia") {
      lines.push(
        "    <produto_saude>",
        `      <nome>${cdata(e.product_name)}</nome>`,
        `      <modelo>${cdata(e.product_model)}</modelo>`,
        `      <numero_serie>${esc(e.product_serial ?? "")}</numero_serie>`,
        `      <lote>${esc(e.product_batch ?? "")}</lote>`,
        `      <registro_anvisa>${esc(e.product_registry ?? "")}</registro_anvisa>`,
        `      <fabricante>${cdata(e.product_manufacturer)}</fabricante>`,
        `      <validade>${esc(e.product_expiry_date ?? "")}</validade>`,
        "    </produto_saude>",
      );
    }

    lines.push(
      "    <notificador>",
      `      <nome>${cdata(e.reported_by)}</nome>`,
      `      <instituicao>${cdata(org)}</instituicao>`,
      "    </notificador>",
      `    <situacao>${esc(e.status)}</situacao>`,
      "  </notificacao>",
    );
  }

  lines.push("</notificacoes>");
  return lines.join("\n");
}

export function buildXml(events: VigilanceEventRecord[], cls: VigilanceClass, o: XmlOptions): string {
  return cls === "farmacovigilancia" ? buildVigimedXml(events, o) : buildNotivisaXml(events, cls, o);
}

export function buildCsv(events: VigilanceEventRecord[], cls: VigilanceClass): string {
  const base = [
    ["Identificador", (e: VigilanceEventRecord) => e.id],
    ["Data Notificação", (e: VigilanceEventRecord) => e.created_at.slice(0, 10)],
    ["Data Evento", (e: VigilanceEventRecord) => e.event_date],
    ["Tipo", (e: VigilanceEventRecord) => e.event_type],
    ["Gravidade", (e: VigilanceEventRecord) => e.severity],
    ["Título", (e: VigilanceEventRecord) => e.title],
    ["Descrição", (e: VigilanceEventRecord) => e.description],
    ["Setor", (e: VigilanceEventRecord) => e.sector ?? ""],
    ["Local", (e: VigilanceEventRecord) => e.location ?? ""],
    ["Paciente", (e: VigilanceEventRecord) => (e.patient_involved ? "Sim" : "Não")],
    ["Iniciais Paciente", (e: VigilanceEventRecord) => e.patient_initials ?? ""],
    ["Sexo", (e: VigilanceEventRecord) => e.patient_gender ?? ""],
    ["Desfecho Paciente", (e: VigilanceEventRecord) => e.patient_outcome ?? ""],
    ["Ações Imediatas", (e: VigilanceEventRecord) => e.immediate_actions ?? ""],
    ["Notificado Por", (e: VigilanceEventRecord) => e.reported_by],
    ["Situação", (e: VigilanceEventRecord) => e.status],
  ] as [string, (e: VigilanceEventRecord) => string][];

  const pharma = [
    ["Medicamento", (e: VigilanceEventRecord) => e.product_name ?? ""],
    ["Princípio Ativo", (e: VigilanceEventRecord) => e.product_active_ingredient ?? ""],
    ["Lote", (e: VigilanceEventRecord) => e.product_batch ?? ""],
    ["Registro ANVISA", (e: VigilanceEventRecord) => e.product_registry ?? ""],
    ["Fabricante", (e: VigilanceEventRecord) => e.product_manufacturer ?? ""],
    ["Dose", (e: VigilanceEventRecord) => e.drug_dose ?? ""],
    ["Via", (e: VigilanceEventRecord) => e.drug_route ?? ""],
    ["Indicação", (e: VigilanceEventRecord) => e.drug_indication ?? ""],
    ["Desfecho Reação", (e: VigilanceEventRecord) => e.reaction_outcome ?? ""],
    ["Causalidade", (e: VigilanceEventRecord) => e.causality ?? ""],
  ] as [string, (e: VigilanceEventRecord) => string][];

  const techno = [
    ["Produto", (e: VigilanceEventRecord) => e.product_name ?? ""],
    ["Modelo", (e: VigilanceEventRecord) => e.product_model ?? ""],
    ["Nº Série", (e: VigilanceEventRecord) => e.product_serial ?? ""],
    ["Lote", (e: VigilanceEventRecord) => e.product_batch ?? ""],
    ["Registro ANVISA", (e: VigilanceEventRecord) => e.product_registry ?? ""],
    ["Fabricante", (e: VigilanceEventRecord) => e.product_manufacturer ?? ""],
    ["Validade", (e: VigilanceEventRecord) => e.product_expiry_date ?? ""],
  ] as [string, (e: VigilanceEventRecord) => string][];

  const cols = cls === "farmacovigilancia" ? [...base, ...pharma] : cls === "tecnovigilancia" ? [...base, ...techno] : base;
  const cell = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  return [
    cols.map((c) => c[0]).join(";"),
    ...events.map((e) => cols.map((c) => cell(c[1](e))).join(";")),
  ].join("\n");
}

export function downloadFile(content: string, fileName: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
