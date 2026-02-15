import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BarChart3, FileText, ClipboardCheck, Target, TriangleAlert, ShieldAlert, GraduationCap, Heart, Truck, GitBranch, Crosshair, TrendingUp, TrendingDown, Minus, Handshake, MessageSquare, FileSignature, Users, Wrench, FolderKanban, Shield, Brain, FlaskConical } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

// Widget registry
export interface WidgetDefinition {
  id: string;
  label: string;
  icon: any;
  category: string;
  defaultW: number;
  defaultH: number;
  minW?: number;
  minH?: number;
  navigateTo?: string; // tab key for navigation
}

export const widgetRegistry: WidgetDefinition[] = [
  { id: "ncs_summary", label: "NCs Resumo", icon: AlertTriangle, category: "Não Conformidades", defaultW: 3, defaultH: 2, navigateTo: "ncs" },
  { id: "ncs_by_severity", label: "NCs por Severidade", icon: AlertTriangle, category: "Não Conformidades", defaultW: 4, defaultH: 3, navigateTo: "ncs" },
  { id: "indicators_status", label: "Indicadores Status", icon: BarChart3, category: "Indicadores", defaultW: 3, defaultH: 2, navigateTo: "indicadores" },
  { id: "indicators_chart", label: "Indicadores vs Meta", icon: TrendingUp, category: "Indicadores", defaultW: 6, defaultH: 3, navigateTo: "indicadores" },
  { id: "docs_status", label: "Documentos Status", icon: FileText, category: "Documentos", defaultW: 3, defaultH: 2, navigateTo: "documentos" },
  { id: "audits_summary", label: "Auditorias Resumo", icon: ClipboardCheck, category: "Auditorias", defaultW: 3, defaultH: 2, navigateTo: "auditorias" },
  { id: "risks_heatmap", label: "Riscos por Nível", icon: TriangleAlert, category: "Riscos", defaultW: 4, defaultH: 3, navigateTo: "riscos" },
  { id: "plans_progress", label: "Planos de Ação", icon: Crosshair, category: "Planos", defaultW: 4, defaultH: 3, navigateTo: "planos" },
  { id: "events_summary", label: "Eventos Adversos", icon: ShieldAlert, category: "Eventos", defaultW: 3, defaultH: 2, navigateTo: "eventos" },
  { id: "capas_summary", label: "CAPAs Resumo", icon: Target, category: "CAPA", defaultW: 3, defaultH: 2, navigateTo: "capa" },
  { id: "trainings_summary", label: "Treinamentos", icon: GraduationCap, category: "Treinamentos", defaultW: 3, defaultH: 2, navigateTo: "treinamentos" },
  { id: "maturity_radar", label: "Radar Maturidade", icon: BarChart3, category: "Geral", defaultW: 6, defaultH: 4 },
  { id: "suppliers_summary", label: "Fornecedores", icon: Truck, category: "Fornecedores", defaultW: 3, defaultH: 2, navigateTo: "fornecedores" },
  { id: "surveys_summary", label: "Pesquisas Satisfação", icon: MessageSquare, category: "Pesquisas", defaultW: 3, defaultH: 2, navigateTo: "pesquisas" },
  { id: "contracts_summary", label: "Contratos", icon: FileSignature, category: "Contratos", defaultW: 3, defaultH: 2, navigateTo: "contratos" },
  { id: "meetings_summary", label: "Atas de Reunião", icon: Users, category: "Reuniões", defaultW: 3, defaultH: 2, navigateTo: "atas" },
  { id: "metrology_summary", label: "Metrologia", icon: Wrench, category: "Metrologia", defaultW: 3, defaultH: 2, navigateTo: "metrologia" },
  { id: "changes_summary", label: "Gestão de Mudanças", icon: GitBranch, category: "Mudanças", defaultW: 3, defaultH: 2, navigateTo: "mudancas" },
  { id: "projects_summary", label: "Projetos", icon: FolderKanban, category: "Projetos", defaultW: 3, defaultH: 2, navigateTo: "projetos" },
  { id: "lgpd_summary", label: "LGPD", icon: Shield, category: "LGPD", defaultW: 3, defaultH: 2, navigateTo: "lgpd" },
  { id: "competencies_summary", label: "Competências", icon: Brain, category: "Competências", defaultW: 3, defaultH: 2, navigateTo: "competencias" },
  { id: "fmea_summary", label: "FMEA", icon: FlaskConical, category: "FMEA", defaultW: 3, defaultH: 2, navigateTo: "fmea" },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
];

// Individual widget components
export const WidgetRenderer = ({ widgetId }: { widgetId: string }) => {
  switch (widgetId) {
    case "ncs_summary": return <NcsSummaryWidget />;
    case "ncs_by_severity": return <NcsBySeverityWidget />;
    case "indicators_status": return <IndicatorsStatusWidget />;
    case "indicators_chart": return <IndicatorsChartWidget />;
    case "docs_status": return <DocsStatusWidget />;
    case "audits_summary": return <AuditsSummaryWidget />;
    case "risks_heatmap": return <RisksWidget />;
    case "plans_progress": return <PlansProgressWidget />;
    case "events_summary": return <EventsSummaryWidget />;
    case "capas_summary": return <CapasSummaryWidget />;
    case "trainings_summary": return <TrainingsSummaryWidget />;
    case "maturity_radar": return <MaturityRadarWidget />;
    case "suppliers_summary": return <SuppliersSummaryWidget />;
    case "surveys_summary": return <SurveysSummaryWidget />;
    case "contracts_summary": return <ContractsSummaryWidget />;
    case "meetings_summary": return <MeetingsSummaryWidget />;
    case "metrology_summary": return <MetrologySummaryWidget />;
    case "changes_summary": return <ChangesSummaryWidget />;
    case "projects_summary": return <ProjectsSummaryWidget />;
    case "lgpd_summary": return <LgpdSummaryWidget />;
    case "competencies_summary": return <CompetenciesSummaryWidget />;
    case "fmea_summary": return <FmeaSummaryWidget />;
    default: return <p className="text-xs text-muted-foreground">Widget não encontrado</p>;
  }
};

// --- Widgets ---

const StatCard = ({ label, value, sub, danger }: { label: string; value: number; sub: string; danger?: boolean }) => (
  <div className="flex h-full flex-col items-center justify-center text-center">
    <p className={`text-3xl font-bold ${danger ? "text-destructive" : "text-foreground"}`}>{value}</p>
    <p className="text-sm font-medium text-foreground">{label}</p>
    <p className="text-xs text-muted-foreground">{sub}</p>
  </div>
);

const NcsSummaryWidget = () => {
  const [data, setData] = useState({ open: 0, critical: 0 });
  useEffect(() => {
    supabase.from("non_conformities").select("id, status, severity").then(({ data: ncs }) => {
      const items = ncs ?? [];
      setData({
        open: items.filter((n: any) => n.status !== "concluida").length,
        critical: items.filter((n: any) => (n.severity === "alta" || n.severity === "critica") && n.status !== "concluida").length,
      });
    });
  }, []);
  return <StatCard label="NCs Abertas" value={data.open} sub={`${data.critical} críticas`} danger={data.critical > 0} />;
};

const NcsBySeverityWidget = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("non_conformities").select("severity").then(({ data: ncs }) => {
      const counts: Record<string, number> = {};
      (ncs ?? []).forEach((n: any) => { counts[n.severity] = (counts[n.severity] || 0) + 1; });
      setData(Object.entries(counts).map(([name, value]) => ({ name, value })));
    });
  }, []);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={({ name, value }) => `${name}: ${value}`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const IndicatorsStatusWidget = () => {
  const [data, setData] = useState({ below: 0, total: 0 });
  useEffect(() => {
    Promise.all([
      supabase.from("quality_indicators").select("id, target_value"),
      supabase.from("indicator_measurements").select("indicator_id, value").order("period_date", { ascending: false }),
    ]).then(([indRes, measRes]) => {
      const inds = indRes.data ?? [];
      const meas = measRes.data ?? [];
      const below = inds.filter((ind: any) => {
        const m = meas.find((m: any) => m.indicator_id === ind.id);
        return m && m.value < ind.target_value;
      }).length;
      setData({ below, total: inds.length });
    });
  }, []);
  return <StatCard label="Abaixo da Meta" value={data.below} sub={`de ${data.total} indicadores`} danger={data.below > 0} />;
};

const IndicatorsChartWidget = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([
      supabase.from("quality_indicators").select("id, name, target_value"),
      supabase.from("indicator_measurements").select("indicator_id, value").order("period_date", { ascending: false }),
    ]).then(([indRes, measRes]) => {
      const inds = indRes.data ?? [];
      const meas = measRes.data ?? [];
      setData(inds.slice(0, 8).map((ind: any) => {
        const m = meas.find((m: any) => m.indicator_id === ind.id);
        return { name: ind.name?.substring(0, 15), meta: ind.target_value, atual: m?.value ?? 0 };
      }));
    });
  }, []);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="meta" fill="hsl(var(--muted-foreground))" name="Meta" />
        <Bar dataKey="atual" fill="hsl(var(--primary))" name="Atual" />
      </BarChart>
    </ResponsiveContainer>
  );
};

const DocsStatusWidget = () => {
  const [data, setData] = useState({ expiring: 0, total: 0 });
  useEffect(() => {
    supabase.from("quality_documents").select("id, status, valid_until").then(({ data: docs }) => {
      const items = docs ?? [];
      const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
      setData({
        expiring: items.filter((d: any) => d.status === "aprovado" && d.valid_until && new Date(d.valid_until) < thirtyDays).length,
        total: items.length,
      });
    });
  }, []);
  return <StatCard label="Docs a Vencer" value={data.expiring} sub={`próx. 30 dias (de ${data.total})`} danger={data.expiring > 0} />;
};

const AuditsSummaryWidget = () => {
  const [data, setData] = useState({ upcoming: 0, total: 0 });
  useEffect(() => {
    supabase.from("audits").select("id, status, scheduled_date").then(({ data: auds }) => {
      const items = auds ?? [];
      const now = new Date();
      const sevenDays = new Date(); sevenDays.setDate(now.getDate() + 7);
      setData({
        upcoming: items.filter((a: any) => a.status === "planejada" && new Date(a.scheduled_date) <= sevenDays && new Date(a.scheduled_date) >= now).length,
        total: items.length,
      });
    });
  }, []);
  return <StatCard label="Auditorias" value={data.upcoming} sub={`próx. 7 dias (de ${data.total})`} />;
};

const RisksWidget = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("risks").select("risk_level, status").then(({ data: risks }) => {
      const items = risks ?? [];
      const buckets = [
        { name: "Baixo (1-4)", value: items.filter((r: any) => (r.risk_level ?? 0) <= 4).length },
        { name: "Médio (5-9)", value: items.filter((r: any) => (r.risk_level ?? 0) >= 5 && (r.risk_level ?? 0) <= 9).length },
        { name: "Alto (10-14)", value: items.filter((r: any) => (r.risk_level ?? 0) >= 10 && (r.risk_level ?? 0) <= 14).length },
        { name: "Crítico (15+)", value: items.filter((r: any) => (r.risk_level ?? 0) >= 15).length },
      ];
      setData(buckets);
    });
  }, []);
  const riskColors = ["hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(25, 95%, 53%)", "hsl(var(--destructive))"];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
        <Tooltip />
        <Bar dataKey="value" name="Riscos">
          {data.map((_, i) => <Cell key={i} fill={riskColors[i]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const PlansProgressWidget = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("action_plans").select("status").then(({ data: plans }) => {
      const items = plans ?? [];
      const counts: Record<string, number> = {};
      items.forEach((p: any) => { counts[p.status] = (counts[p.status] || 0) + 1; });
      setData(Object.entries(counts).map(([name, value]) => ({ name, value })));
    });
  }, []);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" label={({ name, value }) => `${name}: ${value}`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

const EventsSummaryWidget = () => {
  const [data, setData] = useState({ critical: 0, total: 0 });
  useEffect(() => {
    supabase.from("adverse_events").select("id, severity, status").then(({ data: events }) => {
      const items = events ?? [];
      setData({
        critical: items.filter((e: any) => (e.severity === "grave" || e.severity === "sentinela") && e.status !== "encerrado").length,
        total: items.length,
      });
    });
  }, []);
  return <StatCard label="Eventos Graves" value={data.critical} sub={`abertos (de ${data.total})`} danger={data.critical > 0} />;
};

const CapasSummaryWidget = () => {
  const [data, setData] = useState({ open: 0, total: 0 });
  useEffect(() => {
    supabase.from("capas").select("id, status").then(({ data: capas }) => {
      const items = capas ?? [];
      setData({
        open: items.filter((c: any) => c.status !== "encerrada").length,
        total: items.length,
      });
    });
  }, []);
  return <StatCard label="CAPAs Abertas" value={data.open} sub={`de ${data.total} total`} />;
};

const TrainingsSummaryWidget = () => {
  const [data, setData] = useState({ expiring: 0, total: 0 });
  useEffect(() => {
    supabase.from("trainings").select("id, expiry_date").then(({ data: trains }) => {
      const items = trains ?? [];
      const now = new Date();
      const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30);
      setData({
        expiring: items.filter((t: any) => t.expiry_date && new Date(t.expiry_date) < thirtyDays && new Date(t.expiry_date) > now).length,
        total: items.length,
      });
    });
  }, []);
  return <StatCard label="Treinamentos" value={data.expiring} sub={`a vencer (de ${data.total})`} danger={data.expiring > 0} />;
};

const MaturityRadarWidget = () => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      const queries = [
        { key: "NCs", table: "non_conformities" as const, doneField: "status", doneValue: "concluida" },
        { key: "Docs", table: "quality_documents" as const, doneField: "status", doneValue: "aprovado" },
        { key: "Auditorias", table: "audits" as const, doneField: "status", doneValue: "concluida" },
        { key: "Planos", table: "action_plans" as const, doneField: "status", doneValue: "concluído" },
        { key: "CAPAs", table: "capas" as const, doneField: "status", doneValue: "encerrada" },
        { key: "Riscos", table: "risks" as const, doneField: "status", doneValue: "mitigado" },
      ];
      const results = await Promise.all(
        queries.map(async (q) => {
          const { data: items } = await supabase.from(q.table).select("id, status");
          const all = items ?? [];
          const done = all.filter((i: any) => i.status === q.doneValue).length;
          return { subject: q.key, value: all.length > 0 ? Math.round((done / all.length) * 100) : 0 };
        })
      );
      setData(results);
    };
    load();
  }, []);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
        <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// --- New module widgets ---

const SuppliersSummaryWidget = () => {
  const [data, setData] = useState({ critical: 0, total: 0 });
  useEffect(() => {
    supabase.from("suppliers" as any).select("id, status").then(({ data: items }: any) => {
      const list = items ?? [];
      setData({ critical: list.filter((s: any) => s.status === "bloqueado" || s.status === "reprovado").length, total: list.length });
    });
  }, []);
  return <StatCard label="Fornecedores" value={data.total} sub={`${data.critical} bloqueados/reprovados`} danger={data.critical > 0} />;
};

const SurveysSummaryWidget = () => {
  const [data, setData] = useState({ active: 0, total: 0 });
  useEffect(() => {
    supabase.from("satisfaction_surveys").select("id, status").then(({ data: items }) => {
      const list = items ?? [];
      setData({ active: list.filter((s: any) => s.status === "ativa").length, total: list.length });
    });
  }, []);
  return <StatCard label="Pesquisas Ativas" value={data.active} sub={`de ${data.total} total`} />;
};

const ContractsSummaryWidget = () => {
  const [data, setData] = useState({ expiring: 0, total: 0 });
  useEffect(() => {
    supabase.from("contracts").select("id, end_date, status").then(({ data: items }) => {
      const list = items ?? [];
      const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
      setData({
        expiring: list.filter((c: any) => c.status === "ativo" && c.end_date && new Date(c.end_date) < thirtyDays).length,
        total: list.length,
      });
    });
  }, []);
  return <StatCard label="Contratos a Vencer" value={data.expiring} sub={`próx. 30 dias (de ${data.total})`} danger={data.expiring > 0} />;
};

const MeetingsSummaryWidget = () => {
  const [data, setData] = useState({ pending: 0, total: 0 });
  useEffect(() => {
    supabase.from("meeting_minutes").select("id, status").then(({ data: items }) => {
      const list = items ?? [];
      setData({ pending: list.filter((m: any) => m.status === "rascunho").length, total: list.length });
    });
  }, []);
  return <StatCard label="Atas Pendentes" value={data.pending} sub={`de ${data.total} total`} danger={data.pending > 0} />;
};

const MetrologySummaryWidget = () => {
  const [data, setData] = useState({ expiring: 0, total: 0 });
  useEffect(() => {
    supabase.from("equipment").select("id, status").then(({ data: items }) => {
      const list = items ?? [];
      setData({
        expiring: list.filter((e: any) => e.status === "vencido" || e.status === "em_calibração").length,
        total: list.length,
      });
    });
  }, []);
  return <StatCard label="Equipamentos" value={data.total} sub={`${data.expiring} requerem atenção`} danger={data.expiring > 0} />;
};

const ChangesSummaryWidget = () => {
  const [data, setData] = useState({ open: 0, total: 0 });
  useEffect(() => {
    supabase.from("change_requests").select("id, status").then(({ data: items }) => {
      const list = items ?? [];
      setData({ open: list.filter((c: any) => c.status !== "concluída" && c.status !== "rejeitada").length, total: list.length });
    });
  }, []);
  return <StatCard label="Mudanças Abertas" value={data.open} sub={`de ${data.total} total`} danger={data.open > 0} />;
};

const ProjectsSummaryWidget = () => {
  const [data, setData] = useState({ active: 0, total: 0 });
  useEffect(() => {
    supabase.from("projects").select("id, status").then(({ data: items }) => {
      const list = items ?? [];
      setData({ active: list.filter((p: any) => p.status !== "concluído" && p.status !== "cancelado").length, total: list.length });
    });
  }, []);
  return <StatCard label="Projetos Ativos" value={data.active} sub={`de ${data.total} total`} />;
};

const LgpdSummaryWidget = () => {
  const [data, setData] = useState({ sensitive: 0, total: 0 });
  useEffect(() => {
    supabase.from("lgpd_data_mappings").select("id, is_sensitive").then(({ data: items }) => {
      const list = items ?? [];
      setData({ sensitive: list.filter((l: any) => l.is_sensitive).length, total: list.length });
    });
  }, []);
  return <StatCard label="Dados Sensíveis" value={data.sensitive} sub={`de ${data.total} mapeamentos`} danger={data.sensitive > 0} />;
};

const CompetenciesSummaryWidget = () => {
  const [data, setData] = useState({ mandatory: 0, total: 0 });
  useEffect(() => {
    supabase.from("competencies").select("id, is_mandatory").then(({ data: items }) => {
      const list = items ?? [];
      setData({ mandatory: list.filter((c: any) => c.is_mandatory).length, total: list.length });
    });
  }, []);
  return <StatCard label="Competências" value={data.total} sub={`${data.mandatory} obrigatórias`} />;
};

const FmeaSummaryWidget = () => {
  const [data, setData] = useState({ active: 0, total: 0 });
  useEffect(() => {
    supabase.from("fmea_analyses").select("id, status").then(({ data: items }) => {
      const list = items ?? [];
      setData({ active: list.filter((f: any) => f.status === "em_andamento" || f.status === "ativa").length, total: list.length });
    });
  }, []);
  return <StatCard label="FMEA Ativas" value={data.active} sub={`de ${data.total} análises`} />;
};
