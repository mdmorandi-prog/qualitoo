import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wrench, AlertTriangle, CheckCircle2, Calendar, Search } from "lucide-react";
import { toast } from "sonner";

const Metrology = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<any[]>([]);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showEquipForm, setShowEquipForm] = useState(false);
  const [showCalibForm, setShowCalibForm] = useState(false);
  const [selectedEquip, setSelectedEquip] = useState<any>(null);
  const [equipForm, setEquipForm] = useState({ name: "", tag_number: "", serial_number: "", manufacturer: "", model: "", sector: "", location: "", category: "", status: "ativo", notes: "" });
  const [calibForm, setCalibForm] = useState({ equipment_id: "", calibration_date: "", next_calibration_date: "", performed_by: "", certificate_number: "", result: "aprovado", deviation: "", notes: "" });

  const fetchData = async () => {
    const [eqRes, calRes] = await Promise.all([
      supabase.from("equipment").select("*").order("name"),
      supabase.from("calibrations").select("*").order("calibration_date", { ascending: false }),
    ]);
    setEquipment(eqRes.data ?? []);
    setCalibrations(calRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddEquip = async () => {
    if (!equipForm.name) return toast.error("Nome é obrigatório");
    const { error } = await supabase.from("equipment").insert({ ...equipForm, created_by: user?.email ?? "" });
    if (error) return toast.error("Erro ao salvar");
    toast.success("Equipamento cadastrado!");
    setShowEquipForm(false);
    setEquipForm({ name: "", tag_number: "", serial_number: "", manufacturer: "", model: "", sector: "", location: "", category: "", status: "ativo", notes: "" });
    fetchData();
  };

  const handleAddCalib = async () => {
    if (!calibForm.equipment_id || !calibForm.calibration_date) return toast.error("Equipamento e data são obrigatórios");
    const { error } = await supabase.from("calibrations").insert({ ...calibForm, created_by: user?.email ?? "" });
    if (error) return toast.error("Erro ao salvar");
    toast.success("Calibração registrada!");
    setShowCalibForm(false);
    setCalibForm({ equipment_id: "", calibration_date: "", next_calibration_date: "", performed_by: "", certificate_number: "", result: "aprovado", deviation: "", notes: "" });
    fetchData();
  };

  const now = new Date();
  const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30);

  const equipWithCalib = equipment.map(eq => {
    const lastCalib = calibrations.find(c => c.equipment_id === eq.id);
    const nextDate = lastCalib?.next_calibration_date ? new Date(lastCalib.next_calibration_date) : null;
    const isExpiring = nextDate && nextDate < thirtyDays;
    const isOverdue = nextDate && nextDate < now;
    return { ...eq, lastCalib, nextDate, isExpiring, isOverdue };
  });

  const filtered = equipWithCalib.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.tag_number?.toLowerCase().includes(search.toLowerCase())
  );

  const expiring = equipWithCalib.filter(e => e.isExpiring);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Metrologia / Calibração</h2>
          <p className="text-sm text-muted-foreground">Controle de equipamentos e certificados de calibração</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCalibForm(true)}>
            <Calendar className="mr-1 h-4 w-4" /> Nova Calibração
          </Button>
          <Button size="sm" onClick={() => setShowEquipForm(true)}>
            <Plus className="mr-1 h-4 w-4" /> Novo Equipamento
          </Button>
        </div>
      </div>

      {expiring.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-700">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">{expiring.length} equipamento(s) com calibração vencendo/vencida</p>
              <p className="text-xs text-muted-foreground">
                {expiring.map(e => e.name).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar equipamento..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Tabs defaultValue="equipment">
        <TabsList>
          <TabsTrigger value="equipment"><Wrench className="mr-1 h-3.5 w-3.5" /> Equipamentos ({filtered.length})</TabsTrigger>
          <TabsTrigger value="calibrations"><Calendar className="mr-1 h-3.5 w-3.5" /> Calibrações ({calibrations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="mt-4">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>TAG</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Próx. Calibração</TableHead>
                  <TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(eq => (
                  <TableRow key={eq.id} className="cursor-pointer" onClick={() => { setSelectedEquip(eq); }}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{eq.name}</p>
                        {eq.manufacturer && <p className="text-xs text-muted-foreground">{eq.manufacturer} {eq.model}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{eq.tag_number ?? "-"}</TableCell>
                    <TableCell className="text-sm">{eq.sector ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant={eq.status === "ativo" ? "default" : "secondary"} className="text-[10px]">{eq.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {eq.nextDate ? (
                        <span className={`text-sm ${eq.isOverdue ? "text-destructive font-medium" : eq.isExpiring ? "text-amber-500 font-medium" : ""}`}>
                          {eq.nextDate.toLocaleDateString("pt-BR")}
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {eq.lastCalib ? (
                        <Badge variant={eq.lastCalib.result === "aprovado" ? "default" : "destructive"} className="text-[10px]">
                          {eq.lastCalib.result}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="calibrations" className="mt-4">
          <div className="space-y-2">
            {calibrations.map(c => {
              const eq = equipment.find(e => e.id === c.equipment_id);
              return (
                <Card key={c.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    {c.result === "aprovado" ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{eq?.name ?? "Equipamento"}</p>
                      <p className="text-xs text-muted-foreground">
                        Data: {new Date(c.calibration_date).toLocaleDateString("pt-BR")}
                        {c.certificate_number && ` · Certificado: ${c.certificate_number}`}
                        {c.performed_by && ` · Por: ${c.performed_by}`}
                      </p>
                    </div>
                    <Badge variant={c.result === "aprovado" ? "default" : "destructive"} className="text-[10px]">{c.result}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Equipment Dialog */}
      <Dialog open={showEquipForm} onOpenChange={setShowEquipForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Novo Equipamento</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Nome *" value={equipForm.name} onChange={e => setEquipForm({ ...equipForm, name: e.target.value })} className="sm:col-span-2" />
            <Input placeholder="TAG" value={equipForm.tag_number} onChange={e => setEquipForm({ ...equipForm, tag_number: e.target.value })} />
            <Input placeholder="Nº Série" value={equipForm.serial_number} onChange={e => setEquipForm({ ...equipForm, serial_number: e.target.value })} />
            <Input placeholder="Fabricante" value={equipForm.manufacturer} onChange={e => setEquipForm({ ...equipForm, manufacturer: e.target.value })} />
            <Input placeholder="Modelo" value={equipForm.model} onChange={e => setEquipForm({ ...equipForm, model: e.target.value })} />
            <Input placeholder="Setor" value={equipForm.sector} onChange={e => setEquipForm({ ...equipForm, sector: e.target.value })} />
            <Input placeholder="Localização" value={equipForm.location} onChange={e => setEquipForm({ ...equipForm, location: e.target.value })} />
            <Input placeholder="Categoria" value={equipForm.category} onChange={e => setEquipForm({ ...equipForm, category: e.target.value })} />
            <Select value={equipForm.status} onValueChange={v => setEquipForm({ ...equipForm, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                <SelectItem value="descartado">Descartado</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder="Observações" value={equipForm.notes} onChange={e => setEquipForm({ ...equipForm, notes: e.target.value })} className="sm:col-span-2" rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEquipForm(false)}>Cancelar</Button>
            <Button onClick={handleAddEquip}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Calibration Dialog */}
      <Dialog open={showCalibForm} onOpenChange={setShowCalibForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Calibração</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={calibForm.equipment_id} onValueChange={v => setCalibForm({ ...calibForm, equipment_id: v })}>
              <SelectTrigger className="sm:col-span-2"><SelectValue placeholder="Selecione o equipamento *" /></SelectTrigger>
              <SelectContent>
                {equipment.map(eq => <SelectItem key={eq.id} value={eq.id}>{eq.name} {eq.tag_number ? `(${eq.tag_number})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Data da Calibração *</label>
              <Input type="date" value={calibForm.calibration_date} onChange={e => setCalibForm({ ...calibForm, calibration_date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Próxima Calibração</label>
              <Input type="date" value={calibForm.next_calibration_date} onChange={e => setCalibForm({ ...calibForm, next_calibration_date: e.target.value })} />
            </div>
            <Input placeholder="Realizada por" value={calibForm.performed_by} onChange={e => setCalibForm({ ...calibForm, performed_by: e.target.value })} />
            <Input placeholder="Nº Certificado" value={calibForm.certificate_number} onChange={e => setCalibForm({ ...calibForm, certificate_number: e.target.value })} />
            <Select value={calibForm.result} onValueChange={v => setCalibForm({ ...calibForm, result: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
                <SelectItem value="aprovado_com_restricao">Aprovado c/ Restrição</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Desvio encontrado" value={calibForm.deviation} onChange={e => setCalibForm({ ...calibForm, deviation: e.target.value })} />
            <Textarea placeholder="Observações" value={calibForm.notes} onChange={e => setCalibForm({ ...calibForm, notes: e.target.value })} className="sm:col-span-2" rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCalibForm(false)}>Cancelar</Button>
            <Button onClick={handleAddCalib}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Metrology;
