import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = {
  primary: "hsl(var(--primary))",
  destructive: "hsl(var(--destructive))",
  warning: "hsl(var(--warning))",
  safe: "hsl(var(--safe))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted-foreground))",
};

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--foreground))",
  },
};

export interface DateFilter {
  startDate: string;
  endDate: string;
}

function generateMonthKeys(startDate: string, endDate: string) {
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T23:59:59");
  const months: string[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    months.push(d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }));
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

function isInRange(dateStr: string, filter: DateFilter) {
  const d = new Date(dateStr);
  return d >= new Date(filter.startDate + "T00:00:00") && d <= new Date(filter.endDate + "T23:59:59");
}

export const NcTrendChart = ({ filter }: { filter: DateFilter }) => {
  const [data, setData] = useState<{ month: string; abertas: number; concluidas: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: ncs } = await supabase
        .from("non_conformities")
        .select("created_at, status, closed_at");
      if (!ncs) return;

      const monthKeys = generateMonthKeys(filter.startDate, filter.endDate);
      const months: Record<string, { abertas: number; concluidas: number }> = {};
      monthKeys.forEach(k => { months[k] = { abertas: 0, concluidas: 0 }; });

      ncs.forEach((nc: any) => {
        if (!isInRange(nc.created_at, filter)) return;
        const key = new Date(nc.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        if (months[key]) months[key].abertas++;
        if (nc.status === "concluida" && nc.closed_at && isInRange(nc.closed_at, filter)) {
          const cKey = new Date(nc.closed_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
          if (months[cKey]) months[cKey].concluidas++;
        }
      });

      setData(Object.entries(months).map(([month, vals]) => ({ month, ...vals })));
    };
    load();
  }, [filter.startDate, filter.endDate]);

  if (data.length === 0) return <ChartPlaceholder label="Não Conformidades por Mês" />;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <h4 className="mb-4 text-sm font-bold text-foreground">Não Conformidades — Tendência</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="abertas" name="Abertas" fill={COLORS.destructive} radius={[4, 4, 0, 0]} />
          <Bar dataKey="concluidas" name="Concluídas" fill={COLORS.safe} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RiskDistributionChart = () => {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: risks } = await supabase.from("risks").select("risk_level");
      if (!risks) return;

      let low = 0, medium = 0, high = 0, critical = 0;
      risks.forEach((r: any) => {
        const lvl = r.risk_level ?? 0;
        if (lvl >= 15) critical++;
        else if (lvl >= 10) high++;
        else if (lvl >= 5) medium++;
        else low++;
      });

      setData([
        { name: "Baixo", value: low, color: COLORS.safe },
        { name: "Médio", value: medium, color: COLORS.warning },
        { name: "Alto", value: high, color: COLORS.destructive },
        { name: "Crítico", value: critical, color: "#ef4444" },
      ].filter(d => d.value > 0));
    };
    load();
  }, []);

  if (data.length === 0) return <ChartPlaceholder label="Distribuição de Riscos" />;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <h4 className="mb-4 text-sm font-bold text-foreground">Distribuição de Riscos</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
            {data.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ActionPlansChart = ({ filter }: { filter: DateFilter }) => {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: plans } = await supabase.from("action_plans").select("status, created_at");
      if (!plans) return;

      const statusMap: Record<string, { label: string; color: string }> = {
        pendente: { label: "Pendentes", color: COLORS.warning },
        em_andamento: { label: "Em Andamento", color: COLORS.accent },
        concluido: { label: "Concluídos", color: COLORS.safe },
      };

      const counts: Record<string, number> = {};
      plans.filter((p: any) => isInRange(p.created_at, filter)).forEach((p: any) => {
        counts[p.status] = (counts[p.status] || 0) + 1;
      });

      setData(
        Object.entries(counts)
          .map(([status, value]) => ({
            name: statusMap[status]?.label ?? status,
            value,
            color: statusMap[status]?.color ?? COLORS.muted,
          }))
          .filter(d => d.value > 0)
      );
    };
    load();
  }, [filter.startDate, filter.endDate]);

  if (data.length === 0) return <ChartPlaceholder label="Status dos Planos de Ação" />;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <h4 className="mb-4 text-sm font-bold text-foreground">Planos de Ação — Status</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
            {data.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EventsTrendChart = ({ filter }: { filter: DateFilter }) => {
  const [data, setData] = useState<{ month: string; eventos: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: events } = await supabase.from("adverse_events").select("event_date");
      if (!events) return;

      const monthKeys = generateMonthKeys(filter.startDate, filter.endDate);
      const months: Record<string, number> = {};
      monthKeys.forEach(k => { months[k] = 0; });

      events.forEach((e: any) => {
        if (!isInRange(e.event_date, filter)) return;
        const key = new Date(e.event_date).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        if (months[key] !== undefined) months[key]++;
      });

      setData(Object.entries(months).map(([month, eventos]) => ({ month, eventos })));
    };
    load();
  }, [filter.startDate, filter.endDate]);

  if (data.length === 0) return <ChartPlaceholder label="Eventos Adversos por Mês" />;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <h4 className="mb-4 text-sm font-bold text-foreground">Eventos Adversos — Tendência</h4>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip {...tooltipStyle} />
          <Area type="monotone" dataKey="eventos" name="Eventos" stroke={COLORS.destructive} fill={COLORS.destructive} fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const IndicatorsVsTargetChart = () => {
  const [data, setData] = useState<{ name: string; valor: number; meta: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const [indRes, measRes] = await Promise.all([
        supabase.from("quality_indicators").select("id, name, target_value").eq("is_active", true),
        supabase.from("indicator_measurements").select("indicator_id, value, period_date").order("period_date", { ascending: false }),
      ]);
      const inds = (indRes.data as any[]) ?? [];
      const meas = (measRes.data as any[]) ?? [];
      const result = inds.slice(0, 8).map((ind: any) => {
        const lastMeas = meas.find((m: any) => m.indicator_id === ind.id);
        return { name: ind.name.length > 15 ? ind.name.slice(0, 15) + "…" : ind.name, valor: lastMeas?.value ?? 0, meta: ind.target_value };
      });
      setData(result);
    };
    load();
  }, []);

  if (data.length === 0) return <ChartPlaceholder label="Indicadores vs Meta" />;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <h4 className="mb-4 text-sm font-bold text-foreground">Indicadores vs Meta</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="valor" name="Valor Atual" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          <Bar dataKey="meta" name="Meta" fill={COLORS.safe} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ChartPlaceholder = ({ label }: { label: string }) => (
  <div className="flex h-[280px] items-center justify-center rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
    <div className="text-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground/60">Sem dados suficientes</p>
    </div>
  </div>
);
