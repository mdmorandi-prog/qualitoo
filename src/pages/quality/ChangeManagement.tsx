import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, GitPullRequest, Search, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  em_analise: { label: "Em Análise", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  aprovado: { label: "Aprovado", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  em_implementacao: { label: "Em Implementação", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  implementado: { label: "Implementado", color: "bg-primary/20 text-primary" },
  verificado: { label: "Verificado", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

const priorityConfig: Record<string, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  alta: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  critica: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const ChangeManagement = () => {
  const { user, isAdmin } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", justification: "", impact_analysis: "",
    affected_processes: "", affected_documents: "", risk_assessment: "",
    sector: "", priority: "media",
  });

  const fetchData = async () => {
    const { data } = await supabase.from("change_requests").select("*").order("created_at", { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.description) return toast.error("Título e descrição são obrigatórios");
    if (editingId) {
      const { error } = await supabase.from("change_requests").update(form).eq("id", editingId);
      if (error) return toast.error("Erro ao atualizar");
      toast.success("Solicitação atualizada!");
    } else {
      const { error } = await supabase.from("change_requests").insert({ ...form, requested_by: user?.email ?? "", status: "rascunho" });
      if (error) return toast.error("Erro ao salvar");
      toast.success("Solicitação criada!");
    }
    setShowForm(false);
    resetForm();
    fetchData();
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ title: "", description: "", justification: "", impact_analysis: "", affected_processes: "", affected_documents: "", risk_assessment: "", sector: "", priority: "media" });
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "aprovado") { updates.approved_by = user?.email; updates.approved_at = new Date().toISOString(); }
    if (newStatus === "implementado") { updates.implemented_at = new Date().toISOString(); }
    if (newStatus === "verificado") { updates.verified_at = new Date().toISOString(); }
    const { error } = await supabase.from("change_requests").update(updates).eq("id", id);
    if (error) return toast.error("Erro ao atualizar status");
    toast.success(`Status atualizado para ${statusConfig[newStatus]?.label}`);
    fetchData();
  };

  const openEdit = (req: any) => {
    setEditingId(req.id);
    setForm({
      title: req.title, description: req.description, justification: req.justification ?? "",
      impact_analysis: req.impact_analysis ?? "", affected_processes: req.affected_processes ?? "",
      affected_documents: req.affected_documents ?? "", risk_assessment: req.risk_assessment ?? "",
      sector: req.sector ?? "", priority: req.priority,
    });
    setShowForm(true);
  };

  const filtered = requests.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  const nextStatus: Record<string, string[]> = {
    rascunho: ["em_analise"],
    em_analise: isAdmin ? ["aprovado", "rejeitado"] : [],
    aprovado: ["em_implementacao"],
    em_implementacao: ["implementado"],
    implementado: isAdmin ? ["verificado"] : [],
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Mudanças</h2>
          <p className="text-sm text-muted-foreground">Change Control para processos críticos</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Nova Solicitação
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar mudanças..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Status overview */}
      <div className="grid gap-3 sm:grid-cols-4">
        {["rascunho", "em_analise", "aprovado", "em_implementacao"].map(s => {
          const count = requests.filter(r => r.status === s).length;
          const sc = statusConfig[s];
          return (
            <Card key={s}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <Badge className={`mt-1 ${sc.color}`}>{sc.label}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.map(req => {
          const sc = statusConfig[req.status] ?? statusConfig.rascunho;
          const transitions = nextStatus[req.status] ?? [];
          return (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <GitPullRequest className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{req.title}</p>
                      <Badge className={sc.color}>{sc.label}</Badge>
                      <Badge className={priorityConfig[req.priority]}>{req.priority}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{req.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Solicitante: {req.requested_by} · {new Date(req.created_at).toLocaleDateString("pt-BR")}
                      {req.sector && ` · Setor: ${req.sector}`}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {transitions.map(ns => (
                      <Button key={ns} size="sm" variant="outline" className="text-xs" onClick={() => handleStatusChange(req.id, ns)}>
                        <ArrowRight className="mr-1 h-3 w-3" /> {statusConfig[ns]?.label}
                      </Button>
                    ))}
                    {req.status === "rascunho" && (
                      <Button size="sm" variant="ghost" onClick={() => openEdit(req)}>Editar</Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nova"} Solicitação de Mudança</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Título *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="sm:col-span-2" />
            <Textarea placeholder="Descrição da mudança *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" rows={3} />
            <Textarea placeholder="Justificativa" value={form.justification} onChange={e => setForm({ ...form, justification: e.target.value })} className="sm:col-span-2" rows={2} />
            <Textarea placeholder="Análise de Impacto" value={form.impact_analysis} onChange={e => setForm({ ...form, impact_analysis: e.target.value })} className="sm:col-span-2" rows={2} />
            <Input placeholder="Processos Afetados" value={form.affected_processes} onChange={e => setForm({ ...form, affected_processes: e.target.value })} />
            <Input placeholder="Documentos Afetados" value={form.affected_documents} onChange={e => setForm({ ...form, affected_documents: e.target.value })} />
            <Textarea placeholder="Avaliação de Risco" value={form.risk_assessment} onChange={e => setForm({ ...form, risk_assessment: e.target.value })} className="sm:col-span-2" rows={2} />
            <Input placeholder="Setor" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} />
            <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChangeManagement;
