import { useEffect, useState } from "react";
import { Plus, Search, Eye, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuditChecklist from "@/components/audit/AuditChecklist";
import AiAuditBriefing from "@/components/innovations/AiAuditBriefing";
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

type AuditStatus = "planejada" | "em_andamento" | "concluida" | "cancelada";

interface Audit {
  id: string; title: string; description: string | null; audit_type: string;
  status: AuditStatus; scheduled_date: string; completed_date: string | null;
  sector: string | null; scope: string | null; conclusion: string | null;
  findings: string | null; created_at: string;
}

const statusConfig: Record<AuditStatus, { label: string; color: string }> = {
  planejada: { label: "Planejada", color: "bg-accent/10 text-accent" },
  em_andamento: { label: "Em Andamento", color: "bg-warning/10 text-warning" },
  concluida: { label: "Concluída", color: "bg-safe/10 text-safe" },
  cancelada: { label: "Cancelada", color: "bg-muted text-muted-foreground" },
};

const Audits = () => {
  const { user } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Audit | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", audit_type: "interna", scheduled_date: "", sector: "", scope: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("audits").select("*").order("scheduled_date", { ascending: false });
    if (error) toast.error("Erro");
    else setAudits((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.scheduled_date || !user) { toast.error("Preencha os campos obrigatórios"); return; }
    const { error } = await supabase.from("audits").insert({
      title: form.title, description: form.description || null, audit_type: form.audit_type,
      scheduled_date: form.scheduled_date, sector: form.sector || null, scope: form.scope || null,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar"); console.error(error); }
    else { toast.success("Auditoria criada!"); setDialogOpen(false); setForm({ title: "", description: "", audit_type: "interna", scheduled_date: "", sector: "", scope: "" }); fetchData(); }
  };

  const updateStatus = async (id: string, status: AuditStatus) => {
    const update: any = { status };
    if (status === "concluida") update.completed_date = new Date().toISOString().split("T")[0];
    const { error } = await supabase.from("audits").update(update).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Atualizado"); fetchData(); }
  };

  const updateField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("audits").update({ [field]: value } as any).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Salvo"); fetchData(); }
  };

  const createActionPlanFromAudit = async (audit: Audit) => {
    if (!user) return;
    const { error } = await supabase.from("action_plans").insert({
      title: `Plano - ${audit.title}`,
      what: audit.findings || audit.description || "",
      why: `Achados da auditoria: ${audit.title}`,
      origin_type: "audit",
      origin_id: audit.id,
      sector: audit.sector,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar Plano"); console.error(error); }
    else { toast.success("Plano de Ação criado a partir da Auditoria!"); setDetailOpen(false); }
  };

  const filtered = audits.filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-display text-2xl font-bold text-foreground">Auditorias Internas</h2><p className="text-sm text-muted-foreground">Planejamento e execução de auditorias</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2 w-full sm:w-auto"><Plus className="h-4 w-4" /> Nova Auditoria</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg w-[95vw]">
            <DialogHeader><DialogTitle className="font-display">Planejar Auditoria</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Tipo</Label>
                  <Select value={form.audit_type} onValueChange={v => setForm(f => ({ ...f, audit_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="interna">Interna</SelectItem><SelectItem value="externa">Externa</SelectItem><SelectItem value="certificacao">Certificação</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Data Prevista *</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Escopo</Label><Input value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Criar Auditoria</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Total", value: audits.length, color: "text-foreground" },
          { label: "Planejadas", value: audits.filter(a => a.status === "planejada").length, color: "text-accent" },
          { label: "Em Andamento", value: audits.filter(a => a.status === "em_andamento").length, color: "text-warning" },
          { label: "Concluídas", value: audits.filter(a => a.status === "concluida").length, color: "text-safe" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-3 sm:p-4 shadow-[var(--card-shadow)]"><p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p><p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p></div>
        ))}
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">Nenhuma auditoria.</p>
        ) : filtered.map(a => (
          <div key={a.id} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)] space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground truncate">{a.title}</p>
                <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{a.audit_type} • {new Date(a.scheduled_date).toLocaleDateString("pt-BR")}</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 ml-2" onClick={() => { setSelected(a); setDetailOpen(true); }}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Select value={a.status} onValueChange={v => updateStatus(a.id, v as AuditStatus)}>
                <SelectTrigger className="h-8 flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {a.sector && <p className="text-[10px] text-muted-foreground">Setor: {a.sector}</p>}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma auditoria.</TableCell></TableRow>
            : filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell className="text-sm capitalize">{a.audit_type}</TableCell>
                <TableCell>
                  <Select value={a.status} onValueChange={v => updateStatus(a.id, v as AuditStatus)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(a.scheduled_date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelected(a); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl w-[95vw]">
          <DialogHeader><DialogTitle className="font-display">Detalhes da Auditoria</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">Tipo</span><span className="font-medium capitalize">{selected.audit_type}</span></div>
                <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">Setor</span><span className="font-medium">{selected.sector || "—"}</span></div>
                <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">Escopo</span><span className="font-medium">{selected.scope || "—"}</span></div>
              </div>
              {selected.description && <div className="rounded-lg bg-secondary/50 p-3"><p className="mb-1 text-xs font-semibold text-muted-foreground">Descrição</p><p className="text-sm">{selected.description}</p></div>}
              <div className="grid gap-3">
                <div className="grid gap-2"><Label className="text-xs font-semibold">Achados</Label><Textarea defaultValue={selected.findings ?? ""} onBlur={e => updateField(selected.id, "findings", e.target.value)} placeholder="Registre os achados da auditoria..." /></div>
                <div className="grid gap-2"><Label className="text-xs font-semibold">Conclusão</Label><Textarea defaultValue={selected.conclusion ?? ""} onBlur={e => updateField(selected.id, "conclusion", e.target.value)} placeholder="Conclusão da auditoria..." /></div>
              </div>
              <div className="border-t pt-4 space-y-4">
                <AiAuditBriefing auditId={selected.id} auditTitle={selected.title} auditType={selected.audit_type} sector={selected.sector} scope={selected.scope} />
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => createActionPlanFromAudit(selected)}>
                  <Crosshair className="h-4 w-4" /> Criar Plano de Ação a partir desta Auditoria
                </Button>
                <AuditChecklist auditId={selected.id} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Audits;
