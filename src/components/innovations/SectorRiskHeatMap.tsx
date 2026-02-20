import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, ShieldAlert, TriangleAlert, Activity } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SectorData {
  sector: string;
  risks: number;
  criticalRisks: number;
  ncs: number;
  events: number;
  total: number;
}

const HOSPITAL_SECTORS_LAYOUT: { name: string; row: number; col: number; span?: number }[] = [
  { name: "UTI", row: 0, col: 0 },
  { name: "Centro Cirúrgico", row: 0, col: 1 },
  { name: "Emergência", row: 0, col: 2 },
  { name: "Farmácia", row: 0, col: 3 },
  { name: "Enfermaria", row: 1, col: 0 },
  { name: "Laboratório", row: 1, col: 1 },
  { name: "Radiologia", row: 1, col: 2 },
  { name: "Ambulatório", row: 1, col: 3 },
  { name: "CME", row: 2, col: 0 },
  { name: "Nutrição", row: 2, col: 1 },
  { name: "Manutenção", row: 2, col: 2 },
  { name: "TI", row: 2, col: 3 },
  { name: "RH", row: 3, col: 0 },
  { name: "Qualidade", row: 3, col: 1 },
  { name: "Administração", row: 3, col: 2 },
  { name: "SCIH", row: 3, col: 3 },
];

const heatColor = (total: number, critical: number) => {
  if (critical > 0 || total >= 8) return "bg-destructive/60 border-destructive/40 text-destructive-foreground";
  if (total >= 5) return "bg-destructive/30 border-destructive/20 text-foreground";
  if (total >= 3) return "bg-warning/30 border-warning/20 text-foreground";
  if (total >= 1) return "bg-safe/20 border-safe/20 text-foreground";
  return "bg-secondary/50 border-border text-muted-foreground";
};

const heatGlow = (total: number, critical: number) => {
  if (critical > 0 || total >= 8) return "shadow-[0_0_20px_hsl(var(--destructive)/0.3)]";
  if (total >= 5) return "shadow-[0_0_12px_hsl(var(--destructive)/0.15)]";
  return "";
};

const SectorRiskHeatMap = () => {
  const [sectorData, setSectorData] = useState<Record<string, SectorData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [risksRes, ncsRes, eventsRes] = await Promise.all([
        supabase.from("risks").select("sector, risk_level"),
        supabase.from("non_conformities").select("sector"),
        supabase.from("adverse_events").select("sector, severity"),
      ]);

      const map: Record<string, SectorData> = {};
      const ensure = (s: string) => {
        const key = s.trim().toLowerCase();
        if (!map[key]) map[key] = { sector: s.trim(), risks: 0, criticalRisks: 0, ncs: 0, events: 0, total: 0 };
        return map[key];
      };

      (risksRes.data ?? []).forEach((r: any) => {
        if (!r.sector) return;
        const d = ensure(r.sector);
        d.risks++;
        if ((r.risk_level ?? 0) >= 15) d.criticalRisks++;
      });

      (ncsRes.data ?? []).forEach((r: any) => {
        if (!r.sector) return;
        ensure(r.sector).ncs++;
      });

      (eventsRes.data ?? []).forEach((r: any) => {
        if (!r.sector) return;
        ensure(r.sector).events++;
      });

      Object.values(map).forEach(d => { d.total = d.risks + d.ncs + d.events; });
      setSectorData(map);
      setLoading(false);
    };
    load();
  }, []);

  const findData = (name: string): SectorData => {
    const key = name.trim().toLowerCase();
    return sectorData[key] ?? { sector: name, risks: 0, criticalRisks: 0, ncs: 0, events: 0, total: 0 };
  };

  const maxRows = 4;
  const maxCols = 4;

  return (
    <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">
            🏥 Mapa de Calor Geoespacial — Setores
          </h3>
          <p className="text-xs text-muted-foreground">
            Concentração de riscos, NCs e eventos adversos por área física
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-secondary/50 border border-border" /> Sem ocorrências</span>
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-safe/20 border border-safe/20" /> Baixo</span>
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-warning/30 border border-warning/20" /> Médio</span>
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-destructive/30 border border-destructive/20" /> Alto</span>
          <span className="flex items-center gap-1"><div className="h-2.5 w-2.5 rounded bg-destructive/60 border border-destructive/40" /> Crítico</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Carregando mapa...</div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {HOSPITAL_SECTORS_LAYOUT.map(({ name }) => {
            const d = findData(name);
            return (
              <Tooltip key={name}>
                <TooltipTrigger asChild>
                  <div
                    className={`relative flex flex-col items-center justify-center rounded-lg border p-3 transition-all hover:scale-[1.03] cursor-default min-h-[90px] ${heatColor(d.total, d.criticalRisks)} ${heatGlow(d.total, d.criticalRisks)}`}
                  >
                    <span className="text-xs font-bold leading-tight text-center">{name}</span>
                    {d.total > 0 ? (
                      <div className="mt-1.5 flex items-center gap-2">
                        {d.risks > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <TriangleAlert className="h-3 w-3" />{d.risks}
                          </span>
                        )}
                        {d.ncs > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <AlertTriangle className="h-3 w-3" />{d.ncs}
                          </span>
                        )}
                        {d.events > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px]">
                            <ShieldAlert className="h-3 w-3" />{d.events}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="mt-1 text-[10px] opacity-50">—</span>
                    )}
                    {d.criticalRisks > 0 && (
                      <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground animate-pulse">
                        !
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-bold">{name}</p>
                  <p>⚠️ Riscos: {d.risks} ({d.criticalRisks} críticos)</p>
                  <p>🔴 NCs: {d.ncs}</p>
                  <p>🏥 Eventos Adversos: {d.events}</p>
                  <p className="mt-1 font-bold">Total de ocorrências: {d.total}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SectorRiskHeatMap;
