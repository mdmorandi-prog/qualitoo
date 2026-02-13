import { useState, useEffect } from "react";
import { ScrollText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuditLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actor_name: string | null;
  actor_email: string | null;
  user_agent: string | null;
  document_hash: string | null;
  details: any;
  created_at: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  document_opened: { label: "Documento aberto", color: "text-muted-foreground" },
  signature_requested: { label: "Assinatura solicitada", color: "text-accent" },
  identity_verified: { label: "Identidade verificada", color: "text-safe" },
  identity_verification_failed: { label: "Verificação falhou", color: "text-destructive" },
  document_signed_started: { label: "Assinatura iniciada", color: "text-warning" },
  document_signed: { label: "Documento assinado", color: "text-safe" },
  signature_verified: { label: "Assinatura verificada", color: "text-primary" },
  signature_revoked: { label: "Assinatura revogada", color: "text-destructive" },
  audit_report_generated: { label: "Relatório gerado", color: "text-muted-foreground" },
};

const SignatureAuditLog = ({ open, onOpenChange, documentId, documentTitle }: AuditLogProps) => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) fetchLogs();
  }, [open]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("signature_audit_log")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true });
    if (error) toast.error("Erro ao carregar logs");
    else setEntries((data as any[]) ?? []);
    setLoading(false);

    // Log this access
    await supabase.from("signature_audit_log").insert({
      document_id: documentId,
      action: "audit_report_generated",
      details: { entries_count: data?.length ?? 0 } as any,
    } as any);
  };

  const exportReport = () => {
    const lines = [
      `RELATÓRIO DE AUDITORIA DE ASSINATURA ELETRÔNICA`,
      `Documento: ${documentTitle}`,
      `Data de Geração: ${new Date().toLocaleString("pt-BR")}`,
      `Total de Registros: ${entries.length}`,
      ``,
      `${"=".repeat(80)}`,
      ...entries.map((e, i) => [
        ``,
        `#${i + 1} — ${actionLabels[e.action]?.label || e.action}`,
        `  Data/Hora: ${new Date(e.created_at).toLocaleString("pt-BR")}`,
        `  Ator: ${e.actor_name || "Sistema"} (${e.actor_email || "—"})`,
        e.document_hash ? `  Hash do Documento: ${e.document_hash}` : null,
        e.user_agent ? `  Dispositivo: ${e.user_agent.substring(0, 80)}...` : null,
        e.details && Object.keys(e.details).length > 0 ? `  Detalhes: ${JSON.stringify(e.details)}` : null,
      ].filter(Boolean).join("\n")),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `auditoria-assinatura-${documentId.substring(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório de auditoria exportado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ScrollText className="h-5 w-5 text-primary" />
            Trilha de Auditoria — {documentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{entries.length} registros encontrados</p>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportReport} disabled={loading || entries.length === 0}>
              <Download className="h-4 w-4" /> Exportar Relatório
            </Button>
          </div>

          <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Ator</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
                ) : entries.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum registro de auditoria.</TableCell></TableRow>
                ) : entries.map((e, i) => {
                  const cfg = actionLabels[e.action] || { label: e.action, color: "text-foreground" };
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {e.actor_name || "Sistema"}
                        {e.actor_email && <span className="text-muted-foreground ml-1">({e.actor_email})</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[120px]">
                        {e.document_hash ? e.document_hash.substring(0, 16) + "..." : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureAuditLog;
