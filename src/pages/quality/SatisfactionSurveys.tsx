import { useEffect, useState } from "react";
import { Plus, Search, BarChart3, Eye, Link2, Copy } from "lucide-react";
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

type SurveyType = "nps" | "csat" | "custom";
type SurveyStatus = "rascunho" | "ativa" | "encerrada";

interface Survey {
  id: string; title: string; description: string | null;
  survey_type: SurveyType; status: SurveyStatus; sector: string | null;
  start_date: string | null; end_date: string | null; created_at: string;
}

interface SurveyResponse {
  id: string; survey_id: string; respondent_name: string | null;
  respondent_sector: string | null; score: number | null; comments: string | null;
  created_at: string;
}

const typeLabels: Record<SurveyType, string> = { nps: "NPS", csat: "CSAT", custom: "Personalizada" };
const statusConfig: Record<SurveyStatus, { label: string; color: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  ativa: { label: "Ativa", color: "bg-safe/10 text-safe" },
  encerrada: { label: "Encerrada", color: "bg-secondary text-secondary-foreground" },
};

const Surveys = () => {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [respondForm, setRespondForm] = useState({ name: "", sector: "", score: "8", comments: "" });

  const [form, setForm] = useState({
    title: "", description: "", survey_type: "nps" as SurveyType, sector: "",
    start_date: new Date().toISOString().split("T")[0], end_date: "",
  });

  useEffect(() => { fetchSurveys(); }, []);

  const fetchSurveys = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("satisfaction_surveys").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar pesquisas");
    else setSurveys((data as any[]) ?? []);
    setLoading(false);
  };

  const fetchResponses = async (surveyId: string) => {
    const { data } = await supabase.from("survey_responses").select("*").eq("survey_id", surveyId).order("created_at", { ascending: false });
    setResponses((data as any[]) ?? []);
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const { error } = await supabase.from("satisfaction_surveys").insert({
      title: form.title, description: form.description || null,
      survey_type: form.survey_type, sector: form.sector || null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else {
      toast.success("Pesquisa criada!");
      setDialogOpen(false);
      setForm({ title: "", description: "", survey_type: "nps", sector: "", start_date: new Date().toISOString().split("T")[0], end_date: "" });
      fetchSurveys();
    }
  };

  const updateStatus = async (id: string, status: SurveyStatus) => {
    const { error } = await supabase.from("satisfaction_surveys").update({ status } as any).eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Status atualizado"); fetchSurveys(); }
  };

  const openDetail = async (s: Survey) => {
    setSelectedSurvey(s);
    await fetchResponses(s.id);
    setDetailOpen(true);
  };

  const handleRespond = async () => {
    if (!selectedSurvey) return;
    const { error } = await supabase.from("survey_responses").insert({
      survey_id: selectedSurvey.id,
      respondent_name: respondForm.name || null,
      respondent_sector: respondForm.sector || null,
      score: Number(respondForm.score),
      comments: respondForm.comments || null,
    } as any);
    if (error) { toast.error("Erro"); console.error(error); }
    else {
      toast.success("Resposta registrada!");
      setRespondDialogOpen(false);
      setRespondForm({ name: "", sector: "", score: "8", comments: "" });
      fetchResponses(selectedSurvey.id);
    }
  };

  const filtered = surveys.filter(s =>
    !search || s.title.toLowerCase().includes(search.toLowerCase())
  );

  // NPS calculation
  const calcNPS = (resps: SurveyResponse[]) => {
    if (resps.length === 0) return { nps: 0, promoters: 0, passives: 0, detractors: 0 };
    const scored = resps.filter(r => r.score !== null);
    if (scored.length === 0) return { nps: 0, promoters: 0, passives: 0, detractors: 0 };
    const promoters = scored.filter(r => (r.score ?? 0) >= 9).length;
    const detractors = scored.filter(r => (r.score ?? 0) <= 6).length;
    const passives = scored.length - promoters - detractors;
    const nps = Math.round(((promoters - detractors) / scored.length) * 100);
    return { nps, promoters, passives, detractors };
  };

  // Stats for all active surveys
  const activeSurveys = surveys.filter(s => s.status === "ativa");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Pesquisa de Satisfação</h2>
          <p className="text-sm text-muted-foreground">NPS, CSAT e pesquisas customizadas para experiência do paciente</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nova Pesquisa</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Criar Pesquisa</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={form.survey_type} onValueChange={v => setForm(f => ({ ...f, survey_type: v as SurveyType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nps">NPS (0-10)</SelectItem>
                      <SelectItem value="csat">CSAT (1-5)</SelectItem>
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Início</Label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Fim</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <Button onClick={handleCreate} className="w-full">Criar Pesquisa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pesquisas..." className="pl-10" /></div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: surveys.length, color: "text-foreground" },
          { label: "Ativas", value: activeSurveys.length, color: "text-safe" },
          { label: "Encerradas", value: surveys.filter(s => s.status === "encerrada").length, color: "text-muted-foreground" },
          { label: "Rascunho", value: surveys.filter(s => s.status === "rascunho").length, color: "text-warning" },
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
              <TableHead>Pesquisa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma pesquisa criada.</TableCell></TableRow>
            ) : filtered.map(s => (
              <TableRow key={s.id}>
                <TableCell>
                  <div><p className="font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{s.sector || "Geral"}</p></div>
                </TableCell>
                <TableCell><span className="text-xs font-medium">{typeLabels[s.survey_type]}</span></TableCell>
                <TableCell>
                  <Select value={s.status} onValueChange={v => updateStatus(s.id, v as SurveyStatus)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="encerrada">Encerrada</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {s.start_date ? new Date(s.start_date).toLocaleDateString("pt-BR") : "—"}
                  {s.end_date ? ` a ${new Date(s.end_date).toLocaleDateString("pt-BR")}` : ""}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(s)}><BarChart3 className="h-4 w-4" /></Button>
                    {s.status === "ativa" && (
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedSurvey(s); setRespondDialogOpen(true); }} title="Registrar resposta"><Plus className="h-4 w-4" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Respond Dialog */}
      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Registrar Resposta</DialogTitle></DialogHeader>
          {selectedSurvey && (
            <div className="grid gap-4 py-4">
              <p className="text-sm text-muted-foreground">{selectedSurvey.title}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Nome (opcional)</Label><Input value={respondForm.name} onChange={e => setRespondForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={respondForm.sector} onChange={e => setRespondForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2">
                <Label>Nota ({selectedSurvey.survey_type === "csat" ? "1-5" : "0-10"})</Label>
                <Input type="number" min={selectedSurvey.survey_type === "csat" ? 1 : 0} max={selectedSurvey.survey_type === "csat" ? 5 : 10} value={respondForm.score} onChange={e => setRespondForm(f => ({ ...f, score: e.target.value }))} />
              </div>
              <div className="grid gap-2"><Label>Comentários</Label><Textarea value={respondForm.comments} onChange={e => setRespondForm(f => ({ ...f, comments: e.target.value }))} /></div>
              <Button onClick={handleRespond} className="w-full">Enviar Resposta</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail / Results Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-display">Resultados da Pesquisa</DialogTitle></DialogHeader>
          {selectedSurvey && (() => {
            const npsData = calcNPS(responses);
            const avgScore = responses.length > 0 ? (responses.reduce((acc, r) => acc + (r.score ?? 0), 0) / responses.filter(r => r.score !== null).length) : 0;
            return (
              <div className="space-y-4">
                <p className="text-sm font-medium">{selectedSurvey.title}</p>

                {selectedSurvey.survey_type === "nps" ? (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">NPS</p>
                      <p className={`text-2xl font-bold ${npsData.nps >= 50 ? "text-safe" : npsData.nps >= 0 ? "text-warning" : "text-destructive"}`}>{npsData.nps}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Promotores</p>
                      <p className="text-lg font-bold text-safe">{npsData.promoters}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Neutros</p>
                      <p className="text-lg font-bold text-warning">{npsData.passives}</p>
                    </div>
                    <div className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground">Detratores</p>
                      <p className="text-lg font-bold text-destructive">{npsData.detractors}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-xs text-muted-foreground">Nota Média</p>
                    <p className={`text-3xl font-bold ${avgScore >= 4 ? "text-safe" : avgScore >= 3 ? "text-warning" : "text-destructive"}`}>{avgScore.toFixed(1)}</p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">{responses.length} resposta{responses.length !== 1 ? "s" : ""}</p>

                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {responses.map(r => (
                    <div key={r.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{r.respondent_name || "Anônimo"} {r.respondent_sector ? `• ${r.respondent_sector}` : ""}</span>
                        <span className="font-bold">{r.score}</span>
                      </div>
                      {r.comments && <p className="mt-1 text-xs text-foreground">{r.comments}</p>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Surveys;
