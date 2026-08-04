import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Eye, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SectorSelect } from "@/components/SectorSelect";
import ExportPdfButton from "@/components/ExportPdfButton";
import { generateModuleReport } from "@/lib/pdfReport";
import {
  ANVISA_CAUSALITY,
  ANVISA_OUTCOME,
  ANVISA_ROUTES,
  VIGILANCE_LABELS,
  type VigilanceClass,
  type VigilanceEventRecord,
  validateEvents,
} from "@/lib/notivisa";

const severityLabels: Record<string, string> = {
  leve: "Leve", moderado: "Moderado", grave: "Grave", sentinela: "Sentinela",
};
const statusLabels: Record<string, string> = {
  notificado: "Notificado", em_investigacao: "Em Investigação",
  acao_corretiva: "Ação Corretiva", encerrado: "Encerrado",
};

const emptyForm = {
  title: "", description: "", event_type: "evento_adverso",
  severity: "moderado", event_date: new Date().toISOString().split("T")[0],
  sector: "", location: "", reported_by: "", immediate_actions: "",
  patient_involved: true, patient_outcome: "",
  patient_initials: "", patient_birth_date: "", patient_gender: "nao_informado", patient_weight_kg: "",
  product_name: "", product_active_ingredient: "", product_batch: "", product_registry: "",
  product_manufacturer: "", product_expiry_date: "", product_model: "", product_serial: "",
  drug_dose: "", drug_route: "oral", drug_indication: "", reaction_outcome: "em_recuperacao",
  causality: "nao_classificada",
};

interface Props {
  vigilanceClass: Exclude<VigilanceClass, "assistencial">;
  title: string;
  subtitle: string;
}

const VigilanceEvents = ({ vigilanceClass, title, subtitle }: Props) => {
  const isPharma = vigilanceClass === "farmacovigilancia";
  const [events, setEvents] = useState<VigilanceEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detail, setDetail] = useState<VigilanceEventRecord | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => { fetchEvents(); /* eslint-disable-next-line */ }, [vigilanceClass]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("adverse_events")
      .select("*")
      .eq("vigilance_class", vigilanceClass)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar notificações");
    else setEvents((data as any[]) ?? []);
    setLoading(false);
  };

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.reported_by) {
      toast.error("Preencha título, descrição e notificador");
      return;
    }
    const payload: any = {
      ...form,
      vigilance_class: vigilanceClass,
      event_type: isPharma ? form.event_type : "queixa_tecnica",
      patient_weight_kg: form.patient_weight_kg ? Number(form.patient_weight_kg) : null,
      patient_birth_date: form.patient_birth_date || null,
      product_expiry_date: form.product_expiry_date || null,
      sector: form.sector || null,
      location: form.location || null,
    };
    Object.keys(payload).forEach(k => { if (payload[k] === "") payload[k] = null; });
    payload.title = form.title;
    payload.description = form.description;
    payload.reported_by = form.reported_by;

    const { error } = await supabase.from("adverse_events").insert(payload);
    if (error) { toast.error("Erro ao registrar notificação"); console.error(error); return; }
    toast.success("Notificação registrada!");
    setDialogOpen(false);
    setForm({ ...emptyForm });
    fetchEvents();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("adverse_events").update({ status } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar"); else fetchEvents();
  };

  const filtered = useMemo(
    () => events.filter(e => !search || `${e.title} ${e.description} ${e.product_name ?? ""}`.toLowerCase().includes(search.toLowerCase())),
    [events, search],
  );

  const validation = useMemo(() => validateEvents(filtered, vigilanceClass), [filtered, vigilanceClass]);
  const readyCount = filtered.length - new Set(validation.errors.map(e => e.recordId)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportPdfButton
            onClick={() => generateModuleReport({
              title: `Relatório de ${title}`,
              subtitle,
              filters: search ? `Busca: "${search}"` : "Todos os registros",
              kpis: [
                { label: "Notificações", value: filtered.length },
                { label: "Prontas para ANVISA", value: readyCount },
                { label: "Com pendências", value: filtered.length - readyCount },
                { label: "Graves/Sentinela", value: filtered.filter(e => e.severity === "grave" || e.severity === "sentinela").length },
              ],
              columns: [
                { header: "Título", accessor: (r: any) => r.title },
                { header: isPharma ? "Medicamento" : "Produto", accessor: (r: any) => r.product_name ?? "—" },
                { header: "Lote", accessor: (r: any) => r.product_batch ?? "—" },
                { header: "Registro ANVISA", accessor: (r: any) => r.product_registry ?? "—" },
                { header: "Gravidade", accessor: (r: any) => severityLabels[r.severity] ?? r.severity },
                { header: "Situação", accessor: (r: any) => statusLabels[r.status] ?? r.status },
                { header: "Data", accessor: (r: any) => new Date(r.event_date).toLocaleDateString("pt-BR") },
              ],
              rows: filtered,
              landscape: true,
            })}
          />
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Nova Notificação
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: filtered.length, color: "text-foreground" },
          { label: "Prontas p/ ANVISA", value: readyCount, color: "text-safe" },
          { label: "Pendências de validação", value: validation.errors.length, color: "text-destructive" },
          { label: "Em investigação", value: filtered.filter(e => e.status === "em_investigacao").length, color: "text-warning" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por título, descrição ou produto..." className="pl-10" />
      </div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>{isPharma ? "Medicamento" : "Produto"}</TableHead>
              <TableHead>Lote / Registro</TableHead>
              <TableHead>Gravidade</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>XSD</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhuma notificação registrada.</TableCell></TableRow>
            ) : filtered.map(e => {
              const hasError = validation.errors.some(v => v.recordId === e.id);
              return (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell className="text-sm">{e.product_name ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.product_batch ?? "—"} / {e.product_registry ?? "—"}</TableCell>
                  <TableCell className="text-sm">{severityLabels[e.severity] ?? e.severity}</TableCell>
                  <TableCell>
                    <Select value={e.status} onValueChange={v => updateStatus(e.id, v)}>
                      <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {hasError ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-1 text-[10px] text-destructive">
                        <AlertTriangle className="h-3 w-3" /> Pendente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-safe/10 px-2 py-1 text-[10px] text-safe">
                        <ShieldCheck className="h-3 w-3" /> Válido
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setDetail(e)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">Nova notificação — {VIGILANCE_LABELS[vigilanceClass]}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder={isPharma ? "Suspeita de reação adversa a..." : "Falha/desvio de qualidade em..."} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {isPharma && (
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={form.event_type} onValueChange={v => set("event_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="evento_adverso">Reação adversa (RAM)</SelectItem>
                      <SelectItem value="queixa_tecnica">Queixa técnica</SelectItem>
                      <SelectItem value="incidente">Erro de medicação</SelectItem>
                      <SelectItem value="near_miss">Near miss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Gravidade *</Label>
                <Select value={form.severity} onValueChange={v => set("severity", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(severityLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data do evento *</Label>
                <Input type="date" value={form.event_date} onChange={e => set("event_date", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Setor</Label>
                <SectorSelect value={form.sector} onChange={v => set("sector", v)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Descrição / narrativa *</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} className="min-h-[90px]" />
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">{isPharma ? "Medicamento suspeito" : "Produto para a saúde"}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>{isPharma ? "Nome comercial *" : "Nome do produto *"}</Label>
                  <Input value={form.product_name} onChange={e => set("product_name", e.target.value)} /></div>
                {isPharma ? (
                  <div className="grid gap-2"><Label>Princípio ativo *</Label>
                    <Input value={form.product_active_ingredient} onChange={e => set("product_active_ingredient", e.target.value)} /></div>
                ) : (
                  <div className="grid gap-2"><Label>Modelo *</Label>
                    <Input value={form.product_model} onChange={e => set("product_model", e.target.value)} /></div>
                )}
                <div className="grid gap-2"><Label>Lote *</Label>
                  <Input value={form.product_batch} onChange={e => set("product_batch", e.target.value)} /></div>
                <div className="grid gap-2"><Label>Registro ANVISA *</Label>
                  <Input value={form.product_registry} onChange={e => set("product_registry", e.target.value)} placeholder="1.2345.6789.001-0" /></div>
                <div className="grid gap-2"><Label>Fabricante / detentor *</Label>
                  <Input value={form.product_manufacturer} onChange={e => set("product_manufacturer", e.target.value)} /></div>
                <div className="grid gap-2"><Label>Validade</Label>
                  <Input type="date" value={form.product_expiry_date} onChange={e => set("product_expiry_date", e.target.value)} /></div>
                {!isPharma && (
                  <div className="grid gap-2"><Label>Número de série</Label>
                    <Input value={form.product_serial} onChange={e => set("product_serial", e.target.value)} /></div>
                )}
                {isPharma && (
                  <>
                    <div className="grid gap-2"><Label>Dose / posologia *</Label>
                      <Input value={form.drug_dose} onChange={e => set("drug_dose", e.target.value)} placeholder="500 mg 8/8h" /></div>
                    <div className="grid gap-2"><Label>Via de administração *</Label>
                      <Select value={form.drug_route} onValueChange={v => set("drug_route", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ANVISA_ROUTES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select></div>
                    <div className="grid gap-2"><Label>Indicação terapêutica</Label>
                      <Input value={form.drug_indication} onChange={e => set("drug_indication", e.target.value)} /></div>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.patient_involved} onCheckedChange={v => set("patient_involved", v)} />
                <Label>Paciente envolvido</Label>
              </div>
              {form.patient_involved && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2"><Label>Iniciais {isPharma && "*"}</Label>
                    <Input maxLength={10} value={form.patient_initials} onChange={e => set("patient_initials", e.target.value.toUpperCase())} placeholder="J.S.M." /></div>
                  <div className="grid gap-2"><Label>Data de nascimento</Label>
                    <Input type="date" value={form.patient_birth_date} onChange={e => set("patient_birth_date", e.target.value)} /></div>
                  <div className="grid gap-2"><Label>Sexo</Label>
                    <Select value={form.patient_gender} onValueChange={v => set("patient_gender", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="nao_informado">Não informado</SelectItem>
                      </SelectContent>
                    </Select></div>
                  <div className="grid gap-2"><Label>Peso (kg)</Label>
                    <Input type="number" value={form.patient_weight_kg} onChange={e => set("patient_weight_kg", e.target.value)} /></div>
                  {isPharma && (
                    <>
                      <div className="grid gap-2"><Label>Desfecho da reação *</Label>
                        <Select value={form.reaction_outcome} onValueChange={v => set("reaction_outcome", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{ANVISA_OUTCOME.map(o => <SelectItem key={o} value={o}>{o.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                        </Select></div>
                      <div className="grid gap-2"><Label>Causalidade (OMS-UMC)</Label>
                        <Select value={form.causality} onValueChange={v => set("causality", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{ANVISA_CAUSALITY.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                        </Select></div>
                    </>
                  )}
                  <div className="col-span-2 grid gap-2"><Label>Desfecho clínico (texto)</Label>
                    <Textarea value={form.patient_outcome} onChange={e => set("patient_outcome", e.target.value)} /></div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Ações imediatas</Label>
              <Textarea value={form.immediate_actions} onChange={e => set("immediate_actions", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Notificador *</Label>
              <Input value={form.reported_by} onChange={e => set("reported_by", e.target.value)} />
            </div>
            <Button onClick={handleCreate} className="w-full">Registrar notificação</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">{detail?.title}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-2 text-sm">
              {[
                ["Classe", VIGILANCE_LABELS[detail.vigilance_class]],
                ["Data do evento", new Date(detail.event_date).toLocaleDateString("pt-BR")],
                ["Gravidade", severityLabels[detail.severity]],
                [isPharma ? "Medicamento" : "Produto", detail.product_name],
                isPharma ? ["Princípio ativo", detail.product_active_ingredient] : ["Modelo", detail.product_model],
                ["Lote", detail.product_batch],
                ["Registro ANVISA", detail.product_registry],
                ["Fabricante", detail.product_manufacturer],
                ["Paciente", detail.patient_initials],
                isPharma ? ["Desfecho", detail.reaction_outcome] : ["Nº série", detail.product_serial],
                ["Notificador", detail.reported_by],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between gap-4 border-b border-border/50 pb-1">
                  <span className="text-muted-foreground">{k as string}</span>
                  <span className="text-right font-medium">{(v as string) || "—"}</span>
                </div>
              ))}
              <div>
                <p className="text-muted-foreground">Descrição</p>
                <p className="mt-1">{detail.description}</p>
              </div>
              {validation.errors.filter(v => v.recordId === detail.id).length > 0 && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                  <p className="text-xs font-bold text-destructive">Pendências para envio à ANVISA</p>
                  <ul className="mt-1 list-disc pl-4 text-xs text-destructive">
                    {validation.errors.filter(v => v.recordId === detail.id).map((v, i) => (
                      <li key={i}>{v.field}: {v.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VigilanceEvents;
