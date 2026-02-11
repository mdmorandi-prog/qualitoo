import { useEffect, useState } from "react";
import { Plus, Search, Eye, FileCheck, FileClock, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type DocStatus = "rascunho" | "em_revisao" | "aprovado" | "obsoleto";

interface Doc {
  id: string; title: string; code: string | null; description: string | null;
  category: string | null; sector: string | null; version: number;
  status: DocStatus; content: string | null; valid_until: string | null; created_at: string;
}

const statusConfig: Record<DocStatus, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  em_revisao: { label: "Em Revisão", color: "bg-warning/10 text-warning" },
  aprovado: { label: "Aprovado", color: "bg-safe/10 text-safe" },
  obsoleto: { label: "Obsoleto", color: "bg-destructive/10 text-destructive" },
};

const Documents = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", code: "", description: "", category: "", sector: "", content: "", valid_until: "",
  });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("quality_documents").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar");
    else setDocs((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const { error } = await supabase.from("quality_documents").insert({
      title: form.title, code: form.code || null, description: form.description || null,
      category: form.category || null, sector: form.sector || null,
      content: form.content || null, valid_until: form.valid_until || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar"); console.error(error); }
    else { toast.success("Documento criado!"); setDialogOpen(false); setForm({ title: "", code: "", description: "", category: "", sector: "", content: "", valid_until: "" }); fetch(); }
  };

  const updateStatus = async (id: string, status: DocStatus) => {
    const update: any = { status };
    if (status === "aprovado") { update.approved_by = user?.id; update.approved_at = new Date().toISOString(); }
    const { error } = await supabase.from("quality_documents").update(update).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Status atualizado"); fetch(); }
  };

  const filtered = docs
    .filter(d => filterStatus === "all" || d.status === filterStatus)
    .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.code && d.code.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Controle de Documentos</h2>
          <p className="text-sm text-muted-foreground">Gestão de procedimentos, políticas e manuais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Documento</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Criar Documento</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Código</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="POP-001" /></div>
                <div className="grid gap-2"><Label>Validade</Label><Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="POP, Manual, IT..." /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Conteúdo</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="min-h-[150px]" placeholder="Conteúdo do documento..." /></div>
              <Button onClick={handleCreate} className="w-full">Criar Documento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: docs.length, color: "text-foreground" },
          { label: "Aprovados", value: docs.filter(d => d.status === "aprovado").length, color: "text-safe" },
          { label: "Em Revisão", value: docs.filter(d => d.status === "em_revisao").length, color: "text-warning" },
          { label: "Obsoletos", value: docs.filter(d => d.status === "obsoleto").length, color: "text-destructive" },
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
            <TableHead>Código</TableHead><TableHead>Título</TableHead><TableHead>Versão</TableHead><TableHead>Status</TableHead><TableHead>Validade</TableHead><TableHead>Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum documento.</TableCell></TableRow>
            : filtered.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs font-semibold">{d.code || "—"}</TableCell>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell className="text-sm">v{d.version}</TableCell>
                <TableCell>
                  <Select value={d.status} onValueChange={v => updateStatus(d.id, v as DocStatus)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{d.valid_until ? new Date(d.valid_until).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelected(d); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{selected?.code ? `${selected.code} - ` : ""}{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex gap-3 text-sm">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig[selected.status].color}`}>{statusConfig[selected.status].label}</span>
                <span className="text-muted-foreground">Versão {selected.version}</span>
                {selected.valid_until && <span className="text-muted-foreground">Validade: {new Date(selected.valid_until).toLocaleDateString("pt-BR")}</span>}
              </div>
              {selected.description && <div className="rounded-lg bg-secondary/50 p-3"><p className="text-sm text-foreground">{selected.description}</p></div>}
              {selected.content && <div className="rounded-lg border p-4"><pre className="whitespace-pre-wrap text-sm text-foreground">{selected.content}</pre></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents;
