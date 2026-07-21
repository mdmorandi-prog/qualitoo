import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CalendarClock, Lock, Unlock, Trash2, ShieldAlert, ScrollText, CheckCircle2 } from "lucide-react";

interface RetentionInfo {
  retention_period_months: number | null;
  retention_basis: string | null;
  retention_start_date: string | null;
  disposal_eligible_at: string | null;
  legal_hold: boolean;
  legal_hold_reason: string | null;
  disposed_at: string | null;
  disposal_reason: string | null;
  disposal_method: string | null;
  status: string;
}

interface DisposalLogEntry {
  id: string;
  action: string;
  reason: string | null;
  method: string | null;
  created_at: string;
  performed_by: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  documentId: string;
  documentTitle: string;
  onUpdated?: () => void;
}

const ACTION_LABEL: Record<string, { label: string; color: string; icon: any }> = {
  retention_defined: { label: "Retenção definida", color: "bg-primary/10 text-primary", icon: CalendarClock },
  legal_hold_applied: { label: "Bloqueio legal aplicado", color: "bg-warning/10 text-warning", icon: Lock },
  legal_hold_released: { label: "Bloqueio legal liberado", color: "bg-safe/10 text-safe", icon: Unlock },
  disposal_authorized: { label: "Descarte autorizado", color: "bg-warning/10 text-warning", icon: ShieldAlert },
  disposed: { label: "Documento descartado", color: "bg-destructive/10 text-destructive", icon: Trash2 },
};

const BASIS_OPTIONS = [
  "ISO 9001:2015 - 7.5.3",
  "ANVISA RDC 63/2011",
  "LGPD - Lei 13.709/2018",
  "CLT - 5 anos",
  "Código Civil - 10 anos",
  "Norma interna",
  "Outro",
];

const METHOD_OPTIONS = [
  "Exclusão eletrônica segura",
  "Anonimização (LGPD)",
  "Trituração física (mídia impressa)",
  "Arquivo permanente (histórico)",
];

export default function DocumentRetention({ open, onOpenChange, documentId, documentTitle, onUpdated }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<RetentionInfo | null>(null);
  const [log, setLog] = useState<DisposalLogEntry[]>([]);

  const [months, setMonths] = useState("");
  const [basis, setBasis] = useState("");
  const [customBasis, setCustomBasis] = useState("");
  const [startDate, setStartDate] = useState("");

  const [holdDialogOpen, setHoldDialogOpen] = useState(false);
  const [holdReason, setHoldReason] = useState("");

  const [disposeDialogOpen, setDisposeDialogOpen] = useState(false);
  const [disposeReason, setDisposeReason] = useState("");
  const [disposeMethod, setDisposeMethod] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) fetchAll();
  }, [open, documentId]);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: doc }, { data: logs }] = await Promise.all([
      supabase.from("quality_documents").select(
        "retention_period_months, retention_basis, retention_start_date, disposal_eligible_at, legal_hold, legal_hold_reason, disposed_at, disposal_reason, disposal_method, status"
      ).eq("id", documentId).single(),
      supabase.from("document_disposal_log" as any).select("*").eq("document_id", documentId).order("created_at", { ascending: false }),
    ]);
    if (doc) {
      setInfo(doc as any);
      setMonths(doc.retention_period_months?.toString() ?? "");
      const savedBasis = doc.retention_basis ?? "";
      if (savedBasis && BASIS_OPTIONS.includes(savedBasis)) {
        setBasis(savedBasis); setCustomBasis("");
      } else if (savedBasis) {
        setBasis("Outro"); setCustomBasis(savedBasis);
      } else { setBasis(""); setCustomBasis(""); }
      setStartDate(doc.retention_start_date ?? "");
    }
    setLog((logs as any[]) ?? []);
    setLoading(false);
  };

  const logAction = async (action: string, reason?: string, method?: string) => {
    if (!user) return;
    const snapshot = {
      retention_period_months: info?.retention_period_months,
      retention_basis: info?.retention_basis,
      retention_start_date: info?.retention_start_date,
      disposal_eligible_at: info?.disposal_eligible_at,
      legal_hold: info?.legal_hold,
    };
    await supabase.from("document_disposal_log" as any).insert({
      document_id: documentId,
      action,
      performed_by: user.id,
      reason: reason ?? null,
      method: method ?? null,
      retention_snapshot: snapshot,
      user_agent: navigator.userAgent,
    });
  };

  const saveRetention = async () => {
    const m = parseInt(months);
    if (!m || m < 1) { toast.error("Informe um período de retenção válido (meses)."); return; }
    const finalBasis = basis === "Outro" ? customBasis.trim() : basis;
    if (!finalBasis) { toast.error("Informe a base legal/regulatória."); return; }
    setSaving(true);
    const { error } = await supabase.from("quality_documents").update({
      retention_period_months: m,
      retention_basis: finalBasis,
      retention_start_date: startDate || new Date().toISOString().slice(0, 10),
    }).eq("id", documentId);
    if (error) { toast.error("Erro ao salvar retenção"); setSaving(false); return; }
    await logAction("retention_defined", `${m} meses • ${finalBasis}`);
    toast.success("Política de retenção salva");
    setSaving(false);
    fetchAll(); onUpdated?.();
  };

  const applyLegalHold = async () => {
    if (!holdReason.trim()) { toast.error("Informe o motivo do bloqueio legal."); return; }
    setSaving(true);
    const { error } = await supabase.from("quality_documents").update({
      legal_hold: true, legal_hold_reason: holdReason.trim(),
    }).eq("id", documentId);
    if (!error) {
      await logAction("legal_hold_applied", holdReason.trim());
      toast.success("Bloqueio legal aplicado");
      setHoldDialogOpen(false); setHoldReason(""); fetchAll(); onUpdated?.();
    } else toast.error("Erro ao aplicar bloqueio");
    setSaving(false);
  };

  const releaseLegalHold = async () => {
    setSaving(true);
    const { error } = await supabase.from("quality_documents").update({
      legal_hold: false, legal_hold_reason: null,
    }).eq("id", documentId);
    if (!error) {
      await logAction("legal_hold_released", "Bloqueio liberado por autoridade competente");
      toast.success("Bloqueio legal liberado"); fetchAll(); onUpdated?.();
    } else toast.error("Erro ao liberar bloqueio");
    setSaving(false);
  };

  const disposeDocument = async () => {
    if (!disposeReason.trim() || !disposeMethod) {
      toast.error("Informe motivo e método de descarte."); return;
    }
    setSaving(true);
    await logAction("disposal_authorized", disposeReason.trim(), disposeMethod);
    const { error } = await supabase.from("quality_documents").update({
      status: "descartado" as any,
      disposed_at: new Date().toISOString(),
      disposed_by: user!.id,
      disposal_reason: disposeReason.trim(),
      disposal_method: disposeMethod,
    }).eq("id", documentId);
    if (!error) {
      await logAction("disposed", disposeReason.trim(), disposeMethod);
      toast.success("Documento descartado. Trilha registrada.");
      setDisposeDialogOpen(false); setDisposeReason(""); setDisposeMethod("");
      fetchAll(); onUpdated?.();
    } else toast.error("Erro no descarte");
    setSaving(false);
  };

  const isEligible = info?.disposal_eligible_at && new Date(info.disposal_eligible_at) <= new Date();
  const alreadyDisposed = !!info?.disposed_at;
  const daysLeft = info?.disposal_eligible_at
    ? Math.ceil((new Date(info.disposal_eligible_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <CalendarClock className="h-5 w-5 text-primary" />
            Retenção & Descarte — {documentTitle}
          </DialogTitle>
        </DialogHeader>

        {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : info && (
          <div className="space-y-6">
            {/* Status banner */}
            <div className="flex flex-wrap items-center gap-2">
              {alreadyDisposed && <Badge variant="destructive" className="gap-1"><Trash2 className="h-3 w-3" /> Descartado em {new Date(info.disposed_at!).toLocaleDateString("pt-BR")}</Badge>}
              {info.legal_hold && <Badge className="gap-1 bg-warning/10 text-warning hover:bg-warning/10 border-warning/20"><Lock className="h-3 w-3" /> Bloqueio legal ativo</Badge>}
              {!alreadyDisposed && info.disposal_eligible_at && (
                isEligible
                  ? <Badge className="gap-1 bg-destructive/10 text-destructive hover:bg-destructive/10 border-destructive/20"><ShieldAlert className="h-3 w-3" /> Elegível para descarte</Badge>
                  : <Badge variant="outline" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Em retenção • {daysLeft} dias restantes</Badge>
              )}
              {!info.disposal_eligible_at && !alreadyDisposed && <Badge variant="outline">Sem política definida</Badge>}
            </div>

            {/* Retention policy form */}
            {!alreadyDisposed && (
              <div className="rounded-lg border p-4 space-y-3">
                <h3 className="text-sm font-semibold">Política de retenção</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="months">Período (meses)</Label>
                    <Input id="months" type="number" min={1} value={months} onChange={e => setMonths(e.target.value)} placeholder="Ex.: 60" />
                  </div>
                  <div>
                    <Label htmlFor="start">Início da retenção</Label>
                    <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Base legal</Label>
                    <Select value={basis} onValueChange={setBasis}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {BASIS_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {basis === "Outro" && (
                  <Input placeholder="Descreva a base legal/regulatória" value={customBasis} onChange={e => setCustomBasis(e.target.value)} />
                )}
                {info.disposal_eligible_at && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Elegível para descarte a partir de:</span>{" "}
                    {new Date(info.disposal_eligible_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
                <Button size="sm" onClick={saveRetention} disabled={saving}>Salvar política</Button>
              </div>
            )}

            {/* Legal hold */}
            {!alreadyDisposed && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Bloqueio legal (Legal Hold)</h3>
                    <p className="text-xs text-muted-foreground mt-1">Impede o descarte durante litígios, auditorias externas ou investigações.</p>
                    {info.legal_hold && info.legal_hold_reason && (
                      <p className="text-xs mt-2"><span className="font-medium">Motivo:</span> {info.legal_hold_reason}</p>
                    )}
                  </div>
                  {info.legal_hold
                    ? <Button size="sm" variant="outline" onClick={releaseLegalHold} disabled={saving} className="gap-1"><Unlock className="h-4 w-4" /> Liberar</Button>
                    : <Button size="sm" variant="outline" onClick={() => setHoldDialogOpen(true)} className="gap-1"><Lock className="h-4 w-4" /> Aplicar</Button>}
                </div>
              </div>
            )}

            {/* Disposal */}
            {!alreadyDisposed && isEligible && !info.legal_hold && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-destructive flex items-center gap-2"><Trash2 className="h-4 w-4" /> Descarte controlado</h3>
                <p className="text-xs text-muted-foreground">Este documento cumpriu o período de retenção. O descarte gera trilha imutável e não pode ser desfeito.</p>
                <Button size="sm" variant="destructive" onClick={() => setDisposeDialogOpen(true)}>Autorizar descarte</Button>
              </div>
            )}

            {alreadyDisposed && (
              <div className="rounded-lg border p-4 text-xs space-y-1 bg-muted/30">
                <p><span className="font-medium">Descartado em:</span> {new Date(info.disposed_at!).toLocaleString("pt-BR")}</p>
                <p><span className="font-medium">Método:</span> {info.disposal_method}</p>
                <p><span className="font-medium">Motivo:</span> {info.disposal_reason}</p>
              </div>
            )}

            <Separator />

            {/* Audit trail */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ScrollText className="h-4 w-4" /> Trilha de auditoria (imutável)</h3>
              {log.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma ação registrada ainda.</p>
              ) : (
                <ol className="relative border-l pl-6 space-y-4">
                  {log.map(entry => {
                    const cfg = ACTION_LABEL[entry.action] ?? { label: entry.action, color: "bg-muted", icon: ScrollText };
                    const Icon = cfg.icon;
                    return (
                      <li key={entry.id} className="relative">
                        <span className={`absolute -left-[30px] flex h-6 w-6 items-center justify-center rounded-full ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{cfg.label}</Badge>
                          <span className="text-[11px] text-muted-foreground">{new Date(entry.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                        {entry.reason && <p className="mt-1 text-xs">{entry.reason}</p>}
                        {entry.method && <p className="text-[11px] text-muted-foreground">Método: {entry.method}</p>}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Legal hold dialog */}
      <AlertDialog open={holdDialogOpen} onOpenChange={setHoldDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar bloqueio legal</AlertDialogTitle>
            <AlertDialogDescription>Enquanto ativo, este documento não pode ser descartado, mesmo após o período de retenção.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Motivo (processo judicial, auditoria externa, investigação...)" value={holdReason} onChange={e => setHoldReason(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={applyLegalHold}>Aplicar bloqueio</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disposal dialog */}
      <AlertDialog open={disposeDialogOpen} onOpenChange={setDisposeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Autorizar descarte definitivo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong> e será registrada permanentemente na trilha de auditoria com seu usuário, IP e horário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Método de descarte</Label>
              <Select value={disposeMethod} onValueChange={setDisposeMethod}>
                <SelectTrigger><SelectValue placeholder="Selecione o método" /></SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Justificativa</Label>
              <Textarea placeholder="Ex.: Documento cumpriu período de retenção conforme ISO 9001." value={disposeReason} onChange={e => setDisposeReason(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={disposeDocument} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar descarte
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
