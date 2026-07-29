import { useEffect, useState } from "react";
import { Plus, Search, AlertTriangle, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ExportPdfButton from "@/components/ExportPdfButton";
import { generateModuleReport } from "@/lib/pdfReport";
import { SectorSelect } from "@/components/SectorSelect";

interface Incident {
  id: string; title: string; description: string; occurred_at: string | null; detected_at: string;
  affected_data: string | null; affected_subjects: number | null; risk: string;
  anpd_notified: boolean; anpd_notified_at: string | null; subjects_notified: boolean;
  containment_measures: string | null; corrective_measures: string | null;
  sector: string | null; responsible: string | null; status: string; created_at: string;
}

const RISK_LABELS: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto", critico: "Crítico" };
const STATUS_LABELS: Record<string, string> = { aberto: "Aberto", em_investigacao: "Em investigação", contido: "Contido", encerrado: "Encerrado" };

const emptyForm = {
  title: "", description: "", occurred_at: "", affected_data: "", affected_subjects: "0",
  risk: "medio", anpd_notified: false, subjects_notified: false,
  containment_measures: "", corrective_measures: "", sector: "", responsible: "", status: "aberto",
};

const LgpdIncidents = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lgpd_incidents" as any)
      .select("*")
      .order("detected_at", { ascending: false });
    if (error) toast.error("Erro ao carregar incidentes");
    else setRows((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !user) { toast.error("Preencha título e descrição"); return; }
    const { error } = await supabase.from("lgpd_incidents" as any).insert({
      ...form,
      occurred_at: form.occurred_at ? new Date(form.occurred_at).toISOString() : null,
      affected_subjects: Number(form.affected_subjects) || 0,
      affected_data: form.affected_data || null,
      containment_measures: form.containment_measures || null,
      corrective_measures: form.corrective_measures || null,
      sector: form.sector || null,
      responsible: form.responsible || null,
      anpd_notified_at: form.anpd_notified ? new Date().toISOString() : null,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao registrar incidente"); return; }
    toast.success("Incidente registrado!");
    setDialogOpen(false); setForm(emptyForm); fetchData();
  };

  const toggleAnpd = async (r: Incident) => {
    const next = !r.anpd_notified;
    const { error } = await supabase.from("lgpd_incidents" as any).update({
      anpd_notified: next, anpd_notified_at: next ? new Date().toISOString() : null,
    } as any).eq("id", r.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    fetchData();
  };

  const filtered = rows.filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()));
  const highRisk = rows.filter(r => r.risk === "alto" || r.risk === "critico");
  const pendingAnpd = highRisk.filter(r => !r.anpd_notified);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Incidentes de Segurança com Dados Pessoais</h3>
          <p className="text-sm text-muted-foreground">Art. 48 — comunicação à ANPD e aos titulares em prazo razoável</p>
        </div>
        <div className="flex gap-2">
          <ExportPdfButton onClick={() => generateModuleReport({
            title: "Relatório de Incidentes de Dados Pessoais (LGPD)",
            subtitle: "Registro, risco e comunicação à ANPD",
            kpis: [
              { label: "Total", value: rows.length },
              { label: "Alto/Crítico", value: highRisk.length },
              { label: "ANPD pendente", value: pendingAnpd.length },
              { label: "Titulares afetados", value: rows.reduce((s, r) => s + (r.affected_subjects || 0), 0) },
            ],
            columns: [
              { header: "Título", accessor: (r: any) => r.title },
              { header: "Detectado", accessor: (r: any) => new Date(r.detected_at).toLocaleDateString("pt-BR") },
              { header: "Setor", accessor: (r: any) => r.sector ?? "—" },
              { header: "Risco", accessor: (r: any) => RISK_LABELS[r.risk] ?? r.risk },
              { header: "Afetados", accessor: (r: any) => r.affected_subjects ?? 0, align: "right" },
              { header: "ANPD", accessor: (r: any) => r.anpd_notified ? "Comunicada" : "Pendente" },
              { header: "Titulares", accessor: (r: any) => r.subjects_notified ? "Comunicados" : "Pendente" },
              { header: "Status", accessor: (r: any) => STATUS_LABELS[r.status] ?? r.status },
            ],
            rows: filtered,
            landscape: true,
          })} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Incidente</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader><DialogTitle>Registrar Incidente de Dados</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Descrição *</Label><Textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Ocorrido em</Label><Input type="datetime-local" value={form.occurred_at} onChange={e => setForm(f => ({ ...f, occurred_at: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>Titulares afetados</Label><Input type="number" min={0} value={form.affected_subjects} onChange={e => setForm(f => ({ ...f, affected_subjects: e.target.value }))} /></div>
                </div>
                <div className="grid gap-2"><Label>Dados afetados</Label><Input value={form.affected_data} onChange={e => setForm(f => ({ ...f, affected_data: e.target.value }))} placeholder="Ex: nome, CPF, prontuário" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Risco</Label>
                    <Select value={form.risk} onValueChange={v => setForm(f => ({ ...f, risk: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(RISK_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Setor</Label><SectorSelect value={form.sector} onChange={v => setForm(f => ({ ...f, sector: v }))} /></div>
                  <div className="grid gap-2"><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} /></div>
                </div>
                <div className="grid gap-2"><Label>Medidas de contenção</Label><Textarea value={form.containment_measures} onChange={e => setForm(f => ({ ...f, containment_measures: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Medidas corretivas</Label><Textarea value={form.corrective_measures} onChange={e => setForm(f => ({ ...f, corrective_measures: e.target.value }))} /></div>
                <div className="flex items-center gap-3"><Switch checked={form.anpd_notified} onCheckedChange={v => setForm(f => ({ ...f, anpd_notified: v }))} /><Label>Comunicado à ANPD</Label></div>
                <div className="flex items-center gap-3"><Switch checked={form.subjects_notified} onCheckedChange={v => setForm(f => ({ ...f, subjects_notified: v }))} /><Label>Titulares comunicados</Label></div>
                <Button onClick={handleCreate} className="w-full">Registrar Incidente</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: rows.length, color: "text-foreground" },
          { label: "Alto / Crítico", value: highRisk.length, color: "text-destructive" },
          { label: "ANPD pendente", value: pendingAnpd.length, color: "text-warning" },
          { label: "Titulares afetados", value: rows.reduce((s, r) => s + (r.affected_subjects || 0), 0), color: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {pendingAnpd.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <Siren className="mt-0.5 h-5 w-5 text-destructive" />
          <p className="text-sm text-foreground">
            <strong>{pendingAnpd.length}</strong> incidente(s) de risco alto/crítico ainda sem comunicação à ANPD.
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar incidente..." className="pl-10" />
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Incidente</TableHead><TableHead>Detectado</TableHead><TableHead>Risco</TableHead>
            <TableHead>Afetados</TableHead><TableHead>ANPD</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum incidente registrado.</TableCell></TableRow>
            : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-sm font-medium">
                  {r.title}
                  <div className="max-w-[260px] truncate text-xs text-muted-foreground">{r.description}</div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.detected_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge variant={r.risk === "critico" || r.risk === "alto" ? "destructive" : "secondary"} className="gap-1">
                    {(r.risk === "critico" || r.risk === "alto") && <AlertTriangle className="h-3 w-3" />}
                    {RISK_LABELS[r.risk] ?? r.risk}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{r.affected_subjects ?? 0}</TableCell>
                <TableCell>
                  <Button variant={r.anpd_notified ? "ghost" : "outline"} size="sm" onClick={() => toggleAnpd(r)}>
                    {r.anpd_notified ? "Comunicada" : "Marcar comunicação"}
                  </Button>
                </TableCell>
                <TableCell className="text-xs">{STATUS_LABELS[r.status] ?? r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LgpdIncidents;
