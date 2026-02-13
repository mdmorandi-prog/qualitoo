import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, BarChart3, FileText, ClipboardCheck, Target, TriangleAlert, ShieldAlert, GraduationCap, Heart, Truck, GitBranch, Crosshair, TrendingUp, TrendingDown, Minus } from "lucide-react";
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
}

export const widgetRegistry: WidgetDefinition[] = [
  { id: "ncs_summary", label: "NCs Resumo", icon: AlertTriangle, category: "Não Conformidades", defaultW: 3, defaultH: 2 },
  { id: "ncs_by_severity", label: "NCs por Severidade", icon: AlertTriangle, category: "Não Conformidades", defaultW: 4, defaultH: 3 },
  { id: "indicators_status", label: "Indicadores Status", icon: BarChart3, category: "Indicadores", defaultW: 3, defaultH: 2 },
  { id: "indicators_chart", label: "Indicadores vs Meta", icon: TrendingUp, category: "Indicadores", defaultW: 6, defaultH: 3 },
  { id: "docs_status", label: "Documentos Status", icon: FileText, category: "Documentos", defaultW: 3, defaultH: 2 },
  { id: "audits_summary", label: "Auditorias Resumo", icon: ClipboardCheck, category: "Auditorias", defaultW: 3, defaultH: 2 },
  { id: "risks_heatmap", label: "Riscos por Nível", icon: TriangleAlert, category: "Riscos", defaultW: 4, defaultH: 3 },
  { id: "plans_progress", label: "Planos de Ação", icon: Crosshair, category: "Planos", defaultW: 4, defaultH: 3 },
  { id: "events_summary", label: "Eventos Adversos", icon: ShieldAlert, category: "Eventos", defaultW: 3, defaultH: 2 },
  { id: "capas_summary", label: "CAPAs Resumo", icon: Target, category: "CAPA", defaultW: 3, defaultH: 2 },
  { id: "trainings_summary", label: "Treinamentos", icon: GraduationCap, category: "Treinamentos", defaultW: 3, defaultH: 2 },
  { id: "maturity_radar", label: "Radar Maturidade", icon: BarChart3, category: "Geral", defaultW: 6, defaultH: 4 },
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
