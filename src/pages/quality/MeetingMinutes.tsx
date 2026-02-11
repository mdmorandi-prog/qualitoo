import { useEffect, useState } from "react";
import { Plus, Search, Eye } from "lucide-react";
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

interface Meeting {
  id: string; title: string; meeting_date: string; meeting_type: string | null;
  location: string | null; status: string; participants: string | null;
  agenda: string | null; discussions: string | null; decisions: string | null;
  action_items: string | null; next_meeting: string | null; created_at: string;
}

const MeetingMinutes = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Meeting | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", meeting_date: new Date().toISOString().split("T")[0], meeting_type: "comite_qualidade",
    location: "", participants: "", agenda: "",
  });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("meeting_minutes").select("*").order("meeting_date", { ascending: false });
    if (error) toast.error("Erro");
    else setMeetings((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const { error } = await supabase.from("meeting_minutes").insert({
      title: form.title, meeting_date: form.meeting_date, meeting_type: form.meeting_type,
      location: form.location || null, participants: form.participants || null,
      agenda: form.agenda || null, created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else { toast.success("Ata criada!"); setDialogOpen(false); setForm({ title: "", meeting_date: new Date().toISOString().split("T")[0], meeting_type: "comite_qualidade", location: "", participants: "", agenda: "" }); fetch(); }
  };

  const updateField = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("meeting_minutes").update({ [field]: value } as any).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Salvo"); fetch(); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("meeting_minutes").update({ status } as any).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Atualizado"); fetch(); }
  };

  const filtered = meetings.filter(m => !search || m.title.toLowerCase().includes(search.toLowerCase()));

  const typeLabels: Record<string, string> = {
    comite_qualidade: "Comitê de Qualidade", reuniao_setor: "Reunião de Setor",
    analise_critica: "Análise Crítica", outro: "Outro",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-display text-2xl font-bold text-foreground">Atas de Reunião</h2><p className="text-sm text-muted-foreground">Registro de deliberações e encaminhamentos</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nova Ata</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Criar Ata de Reunião</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Data *</Label><Input type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Tipo</Label>
                  <Select value={form.meeting_type} onValueChange={v => setForm(f => ({ ...f, meeting_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comite_qualidade">Comitê de Qualidade</SelectItem>
                      <SelectItem value="reuniao_setor">Reunião de Setor</SelectItem>
                      <SelectItem value="analise_critica">Análise Crítica</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2"><Label>Local</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Participantes</Label><Textarea value={form.participants} onChange={e => setForm(f => ({ ...f, participants: e.target.value }))} placeholder="Lista de participantes..." /></div>
              <div className="grid gap-2"><Label>Pauta</Label><Textarea value={form.agenda} onChange={e => setForm(f => ({ ...f, agenda: e.target.value }))} placeholder="Itens da pauta..." /></div>
              <Button onClick={handleCreate} className="w-full">Criar Ata</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Tipo</TableHead><TableHead>Data</TableHead><TableHead>Status</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma ata.</TableCell></TableRow>
            : filtered.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell className="text-sm">{typeLabels[m.meeting_type ?? "outro"] ?? m.meeting_type}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(m.meeting_date).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <Select value={m.status} onValueChange={v => updateStatus(m.id, v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="aprovada">Aprovada</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelected(m); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">Tipo</span><span className="font-medium">{typeLabels[selected.meeting_type ?? "outro"]}</span></div>
                <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">Data</span><span className="font-medium">{new Date(selected.meeting_date).toLocaleDateString("pt-BR")}</span></div>
                <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-muted-foreground">Local</span><span className="font-medium">{selected.location || "—"}</span></div>
              </div>
              {selected.participants && <div className="rounded-lg bg-secondary/50 p-3"><p className="mb-1 text-xs font-semibold text-muted-foreground">Participantes</p><p className="text-sm">{selected.participants}</p></div>}
              {selected.agenda && <div className="rounded-lg bg-secondary/50 p-3"><p className="mb-1 text-xs font-semibold text-muted-foreground">Pauta</p><p className="text-sm whitespace-pre-wrap">{selected.agenda}</p></div>}
              <div className="grid gap-3">
                <div className="grid gap-2"><Label className="text-xs font-semibold">Discussões</Label><Textarea defaultValue={selected.discussions ?? ""} onBlur={e => updateField(selected.id, "discussions", e.target.value)} placeholder="O que foi discutido..." /></div>
                <div className="grid gap-2"><Label className="text-xs font-semibold">Decisões</Label><Textarea defaultValue={selected.decisions ?? ""} onBlur={e => updateField(selected.id, "decisions", e.target.value)} placeholder="Decisões tomadas..." /></div>
                <div className="grid gap-2"><Label className="text-xs font-semibold">Encaminhamentos</Label><Textarea defaultValue={selected.action_items ?? ""} onBlur={e => updateField(selected.id, "action_items", e.target.value)} placeholder="Ações e responsáveis..." /></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingMinutes;
