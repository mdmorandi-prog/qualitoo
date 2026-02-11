import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
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

interface Training {
  id: string; title: string; description: string | null; category: string | null;
  sector: string | null; instructor: string | null; training_date: string | null;
  expiry_date: string | null; duration_hours: number | null;
  participants_count: number | null; status: string; materials: string | null; created_at: string;
}

const Trainings = () => {
  const { user } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", category: "", sector: "", instructor: "",
    training_date: "", expiry_date: "", duration_hours: "", participants_count: "",
  });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("trainings").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro");
    else setTrainings((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const { error } = await supabase.from("trainings").insert({
      title: form.title, description: form.description || null, category: form.category || null,
      sector: form.sector || null, instructor: form.instructor || null,
      training_date: form.training_date || null, expiry_date: form.expiry_date || null,
      duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
      participants_count: form.participants_count ? Number(form.participants_count) : null,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else { toast.success("Treinamento criado!"); setDialogOpen(false); setForm({ title: "", description: "", category: "", sector: "", instructor: "", training_date: "", expiry_date: "", duration_hours: "", participants_count: "" }); fetch(); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("trainings").update({ status } as any).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Atualizado"); fetch(); }
  };

  const filtered = trainings.filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()));

  const isExpiring = (d: string | null) => {
    if (!d) return false;
    const diff = new Date(d).getTime() - Date.now();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-display text-2xl font-bold text-foreground">Treinamentos</h2><p className="text-sm text-muted-foreground">Gestão de capacitação e certificações</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Treinamento</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Cadastrar Treinamento</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Obrigatório, Complementar..." /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Instrutor</Label><Input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Duração (horas)</Label><Input type="number" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Data do Treinamento</Label><Input type="date" value={form.training_date} onChange={e => setForm(f => ({ ...f, training_date: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Validade</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Nº Participantes</Label><Input type="number" value={form.participants_count} onChange={e => setForm(f => ({ ...f, participants_count: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: trainings.length, color: "text-foreground" },
          { label: "Realizados", value: trainings.filter(t => t.status === "realizado").length, color: "text-safe" },
          { label: "Planejados", value: trainings.filter(t => t.status === "planejado").length, color: "text-accent" },
          { label: "A Vencer", value: trainings.filter(t => isExpiring(t.expiry_date)).length, color: "text-warning" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]"><p className="text-xs text-muted-foreground">{s.label}</p><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p></div>
        ))}
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow><TableHead>Treinamento</TableHead><TableHead>Instrutor</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead>Validade</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum treinamento.</TableCell></TableRow>
            : filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell><div><p className="font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{t.category || "—"} • {t.participants_count ?? 0} participantes</p></div></TableCell>
                <TableCell className="text-sm">{t.instructor || "—"}</TableCell>
                <TableCell>
                  <Select value={t.status} onValueChange={v => updateStatus(t.id, v)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="planejado">Planejado</SelectItem><SelectItem value="em_andamento">Em Andamento</SelectItem><SelectItem value="realizado">Realizado</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.training_date ? new Date(t.training_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell>
                  <span className={`text-xs ${isExpiring(t.expiry_date) ? "font-bold text-warning" : "text-muted-foreground"}`}>
                    {t.expiry_date ? new Date(t.expiry_date).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Trainings;
