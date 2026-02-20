import { useEffect, useState } from "react";
import { Plus, Search, Calendar, Mail, ToggleLeft, ToggleRight, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { exportDashboardPdf } from "@/lib/exportPdf";

interface ScheduledReport {
  id: string; title: string; report_type: string; frequency: string;
  recipients: string[]; last_sent_at: string | null; next_send_at: string | null;
  is_active: boolean; include_modules: string[]; created_at: string;
}

const moduleOptions = [
  { key: "ncs", label: "Não Conformidades" },
  { key: "indicadores", label: "Indicadores" },
  { key: "documentos", label: "Documentos" },
  { key: "auditorias", label: "Auditorias" },
  { key: "planos", label: "Planos de Ação" },
  { key: "riscos", label: "Riscos" },
  { key: "treinamentos", label: "Treinamentos" },
  { key: "eventos", label: "Eventos Adversos" },
  { key: "capa", label: "CAPA" },
  { key: "fornecedores", label: "Fornecedores" },
];

const ScheduledReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", report_type: "dashboard", frequency: "semanal",
    recipients: "", include_modules: [] as string[],
  });

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data } = await supabase.from("scheduled_reports").select("*").order("created_at", { ascending: false });
    setReports((data as any[]) ?? []);
    setLoading(false);
  };

  const calculateNextSend = (frequency: string): string => {
    const now = new Date();
    switch (frequency) {
      case "diario": now.setDate(now.getDate() + 1); break;
      case "semanal": now.setDate(now.getDate() + 7); break;
      case "quinzenal": now.setDate(now.getDate() + 15); break;
      case "mensal": now.setMonth(now.getMonth() + 1); break;
      case "trimestral": now.setMonth(now.getMonth() + 3); break;
      default: now.setDate(now.getDate() + 7);
    }
    return now.toISOString();
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const recipients = form.recipients.split(",").map(r => r.trim()).filter(Boolean);
    if (recipients.length === 0) { toast.error("Informe ao menos 1 destinatário"); return; }

    const { error } = await supabase.from("scheduled_reports").insert({
      title: form.title, report_type: form.report_type, frequency: form.frequency,
      recipients, include_modules: form.include_modules,
      next_send_at: calculateNextSend(form.frequency), created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); return; }
    toast.success("Relatório agendado!");
    setDialogOpen(false);
    setForm({ title: "", report_type: "dashboard", frequency: "semanal", recipients: "", include_modules: [] });
    fetchReports();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("scheduled_reports").update({ is_active: !current } as any).eq("id", id);
    toast.success(!current ? "Ativado" : "Desativado");
    fetchReports();
  };

  const deleteReport = async (id: string) => {
    await supabase.from("scheduled_reports").delete().eq("id", id);
    toast.success("Relatório removido");
    fetchReports();
  };

  const toggleModule = (mod: string) => {
    setForm(f => ({
      ...f,
      include_modules: f.include_modules.includes(mod)
        ? f.include_modules.filter(m => m !== mod)
        : [...f.include_modules, mod],
    }));
  };

  const freqLabels: Record<string, string> = {
    diario: "Diário", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", trimestral: "Trimestral",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Relatórios Agendados</h2>
          <p className="text-sm text-muted-foreground">Envio automático de relatórios por e-mail</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportDashboardPdf}>
            <Download className="h-4 w-4" /> Exportar Agora
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Agendamento</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader><DialogTitle>Agendar Relatório</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Relatório Semanal Qualitoo" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Tipo</Label>
                    <Select value={form.report_type} onValueChange={v => setForm(f => ({ ...f, report_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard Completo</SelectItem>
                        <SelectItem value="ncs">Não Conformidades</SelectItem>
                        <SelectItem value="indicadores">Indicadores</SelectItem>
                        <SelectItem value="personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2"><Label>Frequência</Label>
                    <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Destinatários (separados por vírgula) *</Label>
                  <Input value={form.recipients} onChange={e => setForm(f => ({ ...f, recipients: e.target.value }))} placeholder="email1@hospital.com, email2@hospital.com" />
                </div>
                {form.report_type === "personalizado" && (
                  <div className="grid gap-2">
                    <Label>Módulos a incluir</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {moduleOptions.map(m => (
                        <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox checked={form.include_modules.includes(m.key)} onCheckedChange={() => toggleModule(m.key)} />
                          {m.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <Button onClick={handleCreate}>Agendar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: reports.length, color: "text-foreground" },
          { label: "Ativos", value: reports.filter(r => r.is_active).length, color: "text-safe" },
          { label: "Inativos", value: reports.filter(r => !r.is_active).length, color: "text-muted-foreground" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Relatório</TableHead><TableHead>Frequência</TableHead><TableHead>Destinatários</TableHead><TableHead>Próximo Envio</TableHead><TableHead>Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : reports.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum relatório agendado.</TableCell></TableRow>
            : reports.map(r => (
              <TableRow key={r.id} className={!r.is_active ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{r.title}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{r.report_type}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{freqLabels[r.frequency]}</Badge></TableCell>
                <TableCell className="text-xs">{r.recipients.join(", ")}</TableCell>
                <TableCell className="text-xs">{r.next_send_at ? new Date(r.next_send_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleActive(r.id, r.is_active)} title={r.is_active ? "Desativar" : "Ativar"}>
                      {r.is_active ? <ToggleRight className="h-4 w-4 text-safe" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteReport(r.id)} className="text-destructive">✕</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ScheduledReports;
