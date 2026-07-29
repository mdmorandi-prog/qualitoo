import { useEffect, useState } from "react";
import { Search, Loader2, FileCheck2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ExportPdfButton from "@/components/ExportPdfButton";
import { generateModuleReport } from "@/lib/pdfReport";

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  acesso: "Acesso aos dados",
  correcao: "Correção de dados",
  exclusao: "Exclusão / eliminação",
  portabilidade: "Portabilidade",
  revogacao_consentimento: "Revogação de consentimento",
  anonimizacao: "Anonimização / bloqueio",
  informacao_compartilhamento: "Informação sobre compartilhamento",
  oposicao: "Oposição ao tratamento",
};

const STATUS_LABELS: Record<string, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  aguardando_titular: "Aguardando titular",
  concluida: "Concluída",
  recusada: "Recusada",
};

const statusVariant = (s: string) =>
  s === "concluida" ? "default" : s === "recusada" ? "destructive" : "secondary";

interface LgpdRequest {
  id: string; protocol: string; request_type: string; requester_name: string;
  requester_email: string; requester_document: string | null; requester_phone: string | null;
  relationship: string | null; description: string; status: string; due_date: string;
  response: string | null; responded_at: string | null; created_at: string;
}

const daysLeft = (due: string) =>
  Math.ceil((new Date(due).getTime() - Date.now()) / 86400000);

const LgpdRequests = () => {
  const [rows, setRows] = useState<LgpdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LgpdRequest | null>(null);
  const [status, setStatus] = useState("");
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lgpd_requests" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar solicitações");
    else setRows((data as any[]) ?? []);
    setLoading(false);
  };

  const openDetail = (r: LgpdRequest) => {
    setSelected(r); setStatus(r.status); setResponse(r.response ?? "");
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("lgpd_requests" as any)
      .update({
        status,
        response: response || null,
        responded_at: status === "concluida" || status === "recusada" ? new Date().toISOString() : null,
      } as any)
      .eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Solicitação atualizada");
    setSelected(null);
    fetchData();
  };

  const filtered = rows.filter(r =>
    !search ||
    r.protocol.toLowerCase().includes(search.toLowerCase()) ||
    r.requester_name.toLowerCase().includes(search.toLowerCase()) ||
    r.requester_email.toLowerCase().includes(search.toLowerCase())
  );

  const open = rows.filter(r => !["concluida", "recusada"].includes(r.status));
  const overdue = open.filter(r => daysLeft(r.due_date) < 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Solicitações de Titulares</h3>
          <p className="text-sm text-muted-foreground">Art. 18 da LGPD — prazo legal de resposta de 15 dias</p>
        </div>
        <ExportPdfButton onClick={() => generateModuleReport({
          title: "Relatório de Solicitações de Titulares (LGPD)",
          subtitle: "Atendimento aos direitos previstos no Art. 18 da Lei 13.709/2018",
          kpis: [
            { label: "Total", value: rows.length },
            { label: "Em aberto", value: open.length },
            { label: "Fora do prazo", value: overdue.length },
            { label: "Concluídas", value: rows.filter(r => r.status === "concluida").length },
          ],
          columns: [
            { header: "Protocolo", accessor: (r: any) => r.protocol },
            { header: "Titular", accessor: (r: any) => r.requester_name },
            { header: "E-mail", accessor: (r: any) => r.requester_email },
            { header: "Tipo", accessor: (r: any) => REQUEST_TYPE_LABELS[r.request_type] ?? r.request_type },
            { header: "Recebida em", accessor: (r: any) => new Date(r.created_at).toLocaleDateString("pt-BR") },
            { header: "Prazo", accessor: (r: any) => new Date(r.due_date).toLocaleDateString("pt-BR") },
            { header: "Status", accessor: (r: any) => STATUS_LABELS[r.status] ?? r.status },
          ],
          rows: filtered,
          landscape: true,
        })} />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: rows.length, color: "text-foreground", icon: FileCheck2 },
          { label: "Em aberto", value: open.length, color: "text-primary", icon: Clock },
          { label: "Fora do prazo", value: overdue.length, color: "text-destructive", icon: AlertTriangle },
          { label: "Concluídas", value: rows.filter(r => r.status === "concluida").length, color: "text-safe", icon: FileCheck2 },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por protocolo, nome ou e-mail..." className="pl-10" />
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Protocolo</TableHead><TableHead>Titular</TableHead><TableHead>Tipo</TableHead>
            <TableHead>Recebida</TableHead><TableHead>Prazo</TableHead><TableHead>Status</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhuma solicitação registrada.</TableCell></TableRow>
            ) : filtered.map(r => {
              const dl = daysLeft(r.due_date);
              const isOpen = !["concluida", "recusada"].includes(r.status);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.protocol}</TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{r.requester_name}</div>
                    <div className="text-xs text-muted-foreground">{r.requester_email}</div>
                  </TableCell>
                  <TableCell className="text-xs">{REQUEST_TYPE_LABELS[r.request_type] ?? r.request_type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(r.due_date).toLocaleDateString("pt-BR")}
                    {isOpen && (
                      <span className={dl < 0 ? "ml-2 text-destructive font-medium" : dl <= 3 ? "ml-2 text-warning font-medium" : "ml-2 text-muted-foreground"}>
                        {dl < 0 ? `${Math.abs(dl)}d atraso` : `${dl}d`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell><Badge variant={statusVariant(r.status) as any}>{STATUS_LABELS[r.status] ?? r.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => openDetail(r)}>Tratar</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle>Solicitação {selected?.protocol}</DialogTitle></DialogHeader>
          {selected && (
            <div className="grid gap-4 py-2">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                <p><strong>Titular:</strong> {selected.requester_name}</p>
                <p><strong>E-mail:</strong> {selected.requester_email}</p>
                {selected.requester_document && <p><strong>Documento:</strong> {selected.requester_document}</p>}
                {selected.requester_phone && <p><strong>Telefone:</strong> {selected.requester_phone}</p>}
                {selected.relationship && <p><strong>Vínculo:</strong> {selected.relationship}</p>}
                <p><strong>Tipo:</strong> {REQUEST_TYPE_LABELS[selected.request_type] ?? selected.request_type}</p>
                <p><strong>Prazo legal:</strong> {new Date(selected.due_date).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="grid gap-2">
                <Label>Descrição do titular</Label>
                <p className="whitespace-pre-wrap rounded-lg border p-3 text-sm text-muted-foreground">{selected.description}</p>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Resposta ao titular</Label>
                <Textarea rows={5} value={response} onChange={e => setResponse(e.target.value)} placeholder="Descreva o tratamento dado à solicitação..." />
              </div>
              <Button onClick={save} disabled={saving} className="w-full gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LgpdRequests;
