import { useEffect, useState } from "react";
import { Plus, Search, Eye, CheckCircle2, ArrowRight } from "lucide-react";
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

type CapaType = "corretiva" | "preventiva" | "melhoria";
type CapaStatus = "identificacao" | "analise_causa" | "plano_acao" | "implementacao" | "verificacao_eficacia" | "encerrada";

interface Capa {
  id: string;
  title: string;
  description: string;
  capa_type: CapaType;
  status: CapaStatus;
  origin_type: string | null;
  origin_title: string | null;
  sector: string | null;
  root_cause_analysis: string | null;
  corrective_action: string | null;
  preventive_action: string | null;
  verification_method: string | null;
  verification_date: string | null;
  verification_result: string | null;
  is_effective: boolean | null;
  deadline: string | null;
  created_at: string;
}

const statusSteps: { key: CapaStatus; label: string }[] = [
  { key: "identificacao", label: "Identificação" },
  { key: "analise_causa", label: "Análise de Causa" },
  { key: "plano_acao", label: "Plano de Ação" },
  { key: "implementacao", label: "Implementação" },
  { key: "verificacao_eficacia", label: "Verificação" },
  { key: "encerrada", label: "Encerrada" },
];

const typeLabels: Record<CapaType, string> = {
  corretiva: "Corretiva",
  preventiva: "Preventiva",
  melhoria: "Melhoria",
};

const Capas = () => {
  const { user } = useAuth();
  const [capas, setCapas] = useState<Capa[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Capa | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", capa_type: "corretiva" as CapaType, sector: "", deadline: "",
  });

  useEffect(() => { fetchCapas(); }, []);

  const fetchCapas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("capas").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar CAPAs");
    else setCapas((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !user) { toast.error("Preencha os campos obrigatórios"); return; }
    const { error } = await supabase.from("capas").insert({
      title: form.title, description: form.description, capa_type: form.capa_type,
      sector: form.sector || null, deadline: form.deadline || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar CAPA"); console.error(error); }
    else { toast.success("CAPA criada!"); setDialogOpen(false); setForm({ title: "", description: "", capa_type: "corretiva", sector: "", deadline: "" }); fetchCapas(); }
  };

  const advanceStatus = async (capa: Capa) => {
    const currentIdx = statusSteps.findIndex(s => s.key === capa.status);
    if (currentIdx >= statusSteps.length - 1) return;
    const nextStatus = statusSteps[currentIdx + 1].key;
    const { error } = await supabase.from("capas").update({ status: nextStatus } as any).eq("id", capa.id);
    if (error) toast.error("Erro ao avançar status");
    else { toast.success(`Avançado para: ${statusSteps[currentIdx + 1].label}`); fetchCapas(); }
  };

  const updateField = async (id: string, field: string, value: any) => {
    const { error } = await supabase.from("capas").update({ [field]: value } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Atualizado!"); fetchCapas(); }
  };

  const filtered = capas.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));

  const getStepIndex = (status: CapaStatus) => statusSteps.findIndex(s => s.key === status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">CAPA</h2>
          <p className="text-sm text-muted-foreground">Ações Corretivas e Preventivas com verificação de eficácia</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova CAPA</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Criar CAPA</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo *</Label>
                  <Select value={form.capa_type} onValueChange={v => setForm(f => ({ ...f, capa_type: v as CapaType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corretiva">Corretiva</SelectItem>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                      <SelectItem value="melhoria">Melhoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Prazo</Label>
                  <Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Setor</Label>
                <Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Descrição *</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[100px]" />
              </div>
              <Button onClick={handleCreate} className="w-full">Criar CAPA</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar CAPAs..." className="pl-10" />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: capas.length, color: "text-foreground" },
          { label: "Em Andamento", value: capas.filter(c => c.status !== "encerrada").length, color: "text-accent" },
          { label: "Verificação", value: capas.filter(c => c.status === "verificacao_eficacia").length, color: "text-warning" },
          { label: "Encerradas", value: capas.filter(c => c.status === "encerrada").length, color: "text-safe" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fluxo</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma CAPA encontrada.</TableCell></TableRow>
            ) : filtered.map(c => {
              const stepIdx = getStepIndex(c.status);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.title}</p>
                      {c.origin_title && <p className="text-xs text-muted-foreground">Origem: {c.origin_title}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${c.capa_type === "corretiva" ? "bg-destructive/10 text-destructive" : c.capa_type === "preventiva" ? "bg-accent/10 text-accent" : "bg-safe/10 text-safe"}`}>
                      {typeLabels[c.capa_type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {statusSteps.map((step, i) => (
                        <div key={step.key} className="flex items-center gap-1">
                          <div className={`h-2.5 w-2.5 rounded-full ${i <= stepIdx ? "bg-primary" : "bg-border"}`} title={step.label} />
                          {i < statusSteps.length - 1 && <div className={`h-0.5 w-3 ${i < stepIdx ? "bg-primary" : "bg-border"}`} />}
                        </div>
                      ))}
                      <span className="ml-2 text-xs text-muted-foreground">{statusSteps[stepIdx]?.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.deadline ? new Date(c.deadline).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setSelected(c); setDetailOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {c.status !== "encerrada" && (
                        <Button variant="ghost" size="sm" onClick={() => advanceStatus(c)} title="Avançar etapa">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Detalhes da CAPA</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Status Steps */}
              <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                {statusSteps.map((step, i) => {
                  const stepIdx = getStepIndex(selected.status);
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= stepIdx ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"}`}>
                        {i < stepIdx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 text-sm">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">{typeLabels[selected.capa_type]}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Setor</span>
                  <span className="font-medium">{selected.sector || "—"}</span>
                </div>
              </div>

              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Descrição do Problema</p>
                <p className="text-sm text-foreground">{selected.description}</p>
              </div>

              {/* Editable fields based on status */}
              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Análise de Causa Raiz</Label>
                  <Textarea defaultValue={selected.root_cause_analysis ?? ""} onBlur={e => updateField(selected.id, "root_cause_analysis", e.target.value)} placeholder="Descreva a análise de causa raiz..." />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Ação Corretiva</Label>
                  <Textarea defaultValue={selected.corrective_action ?? ""} onBlur={e => updateField(selected.id, "corrective_action", e.target.value)} placeholder="Descreva a ação corretiva..." />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Ação Preventiva</Label>
                  <Textarea defaultValue={selected.preventive_action ?? ""} onBlur={e => updateField(selected.id, "preventive_action", e.target.value)} placeholder="Descreva a ação preventiva..." />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Método de Verificação de Eficácia</Label>
                  <Textarea defaultValue={selected.verification_method ?? ""} onBlur={e => updateField(selected.id, "verification_method", e.target.value)} placeholder="Como será verificada a eficácia?" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold">Resultado da Verificação</Label>
                  <Textarea defaultValue={selected.verification_result ?? ""} onBlur={e => updateField(selected.id, "verification_result", e.target.value)} placeholder="Resultado da verificação de eficácia..." />
                </div>
              </div>

              {selected.status !== "encerrada" && (
                <Button onClick={() => { advanceStatus(selected); setDetailOpen(false); }} className="w-full gap-2">
                  <ArrowRight className="h-4 w-4" /> Avançar para Próxima Etapa
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Capas;
