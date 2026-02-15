import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import {
  Plus, FileText, Upload, Calendar, AlertTriangle, Clock, Brain,
  Trash2, Download, Search, Filter, RefreshCw, CheckCircle, XCircle
} from "lucide-react";
import { format, differenceInDays, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Contract {
  id: string;
  title: string;
  description: string | null;
  contract_number: string | null;
  counterparty: string | null;
  category: string;
  file_url: string | null;
  file_name: string | null;
  start_date: string;
  duration_months: number;
  end_date: string;
  alert_days_before: number;
  status: string;
  sector: string | null;
  notes: string | null;
  ai_analysis: string | null;
  ai_analyzed_at: string | null;
  created_at: string;
}

const CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "fornecedor", label: "Fornecedor" },
  { value: "prestacao_servico", label: "Prestação de Serviço" },
  { value: "manutencao", label: "Manutenção" },
  { value: "locacao", label: "Locação" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "trabalho", label: "Trabalho" },
  { value: "seguro", label: "Seguro" },
  { value: "outro", label: "Outro" },
];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  vigente: { label: "Vigente", variant: "default" },
  vencendo: { label: "Vencendo", variant: "secondary" },
  vencido: { label: "Vencido", variant: "destructive" },
  renovado: { label: "Renovado", variant: "outline" },
  cancelado: { label: "Cancelado", variant: "outline" },
};

const Contracts = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", contract_number: "", counterparty: "",
    category: "geral", start_date: "", duration_months: "12",
    alert_days_before: "60", sector: "", notes: "",
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("end_date", { ascending: true });
    if (error) { toast.error("Erro ao carregar contratos"); console.error(error); }
    else setContracts((data as any[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const getContractStatus = (contract: Contract) => {
    if (contract.status === "cancelado") return "cancelado";
    if (contract.status === "renovado") return "renovado";
    const daysLeft = differenceInDays(parseISO(contract.end_date), new Date());
    if (daysLeft < 0) return "vencido";
    if (daysLeft <= contract.alert_days_before) return "vencendo";
    return "vigente";
  };

  const handleSubmit = async () => {
    if (!form.title || !form.start_date || !user) return toast.error("Preencha os campos obrigatórios");
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (uploadFile) {
      const ext = uploadFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("contracts").upload(path, uploadFile);
      if (upErr) { toast.error("Erro no upload: " + upErr.message); return; }
      fileUrl = path;
      fileName = uploadFile.name;
    }

    const { error } = await supabase.from("contracts").insert({
      title: form.title,
      description: form.description || null,
      contract_number: form.contract_number || null,
      counterparty: form.counterparty || null,
      category: form.category,
      file_url: fileUrl,
      file_name: fileName,
      start_date: form.start_date,
      duration_months: parseInt(form.duration_months),
      alert_days_before: parseInt(form.alert_days_before),
      sector: form.sector || null,
      notes: form.notes || null,
      created_by: user.id,
    } as any);

    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Contrato cadastrado com sucesso!");
    setDialogOpen(false);
    setForm({ title: "", description: "", contract_number: "", counterparty: "", category: "geral", start_date: "", duration_months: "12", alert_days_before: "60", sector: "", notes: "" });
    setUploadFile(null);
    fetchContracts();
  };

  const handleDownload = async (contract: Contract) => {
    if (!contract.file_url) return;
    const { data, error } = await supabase.storage.from("contracts").createSignedUrl(contract.file_url, 60);
    if (error || !data?.signedUrl) { toast.error("Erro ao gerar link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este contrato?")) return;
    const { error } = await supabase.from("contracts").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Contrato excluído"); fetchContracts(); }
  };

  const handleAiAnalysis = async (contract: Contract) => {
    setSelectedContract(contract);
    setAiAnalysis("");
    setAnalysisOpen(true);
    setAiLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-contract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          contractTitle: contract.title,
          contractDescription: contract.description,
          counterparty: contract.counterparty,
          category: contract.category,
          durationMonths: contract.duration_months,
          notes: contract.notes,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        toast.error(errData.error || "Erro na análise de IA");
        setAiLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { fullText += content; setAiAnalysis(fullText); }
          } catch { /* partial */ }
        }
      }

      // Save analysis to DB
      await supabase.from("contracts").update({
        ai_analysis: fullText,
        ai_analyzed_at: new Date().toISOString(),
      } as any).eq("id", contract.id);

      fetchContracts();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao analisar contrato");
    } finally {
      setAiLoading(false);
    }
  };

  const filtered = contracts.filter(c => {
    const status = getContractStatus(c);
    if (filterStatus !== "all" && status !== filterStatus) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return c.title.toLowerCase().includes(s) || c.counterparty?.toLowerCase().includes(s) || c.contract_number?.toLowerCase().includes(s);
    }
    return true;
  });

  const alerts = contracts.filter(c => {
    const s = getContractStatus(c);
    return s === "vencendo" || s === "vencido";
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Contratos</h1>
          <p className="text-sm text-muted-foreground">Gestão de contratos com alertas de vencimento e análise por IA</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Contrato</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cadastrar Contrato</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Nome do contrato" />
                </div>
                <div className="space-y-2">
                  <Label>Nº do Contrato</Label>
                  <Input value={form.contract_number} onChange={e => setForm(f => ({ ...f, contract_number: e.target.value }))} placeholder="Ex: CT-2025-001" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contraparte</Label>
                  <Input value={form.counterparty} onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))} placeholder="Nome da empresa/pessoa" />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Início da Vigência *</Label>
                  <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Duração (meses)</Label>
                  <Input type="number" min="1" value={form.duration_months} onChange={e => setForm(f => ({ ...f, duration_months: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Alerta (dias antes)</Label>
                  <Input type="number" min="1" value={form.alert_days_before} onChange={e => setForm(f => ({ ...f, alert_days_before: e.target.value }))} />
                </div>
              </div>
              {form.start_date && form.duration_months && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <Calendar className="mr-2 inline h-4 w-4 text-primary" />
                  Vencimento previsto: <strong>{format(addMonths(parseISO(form.start_date), parseInt(form.duration_months)), "dd/MM/yyyy")}</strong>
                </div>
              )}
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="Ex: Administrativo" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o objeto do contrato..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notas adicionais..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Arquivo do Contrato (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                  {uploadFile && <Badge variant="secondary"><Upload className="mr-1 h-3 w-3" />{uploadFile.name}</Badge>}
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">Salvar Contrato</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-5 w-5" /> Alertas de Vencimento ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map(c => {
                const days = differenceInDays(parseISO(c.end_date), new Date());
                return (
                  <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.counterparty} • Vence em {format(parseISO(c.end_date), "dd/MM/yyyy")}</p>
                    </div>
                    <Badge variant={days < 0 ? "destructive" : "secondary"}>
                      {days < 0 ? `Vencido há ${Math.abs(days)} dias` : `${days} dias restantes`}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 text-primary" />
            <div><p className="text-2xl font-bold">{contracts.length}</p><p className="text-xs text-muted-foreground">Total</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <CheckCircle className="h-8 w-8 text-accent" />
            <div><p className="text-2xl font-bold">{contracts.filter(c => getContractStatus(c) === "vigente").length}</p><p className="text-xs text-muted-foreground">Vigentes</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div><p className="text-2xl font-bold">{contracts.filter(c => getContractStatus(c) === "vencendo").length}</p><p className="text-xs text-muted-foreground">Vencendo</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <XCircle className="h-8 w-8 text-destructive" />
            <div><p className="text-2xl font-bold">{contracts.filter(c => getContractStatus(c) === "vencido").length}</p><p className="text-xs text-muted-foreground">Vencidos</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por título, contraparte ou número..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="vigente">Vigentes</SelectItem>
            <SelectItem value="vencendo">Vencendo</SelectItem>
            <SelectItem value="vencido">Vencidos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchContracts}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Contraparte</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum contrato encontrado</TableCell></TableRow>
                ) : filtered.map(c => {
                  const status = getContractStatus(c);
                  const days = differenceInDays(parseISO(c.end_date), new Date());
                  const st = STATUS_MAP[status] || STATUS_MAP.vigente;
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{c.title}</p>
                          {c.contract_number && <p className="text-xs text-muted-foreground">{c.contract_number}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.counterparty || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{CATEGORIES.find(x => x.value === c.category)?.label || c.category}</Badge></TableCell>
                      <TableCell className="text-sm">{format(parseISO(c.start_date), "dd/MM/yy")} <span className="text-muted-foreground">({c.duration_months}m)</span></TableCell>
                      <TableCell className="text-sm">{format(parseISO(c.end_date), "dd/MM/yy")}</TableCell>
                      <TableCell>
                        <Badge variant={st.variant}>{st.label}</Badge>
                        {status === "vencendo" && <p className="mt-1 text-[10px] text-yellow-600">{days} dias</p>}
                        {status === "vencido" && <p className="mt-1 text-[10px] text-destructive">há {Math.abs(days)}d</p>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" title="Análise IA" onClick={() => handleAiAnalysis(c)}>
                            <Brain className="h-4 w-4" />
                          </Button>
                          {c.file_url && (
                            <Button size="sm" variant="ghost" title="Download" onClick={() => handleDownload(c)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" title="Excluir" onClick={() => handleDelete(c.id)} className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* AI Analysis Dialog */}
      <Dialog open={analysisOpen} onOpenChange={setAnalysisOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Análise Jurídica por IA
            </DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="font-medium">{selectedContract.title}</p>
                <p className="text-sm text-muted-foreground">{selectedContract.counterparty} • {selectedContract.category}</p>
              </div>
              <Separator />
              {aiLoading && !aiAnalysis && (
                <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Analisando contrato...
                </div>
              )}
              {aiAnalysis && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                </div>
              )}
              {aiLoading && aiAnalysis && (
                <p className="text-xs text-muted-foreground animate-pulse">Analisando...</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contracts;
