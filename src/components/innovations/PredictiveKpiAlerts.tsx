import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface PredictiveAlert {
  indicatorName: string;
  currentValue: number;
  targetValue: number;
  predictedValue: number;
  trend: "improving" | "declining" | "stable";
  alert: boolean;
  unit: string;
}

// Simple linear regression
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += values[i]; sumXY += i * values[i]; sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

const PredictiveKpiAlerts = () => {
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);

  useEffect(() => {
    const load = async () => {
      const [indRes, measRes] = await Promise.all([
        supabase.from("quality_indicators").select("id, name, target_value, unit").eq("is_active", true),
        supabase.from("indicator_measurements").select("indicator_id, value, period_date").order("period_date", { ascending: true }),
      ]);

      const indicators = (indRes.data as any[]) || [];
      const measurements = (measRes.data as any[]) || [];
      const predictiveAlerts: PredictiveAlert[] = [];

      for (const ind of indicators) {
        const indMeas = measurements.filter(m => m.indicator_id === ind.id);
        if (indMeas.length < 3) continue;

        const values = indMeas.map(m => m.value);
        const lastValue = values[values.length - 1];
        const { slope, intercept } = linearRegression(values);
        const predictedNext = slope * values.length + intercept;

        const trend = slope > 0.5 ? "improving" : slope < -0.5 ? "declining" : "stable";
        const willMissTarget = predictedNext < ind.target_value;

        if (willMissTarget || trend === "declining") {
          predictiveAlerts.push({
            indicatorName: ind.name,
            currentValue: lastValue,
            targetValue: ind.target_value,
            predictedValue: Math.round(predictedNext * 10) / 10,
            trend,
            alert: willMissTarget,
            unit: ind.unit,
          });
        }
      }

      setAlerts(predictiveAlerts);
    };
    load();
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-bold text-foreground">Alertas Preditivos de KPI</h3>
        <Badge className="bg-warning/10 text-warning text-[10px]">{alerts.length} alertas</Badge>
      </div>
      <div className="space-y-2">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 border">
            {a.trend === "declining" ? (
              <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{a.indicatorName}</p>
              <p className="text-[10px] text-muted-foreground">
                Atual: {a.currentValue}{a.unit} → Previsão: {a.predictedValue}{a.unit} (Meta: {a.targetValue}{a.unit})
              </p>
            </div>
            {a.alert && <Badge variant="destructive" className="text-[9px] shrink-0">Risco</Badge>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PredictiveKpiAlerts;
