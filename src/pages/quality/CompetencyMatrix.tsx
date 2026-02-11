import { useEffect, useState } from "react";
import { Plus, Search, Users, BarChart3 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Competency {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sector: string | null;
  required_for_roles: string[] | null;
  is_mandatory: boolean;
  created_at: string;
}

interface Evaluation {
  id: string;
  competency_id: string;
  employee_name: string;
  employee_role: string | null;
  sector: string | null;
  level: number;
  evaluation_date: string;
  notes: string | null;
}

const levelLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Não possui", color: "bg-destructive/20 text-destructive" },
  2: { label: "Básico", color: "bg-warning/20 text-warning" },
  3: { label: "Intermediário", color: "bg-accent/10 text-accent" },
  4: { label: "Avançado", color: "bg-safe/10 text-safe" },
  5: { label: "Especialista", color: "bg-primary/10 text-primary" },
};

const CompetencyMatrix = () => {
  const { user } = useAuth();
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [compDialogOpen, setCompDialogOpen] = useState(false);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [selectedComp, setSelectedComp] = useState<Competency | null>(null);

  const [compForm, setCompForm] = useState({
    name: "", description: "", category: "", sector: "", is_mandatory: false, required_for_roles: "",
  });

  const [evalForm, setEvalForm] = useState({
    employee_name: "", employee_role: "", sector: "", level: 1, notes: "",
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [compRes, evalRes] = await Promise.all([
      supabase.from("competencies").select("*").order("name"),
      supabase.from("competency_evaluations").select("*").order("evaluation_date", { ascending: false }),
    ]);
    if (compRes.error) toast.error("Erro ao carregar competências");
    else setCompetencies((compRes.data as any[]) ?? []);
    if (evalRes.error) toast.error("Erro ao carregar avaliações");
    else setEvaluations((evalRes.data as any[]) ?? []);
    setLoading(false);
  };

  const createCompetency = async () => {
    if (!compForm.name) { toast.error("Nome obrigatório"); return; }
    const { error } = await supabase.from("competencies").insert({
      name: compForm.name,
      description: compForm.description || null,
      category: compForm.category || null,
      sector: compForm.sector || null,
      is_mandatory: compForm.is_mandatory,
      required_for_roles: compForm.required_for_roles ? compForm.required_for_roles.split(",").map(r => r.trim()) : null,
    } as any);
    if (error) { toast.error("Erro ao criar"); console.error(error); }
    else { toast.success("Competência criada!"); setCompDialogOpen(false); setCompForm({ name: "", description: "", category: "", sector: "", is_mandatory: false, required_for_roles: "" }); fetchAll(); }
  };

  const createEvaluation = async () => {
    if (!selectedComp || !evalForm.employee_name || !user) { toast.error("Preencha os campos obrigatórios"); return; }
    const { error } = await supabase.from("competency_evaluations").insert({
      competency_id: selectedComp.id,
      employee_name: evalForm.employee_name,
      employee_role: evalForm.employee_role || null,
      sector: evalForm.sector || null,
      level: evalForm.level,
      evaluated_by: user.id,
      notes: evalForm.notes || null,
    } as any);
    if (error) { toast.error("Erro ao avaliar"); console.error(error); }
    else { toast.success("Avaliação registrada!"); setEvalDialogOpen(false); setEvalForm({ employee_name: "", employee_role: "", sector: "", level: 1, notes: "" }); fetchAll(); }
  };

  const filtered = competencies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  const getCompEvals = (compId: string) => evaluations.filter(e => e.competency_id === compId);

  const getAvgLevel = (compId: string) => {
    const evals = getCompEvals(compId);
    if (evals.length === 0) return 0;
    return Math.round(evals.reduce((sum, e) => sum + e.level, 0) / evals.length * 10) / 10;
  };

  const getGapCount = (compId: string) => getCompEvals(compId).filter(e => e.level < 3).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Matriz de Competências</h2>
          <p className="text-sm text-muted-foreground">Mapeamento de competências por cargo e análise de gaps</p>
        </div>
        <Dialog open={compDialogOpen} onOpenChange={setCompDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Competência</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Cadastrar Competência</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input value={compForm.name} onChange={e => setCompForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Higienização das Mãos" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Input value={compForm.category} onChange={e => setCompForm(f => ({ ...f, category: e.target.value }))} placeholder="Técnica, Comportamental..." />
                </div>
                <div className="grid gap-2">
                  <Label>Setor</Label>
                  <Input value={compForm.sector} onChange={e => setCompForm(f => ({ ...f, sector: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Cargos Requeridos (separados por vírgula)</Label>
                <Input value={compForm.required_for_roles} onChange={e => setCompForm(f => ({ ...f, required_for_roles: e.target.value }))} placeholder="Enfermeiro, Técnico, Médico" />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea value={compForm.description} onChange={e => setCompForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={compForm.is_mandatory} onCheckedChange={v => setCompForm(f => ({ ...f, is_mandatory: v }))} />
                <Label>Competência Obrigatória</Label>
              </div>
              <Button onClick={createCompetency} className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar competências..." className="pl-10" />
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Competências", value: competencies.length, color: "text-foreground" },
          { label: "Obrigatórias", value: competencies.filter(c => c.is_mandatory).length, color: "text-destructive" },
          { label: "Avaliações", value: evaluations.length, color: "text-accent" },
          { label: "Gaps Identificados", value: competencies.reduce((sum, c) => sum + getGapCount(c.id), 0), color: "text-warning" },
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
              <TableHead>Competência</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Avaliações</TableHead>
              <TableHead>Nível Médio</TableHead>
              <TableHead>Gaps</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhuma competência cadastrada.</TableCell></TableRow>
            ) : filtered.map(c => {
              const avg = getAvgLevel(c.id);
              const gaps = getGapCount(c.id);
              const evalCount = getCompEvals(c.id).length;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      {c.is_mandatory && <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">OBRIGATÓRIA</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.category || "—"}</TableCell>
                  <TableCell className="text-sm">{c.sector || "Todos"}</TableCell>
                  <TableCell className="text-sm">{evalCount}</TableCell>
                  <TableCell>
                    {evalCount > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-border">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(avg / 5) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium">{avg}</span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    {gaps > 0 ? (
                      <span className="rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">{gaps} gap{gaps > 1 ? "s" : ""}</span>
                    ) : evalCount > 0 ? (
                      <span className="text-xs text-safe">✓ OK</span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedComp(c); setEvalDialogOpen(true); }}>
                      <Users className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Evaluation Dialog */}
      <Dialog open={evalDialogOpen} onOpenChange={setEvalDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Avaliar: {selectedComp?.name}</DialogTitle></DialogHeader>
          {selectedComp && (
            <div className="space-y-4">
              {/* Existing evaluations */}
              {getCompEvals(selectedComp.id).length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg bg-secondary/50 p-3">
                  <p className="mb-2 text-xs font-bold text-muted-foreground">Avaliações Existentes</p>
                  {getCompEvals(selectedComp.id).map(ev => (
                    <div key={ev.id} className="flex items-center justify-between border-b border-border/30 py-1.5 last:border-0">
                      <span className="text-sm">{ev.employee_name} {ev.employee_role ? `(${ev.employee_role})` : ""}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelLabels[ev.level]?.color}`}>{levelLabels[ev.level]?.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 pt-2">
                <div className="grid gap-2">
                  <Label>Nome do Colaborador *</Label>
                  <Input value={evalForm.employee_name} onChange={e => setEvalForm(f => ({ ...f, employee_name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Cargo</Label>
                    <Input value={evalForm.employee_role} onChange={e => setEvalForm(f => ({ ...f, employee_role: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Setor</Label>
                    <Input value={evalForm.sector} onChange={e => setEvalForm(f => ({ ...f, sector: e.target.value }))} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Nível de Competência *</Label>
                  <Select value={String(evalForm.level)} onValueChange={v => setEvalForm(f => ({ ...f, level: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(levelLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{k} - {v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <Textarea value={evalForm.notes} onChange={e => setEvalForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <Button onClick={createEvaluation} className="w-full">Registrar Avaliação</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompetencyMatrix;
