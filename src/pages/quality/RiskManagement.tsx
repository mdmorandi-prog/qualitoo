import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Risk {
  id: string; title: string; description: string | null; category: string | null;
  sector: string | null; probability: number; impact: number; risk_level: number | null;
  status: string; current_controls: string | null; mitigation_plan: string | null;
  responsible: string | null; review_date: string | null; created_at: string;
}

const riskColor = (level: number) => {
  if (level >= 15) return "bg-destructive/20 text-destructive font-bold";
  if (level >= 10) return "bg-destructive/10 text-destructive";
  if (level >= 5) return "bg-warning/10 text-warning";
  return "bg-safe/10 text-safe";
};

const riskBg = (level: number) => {
  if (level >= 15) return "bg-destructive/70 hover:bg-destructive/80 text-destructive-foreground";
  if (level >= 10) return "bg-destructive/40 hover:bg-destructive/50 text-foreground";
  if (level >= 5) return "bg-warning/40 hover:bg-warning/50 text-foreground";
  return "bg-safe/30 hover:bg-safe/40 text-foreground";
};

const riskLabel = (level: number) => {
  if (level >= 15) return "Crítico";
  if (level >= 10) return "Alto";
  if (level >= 5) return "Médio";
  return "Baixo";
};

const probLabels = ["Raro", "Improvável", "Possível", "Provável", "Quase Certo"];
const impactLabels = ["Insignificante", "Pequeno", "Moderado", "Grande", "Catastrófico"];

const RiskManagement = () => {
  const { user } = useAuth();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ p: number; i: number } | null>(null);
  const [cellDialogOpen, setCellDialogOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", category: "", sector: "", probability: "3", impact: "3",
    current_controls: "", mitigation_plan: "", responsible: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("risks").select("*").order("risk_level", { ascending: false });
    if (error) toast.error("Erro");
    else setRisks((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const prob = Number(form.probability); const imp = Number(form.impact);
    const { error } = await supabase.from("risks").insert({
      title: form.title, description: form.description || null, category: form.category || null,
      sector: form.sector || null, probability: prob, impact: imp, risk_level: prob * imp,
      current_controls: form.current_controls || null, mitigation_plan: form.mitigation_plan || null,
      responsible: form.responsible || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else { toast.success("Risco registrado!"); setDialogOpen(false); setForm({ title: "", description: "", category: "", sector: "", probability: "3", impact: "3", current_controls: "", mitigation_plan: "", responsible: "" }); fetchData(); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("risks").update({ status } as any).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Atualizado"); fetchData(); }
  };

  const filtered = risks.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  const cellRisks = selectedCell ? risks.filter(r => r.probability === selectedCell.p && r.impact === selectedCell.i) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-display text-2xl font-bold text-foreground">Gestão de Riscos</h2><p className="text-sm text-muted-foreground">Matriz de probabilidade × impacto (5×5)</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Risco</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Registrar Risco</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Probabilidade (1-5)</Label>
                  <Select value={form.probability} onValueChange={v => setForm(f => ({ ...f, probability: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} - {probLabels[n-1]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Impacto (1-5)</Label>
                  <Select value={form.impact} onValueChange={v => setForm(f => ({ ...f, impact: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} - {impactLabels[n-1]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <span className="text-xs text-muted-foreground">Nível de Risco: </span>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${riskColor(Number(form.probability) * Number(form.impact))}`}>
                  {Number(form.probability) * Number(form.impact)} — {riskLabel(Number(form.probability) * Number(form.impact))}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Operacional, Clínico..." /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Controles Atuais</Label><Textarea value={form.current_controls} onChange={e => setForm(f => ({ ...f, current_controls: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Plano de Mitigação</Label><Textarea value={form.mitigation_plan} onChange={e => setForm(f => ({ ...f, mitigation_plan: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Registrar Risco</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>

      {/* Interactive Risk Heatmap */}
      <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-4 text-sm font-bold text-foreground">Matriz de Riscos — Clique para ver detalhes</h3>
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Header row */}
            <div className="mb-1 grid grid-cols-[80px_repeat(5,1fr)] gap-1">
              <div className="flex items-end justify-center pb-1">
                <span className="text-[10px] font-bold text-muted-foreground">P \ I</span>
              </div>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="py-1.5 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground">{i}</p>
                  <p className="text-[8px] text-muted-foreground/70">{impactLabels[i-1]}</p>
                </div>
              ))}
            </div>
            {/* Matrix rows */}
            {[5,4,3,2,1].map(p => (
              <div key={p} className="grid grid-cols-[80px_repeat(5,1fr)] gap-1 mb-1">
                <div className="flex items-center justify-center rounded-l-lg py-2">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-muted-foreground">{p}</p>
                    <p className="text-[8px] text-muted-foreground/70">{probLabels[p-1]}</p>
                  </div>
                </div>
                {[1,2,3,4,5].map(i => {
                  const level = p * i;
                  const count = risks.filter(r => r.probability === p && r.impact === i).length;
                  return (
                    <button
                      key={`${p}-${i}`}
                      className={`flex flex-col items-center justify-center rounded-lg py-3 text-xs font-bold transition-all ${riskBg(level)} ${count > 0 ? "ring-2 ring-foreground/10 shadow-md" : ""}`}
                      onClick={() => { if (count > 0) { setSelectedCell({ p, i }); setCellDialogOpen(true); } }}
                      title={`${probLabels[p-1]} × ${impactLabels[i-1]} = ${level}`}
                    >
                      <span className="text-lg leading-none">{level}</span>
                      {count > 0 && <span className="mt-0.5 text-[10px] opacity-80">{count} risco{count > 1 ? "s" : ""}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-3 text-[10px]">
              <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-safe/30" /> Baixo (1-4)</div>
              <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-warning/40" /> Médio (5-9)</div>
              <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-destructive/40" /> Alto (10-14)</div>
              <div className="flex items-center gap-1"><div className="h-3 w-3 rounded bg-destructive/70" /> Crítico (15-25)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cell detail dialog */}
      <Dialog open={cellDialogOpen} onOpenChange={setCellDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {selectedCell && `Riscos — P:${selectedCell.p} × I:${selectedCell.i} = ${selectedCell.p * selectedCell.i}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {cellRisks.map(r => (
              <div key={r.id} className="rounded-lg border p-3 space-y-1">
                <p className="font-medium text-sm text-foreground">{r.title}</p>
                {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {r.category && <span className="rounded-full bg-secondary px-2 py-0.5">{r.category}</span>}
                  {r.sector && <span className="rounded-full bg-secondary px-2 py-0.5">{r.sector}</span>}
                  <span className={`rounded-full px-2 py-0.5 ${riskColor(r.risk_level ?? 0)}`}>{r.status}</span>
                </div>
                {r.responsible && <p className="text-[10px] text-muted-foreground">Resp: {r.responsible}</p>}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: risks.length, color: "text-foreground" },
          { label: "Críticos", value: risks.filter(r => (r.risk_level ?? 0) >= 15).length, color: "text-destructive" },
          { label: "Altos", value: risks.filter(r => (r.risk_level ?? 0) >= 10 && (r.risk_level ?? 0) < 15).length, color: "text-warning" },
          { label: "Tratados", value: risks.filter(r => r.status === "tratado").length, color: "text-safe" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow><TableHead>Risco</TableHead><TableHead>P × I</TableHead><TableHead>Nível</TableHead><TableHead>Status</TableHead><TableHead>Responsável</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum risco.</TableCell></TableRow>
            : filtered.map(r => {
              const level = r.risk_level ?? (r.probability * r.impact);
              return (
                <TableRow key={r.id}>
                  <TableCell><div><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.category || "—"} • {r.sector || "—"}</p></div></TableCell>
                  <TableCell className="font-mono text-sm">{r.probability} × {r.impact}</TableCell>
                  <TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${riskColor(level)}`}>{level} — {riskLabel(level)}</span></TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="identificado">Identificado</SelectItem><SelectItem value="em_analise">Em Análise</SelectItem><SelectItem value="tratado">Tratado</SelectItem><SelectItem value="monitoramento">Monitoramento</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm">{r.responsible || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RiskManagement;
