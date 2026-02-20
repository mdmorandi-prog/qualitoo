import { useEffect, useState } from "react";
import { Plus, Search, Eye, RefreshCw, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Review {
  id: string; title: string; review_date: string; status: string; participants: string | null;
  input_nc_summary: string | null; input_audit_results: string | null;
  input_indicator_performance: string | null; input_customer_feedback: string | null;
  input_risk_assessment: string | null; input_supplier_performance: string | null;
  input_previous_actions: string | null; input_changes: string | null;
  input_improvement_opportunities: string | null;
  output_decisions: string | null; output_resources: string | null;
  output_improvements: string | null; output_action_items: string | null;
  aggregated_data: any; created_at: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  agendada: { label: "Agendada", color: "bg-accent/10 text-accent" },
  em_andamento: { label: "Em Andamento", color: "bg-warning/10 text-warning" },
  concluida: { label: "Concluída", color: "bg-safe/10 text-safe" },
};

const ManagementReview = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Review | null>(null);
  const [form, setForm] = useState({ title: "", review_date: "", participants: "" });
  const [aggregating, setAggregating] = useState(false);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data } = await supabase.from("management_reviews").select("*").order("review_date", { ascending: false });
    setReviews((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.review_date || !user) { toast.error("Preencha os campos"); return; }
    const { error } = await supabase.from("management_reviews").insert({
      title: form.title, review_date: form.review_date,
      participants: form.participants || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); return; }
    toast.success("Análise Crítica criada!");
    setDialogOpen(false);
    setForm({ title: "", review_date: "", participants: "" });
    fetchReviews();
  };

  const aggregateData = async (reviewId: string) => {
    setAggregating(true);
    try {
      const [ncRes, audRes, indRes, measRes, riskRes, supRes, planRes, survRes] = await Promise.all([
        supabase.from("non_conformities").select("id, status, severity"),
        supabase.from("audits").select("id, status, title"),
        supabase.from("quality_indicators").select("id, name, target_value"),
        supabase.from("indicator_measurements").select("indicator_id, value, period_date").order("period_date", { ascending: false }),
        supabase.from("risks").select("id, title, risk_level, status"),
        supabase.from("supplier_evaluations").select("supplier_id, overall_score, evaluation_date").order("evaluation_date", { ascending: false }),
        supabase.from("action_plans").select("id, status, title"),
        supabase.from("survey_responses").select("score"),
      ]);

      const ncs = (ncRes.data as any[]) ?? [];
      const audits = (audRes.data as any[]) ?? [];
      const indicators = (indRes.data as any[]) ?? [];
      const measurements = (measRes.data as any[]) ?? [];
      const risks = (riskRes.data as any[]) ?? [];
      const supplierEvals = (supRes.data as any[]) ?? [];
      const plans = (planRes.data as any[]) ?? [];
      const surveyResp = (survRes.data as any[]) ?? [];

      const ncOpen = ncs.filter(n => n.status !== "concluida").length;
      const ncCritical = ncs.filter(n => (n.severity === "alta" || n.severity === "critica") && n.status !== "concluida").length;
      
      const indBelow = indicators.filter(ind => {
        const last = measurements.find(m => m.indicator_id === ind.id);
        return last && last.value < ind.target_value;
      }).length;

      const highRisks = risks.filter(r => (r.risk_level ?? 0) >= 15).length;
      const avgSupplier = supplierEvals.length > 0 ? (supplierEvals.reduce((s, e) => s + (e.overall_score ?? 0), 0) / supplierEvals.length).toFixed(1) : "N/A";
      const plansPending = plans.filter(p => p.status === "pendente").length;
      const avgSatisfaction = surveyResp.length > 0 ? (surveyResp.reduce((s, r) => s + (r.score ?? 0), 0) / surveyResp.length).toFixed(1) : "N/A";

      const aggregated = {
        nc: { total: ncs.length, open: ncOpen, critical: ncCritical },
        audits: { total: audits.length, concluded: audits.filter(a => a.status === "concluida").length },
        indicators: { total: indicators.length, belowTarget: indBelow },
        risks: { total: risks.length, high: highRisks },
        suppliers: { avgScore: avgSupplier, total: supplierEvals.length },
        plans: { total: plans.length, pending: plansPending },
        satisfaction: { avgScore: avgSatisfaction, responses: surveyResp.length },
        generatedAt: new Date().toISOString(),
      };

      const summaries = {
        input_nc_summary: `Total: ${ncs.length} | Abertas: ${ncOpen} | Críticas: ${ncCritical}`,
        input_audit_results: `Total: ${audits.length} | Concluídas: ${audits.filter(a => a.status === "concluida").length}`,
        input_indicator_performance: `Total: ${indicators.length} | Abaixo da meta: ${indBelow}`,
        input_risk_assessment: `Total: ${risks.length} | Riscos altos (≥15): ${highRisks}`,
        input_supplier_performance: `Nota média: ${avgSupplier} | Avaliações: ${supplierEvals.length}`,
        input_customer_feedback: `Satisfação média: ${avgSatisfaction} | Respostas: ${surveyResp.length}`,
        input_previous_actions: `Total: ${plans.length} | Pendentes: ${plansPending}`,
      };

      await supabase.from("management_reviews").update({
        aggregated_data: aggregated, ...summaries,
      } as any).eq("id", reviewId);

      toast.success("Dados agregados automaticamente!");
      fetchReviews();
      if (selected?.id === reviewId) {
        const { data } = await supabase.from("management_reviews").select("*").eq("id", reviewId).single();
        setSelected(data as any);
      }
    } catch {
      toast.error("Erro ao agregar dados");
    }
    setAggregating(false);
  };

  const updateField = async (field: string, value: string) => {
    if (!selected) return;
    await supabase.from("management_reviews").update({ [field]: value } as any).eq("id", selected.id);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("management_reviews").update({ status } as any).eq("id", id);
    toast.success("Status atualizado");
    fetchReviews();
  };

  const filtered = reviews.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()));

  const inputFields = [
    { key: "input_nc_summary", label: "Status das Não Conformidades (ISO 9.3.2 a)" },
    { key: "input_audit_results", label: "Resultados das Auditorias (ISO 9.3.2 b)" },
    { key: "input_indicator_performance", label: "Desempenho dos Indicadores (ISO 9.3.2 c)" },
    { key: "input_customer_feedback", label: "Feedback de Clientes/Partes (ISO 9.3.2 c)" },
    { key: "input_risk_assessment", label: "Avaliação de Riscos e Oportunidades (ISO 9.3.2 d)" },
    { key: "input_supplier_performance", label: "Desempenho de Fornecedores (ISO 9.3.2 e)" },
    { key: "input_previous_actions", label: "Status de Ações Anteriores (ISO 9.3.2 f)" },
    { key: "input_changes", label: "Mudanças que Afetam o SGQ (ISO 9.3.2 g)" },
    { key: "input_improvement_opportunities", label: "Oportunidades de Melhoria (ISO 9.3.2 h)" },
  ];

  const outputFields = [
    { key: "output_decisions", label: "Decisões e Ações (ISO 9.3.3 a)" },
    { key: "output_resources", label: "Necessidades de Recursos (ISO 9.3.3 b)" },
    { key: "output_improvements", label: "Oportunidades de Melhoria (ISO 9.3.3 c)" },
    { key: "output_action_items", label: "Itens de Ação / Responsáveis" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Análise Crítica pela Direção</h2>
          <p className="text-sm text-muted-foreground">ISO 9001:2015 — Requisito 9.3</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Análise</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Análise Crítica</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Análise Crítica Q1 2026" /></div>
              <div className="grid gap-2"><Label>Data da Reunião *</Label><Input type="date" value={form.review_date} onChange={e => setForm(f => ({ ...f, review_date: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Participantes</Label><Textarea value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} placeholder="Nomes dos participantes..." /></div>
              <Button onClick={handleCreate}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>

      <div className="grid gap-3">
        {loading ? <p className="text-center text-muted-foreground py-8">Carregando...</p>
        : filtered.length === 0 ? <p className="text-center text-muted-foreground py-8">Nenhuma análise crítica.</p>
        : filtered.map(r => (
          <div key={r.id} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{new Date(r.review_date).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusConfig[r.status]?.color}>{statusConfig[r.status]?.label}</Badge>
                <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                  <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="gap-1" onClick={() => { setSelected(r); setDetailOpen(true); }}>
                <Eye className="h-3 w-3" /> Detalhes
              </Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => aggregateData(r.id)} disabled={aggregating}>
                <RefreshCw className={`h-3 w-3 ${aggregating ? "animate-spin" : ""}`} /> Agregar Dados
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl w-[95vw]">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Análise Crítica pela Direção</DialogTitle></DialogHeader>
          {selected && (
            <Tabs defaultValue="inputs" className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inputs">Entradas (Inputs)</TabsTrigger>
                <TabsTrigger value="outputs">Saídas (Outputs)</TabsTrigger>
                <TabsTrigger value="info">Informações</TabsTrigger>
              </TabsList>
              <TabsContent value="inputs" className="space-y-3 mt-4">
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => aggregateData(selected.id)} disabled={aggregating}>
                    <RefreshCw className={`h-3 w-3 ${aggregating ? "animate-spin" : ""}`} /> Auto-agregar
                  </Button>
                </div>
                {inputFields.map(f => (
                  <div key={f.key} className="grid gap-1">
                    <Label className="text-xs font-semibold text-muted-foreground">{f.label}</Label>
                    <Textarea
                      defaultValue={(selected as any)[f.key] ?? ""}
                      onBlur={e => updateField(f.key, e.target.value)}
                      className="text-sm min-h-[60px]"
                    />
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="outputs" className="space-y-3 mt-4">
                {outputFields.map(f => (
                  <div key={f.key} className="grid gap-1">
                    <Label className="text-xs font-semibold text-muted-foreground">{f.label}</Label>
                    <Textarea
                      defaultValue={(selected as any)[f.key] ?? ""}
                      onBlur={e => updateField(f.key, e.target.value)}
                      className="text-sm min-h-[80px]"
                    />
                  </div>
                ))}
              </TabsContent>
              <TabsContent value="info" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Data</p><p className="font-medium">{new Date(selected.review_date).toLocaleDateString("pt-BR")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><Badge className={statusConfig[selected.status]?.color}>{statusConfig[selected.status]?.label}</Badge></div>
                </div>
                {selected.participants && <div><p className="text-xs text-muted-foreground">Participantes</p><p className="text-sm">{selected.participants}</p></div>}
                {selected.aggregated_data?.generatedAt && (
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Dados agregados em: {new Date(selected.aggregated_data.generatedAt).toLocaleString("pt-BR")}</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagementReview;
