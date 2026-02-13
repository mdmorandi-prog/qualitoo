import { useEffect, useState } from "react";
import { Plus, Search, Eye, TrendingUp, TrendingDown, Minus } from "lucide-react";
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

interface Indicator {
  id: string; name: string; description: string | null; unit: string;
  target_value: number; min_acceptable: number | null; max_acceptable: number | null;
  frequency: string; sector: string | null; is_active: boolean; created_at: string;
}

interface Measurement {
  id: string; indicator_id: string; value: number; period_date: string; notes: string | null;
}

const Indicators = () => {
  const { user } = useAuth();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [measDialogOpen, setMeasDialogOpen] = useState(false);
  const [selectedInd, setSelectedInd] = useState<Indicator | null>(null);

  const [form, setForm] = useState({
    name: "", description: "", unit: "%", target_value: "", min_acceptable: "", max_acceptable: "",
    frequency: "mensal", sector: "", is_composite: false, formula: "",
  });

  const [measForm, setMeasForm] = useState({ value: "", period_date: new Date().toISOString().split("T")[0], notes: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [indRes, measRes] = await Promise.all([
      supabase.from("quality_indicators").select("*").order("name"),
      supabase.from("indicator_measurements").select("*").order("period_date", { ascending: false }),
    ]);
    if (!indRes.error) setIndicators((indRes.data as any[]) ?? []);
    if (!measRes.error) setMeasurements((measRes.data as any[]) ?? []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.name || !form.target_value) { toast.error("Preencha os campos obrigatórios"); return; }
    const { error } = await supabase.from("quality_indicators").insert({
      name: form.name, description: form.description || null, unit: form.unit,
      target_value: Number(form.target_value),
      min_acceptable: form.min_acceptable ? Number(form.min_acceptable) : null,
      max_acceptable: form.max_acceptable ? Number(form.max_acceptable) : null,
      frequency: form.frequency, sector: form.sector || null,
      is_composite: form.is_composite, formula: form.formula || null,
    } as any);
    if (error) { toast.error("Erro ao criar"); console.error(error); }
    else { toast.success("Indicador criado!"); setDialogOpen(false); setForm({ name: "", description: "", unit: "%", target_value: "", min_acceptable: "", max_acceptable: "", frequency: "mensal", sector: "", is_composite: false, formula: "" }); fetchAll(); }
  };

  const addMeasurement = async () => {
    if (!selectedInd || !measForm.value || !user) { toast.error("Preencha os campos"); return; }
    const { error } = await supabase.from("indicator_measurements").insert({
      indicator_id: selectedInd.id, value: Number(measForm.value),
      period_date: measForm.period_date, recorded_by: user.id, notes: measForm.notes || null,
    } as any);
    if (error) { toast.error("Erro ao registrar"); console.error(error); }
    else { toast.success("Medição registrada!"); setMeasDialogOpen(false); setMeasForm({ value: "", period_date: new Date().toISOString().split("T")[0], notes: "" }); fetchAll(); }
  };

  const getLastValue = (indId: string) => {
    const m = measurements.filter(m => m.indicator_id === indId);
    return m.length > 0 ? m[0].value : null;
  };

  const getTrend = (indId: string, target: number) => {
    const last = getLastValue(indId);
    if (last === null) return "none";
    if (last >= target) return "up";
    return "down";
  };

  const filtered = indicators.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Indicadores de Qualidade</h2>
          <p className="text-sm text-muted-foreground">Monitoramento de KPIs e métricas de desempenho</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Indicador</Button></DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Cadastrar Indicador</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Taxa de Infecção Hospitalar" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2"><Label>Meta *</Label><Input type="number" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Mín. Aceitável</Label><Input type="number" value={form.min_acceptable} onChange={e => setForm(f => ({ ...f, min_acceptable: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Máx. Aceitável</Label><Input type="number" value={form.max_acceptable} onChange={e => setForm(f => ({ ...f, max_acceptable: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2"><Label>Unidade</Label><Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Frequência</Label>
                  <Select value={form.frequency} onValueChange={v => setForm(f => ({ ...f, frequency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem><SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem><SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                <input type="checkbox" checked={form.is_composite} onChange={e => setForm(f => ({ ...f, is_composite: e.target.checked }))} className="h-4 w-4 rounded" />
                <div className="flex-1">
                  <Label className="text-xs font-bold">Indicador Composto</Label>
                  <p className="text-[10px] text-muted-foreground">Calculado a partir de fórmula com outros indicadores</p>
                </div>
              </div>
              {form.is_composite && (
                <div className="grid gap-2">
                  <Label>Fórmula</Label>
                  <Input value={form.formula} onChange={e => setForm(f => ({ ...f, formula: e.target.value }))} placeholder="Ex: (IND_A / IND_B) * 100" />
                  <p className="text-[10px] text-muted-foreground">Use nomes de indicadores para criar fórmulas compostas</p>
                </div>
              )}
              <Button onClick={handleCreate} className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar indicadores..." className="pl-10" /></div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Indicadores", value: indicators.length, color: "text-foreground" },
          { label: "Na Meta", value: indicators.filter(i => getTrend(i.id, i.target_value) === "up").length, color: "text-safe" },
          { label: "Abaixo", value: indicators.filter(i => getTrend(i.id, i.target_value) === "down").length, color: "text-destructive" },
          { label: "Sem Medição", value: indicators.filter(i => getTrend(i.id, i.target_value) === "none").length, color: "text-muted-foreground" },
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
            <TableHead>Indicador</TableHead><TableHead>Meta</TableHead><TableHead>Último Valor</TableHead><TableHead>Tendência</TableHead><TableHead>Frequência</TableHead><TableHead>Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum indicador.</TableCell></TableRow>
            : filtered.map(ind => {
              const last = getLastValue(ind.id);
              const trend = getTrend(ind.id, ind.target_value);
              return (
                <TableRow key={ind.id}>
                  <TableCell><div><p className="font-medium">{ind.name}</p><p className="text-xs text-muted-foreground">{ind.sector || "Geral"}</p></div></TableCell>
                  <TableCell className="font-mono text-sm">{ind.target_value} {ind.unit}</TableCell>
                  <TableCell className="font-mono text-sm">{last !== null ? `${last} ${ind.unit}` : "—"}</TableCell>
                  <TableCell>
                    {trend === "up" ? <TrendingUp className="h-5 w-5 text-safe" /> : trend === "down" ? <TrendingDown className="h-5 w-5 text-destructive" /> : <Minus className="h-5 w-5 text-muted-foreground" />}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">{ind.frequency}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedInd(ind); setMeasDialogOpen(true); }}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={measDialogOpen} onOpenChange={setMeasDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">Registrar Medição: {selectedInd?.name}</DialogTitle></DialogHeader>
          {selectedInd && (
            <div className="space-y-4">
              {measurements.filter(m => m.indicator_id === selectedInd.id).slice(0, 5).length > 0 && (
                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="mb-2 text-xs font-bold text-muted-foreground">Últimas Medições</p>
                  {measurements.filter(m => m.indicator_id === selectedInd.id).slice(0, 5).map(m => (
                    <div key={m.id} className="flex justify-between border-b border-border/30 py-1 last:border-0">
                      <span className="text-xs text-muted-foreground">{new Date(m.period_date).toLocaleDateString("pt-BR")}</span>
                      <span className={`text-sm font-mono font-medium ${m.value >= selectedInd.target_value ? "text-safe" : "text-destructive"}`}>{m.value} {selectedInd.unit}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Valor *</Label><Input type="number" value={measForm.value} onChange={e => setMeasForm(f => ({ ...f, value: e.target.value }))} /></div>
                  <div className="grid gap-2"><Label>Período *</Label><Input type="date" value={measForm.period_date} onChange={e => setMeasForm(f => ({ ...f, period_date: e.target.value }))} /></div>
                </div>
                <div className="grid gap-2"><Label>Observações</Label><Textarea value={measForm.notes} onChange={e => setMeasForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button onClick={addMeasurement} className="w-full">Registrar Medição</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Indicators;
