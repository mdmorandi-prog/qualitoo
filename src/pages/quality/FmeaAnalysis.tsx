import { useEffect, useState } from "react";
import { Plus, Search, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FmeaAnalysis {
  id: string; title: string; process: string | null; sector: string | null;
  status: string; created_at: string;
}

interface FmeaItem {
  id: string; fmea_id: string; failure_mode: string; effect: string | null;
  cause: string | null; severity: number; occurrence: number; detection: number;
  rpn: number; current_controls: string | null; recommended_action: string | null;
  responsible: string | null; status: string;
}

const rpnColor = (rpn: number) => {
  if (rpn >= 200) return "bg-destructive/20 text-destructive font-bold";
  if (rpn >= 100) return "bg-destructive/10 text-destructive";
  if (rpn >= 50) return "bg-warning/10 text-warning";
  return "bg-safe/10 text-safe";
};

const rpnLabel = (rpn: number) => {
  if (rpn >= 200) return "Crítico";
  if (rpn >= 100) return "Alto";
  if (rpn >= 50) return "Médio";
  return "Baixo";
};

const FmeaAnalysisPage = () => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<FmeaAnalysis[]>([]);
  const [items, setItems] = useState<FmeaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<FmeaAnalysis | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({ title: "", process: "", sector: "" });
  const [itemForm, setItemForm] = useState({
    failure_mode: "", effect: "", cause: "", severity: "5", occurrence: "5",
    detection: "5", current_controls: "", recommended_action: "", responsible: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [aRes, iRes] = await Promise.all([
      supabase.from("fmea_analyses").select("*").order("created_at", { ascending: false }),
      supabase.from("fmea_items").select("*").order("created_at"),
    ]);
    if (!aRes.error) setAnalyses((aRes.data as any[]) ?? []);
    if (!iRes.error) setItems((iRes.data as any[]) ?? []);
    setLoading(false);
  };

  const createAnalysis = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const { error } = await supabase.from("fmea_analyses").insert({
      title: form.title, process: form.process || null, sector: form.sector || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else { toast.success("FMEA criada!"); setDialogOpen(false); setForm({ title: "", process: "", sector: "" }); fetchAll(); }
  };

  const addItem = async () => {
    if (!selected || !itemForm.failure_mode) { toast.error("Modo de falha obrigatório"); return; }
    const { error } = await supabase.from("fmea_items").insert({
      fmea_id: selected.id, failure_mode: itemForm.failure_mode,
      effect: itemForm.effect || null, cause: itemForm.cause || null,
      severity: Number(itemForm.severity), occurrence: Number(itemForm.occurrence),
      detection: Number(itemForm.detection), current_controls: itemForm.current_controls || null,
      recommended_action: itemForm.recommended_action || null, responsible: itemForm.responsible || null,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else {
      toast.success("Item adicionado!");
      setItemForm({ failure_mode: "", effect: "", cause: "", severity: "5", occurrence: "5", detection: "5", current_controls: "", recommended_action: "", responsible: "" });
      fetchAll();
    }
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("fmea_items").delete().eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Removido"); fetchAll(); }
  };

  const filtered = analyses.filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()));
  const selectedItems = selected ? items.filter(i => i.fmea_id === selected.id).sort((a, b) => b.rpn - a.rpn) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Análise FMEA</h2>
          <p className="text-sm text-muted-foreground">Failure Mode and Effects Analysis — Análise de modos de falha e efeitos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova FMEA</Button></DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Criar Análise FMEA</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: FMEA - Processo de Esterilização" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Processo</Label><Input value={form.process} onChange={e => setForm(f => ({ ...f, process: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <Button onClick={createAnalysis} className="w-full">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Análises", value: analyses.length, color: "text-foreground" },
          { label: "Itens RPN ≥200", value: items.filter(i => i.rpn >= 200).length, color: "text-destructive" },
          { label: "Itens RPN ≥100", value: items.filter(i => i.rpn >= 100 && i.rpn < 200).length, color: "text-warning" },
          { label: "Itens Baixo Risco", value: items.filter(i => i.rpn < 50).length, color: "text-safe" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Analyses list */}
      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Análise FMEA</TableHead><TableHead>Processo</TableHead><TableHead>Itens</TableHead><TableHead>Maior RPN</TableHead><TableHead>Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma análise FMEA.</TableCell></TableRow>
            : filtered.map(a => {
              const aItems = items.filter(i => i.fmea_id === a.id);
              const maxRpn = aItems.length > 0 ? Math.max(...aItems.map(i => i.rpn)) : 0;
              return (
                <TableRow key={a.id}>
                  <TableCell><p className="font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.sector || "Geral"}</p></TableCell>
                  <TableCell className="text-sm">{a.process || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{aItems.length}</TableCell>
                  <TableCell>{maxRpn > 0 ? <span className={`rounded-full px-2 py-1 text-xs ${rpnColor(maxRpn)}`}>{maxRpn} — {rpnLabel(maxRpn)}</span> : "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelected(a); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader><DialogTitle className="font-display">FMEA: {selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Add Item Form */}
              <Card>
                <CardHeader className="py-3"><CardTitle className="text-sm">Adicionar Modo de Falha</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-1"><Label className="text-xs">Modo de Falha *</Label><Input value={itemForm.failure_mode} onChange={e => setItemForm(f => ({ ...f, failure_mode: e.target.value }))} className="h-8 text-sm" /></div>
                    <div className="grid gap-1"><Label className="text-xs">Efeito</Label><Input value={itemForm.effect} onChange={e => setItemForm(f => ({ ...f, effect: e.target.value }))} className="h-8 text-sm" /></div>
                    <div className="grid gap-1"><Label className="text-xs">Causa</Label><Input value={itemForm.cause} onChange={e => setItemForm(f => ({ ...f, cause: e.target.value }))} className="h-8 text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-xs">Severidade (1-10)</Label>
                      <Select value={itemForm.severity} onValueChange={v => setItemForm(f => ({ ...f, severity: v }))}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{Array.from({ length: 10 }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Ocorrência (1-10)</Label>
                      <Select value={itemForm.occurrence} onValueChange={v => setItemForm(f => ({ ...f, occurrence: v }))}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{Array.from({ length: 10 }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs">Detecção (1-10)</Label>
                      <Select value={itemForm.detection} onValueChange={v => setItemForm(f => ({ ...f, detection: v }))}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{Array.from({ length: 10 }, (_, i) => <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-2 text-center">
                    <span className="text-xs text-muted-foreground">RPN: </span>
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${rpnColor(Number(itemForm.severity) * Number(itemForm.occurrence) * Number(itemForm.detection))}`}>
                      {Number(itemForm.severity) * Number(itemForm.occurrence) * Number(itemForm.detection)}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1"><Label className="text-xs">Controles Atuais</Label><Input value={itemForm.current_controls} onChange={e => setItemForm(f => ({ ...f, current_controls: e.target.value }))} className="h-8 text-sm" /></div>
                    <div className="grid gap-1"><Label className="text-xs">Ação Recomendada</Label><Input value={itemForm.recommended_action} onChange={e => setItemForm(f => ({ ...f, recommended_action: e.target.value }))} className="h-8 text-sm" /></div>
                  </div>
                  <div className="grid gap-1"><Label className="text-xs">Responsável</Label><Input value={itemForm.responsible} onChange={e => setItemForm(f => ({ ...f, responsible: e.target.value }))} className="h-8 text-sm" /></div>
                  <Button onClick={addItem} size="sm" className="w-full gap-2"><Plus className="h-4 w-4" /> Adicionar</Button>
                </CardContent>
              </Card>

              {/* Items Table */}
              {selectedItems.length > 0 && (
                <div className="overflow-auto rounded-xl border">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-[10px]">Modo de Falha</TableHead>
                      <TableHead className="text-[10px]">Efeito</TableHead>
                      <TableHead className="text-[10px]">Causa</TableHead>
                      <TableHead className="text-[10px] text-center">S</TableHead>
                      <TableHead className="text-[10px] text-center">O</TableHead>
                      <TableHead className="text-[10px] text-center">D</TableHead>
                      <TableHead className="text-[10px] text-center">RPN</TableHead>
                      <TableHead className="text-[10px]">Ação</TableHead>
                      <TableHead className="text-[10px]"></TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {selectedItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs font-medium">{item.failure_mode}</TableCell>
                          <TableCell className="text-xs">{item.effect || "—"}</TableCell>
                          <TableCell className="text-xs">{item.cause || "—"}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{item.severity}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{item.occurrence}</TableCell>
                          <TableCell className="text-center font-mono text-xs">{item.detection}</TableCell>
                          <TableCell className="text-center"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rpnColor(item.rpn)}`}>{item.rpn}</span></TableCell>
                          <TableCell className="text-xs">{item.recommended_action || "—"}</TableCell>
                          <TableCell><Button variant="ghost" size="sm" onClick={() => deleteItem(item.id)} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FmeaAnalysisPage;
