import { useEffect, useMemo, useState } from "react";
import { FileDown, Search, ShieldCheck, AlertTriangle, Calendar, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  VIGILANCE_LABELS, buildCsv, buildXml, downloadFile, validateEvents,
  type ValidationResult, type VigilanceClass, type VigilanceEventRecord,
} from "@/lib/notivisa";

interface RegReport {
  id: string; report_type: string; title: string; period_start: string | null;
  period_end: string | null; records_count: number; created_at: string;
}

interface Submission {
  id: string; report_type: string; format: string; period_start: string | null;
  period_end: string | null; records_count: number; validation_status: string;
  validation_errors: any; validation_warnings: any; submission_status: string;
  protocol: string | null; file_name: string | null; notes: string | null; created_at: string;
}

const CLASS_BY_TYPE: Record<string, VigilanceClass> = {
  notivisa: "assistencial",
  vigimed_farmacovigilancia: "farmacovigilancia",
  notivisa_tecnovigilancia: "tecnovigilancia",
  notivisa_hemovigilancia: "hemovigilancia",
};

const TYPE_LABELS: Record<string, string> = {
  notivisa: "NOTIVISA — Assistencial (NSP)",
  vigimed_farmacovigilancia: "VigiMed — Farmacovigilância (E2B R3)",
  notivisa_tecnovigilancia: "NOTIVISA — Tecnovigilância",
  notivisa_hemovigilancia: "NOTIVISA — Hemovigilância",
};

const SUBMISSION_STATUS: Record<string, string> = {
  gerado: "Arquivo gerado",
  enviado: "Enviado à ANVISA",
  aceito: "Aceito",
  rejeitado: "Rejeitado",
};

const RegulatoryReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<RegReport[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [events, setEvents] = useState<VigilanceEventRecord[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [editing, setEditing] = useState<Submission | null>(null);
  const [protocol, setProtocol] = useState("");
  const [subStatus, setSubStatus] = useState("gerado");
  const [notes, setNotes] = useState("");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [periodStart, setPeriodStart] = useState(sixMonthsAgo.toISOString().split("T")[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split("T")[0]);
  const [reportType, setReportType] = useState("vigimed_farmacovigilancia");

  const vigilanceClass = CLASS_BY_TYPE[reportType];

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: reps }, { data: subs }] = await Promise.all([
      supabase.from("regulatory_reports").select("*").order("created_at", { ascending: false }),
      supabase.from("regulatory_submissions").select("*").order("created_at", { ascending: false }),
    ]);
    setReports((reps as any[]) ?? []);
    setSubmissions((subs as any[]) ?? []);
    setLoading(false);
  };

  const fetchEventsForPeriod = async (): Promise<VigilanceEventRecord[]> => {
    const { data, error } = await supabase
      .from("adverse_events")
      .select("*")
      .eq("vigilance_class", vigilanceClass)
      .gte("event_date", periodStart)
      .lte("event_date", periodEnd)
      .order("event_date", { ascending: true });
    if (error) { toast.error("Erro ao carregar notificações"); return []; }
    return (data as any[]) ?? [];
  };

  const handleValidate = async () => {
    const evs = await fetchEventsForPeriod();
    setEvents(evs);
    const result = validateEvents(evs, vigilanceClass);
    setValidation(result);
    setPreviewOpen(true);
    if (evs.length === 0) toast.info("Nenhuma notificação encontrada no período.");
    else if (result.valid) toast.success(`${evs.length} registro(s) válidos conforme o XSD.`);
    else toast.error(`${result.errors.length} erro(s) de conformidade encontrados.`);
  };

  const handleGenerate = async (format: "csv" | "xml") => {
    if (!user) return;
    setGenerating(true);
    try {
      const evs = await fetchEventsForPeriod();
      if (evs.length === 0) { toast.error("Nenhuma notificação no período selecionado"); return; }

      const result = validateEvents(evs, vigilanceClass);
      setEvents(evs);
      setValidation(result);

      if (format === "xml" && !result.valid) {
        setPreviewOpen(true);
        toast.error("Payload bloqueado: corrija os erros de validação antes de gerar o XML oficial.");
        return;
      }

      const content = format === "csv"
        ? buildCsv(evs, vigilanceClass)
        : buildXml(evs, vigilanceClass, { periodStart, periodEnd, senderOrganization: "Qualitoo" });
      const fileName = `${reportType}_${periodStart}_${periodEnd}.${format}`;
      downloadFile(content, fileName, format === "csv" ? "text/csv" : "application/xml");

      const { data: report } = await supabase.from("regulatory_reports").insert({
        report_type: reportType,
        title: `${TYPE_LABELS[reportType]} — ${new Date(periodStart).toLocaleDateString("pt-BR")} a ${new Date(periodEnd).toLocaleDateString("pt-BR")}`,
        period_start: periodStart,
        period_end: periodEnd,
        records_count: evs.length,
        exported_data: { format, event_count: evs.length, vigilance_class: vigilanceClass },
        generated_by: user.id,
      } as any).select("id").maybeSingle();

      await supabase.from("regulatory_submissions").insert({
        report_id: report?.id ?? null,
        report_type: reportType,
        format,
        period_start: periodStart,
        period_end: periodEnd,
        records_count: evs.length,
        validation_status: result.valid ? (result.warnings.length ? "valido_com_avisos" : "valido") : "invalido",
        validation_errors: result.errors as any,
        validation_warnings: result.warnings as any,
        submission_status: "gerado",
        file_name: fileName,
        submitted_by: user.id,
      } as any);

      toast.success(`${format.toUpperCase()} gerado com ${evs.length} registro(s) e submissão registrada.`);
      fetchAll();
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = (s: Submission) => {
    setEditing(s);
    setProtocol(s.protocol ?? "");
    setSubStatus(s.submission_status);
    setNotes(s.notes ?? "");
  };

  const saveSubmission = async () => {
    if (!editing) return;
    const { error } = await supabase.from("regulatory_submissions")
      .update({ protocol: protocol || null, submission_status: subStatus, notes: notes || null } as any)
      .eq("id", editing.id);
    if (error) toast.error("Sem permissão para atualizar (somente administradores).");
    else { toast.success("Submissão atualizada"); setEditing(null); fetchAll(); }
  };

  const errorCount = validation?.errors.length ?? 0;
  const blockedIds = useMemo(() => new Set(validation?.errors.map(e => e.recordId) ?? []), [validation]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Relatórios Regulatórios</h2>
        <p className="text-sm text-muted-foreground">
          Geração conforme schema oficial NOTIVISA / VigiMed (ANVISA), com validação de payload e trilha de submissão
        </p>
      </div>

      <Tabs defaultValue="gerar">
        <TabsList>
          <TabsTrigger value="gerar">Gerar & Validar</TabsTrigger>
          <TabsTrigger value="submissoes">Log de Submissões</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="gerar" className="space-y-6 pt-4">
          <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
              <Calendar className="h-4 w-4" /> Parâmetros de exportação
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="grid gap-2 sm:col-span-2">
                <Label>Sistema / área de vigilância</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Início</Label>
                <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Fim</Label>
                <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Classe de vigilância selecionada: <strong>{VIGILANCE_LABELS[vigilanceClass]}</strong>. O XML é gerado com os
              elementos obrigatórios do XSD correspondente e só é liberado após a validação sem erros.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleValidate} className="gap-2">
                <Search className="h-4 w-4" /> Validar payload
              </Button>
              <Button onClick={() => handleGenerate("xml")} disabled={generating} className="gap-2">
                <FileDown className="h-4 w-4" /> Gerar XML oficial
              </Button>
              <Button onClick={() => handleGenerate("csv")} disabled={generating} variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" /> Exportar CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Relatórios gerados", value: reports.length, color: "text-foreground" },
              { label: "Submissões registradas", value: submissions.length, color: "text-primary" },
              { label: "Aceitas pela ANVISA", value: submissions.filter(s => s.submission_status === "aceito").length, color: "text-safe" },
              { label: "Registros exportados", value: reports.reduce((a, r) => a + r.records_count, 0), color: "text-accent" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="submissoes" className="pt-4">
          <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Validação</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Protocolo</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Nenhuma submissão registrada.</TableCell></TableRow>
                ) : submissions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="max-w-[220px] truncate font-mono text-xs">{s.file_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{TYPE_LABELS[s.report_type] ?? s.report_type}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.period_start ? new Date(s.period_start).toLocaleDateString("pt-BR") : "—"} a {s.period_end ? new Date(s.period_end).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{s.records_count}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] ${
                        s.validation_status === "valido" ? "bg-safe/10 text-safe"
                          : s.validation_status === "valido_com_avisos" ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"}`}>
                        {s.validation_status === "invalido" ? <AlertTriangle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                        {s.validation_status.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{SUBMISSION_STATUS[s.submission_status] ?? s.submission_status}</TableCell>
                    <TableCell className="font-mono text-xs">{s.protocol ?? "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="gap-1" onClick={() => openEdit(s)}>
                        <Send className="h-3.5 w-3.5" /> Registrar envio
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="pt-4">
          <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Relatório</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Geração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum relatório gerado ainda.</TableCell></TableRow>
                ) : reports.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell className="text-xs">{TYPE_LABELS[r.report_type] ?? r.report_type.toUpperCase()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.period_start ? new Date(r.period_start).toLocaleDateString("pt-BR") : "—"} a {r.period_end ? new Date(r.period_end).toLocaleDateString("pt-BR") : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{r.records_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Validation dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              Validação do payload — {events.length} registro(s)
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Registros válidos</p>
              <p className="text-xl font-bold text-safe">{events.length - blockedIds.size}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Erros bloqueantes</p>
              <p className="text-xl font-bold text-destructive">{errorCount}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Avisos</p>
              <p className="text-xl font-bold text-warning">{validation?.warnings.length ?? 0}</p>
            </div>
          </div>

          {validation && validation.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-destructive">Erros de conformidade com o XSD</p>
              {validation.errors.map((e, i) => (
                <div key={i} className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs">
                  <strong>{e.recordTitle}</strong> — {e.field}: {e.message}
                </div>
              ))}
            </div>
          )}

          {validation && validation.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-bold text-warning">Avisos</p>
              {validation.warnings.slice(0, 30).map((e, i) => (
                <div key={i} className="rounded-lg border border-warning/30 bg-warning/5 p-2 text-xs">
                  <strong>{e.recordTitle}</strong> — {e.field}: {e.message}
                </div>
              ))}
            </div>
          )}

          {validation?.valid && (
            <div className="flex items-center gap-2 rounded-lg border border-safe/40 bg-safe/5 p-3 text-sm text-safe">
              <CheckCircle2 className="h-4 w-4" /> Payload em conformidade — liberado para geração do XML oficial.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submission edit dialog */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Registrar envio à ANVISA</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Situação</Label>
              <Select value={subStatus} onValueChange={setSubStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBMISSION_STATUS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Protocolo ANVISA</Label>
              <Input value={protocol} onChange={e => setProtocol(e.target.value)} placeholder="Nº do protocolo retornado pelo sistema" />
            </div>
            <div className="grid gap-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button onClick={saveSubmission}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegulatoryReports;
