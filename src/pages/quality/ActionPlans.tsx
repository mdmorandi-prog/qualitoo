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
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ActionPlan {
  id: string; title: string; description: string | null; status: string;
  what: string | null; why: string | null; where_action: string | null;
  who: string | null; when_start: string | null; when_end: string | null;
  how: string | null; how_much: string | null; progress: number;
  origin_type: string | null; origin_id: string | null; sector: string | null;
  created_at: string;
}

const emptyForm = {
  title: "", what: "", why: "", where_action: "", who: "",
  when_start: "", when_end: "", how: "", how_much: "", sector: "", description: "",
};

const originLabels: Record<string, string> = {
  non_conformity: "Não Conformidade",
  audit: "Auditoria",
  capa: "CAPA",
  risk: "Risco",
  adverse_event: "Evento Adverso",
  change_request: "Mudança",
  manual: "Manual",
};

const formatOrigin = (type: string | null, title?: string | null) => {
  if (!type || type === "manual") return null;
  const label = originLabels[type] || type;
  return title ? `${label}: ${title}` : label;
};

const ActionPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailPlan, setDetailPlan] = useState<ActionPlan | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);

  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("action_plans").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro");
    else setPlans((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const { error } = await supabase.from("action_plans").insert({
      title: form.title, what: form.what || null, why: form.why || null,
      where_action: form.where_action || null, who: form.who || null,
      when_start: form.when_start || null, when_end: form.when_end || null,
      how: form.how || null, how_much: form.how_much || null,
      sector: form.sector || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else { toast.success("Plano criado!"); setDialogOpen(false); setForm(emptyForm); fetch(); }
  };

  const openDetail = (plan: ActionPlan) => {
    setDetailPlan(plan);
    setEditForm({
      title: plan.title, what: plan.what ?? "", why: plan.why ?? "",
      where_action: plan.where_action ?? "", who: plan.who ?? "",
      when_start: plan.when_start ?? "", when_end: plan.when_end ?? "",
      how: plan.how ?? "", how_much: plan.how_much ?? "",
      sector: plan.sector ?? "", description: plan.description ?? "",
    });
    setDetailOpen(true);
  };

  const handleSave = async () => {
    if (!detailPlan) return;
    const { error } = await supabase.from("action_plans").update({
      title: editForm.title, what: editForm.what || null, why: editForm.why || null,
      where_action: editForm.where_action || null, who: editForm.who || null,
      when_start: editForm.when_start || null, when_end: editForm.when_end || null,
      how: editForm.how || null, how_much: editForm.how_much || null,
      sector: editForm.sector || null, description: editForm.description || null,
    }).eq("id", detailPlan.id);
    if (error) { toast.error("Erro ao salvar"); console.error(error); }
    else { toast.success("Plano atualizado!"); setDetailOpen(false); fetch(); }
  };

  const updateStatus = async (id: string, status: string) => {
    const progress = status === "concluido" ? 100 : status === "em_andamento" ? 50 : 0;
    const { error } = await supabase.from("action_plans").update({ status, progress } as any).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Atualizado"); fetch(); }
  };

  const filtered = plans.filter(p => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-display text-2xl font-bold text-foreground">Planos de Ação (5W2H)</h2><p className="text-sm text-muted-foreground">Metodologia 5W2H para planejamento e execução</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Plano</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle className="font-display">Novo Plano de Ação (5W2H)</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>O quê? (What)</Label><Textarea value={form.what} onChange={e => setForm(f => ({ ...f, what: e.target.value }))} placeholder="O que será feito?" /></div>
              <div className="grid gap-2"><Label>Por quê? (Why)</Label><Textarea value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} placeholder="Por que será feito?" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Onde? (Where)</Label><Input value={form.where_action} onChange={e => setForm(f => ({ ...f, where_action: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Quem? (Who)</Label><Input value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Quando? Início</Label><Input type="date" value={form.when_start} onChange={e => setForm(f => ({ ...f, when_start: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Quando? Fim</Label><Input type="date" value={form.when_end} onChange={e => setForm(f => ({ ...f, when_end: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Como? (How)</Label><Textarea value={form.how} onChange={e => setForm(f => ({ ...f, how: e.target.value }))} placeholder="Como será feito?" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Quanto custa? (How much)</Label><Input value={form.how_much} onChange={e => setForm(f => ({ ...f, how_much: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Plano</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: plans.length, color: "text-foreground" },
          { label: "Pendentes", value: plans.filter(p => p.status === "pendente").length, color: "text-warning" },
          { label: "Em Andamento", value: plans.filter(p => p.status === "em_andamento").length, color: "text-accent" },
          { label: "Concluídos", value: plans.filter(p => p.status === "concluido").length, color: "text-safe" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Responsável</TableHead><TableHead>Status</TableHead><TableHead>Progresso</TableHead><TableHead>Prazo</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum plano.</TableCell></TableRow>
            : filtered.map(p => (
              <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(p)}>
                <TableCell><div><p className="font-medium">{p.title}</p>{formatOrigin(p.origin_type) && <p className="text-xs text-muted-foreground">Origem: {formatOrigin(p.origin_type)}</p>}</div></TableCell>
                <TableCell className="text-sm">{p.who || "—"}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <Select value={p.status} onValueChange={v => updateStatus(p.id, v)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="em_andamento">Em Andamento</SelectItem><SelectItem value="concluido">Concluído</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell><div className="flex items-center gap-2"><Progress value={p.progress} className="h-2 w-16" /><span className="text-xs">{p.progress}%</span></div></TableCell>
                <TableCell className="text-xs text-muted-foreground">{p.when_end ? new Date(p.when_end).toLocaleDateString("pt-BR") : "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail / Edit Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Detalhes do Plano de Ação (5W2H)</DialogTitle></DialogHeader>
          {detailPlan && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição do plano..." /></div>
              <div className="grid gap-2"><Label>O quê? (What)</Label><Textarea value={editForm.what} onChange={e => setEditForm(f => ({ ...f, what: e.target.value }))} placeholder="O que será feito?" /></div>
              <div className="grid gap-2"><Label>Por quê? (Why)</Label><Textarea value={editForm.why} onChange={e => setEditForm(f => ({ ...f, why: e.target.value }))} placeholder="Por que será feito?" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Onde? (Where)</Label><Input value={editForm.where_action} onChange={e => setEditForm(f => ({ ...f, where_action: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Quem? (Who)</Label><Input value={editForm.who} onChange={e => setEditForm(f => ({ ...f, who: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Quando? Início</Label><Input type="date" value={editForm.when_start} onChange={e => setEditForm(f => ({ ...f, when_start: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Quando? Fim</Label><Input type="date" value={editForm.when_end} onChange={e => setEditForm(f => ({ ...f, when_end: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Como? (How)</Label><Textarea value={editForm.how} onChange={e => setEditForm(f => ({ ...f, how: e.target.value }))} placeholder="Como será feito?" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Quanto custa? (How much)</Label><Input value={editForm.how_much} onChange={e => setEditForm(f => ({ ...f, how_much: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={editForm.sector} onChange={e => setEditForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>

              {formatOrigin(detailPlan.origin_type) && (
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-xs font-semibold text-muted-foreground">Origem</p>
                  <p className="text-sm">{formatOrigin(detailPlan.origin_type)}</p>
                </div>
              )}

              <div className="flex gap-2 border-t pt-4">
                <Button onClick={handleSave} className="flex-1">Salvar Alterações</Button>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActionPlans;
