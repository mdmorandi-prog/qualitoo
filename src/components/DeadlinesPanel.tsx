import { useEffect, useState } from "react";
import { Clock, AlertTriangle, FileText, GraduationCap, ClipboardCheck, Ruler } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Deadline {
  id: string;
  title: string;
  date: string;
  type: "document" | "training" | "audit" | "calibration" | "action_plan";
  daysLeft: number;
}

const typeConfig = {
  document: { icon: FileText, label: "Documento", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  training: { icon: GraduationCap, label: "Treinamento", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  audit: { icon: ClipboardCheck, label: "Auditoria", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  calibration: { icon: Ruler, label: "Calibração", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  action_plan: { icon: AlertTriangle, label: "Plano de Ação", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const DeadlinesPanel = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const sixtyDays = new Date();
      sixtyDays.setDate(now.getDate() + 60);
      const items: Deadline[] = [];

      const [docsRes, trainsRes, audsRes, calsRes, plansRes] = await Promise.all([
        supabase.from("quality_documents").select("id, title, valid_until").eq("status", "aprovado").not("valid_until", "is", null),
        supabase.from("trainings").select("id, title, expiry_date").not("expiry_date", "is", null),
        supabase.from("audits").select("id, title, scheduled_date").eq("status", "planejada"),
        supabase.from("calibrations").select("id, certificate_number, next_calibration_date").not("next_calibration_date", "is", null),
        supabase.from("action_plans").select("id, title, when_end").neq("status", "concluido").not("when_end", "is", null),
      ]);

      (docsRes.data ?? []).forEach((d: any) => {
        const date = new Date(d.valid_until);
        if (date <= sixtyDays) {
          items.push({ id: d.id, title: d.title, date: d.valid_until, type: "document", daysLeft: Math.ceil((date.getTime() - now.getTime()) / 86400000) });
        }
      });

      (trainsRes.data ?? []).forEach((t: any) => {
        const date = new Date(t.expiry_date);
        if (date <= sixtyDays) {
          items.push({ id: t.id, title: t.title, date: t.expiry_date, type: "training", daysLeft: Math.ceil((date.getTime() - now.getTime()) / 86400000) });
        }
      });

      (audsRes.data ?? []).forEach((a: any) => {
        const date = new Date(a.scheduled_date);
        if (date <= sixtyDays) {
          items.push({ id: a.id, title: a.title, date: a.scheduled_date, type: "audit", daysLeft: Math.ceil((date.getTime() - now.getTime()) / 86400000) });
        }
      });

      (calsRes.data ?? []).forEach((c: any) => {
        const date = new Date(c.next_calibration_date);
        if (date <= sixtyDays) {
          items.push({ id: c.id, title: c.certificate_number || "Calibração", date: c.next_calibration_date, type: "calibration", daysLeft: Math.ceil((date.getTime() - now.getTime()) / 86400000) });
        }
      });

      (plansRes.data ?? []).forEach((p: any) => {
        const date = new Date(p.when_end);
        if (date <= sixtyDays) {
          items.push({ id: p.id, title: p.title, date: p.when_end, type: "action_plan", daysLeft: Math.ceil((date.getTime() - now.getTime()) / 86400000) });
        }
      });

      items.sort((a, b) => a.daysLeft - b.daysLeft);
      setDeadlines(items.slice(0, 15));
    };
    load();
  }, []);

  if (deadlines.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Próximos Vencimentos</h3>
        <Badge variant="secondary" className="ml-auto text-[10px]">{deadlines.length}</Badge>
      </div>
      <div className="space-y-2 max-h-64 overflow-auto">
        {deadlines.map((d) => {
          const cfg = typeConfig[d.type];
          const Icon = cfg.icon;
          const isOverdue = d.daysLeft < 0;
          const isUrgent = d.daysLeft >= 0 && d.daysLeft <= 7;

          return (
            <div key={`${d.type}-${d.id}`} className="flex items-center gap-3 rounded-lg border p-2.5 text-xs">
              <div className={`rounded-md p-1.5 ${cfg.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{d.title}</p>
                <p className="text-muted-foreground">{cfg.label} • {new Date(d.date).toLocaleDateString("pt-BR")}</p>
              </div>
              <Badge
                variant={isOverdue ? "destructive" : "secondary"}
                className={`text-[10px] shrink-0 ${isUrgent && !isOverdue ? "bg-warning/15 text-warning border-warning/30" : ""}`}
              >
                {isOverdue ? `${Math.abs(d.daysLeft)}d atrás` : `${d.daysLeft}d`}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeadlinesPanel;
