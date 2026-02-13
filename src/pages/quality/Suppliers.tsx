import { useEffect, useState } from "react";
import { Plus, Search, Star, Eye, TrendingUp } from "lucide-react";
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

type Criticality = "baixa" | "media" | "alta" | "critica";
type SupplierStatus = "ativo" | "inativo" | "em_avaliacao" | "bloqueado";

interface Supplier {
  id: string; name: string; cnpj: string | null; category: string | null;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
  criticality: Criticality; status: SupplierStatus;
  qualification_date: string | null; next_evaluation_date: string | null;
  notes: string | null; created_at: string;
}

interface Evaluation {
  id: string; supplier_id: string; evaluation_date: string;
  quality_score: number; delivery_score: number; compliance_score: number; cost_score: number;
  overall_score: number; notes: string | null; non_conformities_count: number;
}

const critConfig: Record<Criticality, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-safe/10 text-safe" },
  media: { label: "Média", color: "bg-warning/10 text-warning" },
  alta: { label: "Alta", color: "bg-destructive/10 text-destructive" },
  critica: { label: "Crítica", color: "bg-destructive/20 text-destructive font-bold" },
};

const statusConfig: Record<SupplierStatus, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "bg-safe/10 text-safe" },
  inativo: { label: "Inativo", color: "bg-muted text-muted-foreground" },
  em_avaliacao: { label: "Em Avaliação", color: "bg-warning/10 text-warning" },
  bloqueado: { label: "Bloqueado", color: "bg-destructive/10 text-destructive" },
};

const Suppliers = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  const [form, setForm] = useState({
    name: "", cnpj: "", category: "", contact_name: "", contact_email: "",
    contact_phone: "", criticality: "media" as Criticality, notes: "",
  });

  const [evalForm, setEvalForm] = useState({
    quality_score: "7", delivery_score: "7", compliance_score: "7", cost_score: "7",
    notes: "", non_conformities_count: "0",
  });

  useEffect(() => { fetchSuppliers(); }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("name");
    if (error) toast.error("Erro ao carregar fornecedores");
    else setSuppliers((data as any[]) ?? []);
    setLoading(false);
  };

  const fetchEvaluations = async (supplierId: string) => {
    const { data } = await supabase
      .from("supplier_evaluations")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("evaluation_date", { ascending: false });
    setEvaluations((data as any[]) ?? []);
  };

  const handleCreate = async () => {
    if (!form.name || !user) { toast.error("Nome obrigatório"); return; }
    const { error } = await supabase.from("suppliers").insert({
      name: form.name, cnpj: form.cnpj || null, category: form.category || null,
      contact_name: form.contact_name || null, contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null, criticality: form.criticality,
      notes: form.notes || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else {
      toast.success("Fornecedor cadastrado!");
      setDialogOpen(false);
      setForm({ name: "", cnpj: "", category: "", contact_name: "", contact_email: "", contact_phone: "", criticality: "media", notes: "" });
      fetchSuppliers();
    }
  };

  const handleEvaluate = async () => {
    if (!selectedSupplier || !user) return;
    const { error } = await supabase.from("supplier_evaluations").insert({
      supplier_id: selectedSupplier.id,
      quality_score: Number(evalForm.quality_score),
      delivery_score: Number(evalForm.delivery_score),
      compliance_score: Number(evalForm.compliance_score),
      cost_score: Number(evalForm.cost_score),
      notes: evalForm.notes || null,
      non_conformities_count: Number(evalForm.non_conformities_count),
      evaluated_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else {
      // Update next evaluation date (6 months)
      const next = new Date();
      next.setMonth(next.getMonth() + 6);
      await supabase.from("suppliers").update({
        next_evaluation_date: next.toISOString().split("T")[0],
        qualification_date: new Date().toISOString().split("T")[0],
      } as any).eq("id", selectedSupplier.id);
      toast.success("Avaliação registrada!");
      setEvalDialogOpen(false);
      setEvalForm({ quality_score: "7", delivery_score: "7", compliance_score: "7", cost_score: "7", notes: "", non_conformities_count: "0" });
      fetchSuppliers();
      fetchEvaluations(selectedSupplier.id);
    }
  };

  const updateStatus = async (id: string, status: SupplierStatus) => {
    const { error } = await supabase.from("suppliers").update({ status } as any).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Status atualizado"); fetchSuppliers(); }
  };

  const openDetail = async (s: Supplier) => {
    setSelectedSupplier(s);
    await fetchEvaluations(s.id);
    setDetailOpen(true);
  };

  const filtered = suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.cnpj && s.cnpj.includes(search))
  );

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-safe";
    if (score >= 6) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Gestão de Fornecedores</h2>
          <p className="text-sm text-muted-foreground">Cadastro, avaliação e qualificação de fornecedores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Cadastrar Fornecedor</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nome / Razão Social *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" /></div>
                <div className="grid gap-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Medicamentos, OPME..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Contato</Label><Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>E-mail</Label><Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Telefone</Label><Input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
                <div className="grid gap-2">
                  <Label>Criticidade</Label>
                  <Select value={form.criticality} onValueChange={v => setForm(f => ({ ...f, criticality: v as Criticality }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Cadastrar Fornecedor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou CNPJ..." className="pl-10" /></div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: suppliers.length, color: "text-foreground" },
          { label: "Ativos", value: suppliers.filter(s => s.status === "ativo").length, color: "text-safe" },
          { label: "Críticos", value: suppliers.filter(s => s.criticality === "critica" || s.criticality === "alta").length, color: "text-destructive" },
          { label: "Avaliação Pendente", value: suppliers.filter(s => !s.next_evaluation_date || new Date(s.next_evaluation_date) < new Date()).length, color: "text-warning" },
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
              <TableHead>Fornecedor</TableHead>
              <TableHead>Criticidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Próx. Avaliação</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum fornecedor cadastrado.</TableCell></TableRow>
            ) : filtered.map(s => (
              <TableRow key={s.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.category || "—"} {s.cnpj ? `• ${s.cnpj}` : ""}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${critConfig[s.criticality].color}`}>
                    {critConfig[s.criticality].label}
                  </span>
                </TableCell>
                <TableCell>
                  <Select value={s.status} onValueChange={v => updateStatus(s.id, v as SupplierStatus)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="em_avaliacao">Em Avaliação</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs">
                  {s.next_evaluation_date ? (
                    <span className={new Date(s.next_evaluation_date) < new Date() ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {new Date(s.next_evaluation_date).toLocaleDateString("pt-BR")}
                    </span>
                  ) : "Não avaliado"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(s)} title="Detalhes"><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedSupplier(s); setEvalDialogOpen(true); }} title="Avaliar"><Star className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Evaluation Dialog */}
      <Dialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Avaliar Fornecedor</DialogTitle></DialogHeader>
          {selectedSupplier && (
            <div className="grid gap-4 py-4">
              <p className="text-sm font-medium text-foreground">{selectedSupplier.name}</p>
              {[
                { key: "quality_score", label: "Qualidade" },
                { key: "delivery_score", label: "Entrega / Prazo" },
                { key: "compliance_score", label: "Conformidade" },
                { key: "cost_score", label: "Custo-Benefício" },
              ].map(({ key, label }) => (
                <div key={key} className="grid grid-cols-[1fr_80px] items-center gap-4">
                  <Label>{label} (1-10)</Label>
                  <Input
                    type="number" min={1} max={10}
                    value={(evalForm as any)[key]}
                    onChange={e => setEvalForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <span className="text-xs text-muted-foreground">Nota Geral: </span>
                <span className={`text-lg font-bold ${scoreColor((Number(evalForm.quality_score) + Number(evalForm.delivery_score) + Number(evalForm.compliance_score) + Number(evalForm.cost_score)) / 4)}`}>
                  {((Number(evalForm.quality_score) + Number(evalForm.delivery_score) + Number(evalForm.compliance_score) + Number(evalForm.cost_score)) / 4).toFixed(1)}
                </span>
              </div>
              <div className="grid grid-cols-[1fr_80px] items-center gap-4">
                <Label>Não Conformidades</Label>
                <Input type="number" min={0} value={evalForm.non_conformities_count} onChange={e => setEvalForm(f => ({ ...f, non_conformities_count: e.target.value }))} />
              </div>
              <div className="grid gap-2"><Label>Observações</Label><Textarea value={evalForm.notes} onChange={e => setEvalForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleEvaluate} className="w-full">Registrar Avaliação</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Detalhes do Fornecedor</DialogTitle></DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Nome</p><p className="font-medium">{selectedSupplier.name}</p></div>
                <div><p className="text-xs text-muted-foreground">CNPJ</p><p className="font-medium">{selectedSupplier.cnpj || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Categoria</p><p className="font-medium">{selectedSupplier.category || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Criticidade</p><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${critConfig[selectedSupplier.criticality].color}`}>{critConfig[selectedSupplier.criticality].label}</span></div>
                <div><p className="text-xs text-muted-foreground">Contato</p><p className="font-medium">{selectedSupplier.contact_name || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">E-mail</p><p className="font-medium">{selectedSupplier.contact_email || "—"}</p></div>
              </div>

              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground"><TrendingUp className="h-4 w-4" /> Histórico de Avaliações</h4>
                {evaluations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhuma avaliação registrada.</p>
                ) : (
                  <div className="space-y-2">
                    {evaluations.map(ev => (
                      <div key={ev.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{new Date(ev.evaluation_date).toLocaleDateString("pt-BR")}</span>
                          <span className={`text-sm font-bold ${scoreColor(ev.overall_score)}`}>{Number(ev.overall_score).toFixed(1)}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-4 gap-2 text-[10px]">
                          <div>Qualidade: <span className="font-bold">{ev.quality_score}</span></div>
                          <div>Entrega: <span className="font-bold">{ev.delivery_score}</span></div>
                          <div>Conformidade: <span className="font-bold">{ev.compliance_score}</span></div>
                          <div>Custo: <span className="font-bold">{ev.cost_score}</span></div>
                        </div>
                        {ev.notes && <p className="mt-1 text-xs text-muted-foreground">{ev.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button onClick={() => { setEvalDialogOpen(true); setDetailOpen(false); }} variant="outline" className="w-full gap-2">
                <Star className="h-4 w-4" /> Nova Avaliação
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Suppliers;
