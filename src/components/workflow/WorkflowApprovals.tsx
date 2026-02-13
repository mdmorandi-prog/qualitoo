import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ApprovalRequest {
  id: string;
  rule_id: string;
  step_id: string;
  module: string;
  record_id: string;
  record_title: string | null;
  status: string;
  requested_by: string | null;
  decided_by: string | null;
  decision_notes: string | null;
  requested_at: string;
  decided_at: string | null;
}

const WorkflowApprovals = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState<ApprovalRequest | null>(null);
  const [notes, setNotes] = useState("");

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("workflow_approval_requests")
      .select("*")
      .order("requested_at", { ascending: false });
    setRequests((data as unknown as ApprovalRequest[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleDecision = async (status: "aprovado" | "rejeitado") => {
    if (!deciding) return;
    const { error } = await supabase
      .from("workflow_approval_requests")
      .update({
        status,
        decided_by: user?.email ?? "",
        decision_notes: notes || null,
        decided_at: new Date().toISOString(),
      })
      .eq("id", deciding.id);

    if (error) return toast.error("Erro ao processar");
    toast.success(status === "aprovado" ? "Aprovado!" : "Rejeitado!");
    setDeciding(null);
    setNotes("");
    fetchRequests();
  };

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    pendente: { color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: Clock, label: "Pendente" },
    aprovado: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200", icon: CheckCircle2, label: "Aprovado" },
    rejeitado: { color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", icon: XCircle, label: "Rejeitado" },
    escalado: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: AlertTriangle, label: "Escalado" },
    expirado: { color: "bg-muted text-muted-foreground", icon: Clock, label: "Expirado" },
  };

  const pending = requests.filter(r => r.status === "pendente");
  const history = requests.filter(r => r.status !== "pendente");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 font-semibold text-foreground">Pendentes ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma aprovação pendente.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((req) => {
              const sc = statusConfig[req.status];
              return (
                <Card key={req.id} className="border-amber-200 dark:border-amber-800">
                  <CardContent className="flex items-center gap-4 p-4">
                    <sc.icon className="h-5 w-5 text-amber-500" />
                    <div className="flex-1">
                      <p className="font-medium">{req.record_title ?? req.record_id}</p>
                      <p className="text-xs text-muted-foreground">
                        Módulo: {req.module} · Solicitado por: {req.requested_by} · {new Date(req.requested_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => { setDeciding(req); setNotes(""); }}>
                      Decidir
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-foreground">Histórico</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro.</p>
        ) : (
          <div className="space-y-2">
            {history.map((req) => {
              const sc = statusConfig[req.status] ?? statusConfig.pendente;
              return (
                <Card key={req.id}>
                  <CardContent className="flex items-center gap-4 p-3">
                    <sc.icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{req.record_title ?? req.record_id}</span>
                      <span className="mx-2 text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{req.module}</span>
                    </div>
                    <Badge className={sc.color}>{sc.label}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {req.decided_at ? new Date(req.decided_at).toLocaleDateString("pt-BR") : ""}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!deciding} onOpenChange={() => setDeciding(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decisão de Aprovação</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm"><strong>Registro:</strong> {deciding?.record_title ?? deciding?.record_id}</p>
            <p className="text-sm"><strong>Módulo:</strong> {deciding?.module}</p>
            <p className="text-sm"><strong>Solicitante:</strong> {deciding?.requested_by}</p>
            <Textarea placeholder="Observações (opcional)" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => handleDecision("rejeitado")}>
              <XCircle className="mr-1 h-4 w-4" /> Rejeitar
            </Button>
            <Button onClick={() => handleDecision("aprovado")}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowApprovals;
