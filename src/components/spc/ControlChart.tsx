import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";

export interface SpcPoint {
  label: string;
  value: number;
}

interface ControlChartProps {
  /** Título contextual */
  title: string;
  /** Descrição (ex: "medições mensais de eventos adversos") */
  description?: string;
  /** Série ordenada cronologicamente */
  data: SpcPoint[];
  /** Meta opcional (linha verde) */
  target?: number;
  unit?: string;
  height?: number;
}

/**
 * Gráfico de Controle de Processo (Shewhart X-chart).
 * Calcula média e limites de controle (±3σ) sobre a própria série
 * e destaca pontos fora dos limites (causa especial de variação).
 *
 * Aplicável a qualquer módulo que registre observações no tempo:
 * indicadores mensais, NCs por mês, eventos adversos por mês, etc.
 */
export const ControlChart = ({
  title,
  description,
  data,
  target,
  unit,
  height = 280,
}: ControlChartProps) => {
  const stats = useMemo(() => {
    if (data.length < 2) return null;
    const values = data.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const sd = Math.sqrt(variance);
    const ucl = mean + 3 * sd;
    const lcl = Math.max(0, mean - 3 * sd);
    const outliers = data.filter((d) => d.value > ucl || d.value < lcl).length;
    return { mean, sd, ucl, lcl, outliers };
  }, [data]);

  if (data.length < 2) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-2">
          Registre ao menos 2 observações para gerar o gráfico de controle
          estatístico (CEP).
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    ucl: stats!.ucl,
    lcl: stats!.lcl,
    mean: stats!.mean,
  }));

  return (
    <div className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-2 font-display text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-[10px]">
          <span className="rounded bg-primary/10 px-2 py-1 font-mono text-primary">
            μ = {stats!.mean.toFixed(2)}
            {unit ? ` ${unit}` : ""}
          </span>
          <span className="rounded bg-destructive/10 px-2 py-1 font-mono text-destructive">
            LSC = {stats!.ucl.toFixed(2)}
          </span>
          <span className="rounded bg-destructive/10 px-2 py-1 font-mono text-destructive">
            LIC = {stats!.lcl.toFixed(2)}
          </span>
          {stats!.outliers > 0 && (
            <span className="flex items-center gap-1 rounded bg-warning/10 px-2 py-1 font-medium text-warning">
              <AlertTriangle className="h-3 w-3" />
              {stats!.outliers} fora de controle
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine
            y={stats!.ucl}
            stroke="hsl(var(--destructive))"
            strokeDasharray="4 3"
            label={{ value: "LSC", position: "right", fill: "hsl(var(--destructive))", fontSize: 10 }}
          />
          <ReferenceLine
            y={stats!.mean}
            stroke="hsl(var(--primary))"
            label={{ value: "μ", position: "right", fill: "hsl(var(--primary))", fontSize: 10 }}
          />
          <ReferenceLine
            y={stats!.lcl}
            stroke="hsl(var(--destructive))"
            strokeDasharray="4 3"
            label={{ value: "LIC", position: "right", fill: "hsl(var(--destructive))", fontSize: 10 }}
          />
          {target !== undefined && (
            <ReferenceLine
              y={target}
              stroke="hsl(var(--safe, 142 71% 45%))"
              strokeDasharray="2 2"
              label={{ value: "Meta", position: "left", fontSize: 10 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            name={unit ? `Valor (${unit})` : "Valor"}
            stroke="hsl(var(--foreground))"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const out = payload.value > stats!.ucl || payload.value < stats!.lcl;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={out ? 5 : 3.5}
                  fill={out ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                  stroke="hsl(var(--card))"
                  strokeWidth={1.5}
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      <p className="mt-2 text-[10px] text-muted-foreground">
        Gráfico de Controle de Processo (CEP · Shewhart X). Limites calculados como média ±3σ sobre a própria série. Pontos em vermelho indicam causa especial de variação e demandam investigação.
      </p>
    </div>
  );
};

export default ControlChart;

/** Utilitário: agrupa registros por mês (YYYY-MM) para contagem. */
export const groupByMonth = <T,>(
  items: T[],
  getDate: (item: T) => string | Date | null | undefined,
  months = 12
): SpcPoint[] => {
  const now = new Date();
  const buckets: { key: string; label: string; value: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    buckets.push({ key, label, value: 0 });
  }
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.find((x) => x.key === key);
    if (b) b.value += 1;
  }
  return buckets.map(({ label, value }) => ({ label, value }));
};

/** Utilitário: computa média/limites p/ passar ao PDF SVG builder. */
export const computeSpcStats = (points: SpcPoint[]) => {
  const values = points.map((p) => p.value);
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(
    values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length
  );
  return {
    mean,
    sd,
    ucl: mean + 3 * sd,
    lcl: Math.max(0, mean - 3 * sd),
  };
};
