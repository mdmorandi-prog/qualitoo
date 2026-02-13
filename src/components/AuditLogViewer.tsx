import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

interface AuditEntry {
  id: string;
  user_email: string;
  action: string;
  module: string | null;
  record_id: string | null;
  details: any;
  created_at: string;
}

const AuditLogViewer = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLogs((data as any[]) ?? []);
        setLoading(false);
      });
  }, [isAdmin]);

  if (!isAdmin) {
    return <p className="text-sm text-muted-foreground">Acesso restrito a administradores.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Log de Auditoria Global</h2>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum registro de auditoria encontrado.</p>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{log.action}</span>
                    {log.module && <Badge variant="secondary" className="text-[10px]">{log.module}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {log.user_email} • {new Date(log.created_at).toLocaleString("pt-BR")}
                  </p>
                  {log.details && (
                    <pre className="mt-1 text-[10px] text-muted-foreground bg-muted/50 rounded p-1 overflow-auto max-h-20">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AuditLogViewer;
