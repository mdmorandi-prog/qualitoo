import { useEffect, useState } from "react";
import { Clock, AlertTriangle, ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface OverdueItem {
  id: string;
  title: string;
  module: string;
  deadline: string;
  daysOverdue: number;
  severity: "warning" | "critical" | "extreme";
}

const SlaEscalationPanel = () => {
  const [items, setItems] = useState<OverdueItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const overdueItems: OverdueItem[] = [];

      // Check NCs with deadlines
      const { data: ncs } = await supabase.from("non_conformities").select("id, title, deadline, status").neq("status", "concluida");
      for (const nc of (ncs as any[]) || []) {
        if (nc.deadline && new Date(nc.deadline) < now) {
          const days = Math.floor((now.getTime() - new Date(nc.deadline).getTime()) / (1000 * 60 * 60 * 24));
          overdueItems.push({
            id: nc.id, title: nc.title, module: "NC", deadline: nc.deadline,
            daysOverdue: days, severity: days > 30 ? "extreme" : days > 14 ? "critical" : "warning",
          });
        }
      }

      // Check CAPAs
      const { data: capas } = await supabase.from("capas").select("id, title, deadline, status").neq("status", "encerrada");
      for (const c of (capas as any[]) || []) {
        if (c.deadline && new Date(c.deadline) < now) {
          const days = Math.floor((now.getTime() - new Date(c.deadline).getTime()) / (1000 * 60 * 60 * 24));
          overdueItems.push({
            id: c.id, title: c.title, module: "CAPA", deadline: c.deadline,
            daysOverdue: days, severity: days > 30 ? "extreme" : days > 14 ? "critical" : "warning",
          });
        }
      }

      // Check Action Plans
      const { data: plans } = await supabase.from("action_plans").select("id, title, when_end, status").not("status", "in", '("concluido","cancelado")');
      for (const p of (plans as any[]) || []) {
        if (p.when_end && new Date(p.when_end) < now) {
          const days = Math.floor((now.getTime() - new Date(p.when_end).getTime()) / (1000 * 60 * 60 * 24));
          overdueItems.push({
            id: p.id, title: p.title, module: "Plano", deadline: p.when_end,
            daysOverdue: days, severity: days > 30 ? "extreme" : days > 14 ? "critical" : "warning",
          });
        }
      }

      overdueItems.sort((a, b) => b.daysOverdue - a.daysOverdue);
      setItems(overdueItems.slice(0, 10));
    };
    load();
  }, []);

  if (items.length === 0) return null;

  const sevStyles = {
    warning: "border-l-warning bg-warning/5",
    critical: "border-l-destructive bg-destructive/5",
    extreme: "border-l-destructive bg-destructive/10 animate-pulse",
  };

  return (
    <div className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-destructive" />
        <h3 className="text-sm font-bold text-foreground">Auto-Escalonamento SLA</h3>
        <Badge variant="destructive" className="text-[10px]">{items.length} vencidos</Badge>
      </div>
      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
        {items.map(item => (
          <div key={`${item.module}-${item.id}`} className={`flex items-center gap-2 rounded-lg border-l-4 px-3 py-2 ${sevStyles[item.severity]}`}>
            <ArrowUp className={`h-3.5 w-3.5 shrink-0 ${item.severity === "extreme" ? "text-destructive" : "text-warning"}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
              <p className="text-[10px] text-muted-foreground">{item.module} • {item.daysOverdue}d atraso</p>
            </div>
            {item.severity === "extreme" && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SlaEscalationPanel;
