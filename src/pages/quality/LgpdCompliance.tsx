import { useEffect, useState } from "react";
import { Plus, Search, Shield, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ExportPdfButton from "@/components/ExportPdfButton";
import { generateModuleReport } from "@/lib/pdfReport";
import LgpdRequests from "@/components/lgpd/LgpdRequests";
import LgpdConsents from "@/components/lgpd/LgpdConsents";
import LgpdIncidents from "@/components/lgpd/LgpdIncidents";

interface LgpdMapping {
  id: string; data_category: string; data_type: string; purpose: string;
  legal_basis: string; retention_period: string | null; storage_location: string | null;
  responsible: string | null; sector: string | null; is_sensitive: boolean;
  status: string; notes: string | null; created_at: string;
}

const legalBases = [
  "Consentimento do titular",
  "Obrigação legal ou regulatória",
  "Execução de políticas públicas",
  "Estudos por órgão de pesquisa",
  "Execução de contrato",
  "Exercício regular de direitos",
  "Proteção da vida",
  "Tutela da saúde",
  "Interesses legítimos",
  "Proteção do crédito",
];

const dataCategories = [
  "Dados Pessoais de Pacientes",
  "Dados Pessoais de Colaboradores",
  "Dados de Saúde",
  "Dados Biométricos",
  "Dados de Contato",
  "Dados Financeiros",
  "Dados de Fornecedores",
  "Dados de Visitantes",
  "Imagens / CCTV",
  "Outros",
];

const LgpdCompliance = () => {
  const { user } = useAuth();
  const [mappings, setMappings] = useState<LgpdMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    data_category: "", data_type: "", purpose: "", legal_basis: "",
    retention_period: "", storage_location: "", responsible: "", sector: "",
    is_sensitive: false, notes: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("lgpd_data_mappings").select("*").order("data_category");
    if (!error) setMappings((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.data_category || !form.purpose || !form.legal_basis || !user) { toast.error("Preencha os campos obrigatórios"); return; }
    const { error } = await supabase.from("lgpd_data_mappings").insert({
      ...form, retention_period: form.retention_period || null,
      storage_location: form.storage_location || null, responsible: form.responsible || null,
      sector: form.sector || null, notes: form.notes || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else { toast.success("Mapeamento criado!"); setDialogOpen(false); setForm({ data_category: "", data_type: "", purpose: "", legal_basis: "", retention_period: "", storage_location: "", responsible: "", sector: "", is_sensitive: false, notes: "" }); fetchData(); }
  };

  const filtered = mappings.filter(m => !search || m.data_category.toLowerCase().includes(search.toLowerCase()) || m.data_type.toLowerCase().includes(search.toLowerCase()));
  const sensitiveCount = mappings.filter(m => m.is_sensitive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2"><Shield className="h-6 w-6" /> Conformidade LGPD</h2>
          <p className="text-sm text-muted-foreground">Mapeamento, consentimentos, direitos do titular e incidentes</p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <a href="/portal-lgpd" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Portal do Titular
          </a>
        </Button>
      </div>

      <Tabs defaultValue="mapeamento" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="mapeamento">Mapeamento de Dados</TabsTrigger>
          <TabsTrigger value="solicitacoes">Solicitações do Titular</TabsTrigger>
          <TabsTrigger value="consentimentos">Consentimentos</TabsTrigger>
          <TabsTrigger value="incidentes">Incidentes</TabsTrigger>
        </TabsList>

        <TabsContent value="solicitacoes"><LgpdRequests /></TabsContent>
        <TabsContent value="consentimentos"><LgpdConsents /></TabsContent>
        <TabsContent value="incidentes"><LgpdIncidents /></TabsContent>

        <TabsContent value="mapeamento" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Mapeamento de Dados Pessoais</h3>
          <p className="text-sm text-muted-foreground">Inventário de dados e bases legais (Art. 37 — registro de operações)</p>
        </div>
        <div className="flex gap-2">
        <ExportPdfButton onClick={() => generateModuleReport({
          title: "Relatório de Mapeamento de Dados Pessoais (LGPD)",
          subtitle: "Registro das operações de tratamento — Art. 37 da Lei 13.709/2018",
          kpis: [
            { label: "Total", value: mappings.length },
            { label: "Dados sensíveis", value: sensitiveCount },
            { label: "Categorias", value: new Set(mappings.map(m => m.data_category)).size },
            { label: "Bases legais", value: new Set(mappings.map(m => m.legal_basis)).size },
          ],
          columns: [
            { header: "Categoria", accessor: (r: any) => r.data_category },
            { header: "Tipo", accessor: (r: any) => r.data_type ?? "—" },
            { header: "Finalidade", accessor: (r: any) => r.purpose },
            { header: "Base legal", accessor: (r: any) => r.legal_basis },
            { header: "Setor", accessor: (r: any) => r.sector ?? "—" },
            { header: "Sensível", accessor: (r: any) => r.is_sensitive ? "Sim" : "Não" },
            { header: "Retenção", accessor: (r: any) => r.retention_period ?? "—" },
          ],
          rows: filtered,
          landscape: true,
        })} />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Mapeamento</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle>Mapear Dados Pessoais</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Categoria de Dados *</Label>
                <Select value={form.data_category} onValueChange={v => setForm(f => ({ ...f, data_category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{dataCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Tipo de Dado</Label><Input value={form.data_type} onChange={e => setForm(f => ({ ...f, data_type: e.target.value }))} placeholder="Ex: Nome, CPF, Prontuário..." /></div>
              <div className="grid gap-2"><Label>Finalidade *</Label><Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Para que o dado é coletado?" /></div>
              <div className="grid gap-2">
                <Label>Base Legal *</Label>
                <Select value={form.legal_basis} onValueChange={v => setForm(f => ({ ...f, legal_basis: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{legalBases.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Retenção</Label><Input value={form.retention_period} onChange={e => setForm(f => ({ ...f, retention_period: e.target.value }))} placeholder="Ex: 5 anos" /></div>
                <div className="grid gap-2"><Label>Local de Armazenamento</Label><Input value={form.storage_location} onChange={e => setForm(f => ({ ...f, storage_location: e.target.value }))} placeholder="Ex: Servidor local, Cloud" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_sensitive} onCheckedChange={v => setForm(f => ({ ...f, is_sensitive: v }))} />
                <Label>Dado Sensível (Art. 11 LGPD)</Label>
              </div>
              <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Cadastrar Mapeamento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total Mapeamentos", value: mappings.length, color: "text-foreground" },
          { label: "Dados Sensíveis", value: sensitiveCount, color: "text-destructive" },
          { label: "Categorias", value: new Set(mappings.map(m => m.data_category)).size, color: "text-primary" },
          { label: "Bases Legais", value: new Set(mappings.map(m => m.legal_basis)).size, color: "text-safe" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Categoria</TableHead><TableHead>Tipo</TableHead><TableHead>Finalidade</TableHead>
            <TableHead>Base Legal</TableHead><TableHead>Sensível</TableHead><TableHead>Retenção</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum mapeamento.</TableCell></TableRow>
            : filtered.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-sm">{m.data_category}</TableCell>
                <TableCell className="text-sm">{m.data_type}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{m.purpose}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{m.legal_basis}</Badge></TableCell>
                <TableCell>{m.is_sensitive ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <span className="text-muted-foreground text-xs">Não</span>}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{m.retention_period || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LgpdCompliance;
