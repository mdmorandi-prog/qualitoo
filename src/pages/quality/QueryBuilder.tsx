import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Trash2, Download, Search, Filter } from "lucide-react";
import { toast } from "sonner";

const availableTables = [
  { key: "non_conformities", label: "Não Conformidades", columns: ["id","title","description","severity","status","sector","deadline","created_at"] },
  { key: "quality_indicators", label: "Indicadores", columns: ["id","name","unit","target_value","frequency","sector","is_active","created_at"] },
  { key: "indicator_measurements", label: "Medições", columns: ["id","indicator_id","value","period_date","notes","created_at"] },
  { key: "quality_documents", label: "Documentos", columns: ["id","title","code","category","sector","status","version","created_at"] },
  { key: "audits", label: "Auditorias", columns: ["id","title","audit_type","status","scheduled_date","sector","created_at"] },
  { key: "action_plans", label: "Planos de Ação", columns: ["id","title","status","progress","sector","when_start","when_end","created_at"] },
  { key: "risks", label: "Riscos", columns: ["id","title","category","probability","impact","risk_level","status","sector","created_at"] },
  { key: "trainings", label: "Treinamentos", columns: ["id","title","category","status","training_date","instructor","created_at"] },
  { key: "adverse_events", label: "Eventos Adversos", columns: ["id","title","event_type","severity","status","event_date","sector","created_at"] },
  { key: "capas", label: "CAPAs", columns: ["id","title","capa_type","status","sector","deadline","created_at"] },
  { key: "suppliers", label: "Fornecedores", columns: ["id","name","category","status","criticality","created_at"] },
  { key: "equipment", label: "Equipamentos", columns: ["id","name","category","status","serial_number","sector","created_at"] },
  { key: "change_requests", label: "Mudanças", columns: ["id","title","status","priority","sector","created_at"] },
];

interface QueryFilter {
  column: string;
  operator: string;
  value: string;
}

interface SavedQuery {
  name: string;
  table: string;
  columns: string[];
  filters: QueryFilter[];
  orderBy: string;
  orderDir: string;
}

const operators = [
  { key: "eq", label: "=" },
  { key: "neq", label: "≠" },
  { key: "gt", label: ">" },
  { key: "lt", label: "<" },
  { key: "gte", label: "≥" },
  { key: "lte", label: "≤" },
  { key: "like", label: "Contém" },
];

const QueryBuilder = () => {
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [orderBy, setOrderBy] = useState("");
  const [orderDir, setOrderDir] = useState("desc");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultColumns, setResultColumns] = useState<string[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(() => {
    const stored = localStorage.getItem("sgq_saved_queries");
    return stored ? JSON.parse(stored) : [];
  });
  const [queryName, setQueryName] = useState("");

  const tableConfig = availableTables.find(t => t.key === selectedTable);

  const handleTableChange = (table: string) => {
    setSelectedTable(table);
    setSelectedColumns([]);
    setFilters([]);
    setOrderBy("");
    setResults([]);
  };

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const addFilter = () => {
    if (!tableConfig) return;
    setFilters(prev => [...prev, { column: tableConfig.columns[0], operator: "eq", value: "" }]);
  };

  const removeFilter = (idx: number) => {
    setFilters(prev => prev.filter((_, i) => i !== idx));
  };

  const executeQuery = async () => {
    if (!selectedTable) { toast.error("Selecione uma tabela"); return; }
    setLoading(true);
    try {
      const cols = selectedColumns.length > 0 ? selectedColumns.join(",") : "*";
      let query = supabase.from(selectedTable as any).select(cols);

      for (const f of filters) {
        if (!f.value) continue;
        switch (f.operator) {
          case "eq": query = query.eq(f.column, f.value); break;
          case "neq": query = query.neq(f.column, f.value); break;
          case "gt": query = query.gt(f.column, f.value); break;
          case "lt": query = query.lt(f.column, f.value); break;
          case "gte": query = query.gte(f.column, f.value); break;
          case "lte": query = query.lte(f.column, f.value); break;
          case "like": query = query.ilike(f.column, `%${f.value}%`); break;
        }
      }

      if (orderBy) query = query.order(orderBy, { ascending: orderDir === "asc" });

      const { data, error } = await query.limit(500);
      if (error) throw error;

      setResults(data ?? []);
      if (data && data.length > 0) setResultColumns(Object.keys(data[0]));
      else setResultColumns(selectedColumns.length > 0 ? selectedColumns : tableConfig?.columns ?? []);
      toast.success(`${(data ?? []).length} resultado(s)`);
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
    setLoading(false);
  };

  const exportResults = (format: "csv" | "json") => {
    if (results.length === 0) return;
    if (format === "csv") {
      const headers = resultColumns.join(";");
      const rows = results.map(r => resultColumns.map(c => {
        const v = r[c];
        if (v === null || v === undefined) return "";
        if (typeof v === "object") return JSON.stringify(v);
        return String(v).replace(/;/g, ",");
      }).join(";"));
      const blob = new Blob(["\uFEFF" + [headers, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `query_${selectedTable}.csv`);
    } else {
      const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
      downloadBlob(blob, `query_${selectedTable}.json`);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const saveQuery = () => {
    if (!queryName || !selectedTable) return;
    const q: SavedQuery = { name: queryName, table: selectedTable, columns: selectedColumns, filters, orderBy, orderDir };
    const updated = [...savedQueries, q];
    setSavedQueries(updated);
    localStorage.setItem("sgq_saved_queries", JSON.stringify(updated));
    setQueryName("");
    toast.success("Consulta salva!");
  };

  const loadQuery = (q: SavedQuery) => {
    setSelectedTable(q.table);
    setSelectedColumns(q.columns);
    setFilters(q.filters);
    setOrderBy(q.orderBy);
    setOrderDir(q.orderDir);
  };

  const deleteQuery = (idx: number) => {
    const updated = savedQueries.filter((_, i) => i !== idx);
    setSavedQueries(updated);
    localStorage.setItem("sgq_saved_queries", JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Construtor de Consultas</h2>
        <p className="text-sm text-muted-foreground">Crie consultas personalizadas para análise de dados</p>
      </div>

      {/* Saved Queries */}
      {savedQueries.length > 0 && (
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-sm">Consultas Salvas</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {savedQueries.map((q, i) => (
              <div key={i} className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => loadQuery(q)} className="gap-1 text-xs">
                  <Search className="h-3 w-3" /> {q.name}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteQuery(i)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Query Config */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3"><CardTitle className="flex items-center gap-2 text-sm"><Filter className="h-4 w-4" /> Configuração</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Módulo / Tabela</Label>
              <Select value={selectedTable} onValueChange={handleTableChange}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {availableTables.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {tableConfig && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Colunas</Label>
                  <div className="flex flex-wrap gap-1">
                    {tableConfig.columns.map(col => (
                      <Badge
                        key={col}
                        variant={selectedColumns.includes(col) ? "default" : "outline"}
                        className="cursor-pointer text-[10px]"
                        onClick={() => toggleColumn(col)}
                      >
                        {col}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{selectedColumns.length === 0 ? "Todas" : `${selectedColumns.length} selecionada(s)`}</p>
                </div>

                {/* Filters */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Filtros</Label>
                    <Button variant="ghost" size="sm" onClick={addFilter} className="h-6 gap-1 text-[10px]"><Plus className="h-3 w-3" /> Filtro</Button>
                  </div>
                  {filters.map((f, i) => (
                    <div key={i} className="flex gap-1">
                      <Select value={f.column} onValueChange={v => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, column: v } : ff))}>
                        <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{tableConfig.columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={f.operator} onValueChange={v => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, operator: v } : ff))}>
                        <SelectTrigger className="h-8 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{operators.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input value={f.value} onChange={e => setFilters(prev => prev.map((ff, ii) => ii === i ? { ...ff, value: e.target.value } : ff))} className="h-8 text-[10px]" placeholder="Valor" />
                      <Button variant="ghost" size="sm" onClick={() => removeFilter(i)} className="h-8 w-8 p-0"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>

                {/* Order */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Ordenar por</Label>
                    <Select value={orderBy} onValueChange={setOrderBy}>
                      <SelectTrigger className="h-8 text-[10px]"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{tableConfig.columns.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Direção</Label>
                    <Select value={orderDir} onValueChange={setOrderDir}>
                      <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente ↑</SelectItem>
                        <SelectItem value="desc">Decrescente ↓</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={executeQuery} disabled={loading} className="w-full gap-2">
                  <Play className="h-4 w-4" /> {loading ? "Executando..." : "Executar Consulta"}
                </Button>

                {/* Save */}
                <div className="flex gap-1">
                  <Input value={queryName} onChange={e => setQueryName(e.target.value)} placeholder="Nome da consulta..." className="h-8 text-xs" />
                  <Button variant="outline" size="sm" onClick={saveQuery} disabled={!queryName} className="h-8 text-xs">Salvar</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-sm">Resultados ({results.length})</CardTitle>
            {results.length > 0 && (
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => exportResults("csv")} className="h-7 gap-1 text-[10px]"><Download className="h-3 w-3" /> CSV</Button>
                <Button variant="outline" size="sm" onClick={() => exportResults("json")} className="h-7 gap-1 text-[10px]"><Download className="h-3 w-3" /> JSON</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Execute uma consulta para ver os resultados</p>
            ) : (
              <div className="max-h-[500px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>{resultColumns.map(c => <TableHead key={c} className="text-[10px] font-bold">{c}</TableHead>)}</TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.slice(0, 100).map((row, i) => (
                      <TableRow key={i}>
                        {resultColumns.map(c => (
                          <TableCell key={c} className="max-w-[200px] truncate text-[11px]">
                            {row[c] === null ? <span className="text-muted-foreground/50">null</span> : typeof row[c] === "object" ? JSON.stringify(row[c]) : String(row[c])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {results.length > 100 && <p className="p-2 text-center text-[10px] text-muted-foreground">Mostrando 100 de {results.length} resultados</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QueryBuilder;
