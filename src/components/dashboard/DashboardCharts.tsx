import { useEffect, useState, useMemo } from "react";
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

export const NcTrendChart = () => {
  const [data, setData] = useState<{ month: string; abertas: number; concluidas: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: ncs } = await supabase
        .from("non_conformities")
        .select("created_at, status, closed_at");

      if (!ncs) return;

      const months: Record<string, { abertas: number; concluidas: number }> = {};
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        months[key] = { abertas: 0, concluidas: 0 };
      }

      ncs.forEach((nc: any) => {
        const created = new Date(nc.created_at);
        const key = created.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        if (months[key]) months[key].abertas++;

        if (nc.status === "concluida" && nc.closed_at) {
          const closed = new Date(nc.closed_at);
          const cKey = closed.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
          if (months[cKey]) months[cKey].concluidas++;
        }
      });

      setData(Object.entries(months).map(([month, vals]) => ({ month, ...vals })));
    };
    load();
  }, []);

  if (data.length === 0) return <ChartPlaceholder label="Não Conformidades por Mês" />;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <h4 className="mb-4 text-sm font-bold text-foreground">Não Conformidades — Tendência 6 Meses</h4>
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
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ActionPlansChart = () => {
  const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: plans } = await supabase.from("action_plans").select("status, progress");
      if (!plans) return;

      const statusMap: Record<string, { label: string; color: string }> = {
        pendente: { label: "Pendentes", color: COLORS.warning },
        em_andamento: { label: "Em Andamento", color: COLORS.accent },
        concluido: { label: "Concluídos", color: COLORS.safe },
      };

      const counts: Record<string, number> = {};
      plans.forEach((p: any) => {
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
  }, []);

  if (data.length === 0) return <ChartPlaceholder label="Status dos Planos de Ação" />;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <h4 className="mb-4 text-sm font-bold text-foreground">Planos de Ação — Status</h4>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const EventsTrendChart = () => {
  const [data, setData] = useState<{ month: string; eventos: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: events } = await supabase.from("adverse_events").select("event_date");
      if (!events) return;

      const months: Record<string, number> = {};
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        months[key] = 0;
      }

      events.forEach((e: any) => {
        const d = new Date(e.event_date);
        const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        if (months[key] !== undefined) months[key]++;
      });

      setData(Object.entries(months).map(([month, eventos]) => ({ month, eventos })));
    };
    load();
  }, []);

  if (data.length === 0) return <ChartPlaceholder label="Eventos Adversos por Mês" />;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <h4 className="mb-4 text-sm font-bold text-foreground">Eventos Adversos — Tendência 6 Meses</h4>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip {...tooltipStyle} />
          <Area
            type="monotone"
            dataKey="eventos"
            name="Eventos"
            stroke={COLORS.destructive}
            fill={COLORS.destructive}
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </AreaChart>
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
