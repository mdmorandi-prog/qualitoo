import { useEffect, useState } from "react";
import { Plus, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ExportPdfButton from "@/components/ExportPdfButton";
import { generateModuleReport } from "@/lib/pdfReport";
import { SectorSelect } from "@/components/SectorSelect";

interface Consent {
  id: string; subject_name: string; subject_document: string | null; subject_email: string | null;
  purpose: string; legal_basis: string | null; channel: string | null; consent_text: string | null;
  sector: string | null; granted_at: string; revoked_at: string | null; notes: string | null;
}

const emptyForm = {
  subject_name: "", subject_document: "", subject_email: "", purpose: "",
  legal_basis: "Consentimento do titular", channel: "", consent_text: "", sector: "", notes: "",
};

const LgpdConsents = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Consent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("lgpd_consents" as any)
      .select("*")
      .order("granted_at", { ascending: false });
    if (error) toast.error("Erro ao carregar consentimentos");
    else setRows((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.subject_name || !form.purpose || !user) { toast.error("Preencha titular e finalidade"); return; }
    const { error } = await supabase.from("lgpd_consents" as any).insert({
      ...form,
      subject_document: form.subject_document || null,
      subject_email: form.subject_email || null,
      channel: form.channel || null,
      consent_text: form.consent_text || null,
      sector: form.sector || null,
      notes: form.notes || null,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao registrar consentimento"); return; }
    toast.success("Consentimento registrado!");
    setDialogOpen(false); setForm(emptyForm); fetchData();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase
      .from("lgpd_consents" as any)
      .update({ revoked_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) { toast.error("Erro ao revogar"); return; }
    toast.success("Consentimento revogado");
    fetchData();
  };

  const filtered = rows.filter(r =>
    !search || r.subject_name.toLowerCase().includes(search.toLowerCase()) ||
    r.purpose.toLowerCase().includes(search.toLowerCase())
  );
  const active = rows.filter(r => !r.revoked_at);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Registro de Consentimentos</h3>
          <p className="text-sm text-muted-foreground">Prova de consentimento livre, informado e inequívoco (Art. 8º)</p>
        </div>
        <div className="flex gap-2">
          <ExportPdfButton onClick={() => generateModuleReport({
            title: "Relatório de Consentimentos (LGPD)",
            subtitle: "Registro de coleta e revogação de consentimentos",
            kpis: [
              { label: "Total", value: rows.length },
              { label: "Ativos", value: active.length },
              { label: "Revogados", value: rows.length - active.length },
              { label: "Titulares", value: new Set(rows.map(r => r.subject_name)).size },
            ],
            columns: [
              { header: "Titular", accessor: (r: any) => r.subject_name },
              { header: "Finalidade", accessor: (r: any) => r.purpose },
              { header: "Base legal", accessor: (r: any) => r.legal_basis ?? "—" },
              { header: "Canal", accessor: (r: any) => r.channel ?? "—" },
              { header: "Setor", accessor: (r: any) => r.sector ?? "—" },
              { header: "Coletado em", accessor: (r: any) => new Date(r.granted_at).toLocaleDateString("pt-BR") },
              { header: "Revogado em", accessor: (r: any) => r.revoked_at ? new Date(r.revoked_at).toLocaleDateString("pt-BR") : "—" },
            ],
            rows: filtered,
            landscape: true,
          })} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Consentimento</Button></DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader><DialogTitle>Registrar Consentimento</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2"><Label>Titular *</Label><Input value={form.subject_name} onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Documento</Label><Input value={form.subject_document} onChange={e => setForm(f => ({ ...f, subject_document: e.target.value }))} placeholder="CPF" /></div>
                  <div className="grid gap-2"><Label>E-mail</Label><Input value={form.subject_email} onChange={e => setForm(f => ({ ...f, subject_email: e.target.value }))} /></div>
                </div>
                <div className="grid gap-2"><Label>Finalidade *</Label><Input value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="Para que o dado será tratado?" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Base legal</Label><Input value={form.legal_basis} onChange={e => setForm(f => ({ ...f, legal_basis: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>Canal de coleta</Label><Input value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} placeholder="Presencial, site, app..." /></div>
                </div>
                <div className="grid gap-2"><Label>Setor</Label><SectorSelect value={form.sector} onChange={v => setForm(f => ({ ...f, sector: v }))} /></div>
                <div className="grid gap-2"><Label>Texto do consentimento</Label><Textarea rows={4} value={form.consent_text} onChange={e => setForm(f => ({ ...f, consent_text: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button onClick={handleCreate} className="w-full">Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: rows.length, color: "text-foreground" },
          { label: "Ativos", value: active.length, color: "text-safe" },
          { label: "Revogados", value: rows.length - active.length, color: "text-destructive" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar titular ou finalidade..." className="pl-10" />
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Titular</TableHead><TableHead>Finalidade</TableHead><TableHead>Canal</TableHead>
            <TableHead>Coletado</TableHead><TableHead>Situação</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum consentimento registrado.</TableCell></TableRow>
            : filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-sm font-medium">{r.subject_name}</TableCell>
                <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground">{r.purpose}</TableCell>
                <TableCell className="text-xs">{r.channel ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(r.granted_at).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  {r.revoked_at
                    ? <Badge variant="destructive" className="gap-1"><ShieldOff className="h-3 w-3" /> Revogado</Badge>
                    : <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Ativo</Badge>}
                </TableCell>
                <TableCell>
                  {!r.revoked_at && <Button variant="ghost" size="sm" onClick={() => revoke(r.id)}>Revogar</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default LgpdConsents;
