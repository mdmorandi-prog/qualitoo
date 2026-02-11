import { useEffect, useState } from "react";
import { Plus, Search, Eye, ArrowRight, Target, Crosshair } from "lucide-react";
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

type NcSeverity = "baixa" | "media" | "alta" | "critica";
type NcStatus = "aberta" | "em_analise" | "plano_acao" | "em_execucao" | "verificacao" | "concluida";

interface NC {
  id: string; title: string; description: string; severity: NcSeverity; status: NcStatus;
  sector: string | null; deadline: string | null; root_cause: string | null;
  corrective_action: string | null; preventive_action: string | null; created_at: string;
}

const sevConfig: Record<NcSeverity, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-safe/10 text-safe" },
  media: { label: "Média", color: "bg-warning/10 text-warning" },
  alta: { label: "Alta", color: "bg-destructive/10 text-destructive" },
  critica: { label: "Crítica", color: "bg-destructive/20 text-destructive font-bold" },
};

const statusLabels: Record<NcStatus, string> = {
  aberta: "Aberta", em_analise: "Em Análise", plano_acao: "Plano de Ação",
  em_execucao: "Em Execução", verificacao: "Verificação", concluida: "Concluída",
};

const NonConformities = () => {
  const { user } = useAuth();
  const [ncs, setNcs] = useState<NC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<NC | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", severity: "media" as NcSeverity, sector: "", deadline: "",
  });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("non_conformities").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar NCs");
    else setNcs((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !user) { toast.error("Preencha os campos obrigatórios"); return; }
    const { error } = await supabase.from("non_conformities").insert({
      title: form.title, description: form.description, severity: form.severity,
      sector: form.sector || null, deadline: form.deadline || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar NC"); console.error(error); }
    else { toast.success("NC registrada!"); setDialogOpen(false); setForm({ title: "", description: "", severity: "media", sector: "", deadline: "" }); fetch(); }
  };

  const updateStatus = async (id: string, status: NcStatus) => {
    const update: any = { status };
    if (status === "concluida") update.closed_at = new Date().toISOString();
    const { error } = await supabase.from("non_conformities").update(update).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Status atualizado"); fetch(); }
  };

  const updateField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("non_conformities").update({ [field]: value } as any).eq("id", id);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Salvo!"); fetch(); }
  };

  const createCapaFromNc = async (nc: NC) => {
    if (!user) return;
    const { error } = await supabase.from("capas").insert({
      title: `CAPA - ${nc.title}`,
      description: nc.description,
      origin_type: "non_conformity",
      origin_id: nc.id,
      origin_title: nc.title,
      sector: nc.sector,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar CAPA"); console.error(error); }
    else { toast.success("CAPA criada a partir da NC!"); setDetailOpen(false); }
  };

  const createActionPlanFromNc = async (nc: NC) => {
    if (!user) return;
    const { error } = await supabase.from("action_plans").insert({
      title: `Plano - ${nc.title}`,
      what: nc.corrective_action || nc.description,
      why: `Tratamento da NC: ${nc.title}`,
      origin_type: "non_conformity",
      origin_id: nc.id,
      sector: nc.sector,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar Plano"); console.error(error); }
    else { toast.success("Plano de Ação criado a partir da NC!"); setDetailOpen(false); }
  };

  const filtered = ncs
    .filter(n => filterStatus === "all" || n.status === filterStatus)
    .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Não Conformidades</h2>
          <p className="text-sm text-muted-foreground">Registro e tratamento de não conformidades</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova NC</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Registrar Não Conformidade</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Severidade *</Label>
                  <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as NcSeverity }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem><SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Prazo</Label><Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Descrição *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[100px]" /></div>
              <Button onClick={handleCreate} className="w-full">Registrar NC</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: ncs.length, color: "text-foreground" },
          { label: "Abertas", value: ncs.filter(n => n.status === "aberta").length, color: "text-destructive" },
          { label: "Em Tratamento", value: ncs.filter(n => !["aberta", "concluida"].includes(n.status)).length, color: "text-warning" },
          { label: "Concluídas", value: ncs.filter(n => n.status === "concluida").length, color: "text-safe" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Título</TableHead><TableHead>Severidade</TableHead><TableHead>Status</TableHead><TableHead>Prazo</TableHead><TableHead>Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma NC encontrada.</TableCell></TableRow>
            : filtered.map(n => (
              <TableRow key={n.id}>
                <TableCell className="font-medium">{n.title}</TableCell>
                <TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${sevConfig[n.severity].color}`}>{sevConfig[n.severity].label}</span></TableCell>
                <TableCell>
                  <Select value={n.status} onValueChange={v => updateStatus(n.id, v as NcStatus)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{n.deadline ? new Date(n.deadline).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelected(n); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Detalhes da NC</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-3"><p className="mb-1 text-xs font-semibold text-muted-foreground">Descrição</p><p className="text-sm text-foreground">{selected.description}</p></div>
              <div className="grid gap-3">
                <div className="grid gap-2"><Label className="text-xs font-semibold">Causa Raiz</Label><Textarea defaultValue={selected.root_cause ?? ""} onBlur={e => updateField(selected.id, "root_cause", e.target.value)} placeholder="Análise de causa raiz..." /></div>
                <div className="grid gap-2"><Label className="text-xs font-semibold">Ação Corretiva</Label><Textarea defaultValue={selected.corrective_action ?? ""} onBlur={e => updateField(selected.id, "corrective_action", e.target.value)} placeholder="Ação corretiva..." /></div>
                <div className="grid gap-2"><Label className="text-xs font-semibold">Ação Preventiva</Label><Textarea defaultValue={selected.preventive_action ?? ""} onBlur={e => updateField(selected.id, "preventive_action", e.target.value)} placeholder="Ação preventiva..." /></div>
              </div>
              <div className="flex gap-2 border-t pt-4">
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => createCapaFromNc(selected)}>
                  <Target className="h-4 w-4" /> Criar CAPA
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => createActionPlanFromNc(selected)}>
                  <Crosshair className="h-4 w-4" /> Criar Plano de Ação
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NonConformities;
