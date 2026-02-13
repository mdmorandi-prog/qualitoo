import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const importModules = [
  { key: "non_conformities", label: "Não Conformidades", requiredCols: ["title", "description", "severity"], optionalCols: ["sector", "deadline", "status"] },
  { key: "quality_indicators", label: "Indicadores", requiredCols: ["name", "target_value", "unit"], optionalCols: ["frequency", "sector", "description"] },
  { key: "risks", label: "Riscos", requiredCols: ["title", "probability", "impact"], optionalCols: ["description", "category", "sector", "current_controls"] },
  { key: "trainings", label: "Treinamentos", requiredCols: ["title"], optionalCols: ["category", "instructor", "training_date", "duration_hours", "sector"] },
  { key: "suppliers", label: "Fornecedores", requiredCols: ["name"], optionalCols: ["category", "cnpj", "contact_name", "contact_email", "contact_phone"] },
  { key: "equipment", label: "Equipamentos", requiredCols: ["name"], optionalCols: ["serial_number", "manufacturer", "model", "category", "sector", "location"] },
];

const BulkImport = () => {
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState("");
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const moduleConfig = importModules.find(m => m.key === selectedModule);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { toast.error("Arquivo vazio ou sem dados"); return; }

    const separator = lines[0].includes(";") ? ";" : ",";
    const hdrs = lines[0].split(separator).map(h => h.replace(/"/g, "").trim().toLowerCase());
    setHeaders(hdrs);

    const rows = lines.slice(1).map(line => {
      const vals = line.split(separator).map(v => v.replace(/"/g, "").trim());
      const row: Record<string, string> = {};
      hdrs.forEach((h, i) => { row[h] = vals[i] || ""; });
      return row;
    });

    setParsedData(rows);
    toast.success(`${rows.length} linha(s) carregada(s)`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImport = async () => {
    if (!selectedModule || !user || parsedData.length === 0) return;
    setImporting(true);
    let success = 0;
    let errors = 0;

    for (const row of parsedData) {
      const record: any = { ...row };

      // Add required fields
      if (["non_conformities", "risks", "trainings", "suppliers", "equipment"].includes(selectedModule)) {
        record.created_by = user.id;
      }
      if (selectedModule === "risks") {
        record.probability = Number(record.probability) || 3;
        record.impact = Number(record.impact) || 3;
        record.risk_level = record.probability * record.impact;
      }
      if (selectedModule === "quality_indicators") {
        record.target_value = Number(record.target_value) || 0;
      }

      // Remove empty strings
      for (const key of Object.keys(record)) {
        if (record[key] === "") record[key] = null;
      }

      const { error } = await supabase.from(selectedModule as any).insert(record);
      if (error) { errors++; console.error("Import row error:", error); }
      else success++;
    }

    setImportResult({ success, errors });
    setImporting(false);
    if (errors === 0) toast.success(`${success} registro(s) importado(s) com sucesso!`);
    else toast.warning(`${success} importado(s), ${errors} erro(s)`);
  };

  const downloadTemplate = () => {
    if (!moduleConfig) return;
    const allCols = [...moduleConfig.requiredCols, ...moduleConfig.optionalCols];
    const csv = allCols.join(";") + "\n" + allCols.map(() => "").join(";");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `template_${selectedModule}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2"><Upload className="h-6 w-6" /> Importação em Massa</h2>
        <p className="text-sm text-muted-foreground">Importe dados de planilhas CSV para qualquer módulo</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Configurar Importação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Módulo de Destino</label>
              <Select value={selectedModule} onValueChange={v => { setSelectedModule(v); setParsedData([]); setImportResult(null); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o módulo..." /></SelectTrigger>
                <SelectContent>{importModules.map(m => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {moduleConfig && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Template</label>
                <Button variant="outline" onClick={downloadTemplate} className="w-full gap-2">
                  <Download className="h-4 w-4" /> Baixar Template CSV
                </Button>
              </div>
            )}
          </div>

          {moduleConfig && (
            <>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-bold text-muted-foreground mb-1">Colunas obrigatórias:</p>
                <div className="flex flex-wrap gap-1">
                  {moduleConfig.requiredCols.map(c => <Badge key={c} variant="default" className="text-[10px]">{c}</Badge>)}
                  {moduleConfig.optionalCols.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
                </div>
              </div>

              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
                <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Arraste ou selecione um arquivo CSV</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => fileRef.current?.click()}>
                  Selecionar Arquivo
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Preview ({parsedData.length} linhas)</CardTitle>
            <Button onClick={handleImport} disabled={importing} className="gap-2">
              <Upload className="h-4 w-4" /> {importing ? "Importando..." : `Importar ${parsedData.length} registros`}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>{headers.map(h => <TableHead key={h} className="text-[10px] font-bold">{h}</TableHead>)}</TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.slice(0, 20).map((row, i) => (
                    <TableRow key={i}>
                      {headers.map(h => <TableCell key={h} className="text-[11px] max-w-[150px] truncate">{row[h] || <span className="text-muted-foreground/50">—</span>}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedData.length > 20 && <p className="p-2 text-center text-[10px] text-muted-foreground">Mostrando 20 de {parsedData.length}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {importResult && (
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            {importResult.errors === 0 ? (
              <CheckCircle2 className="h-8 w-8 text-safe" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-warning" />
            )}
            <div>
              <p className="font-bold text-foreground">{importResult.success} registro(s) importado(s)</p>
              {importResult.errors > 0 && <p className="text-sm text-destructive">{importResult.errors} erro(s) — verifique o console para detalhes</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkImport;
