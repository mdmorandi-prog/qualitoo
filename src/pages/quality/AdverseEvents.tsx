import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, AlertTriangle, Search, Eye, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type EventSeverity = "leve" | "moderado" | "grave" | "sentinela";
type EventType = "evento_adverso" | "near_miss" | "incidente" | "queixa_tecnica";
type EventStatus = "notificado" | "em_investigacao" | "acao_corretiva" | "encerrado";

interface AdverseEvent {
  id: string;
  title: string;
  description: string;
  event_type: EventType;
  severity: EventSeverity;
  status: EventStatus;
  event_date: string;
  sector: string | null;
  location: string | null;
  patient_involved: boolean;
  patient_outcome: string | null;
  immediate_actions: string | null;
  reported_by: string;
  created_at: string;
}

const severityConfig: Record<EventSeverity, { label: string; color: string }> = {
  leve: { label: "Leve", color: "bg-safe/10 text-safe" },
  moderado: { label: "Moderado", color: "bg-warning/10 text-warning" },
  grave: { label: "Grave", color: "bg-destructive/10 text-destructive" },
  sentinela: { label: "Sentinela", color: "bg-destructive/20 text-destructive font-bold" },
};

const statusConfig: Record<EventStatus, { label: string; color: string }> = {
  notificado: { label: "Notificado", color: "bg-accent/10 text-accent" },
  em_investigacao: { label: "Em Investigação", color: "bg-warning/10 text-warning" },
  acao_corretiva: { label: "Ação Corretiva", color: "bg-primary/10 text-primary" },
  encerrado: { label: "Encerrado", color: "bg-muted text-muted-foreground" },
};

const typeLabels: Record<EventType, string> = {
  evento_adverso: "Evento Adverso",
  near_miss: "Near Miss",
  incidente: "Incidente",
  queixa_tecnica: "Queixa Técnica",
};

const AdverseEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AdverseEvent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [form, setForm] = useState({
    title: "", description: "", event_type: "evento_adverso" as EventType,
    severity: "leve" as EventSeverity, event_date: new Date().toISOString().split("T")[0],
    sector: "", location: "", patient_involved: false, patient_outcome: "",
    immediate_actions: "", reported_by: "",
  });

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("adverse_events")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar eventos");
    else setEvents((data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.reported_by) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    const { error } = await supabase.from("adverse_events").insert({
      ...form,
      sector: form.sector || null,
      location: form.location || null,
      patient_outcome: form.patient_outcome || null,
      immediate_actions: form.immediate_actions || null,
    } as any);
    if (error) { toast.error("Erro ao registrar evento"); console.error(error); }
    else {
      toast.success("Evento adverso registrado!");
      setDialogOpen(false);
      setForm({ title: "", description: "", event_type: "evento_adverso", severity: "leve", event_date: new Date().toISOString().split("T")[0], sector: "", location: "", patient_involved: false, patient_outcome: "", immediate_actions: "", reported_by: "" });
      fetchEvents();
    }
  };

  const updateStatus = async (id: string, status: EventStatus) => {
    const { error } = await supabase.from("adverse_events").update({ status } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else { toast.success("Status atualizado"); fetchEvents(); }
  };

  const createCapaFromEvent = async (event: AdverseEvent) => {
    if (!user) return;
    const { error } = await supabase.from("capas").insert({
      title: `CAPA - ${event.title}`,
      description: event.description,
      origin_type: "adverse_event",
      origin_id: event.id,
      origin_title: event.title,
      sector: event.sector,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar CAPA"); console.error(error); }
    else { toast.success("CAPA criada a partir do Evento Adverso!"); setDetailOpen(false); }
  };

  const filtered = events
    .filter(e => filterSeverity === "all" || e.severity === filterSeverity)
    .filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Eventos Adversos</h2>
          <p className="text-sm text-muted-foreground">Notificação e gestão de incidentes, near-misses e eventos sentinela</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Notificar Evento</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Notificar Evento Adverso</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Título *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Descrição breve do evento" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo *</Label>
                  <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v as EventType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="evento_adverso">Evento Adverso</SelectItem>
                      <SelectItem value="near_miss">Near Miss</SelectItem>
                      <SelectItem value="incidente">Incidente</SelectItem>
                      <SelectItem value="queixa_tecnica">Queixa Técnica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Gravidade *</Label>
                  <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as EventSeverity }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="leve">Leve</SelectItem>
                      <SelectItem value="moderado">Moderado</SelectItem>
                      <SelectItem value="grave">Grave</SelectItem>
                      <SelectItem value="sentinela">Sentinela</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Data do Evento *</Label>
                  <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Setor</Label>
                  <Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="Ex: UTI, Centro Cirúrgico" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Local</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Local específico do evento" />
              </div>
              <div className="grid gap-2">
                <Label>Descrição Detalhada *</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o que aconteceu em detalhes..." className="min-h-[100px]" />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.patient_involved} onCheckedChange={v => setForm(f => ({ ...f, patient_involved: v }))} />
                <Label>Paciente envolvido</Label>
              </div>
              {form.patient_involved && (
                <div className="grid gap-2">
                  <Label>Desfecho do Paciente</Label>
                  <Textarea value={form.patient_outcome} onChange={e => setForm(f => ({ ...f, patient_outcome: e.target.value }))} placeholder="Descreva o desfecho para o paciente..." />
                </div>
              )}
              <div className="grid gap-2">
                <Label>Ações Imediatas Tomadas</Label>
                <Textarea value={form.immediate_actions} onChange={e => setForm(f => ({ ...f, immediate_actions: e.target.value }))} placeholder="Quais ações foram tomadas imediatamente?" />
              </div>
              <div className="grid gap-2">
                <Label>Notificado por *</Label>
                <Input value={form.reported_by} onChange={e => setForm(f => ({ ...f, reported_by: e.target.value }))} placeholder="Nome de quem está notificando" />
              </div>
              <Button onClick={handleCreate} className="w-full">Registrar Evento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar eventos..." className="pl-10" />
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Gravidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="leve">Leve</SelectItem>
            <SelectItem value="moderado">Moderado</SelectItem>
            <SelectItem value="grave">Grave</SelectItem>
            <SelectItem value="sentinela">Sentinela</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: events.length, color: "text-foreground" },
          { label: "Graves/Sentinela", value: events.filter(e => e.severity === "grave" || e.severity === "sentinela").length, color: "text-destructive" },
          { label: "Em Investigação", value: events.filter(e => e.status === "em_investigacao").length, color: "text-warning" },
          { label: "Encerrados", value: events.filter(e => e.status === "encerrado").length, color: "text-safe" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Gravidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum evento encontrado.</TableCell></TableRow>
            ) : filtered.map(e => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.title}</TableCell>
                <TableCell className="text-sm">{typeLabels[e.event_type]}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${severityConfig[e.severity].color}`}>
                    {severityConfig[e.severity].label}
                  </span>
                </TableCell>
                <TableCell>
                  <Select value={e.status} onValueChange={v => updateStatus(e.id, v as EventStatus)}>
                    <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notificado">Notificado</SelectItem>
                      <SelectItem value="em_investigacao">Em Investigação</SelectItem>
                      <SelectItem value="acao_corretiva">Ação Corretiva</SelectItem>
                      <SelectItem value="encerrado">Encerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(e.event_date).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedEvent(e); setDetailOpen(true); }}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Detalhes do Evento</DialogTitle></DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Tipo</span>
                <span className="font-medium">{typeLabels[selectedEvent.event_type]}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Gravidade</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityConfig[selectedEvent.severity].color}`}>{severityConfig[selectedEvent.severity].label}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Setor</span>
                <span className="font-medium">{selectedEvent.sector || "—"}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Paciente Envolvido</span>
                <span className="font-medium">{selectedEvent.patient_involved ? "Sim" : "Não"}</span>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Descrição</p>
                <p className="text-foreground">{selectedEvent.description}</p>
              </div>
              {selectedEvent.immediate_actions && (
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Ações Imediatas</p>
                  <p className="text-foreground">{selectedEvent.immediate_actions}</p>
                </div>
              )}
              {selectedEvent.patient_outcome && (
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="mb-1 text-xs font-semibold text-muted-foreground">Desfecho do Paciente</p>
                  <p className="text-foreground">{selectedEvent.patient_outcome}</p>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Notificado por</span>
                <span className="font-medium">{selectedEvent.reported_by}</span>
              </div>
              <div className="border-t pt-4">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => createCapaFromEvent(selectedEvent)}>
                  <Target className="h-4 w-4" /> Criar CAPA a partir deste Evento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdverseEvents;
