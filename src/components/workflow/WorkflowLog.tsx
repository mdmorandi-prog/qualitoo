import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Zap } from "lucide-react";

interface LogEntry {
  id: string;
  rule_name: string | null;
  module: string;
  record_id: string | null;
  trigger_event: string | null;
  conditions_met: boolean;
  actions_executed: any;
  executed_at: string;
  notes: string | null;
}

const WorkflowLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("workflow_execution_log")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs((data as unknown as LogEntry[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Histórico de Execução</h3>
      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma execução registrada.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center gap-3 p-3">
                {log.conditions_met ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-amber-500" />
                    <span className="font-medium">{log.rule_name ?? "Regra"}</span>
                    <Badge variant="outline" className="text-[10px]">{log.module}</Badge>
                    {log.trigger_event && (
                      <Badge variant="outline" className="text-[10px]">{log.trigger_event}</Badge>
                    )}
                  </div>
                  {log.notes && <p className="mt-1 text-xs text-muted-foreground">{log.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.executed_at).toLocaleString("pt-BR")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkflowLog;
