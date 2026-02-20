import { useEffect, useState } from "react";
import { Plus, Search, Target, Grid3X3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface StrategicPlan {
  id: string; title: string; plan_type: string; status: string;
  period_start: string | null; period_end: string | null; sector: string | null;
}
interface BscObjective {
  id: string; plan_id: string; perspective: string; objective: string;
  description: string | null; target_value: number | null; current_value: number;
  unit: string; status: string;
}
interface SwotItem {
  id: string; plan_id: string; quadrant: string; description: string; priority: string;
}

const perspectives = [
  { key: "financeira", label: "💰 Financeira", color: "bg-safe/10 text-safe" },
  { key: "clientes", label: "👥 Clientes/Pacientes", color: "bg-accent/10 text-accent" },
  { key: "processos", label: "⚙️ Processos Internos", color: "bg-warning/10 text-warning" },
  { key: "aprendizado", label: "📚 Aprendizado e Crescimento", color: "bg-primary/10 text-primary" },
];

const swotQuadrants = [
  { key: "forca", label: "Forças (S)", color: "bg-safe/10 border-safe/30" },
  { key: "fraqueza", label: "Fraquezas (W)", color: "bg-destructive/10 border-destructive/30" },
  { key: "oportunidade", label: "Oportunidades (O)", color: "bg-accent/10 border-accent/30" },
  { key: "ameaca", label: "Ameaças (T)", color: "bg-warning/10 border-warning/30" },
];

const StrategicPlanning = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StrategicPlan | null>(null);
  const [objectives, setObjectives] = useState<BscObjective[]>([]);
  const [swotItems, setSwotItems] = useState<SwotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [objDialogOpen, setObjDialogOpen] = useState(false);
  const [swotDialogOpen, setSwotDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", plan_type: "bsc", period_start: "", period_end: "", sector: "" });
  const [objForm, setObjForm] = useState({ perspective: "financeira", objective: "", description: "", target_value: "100", unit: "%" });
  const [swotForm, setSwotForm] = useState({ quadrant: "forca", description: "", priority: "media" });

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase.from("strategic_plans").select("*").order("created_at", { ascending: false });
    setPlans((data as any[]) ?? []);
    setLoading(false);
  };

  const fetchObjectives = async (planId: string) => {
    const { data } = await supabase.from("bsc_objectives").select("*").eq("plan_id", planId).order("perspective");
    setObjectives((data as any[]) ?? []);
  };

  const fetchSwotItems = async (planId: string) => {
    const { data } = await supabase.from("swot_items").select("*").eq("plan_id", planId);
    setSwotItems((data as any[]) ?? []);
  };

  const selectPlan = (plan: StrategicPlan) => {
    setSelectedPlan(plan);
    fetchObjectives(plan.id);
    fetchSwotItems(plan.id);
  };

  const handleCreatePlan = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const { data, error } = await supabase.from("strategic_plans").insert({
      title: form.title, plan_type: form.plan_type,
      period_start: form.period_start || null, period_end: form.period_end || null,
      sector: form.sector || null, created_by: user.id,
    } as any).select().single();
    if (error) { toast.error("Erro"); return; }
    toast.success("Plano criado!");
    setDialogOpen(false);
    setForm({ title: "", plan_type: "bsc", period_start: "", period_end: "", sector: "" });
    fetchPlans();
    if (data) selectPlan(data as any);
  };

  const addObjective = async () => {
    if (!selectedPlan || !objForm.objective) { toast.error("Preencha o objetivo"); return; }
    const { error } = await supabase.from("bsc_objectives").insert({
      plan_id: selectedPlan.id, perspective: objForm.perspective, objective: objForm.objective,
      description: objForm.description || null, target_value: Number(objForm.target_value), unit: objForm.unit,
    } as any);
    if (error) toast.error("Erro");
    else { toast.success("Objetivo adicionado!"); setObjDialogOpen(false); setObjForm({ perspective: "financeira", objective: "", description: "", target_value: "100", unit: "%" }); fetchObjectives(selectedPlan.id); }
  };

  const addSwotItem = async () => {
    if (!selectedPlan || !swotForm.description) { toast.error("Preencha a descrição"); return; }
    const { error } = await supabase.from("swot_items").insert({
      plan_id: selectedPlan.id, quadrant: swotForm.quadrant, description: swotForm.description, priority: swotForm.priority,
    } as any);
    if (error) toast.error("Erro");
    else { toast.success("Item SWOT adicionado!"); setSwotDialogOpen(false); setSwotForm({ quadrant: "forca", description: "", priority: "media" }); fetchSwotItems(selectedPlan.id); }
  };

  const updateObjValue = async (id: string, value: number) => {
    await supabase.from("bsc_objectives").update({ current_value: value } as any).eq("id", id);
    if (selectedPlan) fetchObjectives(selectedPlan.id);
  };

  const deleteSwotItem = async (id: string) => {
    await supabase.from("swot_items").delete().eq("id", id);
    if (selectedPlan) fetchSwotItems(selectedPlan.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Planejamento Estratégico</h2>
          <p className="text-sm text-muted-foreground">BSC (Balanced Scorecard) e Análise SWOT</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Plano</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Plano Estratégico</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Tipo</Label>
                <Select value={form.plan_type} onValueChange={v => setForm(f => ({ ...f, plan_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="bsc">BSC</SelectItem><SelectItem value="swot">SWOT</SelectItem><SelectItem value="ambos">BSC + SWOT</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Início</Label><Input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Fim</Label><Input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} /></div>
              </div>
              <Button onClick={handleCreatePlan}>Criar Plano</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan list */}
      <div className="grid gap-3 sm:grid-cols-3">
        {loading ? <p className="col-span-3 text-center text-muted-foreground py-8">Carregando...</p>
        : plans.length === 0 ? <p className="col-span-3 text-center text-muted-foreground py-8">Nenhum plano estratégico.</p>
        : plans.map(p => (
          <div key={p.id} onClick={() => selectPlan(p)} className={`cursor-pointer rounded-xl border bg-card p-4 shadow-[var(--card-shadow)] transition-colors ${selectedPlan?.id === p.id ? "border-primary" : "hover:bg-muted/50"}`}>
            <p className="font-medium text-sm">{p.title}</p>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">{p.plan_type.toUpperCase()}</Badge>
              <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
            </div>
            {p.period_start && <p className="text-[10px] text-muted-foreground mt-1">{new Date(p.period_start).toLocaleDateString("pt-BR")} — {p.period_end ? new Date(p.period_end).toLocaleDateString("pt-BR") : "..."}</p>}
          </div>
        ))}
      </div>

      {/* Plan detail */}
      {selectedPlan && (
        <Tabs defaultValue={selectedPlan.plan_type === "swot" ? "swot" : "bsc"} className="mt-4">
          <TabsList>
            {(selectedPlan.plan_type === "bsc" || selectedPlan.plan_type === "ambos") && <TabsTrigger value="bsc" className="gap-1"><Target className="h-3 w-3" /> BSC</TabsTrigger>}
            {(selectedPlan.plan_type === "swot" || selectedPlan.plan_type === "ambos") && <TabsTrigger value="swot" className="gap-1"><Grid3X3 className="h-3 w-3" /> SWOT</TabsTrigger>}
          </TabsList>

          <TabsContent value="bsc" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setObjDialogOpen(true)}><Plus className="h-3 w-3" /> Objetivo</Button>
            </div>
            {perspectives.map(p => {
              const objs = objectives.filter(o => o.perspective === p.key);
              return (
                <div key={p.key} className="space-y-2">
                  <h4 className={`text-sm font-semibold px-2 py-1 rounded ${p.color}`}>{p.label}</h4>
                  {objs.length === 0 ? <p className="text-xs text-muted-foreground pl-4">Nenhum objetivo nesta perspectiva.</p>
                  : objs.map(obj => (
                    <div key={obj.id} className="rounded-lg border p-3 ml-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{obj.objective}</p>
                          {obj.description && <p className="text-xs text-muted-foreground">{obj.description}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{obj.current_value}/{obj.target_value} {obj.unit}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={obj.target_value ? (obj.current_value / obj.target_value) * 100 : 0} className="h-2 flex-1" />
                        <Input type="number" className="h-7 w-20 text-xs" defaultValue={obj.current_value}
                          onBlur={e => updateObjValue(obj.id, Number(e.target.value))} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="swot" className="mt-4">
            <div className="flex justify-end mb-3">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setSwotDialogOpen(true)}><Plus className="h-3 w-3" /> Item</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {swotQuadrants.map(q => (
                <div key={q.key} className={`rounded-xl border p-4 ${q.color}`}>
                  <h4 className="text-sm font-bold mb-2">{q.label}</h4>
                  {swotItems.filter(i => i.quadrant === q.key).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum item.</p>
                  ) : swotItems.filter(i => i.quadrant === q.key).map(item => (
                    <div key={item.id} className="flex items-start justify-between py-1 border-b border-border/30 last:border-0">
                      <div>
                        <p className="text-sm">{item.description}</p>
                        <Badge variant="outline" className="text-[10px] mt-0.5">{item.priority}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => deleteSwotItem(item.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* BSC Objective Dialog */}
      <Dialog open={objDialogOpen} onOpenChange={setObjDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Objetivo BSC</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Perspectiva</Label>
              <Select value={objForm.perspective} onValueChange={v => setObjForm(f => ({ ...f, perspective: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{perspectives.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Objetivo *</Label><Input value={objForm.objective} onChange={e => setObjForm(f => ({ ...f, objective: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Descrição</Label><Textarea value={objForm.description} onChange={e => setObjForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label>Meta</Label><Input type="number" value={objForm.target_value} onChange={e => setObjForm(f => ({ ...f, target_value: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Unidade</Label><Input value={objForm.unit} onChange={e => setObjForm(f => ({ ...f, unit: e.target.value }))} /></div>
            </div>
            <Button onClick={addObjective}>Adicionar Objetivo</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SWOT Item Dialog */}
      <Dialog open={swotDialogOpen} onOpenChange={setSwotDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Item SWOT</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Quadrante</Label>
              <Select value={swotForm.quadrant} onValueChange={v => setSwotForm(f => ({ ...f, quadrant: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{swotQuadrants.map(q => <SelectItem key={q.key} value={q.key}>{q.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2"><Label>Descrição *</Label><Textarea value={swotForm.description} onChange={e => setSwotForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid gap-2"><Label>Prioridade</Label>
              <Select value={swotForm.priority} onValueChange={v => setSwotForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="baixa">Baixa</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="alta">Alta</SelectItem></SelectContent>
              </Select>
            </div>
            <Button onClick={addSwotItem}>Adicionar Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StrategicPlanning;
