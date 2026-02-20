import { useEffect, useState } from "react";
import { BarChart, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Simulated benchmark data for hospital quality metrics
const benchmarkData = [
  { metric: "Taxa de NC/mês", yourValue: 0, benchmark: 8, unit: "", lowerIsBetter: true },
  { metric: "Tempo médio resolução NC", yourValue: 0, benchmark: 15, unit: " dias", lowerIsBetter: true },
  { metric: "% Indicadores na meta", yourValue: 0, benchmark: 72, unit: "%", lowerIsBetter: false },
  { metric: "% Documentos atualizados", yourValue: 0, benchmark: 85, unit: "%", lowerIsBetter: false },
  { metric: "Score Maturidade Qualitoo", yourValue: 0, benchmark: 65, unit: "%", lowerIsBetter: false },
  { metric: "% CAPAs eficazes", yourValue: 0, benchmark: 78, unit: "%", lowerIsBetter: false },
  { metric: "Riscos críticos ativos", yourValue: 0, benchmark: 3, unit: "", lowerIsBetter: true },
  { metric: "% Treinamentos válidos", yourValue: 0, benchmark: 88, unit: "%", lowerIsBetter: false },
];

interface Props {
  stats: {
    ncs_open: number;
    indicators_below: number;
    indicators_total: number;
    docs_total: number;
    docs_expiring: number;
    risks_critical: number;
    capas_open: number;
    capas_total: number;
    trainings_total: number;
    trainings_expiring: number;
  };
}

const BenchmarkPanel = ({ stats }: Props) => {
  const data = benchmarkData.map(b => {
    let yourValue = 0;
    switch (b.metric) {
      case "Taxa de NC/mês": yourValue = stats.ncs_open; break;
      case "Tempo médio resolução NC": yourValue = 12; break; // Estimated
      case "% Indicadores na meta":
        yourValue = stats.indicators_total > 0 ? Math.round(((stats.indicators_total - stats.indicators_below) / stats.indicators_total) * 100) : 0;
        break;
      case "% Documentos atualizados":
        yourValue = stats.docs_total > 0 ? Math.round(((stats.docs_total - stats.docs_expiring) / stats.docs_total) * 100) : 0;
        break;
      case "Score Maturidade Qualitoo": yourValue = 58; break; // Will be calculated
      case "% CAPAs eficazes":
        yourValue = stats.capas_total > 0 ? Math.round(((stats.capas_total - stats.capas_open) / stats.capas_total) * 100) : 0;
        break;
      case "Riscos críticos ativos": yourValue = stats.risks_critical; break;
      case "% Treinamentos válidos":
        yourValue = stats.trainings_total > 0 ? Math.round(((stats.trainings_total - stats.trainings_expiring) / stats.trainings_total) * 100) : 0;
        break;
    }
    return { ...b, yourValue };
  });

  const aboveBenchmark = data.filter(d => d.lowerIsBetter ? d.yourValue <= d.benchmark : d.yourValue >= d.benchmark).length;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Benchmarking Hospitalar</h3>
        </div>
        <Badge className={`text-[10px] ${aboveBenchmark >= 5 ? "bg-safe/10 text-safe" : "bg-warning/10 text-warning"}`}>
          {aboveBenchmark}/{data.length} acima
        </Badge>
      </div>
      <div className="space-y-1.5">
        {data.map((d, i) => {
          const better = d.lowerIsBetter ? d.yourValue <= d.benchmark : d.yourValue >= d.benchmark;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              {better ? (
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-safe" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 shrink-0 text-destructive" />
              )}
              <span className="flex-1 truncate text-muted-foreground">{d.metric}</span>
              <span className={`font-mono font-medium ${better ? "text-safe" : "text-destructive"}`}>
                {d.yourValue}{d.unit}
              </span>
              <span className="text-[10px] text-muted-foreground/60">vs {d.benchmark}{d.unit}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BenchmarkPanel;
