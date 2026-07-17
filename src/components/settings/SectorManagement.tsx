import { useEffect, useState } from "react";
import { Plus, Trash2, Save, Building2, Pencil, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSectors, invalidateSectorsCache, type Sector } from "@/hooks/useSectors";

const SectorManagement = () => {
  const { allSectors, refetch, loading } = useSectors(false);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Sector | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "", color: "#6366f1", is_active: true });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        code: editing.code ?? "",
        description: editing.description ?? "",
        color: editing.color ?? "#6366f1",
        is_active: editing.is_active,
      });
    } else {
      setForm({ name: "", code: "", description: "", color: "#6366f1", is_active: true });
    }
  }, [editing]);

  const save = async () => {
    if (!form.name.trim()) return toast({ title: "Nome obrigatório", variant: "destructive" });
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      description: form.description.trim() || null,
      color: form.color,
      is_active: form.is_active,
    };
    const res = editing
      ? await supabase.from("sectors").update(payload).eq("id", editing.id)
      : await supabase.from("sectors").insert(payload);
    if (res.error) return toast({ title: "Erro ao salvar", description: res.error.message, variant: "destructive" });
    toast({ title: editing ? "Setor atualizado" : "Setor criado" });
    invalidateSectorsCache();
    await refetch();
    setDialogOpen(false);
    setEditing(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este setor? Registros existentes continuarão com o nome do setor salvo.")) return;
    const { error } = await supabase.from("sectors").delete().eq("id", id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    invalidateSectorsCache();
    await refetch();
    toast({ title: "Setor removido" });
  };

  const toggleActive = async (s: Sector) => {
    const { error } = await supabase.from("sectors").update({ is_active: !s.is_active }).eq("id", s.id);
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    invalidateSectorsCache();
    await refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2"><Building2 className="h-5 w-5" /> Setores</h3>
          <p className="text-sm text-muted-foreground">
            Cadastre os setores da sua organização. Eles serão usados em todos os módulos (Riscos, NCs, Eventos, Grupos de Acesso, Mapa de Calor, etc.).
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Novo setor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar setor" : "Novo setor"}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: UTI Adulto" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Código</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="UTI-A" /></div>
                <div>
                  <Label>Cor</Label>
                  <Input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
                </div>
              </div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Setor ativo (aparece em filtros e formulários)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); }}><X className="h-4 w-4 mr-2" /> Cancelar</Button>
              <Button onClick={save}><Save className="h-4 w-4 mr-2" /> Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Carregando...</TableCell></TableRow>}
            {!loading && allSectors.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Nenhum setor cadastrado.</TableCell></TableRow>}
            {allSectors.map(s => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{s.code ?? "—"}</TableCell>
                <TableCell><div className="h-5 w-5 rounded border" style={{ backgroundColor: s.color ?? "#ccc" }} /></TableCell>
                <TableCell>
                  {s.is_active
                    ? <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Check className="h-3 w-3 mr-1" /> Ativo</Badge>
                    : <Badge variant="outline">Inativo</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(s)}>{s.is_active ? "Desativar" : "Ativar"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(s); setDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SectorManagement;
