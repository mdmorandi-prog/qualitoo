import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, FileJson, FileSpreadsheet, Database, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const modules = [
  { key: "non_conformities", label: "Não Conformidades" },
  { key: "quality_indicators", label: "Indicadores" },
  { key: "indicator_measurements", label: "Medições de Indicadores" },
  { key: "quality_documents", label: "Documentos" },
  { key: "audits", label: "Auditorias" },
  { key: "audit_findings", label: "Achados de Auditoria" },
  { key: "action_plans", label: "Planos de Ação" },
  { key: "risks", label: "Riscos" },
  { key: "trainings", label: "Treinamentos" },
  { key: "adverse_events", label: "Eventos Adversos" },
  { key: "capas", label: "CAPAs" },
  { key: "meeting_minutes", label: "Atas de Reunião" },
  { key: "suppliers", label: "Fornecedores" },
  { key: "supplier_evaluations", label: "Avaliações de Fornecedores" },
  { key: "satisfaction_surveys", label: "Pesquisas de Satisfação" },
  { key: "survey_responses", label: "Respostas de Pesquisa" },
  { key: "equipment", label: "Equipamentos" },
  { key: "calibrations", label: "Calibrações" },
  { key: "change_requests", label: "Gestão de Mudanças" },
  { key: "competencies", label: "Competências" },
  { key: "competency_evaluations", label: "Avaliações de Competência" },
];

const DataExport = () => {
  const [selectedModule, setSelectedModule] = useState("");
  const [format, setFormat] = useState("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportLog, setExportLog] = useState<{ module: string; format: string; count: number; date: string }[]>([]);

  const handleExport = async () => {
    if (!selectedModule) return toast.error("Selecione um módulo");
    setExporting(true);

    try {
      let query = supabase.from(selectedModule as any).select("*");
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate + "T23:59:59");

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) { toast.warning("Nenhum dado encontrado"); setExporting(false); return; }

      const moduleLabel = modules.find(m => m.key === selectedModule)?.label ?? selectedModule;

      if (format === "csv") {
        const headers = Object.keys(data[0]);
        const csvContent = [
          headers.join(";"),
          ...data.map(row => headers.map(h => {
            const val = (row as any)[h];
            if (val === null || val === undefined) return "";
            if (typeof val === "object") return JSON.stringify(val).replace(/;/g, ",");
            return String(val).replace(/;/g, ",");
          }).join(";"))
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        downloadBlob(blob, `${selectedModule}_export.csv`);
      } else {
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        downloadBlob(blob, `${selectedModule}_export.json`);
      }

      setExportLog(prev => [{ module: moduleLabel, format, count: data.length, date: new Date().toLocaleString("pt-BR") }, ...prev]);
      toast.success(`${data.length} registro(s) exportado(s)`);
    } catch (err: any) {
      toast.error("Erro na exportação: " + err.message);
    }
    setExporting(false);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Integração BI / Exportação de Dados</h2>
        <p className="text-sm text-muted-foreground">Exporte dados para Power BI, Google Data Studio ou outras ferramentas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" /> Configurar Exportação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Módulo</label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger><SelectValue placeholder="Selecione o módulo" /></SelectTrigger>
                <SelectContent>
                  {modules.map(m => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Formato</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Excel / Power BI)</SelectItem>
                  <SelectItem value="json">JSON (API / Data Studio)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Filtro por Data</label>
              <div className="flex gap-1">
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs" />
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs" />
              </div>
            </div>
          </div>

          <Button onClick={handleExport} disabled={exporting} className="gap-2">
            {format === "csv" ? <FileSpreadsheet className="h-4 w-4" /> : <FileJson className="h-4 w-4" />}
            {exporting ? "Exportando..." : "Exportar Dados"}
          </Button>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <FileSpreadsheet className="mb-2 h-8 w-8 text-emerald-500" />
            <h3 className="font-medium">Power BI</h3>
            <p className="mt-1 text-xs text-muted-foreground">Exporte em CSV e importe via "Obter Dados → Texto/CSV" no Power BI Desktop.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <FileJson className="mb-2 h-8 w-8 text-blue-500" />
            <h3 className="font-medium">Google Data Studio</h3>
            <p className="mt-1 text-xs text-muted-foreground">Use CSV para upload direto ou JSON para integração via Google Sheets.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Download className="mb-2 h-8 w-8 text-primary" />
            <h3 className="font-medium">Excel</h3>
            <p className="mt-1 text-xs text-muted-foreground">Arquivos CSV podem ser abertos diretamente no Excel com separador ponto-e-vírgula.</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Log */}
      {exportLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Histórico de Exportações (sessão)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportLog.map((log, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="font-medium">{log.module}</span>
                  <Badge variant="outline" className="text-[10px]">{log.format.toUpperCase()}</Badge>
                  <span className="text-muted-foreground">{log.count} registros</span>
                  <span className="text-xs text-muted-foreground">{log.date}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataExport;
