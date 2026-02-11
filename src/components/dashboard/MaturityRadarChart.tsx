import { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
    color: "hsl(var(--foreground))",
  },
};

interface ModuleMaturity {
  module: string;
  maturidade: number;
}

export const MaturityRadarChart = () => {
  const [data, setData] = useState<ModuleMaturity[]>([]);

  useEffect(() => {
    const load = async () => {
      const [ncRes, indRes, measRes, docRes, audRes, planRes, riskRes, trainRes, evRes, capaRes] = await Promise.all([
        supabase.from("non_conformities").select("id, status"),
        supabase.from("quality_indicators").select("id, target_value, is_active"),
        supabase.from("indicator_measurements").select("indicator_id, value").order("period_date", { ascending: false }),
        supabase.from("quality_documents").select("id, status"),
        supabase.from("audits").select("id, status"),
        supabase.from("action_plans").select("id, status"),
        supabase.from("risks").select("id, status"),
        supabase.from("trainings").select("id, status"),
        supabase.from("adverse_events").select("id, status"),
        supabase.from("capas").select("id, status"),
      ]);

      const pct = (done: number, total: number) => total === 0 ? 0 : Math.round((done / total) * 100);

      const ncs = (ncRes.data as any[]) ?? [];
      const docs = (docRes.data as any[]) ?? [];
      const auds = (audRes.data as any[]) ?? [];
      const plans = (planRes.data as any[]) ?? [];
      const risks = (riskRes.data as any[]) ?? [];
      const trains = (trainRes.data as any[]) ?? [];
      const events = (evRes.data as any[]) ?? [];
      const capas = (capaRes.data as any[]) ?? [];
      const inds = (indRes.data as any[]) ?? [];
      const meas = (measRes.data as any[]) ?? [];

      // Indicators: % on target
      const indOnTarget = inds.filter(ind => {
        const lastM = meas.find((m: any) => m.indicator_id === ind.id);
        return lastM && lastM.value >= ind.target_value;
      }).length;

      setData([
        { module: "NCs", maturidade: pct(ncs.filter(n => n.status === "concluida").length, ncs.length) },
        { module: "Indicadores", maturidade: pct(indOnTarget, inds.length) },
        { module: "Documentos", maturidade: pct(docs.filter(d => d.status === "aprovado").length, docs.length) },
        { module: "Auditorias", maturidade: pct(auds.filter(a => a.status === "concluida").length, auds.length) },
        { module: "Planos", maturidade: pct(plans.filter(p => p.status === "concluido").length, plans.length) },
        { module: "Riscos", maturidade: pct(risks.filter(r => r.status === "mitigado" || r.status === "controlado").length, risks.length) },
        { module: "Treinamentos", maturidade: pct(trains.filter(t => t.status === "concluido").length, trains.length) },
        { module: "Eventos", maturidade: pct(events.filter(e => e.status === "encerrado").length, events.length) },
        { module: "CAPAs", maturidade: pct(capas.filter(c => c.status === "encerrada").length, capas.length) },
      ]);
    };
    load();
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Maturidade do SGQ</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Sem dados suficientes</p>
        </div>
      </div>
    );
  }

  const avgMaturity = Math.round(data.reduce((s, d) => s + d.maturidade, 0) / data.length);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)] lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground">Maturidade do SGQ por Módulo</h4>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
          avgMaturity >= 70 ? "bg-safe/10 text-safe" : avgMaturity >= 40 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
        }`}>
          Média: {avgMaturity}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="module" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <Radar
            name="Maturidade %"
            dataKey="maturidade"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip {...tooltipStyle} formatter={(value: number) => [`${value}%`, "Maturidade"]} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
