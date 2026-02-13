import { useEffect, useState } from "react";
import { Plus, Search, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
          <p className="text-sm text-muted-foreground">Mapeamento de dados pessoais e bases legais</p>
        </div>
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
