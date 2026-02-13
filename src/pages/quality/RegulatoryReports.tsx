import { useEffect, useState } from "react";
import { FileDown, Search, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AdverseEvent {
  id: string; title: string; description: string; event_type: string;
  severity: string; status: string; event_date: string; sector: string | null;
  location: string | null; patient_involved: boolean; patient_outcome: string | null;
  immediate_actions: string | null; reported_by: string; created_at: string;
}

interface RegReport {
  id: string; report_type: string; title: string; period_start: string | null;
  period_end: string | null; records_count: number; created_at: string;
}

const typeLabels: Record<string, string> = {
  evento_adverso: "Evento Adverso", near_miss: "Near Miss",
  incidente: "Incidente", queixa_tecnica: "Queixa Técnica",
};

const severityLabels: Record<string, string> = {
  leve: "Leve", moderado: "Moderado", grave: "Grave", sentinela: "Sentinela",
};

const RegulatoryReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<RegReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEvents, setPreviewEvents] = useState<AdverseEvent[]>([]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [periodStart, setPeriodStart] = useState(sixMonthsAgo.toISOString().split("T")[0]);
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split("T")[0]);
  const [reportType, setReportType] = useState("notivisa");

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("regulatory_reports").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro");
    else setReports((data as any[]) ?? []);
    setLoading(false);
  };

  const fetchEventsForPeriod = async () => {
    const { data, error } = await supabase
      .from("adverse_events")
      .select("*")
      .gte("event_date", periodStart)
      .lte("event_date", periodEnd)
      .order("event_date", { ascending: true });
    if (error) { toast.error("Erro ao carregar eventos"); return []; }
    return (data as AdverseEvent[]) ?? [];
  };

  const handlePreview = async () => {
    const events = await fetchEventsForPeriod();
    setPreviewEvents(events);
    setPreviewOpen(true);
  };

  const generateCSV = (events: AdverseEvent[]) => {
    const headers = [
      "Data Notificação", "Data Evento", "Tipo", "Gravidade", "Título",
      "Descrição", "Setor", "Local", "Paciente Envolvido", "Desfecho Paciente",
      "Ações Imediatas", "Notificado Por", "Status",
    ];
    const rows = events.map(e => [
      new Date(e.created_at).toLocaleDateString("pt-BR"),
      new Date(e.event_date).toLocaleDateString("pt-BR"),
      typeLabels[e.event_type] || e.event_type,
      severityLabels[e.severity] || e.severity,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      e.sector || "",
      e.location || "",
      e.patient_involved ? "Sim" : "Não",
      e.patient_outcome ? `"${e.patient_outcome.replace(/"/g, '""')}"` : "",
      e.immediate_actions ? `"${e.immediate_actions.replace(/"/g, '""')}"` : "",
      e.reported_by,
      e.status,
    ]);
    return [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
  };

  const generateXML = (events: AdverseEvent[]) => {
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<notificacoes xmlns="http://www.anvisa.gov.br/notivisa">',
      `  <periodo_inicio>${periodStart}</periodo_inicio>`,
      `  <periodo_fim>${periodEnd}</periodo_fim>`,
      `  <total_registros>${events.length}</total_registros>`,
      ...events.map(e => [
        '  <notificacao>',
        `    <data_notificacao>${new Date(e.created_at).toISOString()}</data_notificacao>`,
        `    <data_evento>${e.event_date}</data_evento>`,
        `    <tipo>${typeLabels[e.event_type] || e.event_type}</tipo>`,
        `    <gravidade>${severityLabels[e.severity] || e.severity}</gravidade>`,
        `    <titulo><![CDATA[${e.title}]]></titulo>`,
        `    <descricao><![CDATA[${e.description}]]></descricao>`,
        `    <setor>${e.sector || ''}</setor>`,
        `    <local>${e.location || ''}</local>`,
        `    <paciente_envolvido>${e.patient_involved ? 'sim' : 'nao'}</paciente_envolvido>`,
        `    <desfecho_paciente><![CDATA[${e.patient_outcome || ''}]]></desfecho_paciente>`,
        `    <acoes_imediatas><![CDATA[${e.immediate_actions || ''}]]></acoes_imediatas>`,
        `    <notificado_por>${e.reported_by}</notificado_por>`,
        `    <status>${e.status}</status>`,
        '  </notificacao>',
      ].join('\n')),
      '</notificacoes>',
    ].join('\n');
    return xml;
  };

  const handleGenerate = async (format: "csv" | "xml") => {
    if (!user) return;
    setGenerating(true);

    const events = await fetchEventsForPeriod();
    if (events.length === 0) {
      toast.error("Nenhum evento encontrado no período selecionado");
      setGenerating(false);
      return;
    }

    const content = format === "csv" ? generateCSV(events) : generateXML(events);
    const blob = new Blob([content], { type: format === "csv" ? "text/csv;charset=utf-8;" : "application/xml;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}_${periodStart}_${periodEnd}.${format}`;
    link.click();
    URL.revokeObjectURL(url);

    // Log the export
    await supabase.from("regulatory_reports").insert({
      report_type: reportType,
      title: `Relatório ${reportType.toUpperCase()} — ${new Date(periodStart).toLocaleDateString("pt-BR")} a ${new Date(periodEnd).toLocaleDateString("pt-BR")}`,
      period_start: periodStart,
      period_end: periodEnd,
      records_count: events.length,
      exported_data: { format, event_count: events.length, event_types: [...new Set(events.map(e => e.event_type))] },
      generated_by: user.id,
    } as any);

    toast.success(`Relatório ${format.toUpperCase()} gerado com ${events.length} registros`);
    setGenerating(false);
    fetchReports();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Relatórios Regulatórios</h2>
        <p className="text-sm text-muted-foreground">Exportação para NOTIVISA/ANVISA — Eventos Adversos e Queixas Técnicas</p>
      </div>

      {/* Export Controls */}
      <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
          <Calendar className="h-4 w-4" /> Gerar Relatório
        </h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="notivisa">NOTIVISA</SelectItem>
                <SelectItem value="anvisa_tecnovigilancia">Tecnovigilância</SelectItem>
                <SelectItem value="anvisa_farmacovigilancia">Farmacovigilância</SelectItem>
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
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={handlePreview} className="gap-2">
              <Search className="h-4 w-4" /> Pré-visualizar
            </Button>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => handleGenerate("csv")} disabled={generating} className="gap-2">
            <FileDown className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button onClick={() => handleGenerate("xml")} disabled={generating} variant="outline" className="gap-2">
            <FileDown className="h-4 w-4" /> Exportar XML (NOTIVISA)
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Relatórios Gerados", value: reports.length, color: "text-foreground" },
          { label: "NOTIVISA", value: reports.filter(r => r.report_type === "notivisa").length, color: "text-primary" },
          { label: "Total Registros Exportados", value: reports.reduce((acc, r) => acc + r.records_count, 0), color: "text-accent" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Relatório</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Registros</TableHead>
              <TableHead>Data Geração</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : reports.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum relatório gerado ainda.</TableCell></TableRow>
            ) : reports.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell className="text-xs">{r.report_type.toUpperCase()}</TableCell>
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

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Pré-visualização — {previewEvents.length} eventos</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {previewEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento encontrado no período.</p>
            ) : previewEvents.map(e => (
              <div key={e.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{e.title}</p>
                  <span className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="mt-1 flex gap-2 text-[10px]">
                  <span className="rounded-full bg-secondary px-2 py-0.5">{typeLabels[e.event_type]}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5">{severityLabels[e.severity]}</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5">{e.sector || "—"}</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegulatoryReports;
