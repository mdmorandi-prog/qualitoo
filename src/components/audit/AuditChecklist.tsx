import { useEffect, useState } from "react";
import { Plus, Trash2, Upload, CheckCircle, XCircle, AlertCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ChecklistItem {
  id: string;
  requirement: string;
  clause: string | null;
  status: string;
  score: number;
  max_score: number;
  evidence_notes: string | null;
  evidence_urls: string[];
  display_order: number;
}

interface Checklist {
  id: string;
  audit_id: string;
  title: string;
  standard: string;
  total_score: number;
  max_score: number;
  compliance_percentage: number;
  items?: ChecklistItem[];
}

const statusOptions = [
  { value: "nao_avaliado", label: "Não Avaliado", icon: AlertCircle, color: "text-muted-foreground" },
  { value: "conforme", label: "Conforme", icon: CheckCircle, color: "text-safe" },
  { value: "nao_conforme", label: "Não Conforme", icon: XCircle, color: "text-destructive" },
  { value: "parcial", label: "Parcialmente", icon: AlertCircle, color: "text-warning" },
  { value: "nao_aplicavel", label: "N/A", icon: AlertCircle, color: "text-muted-foreground" },
];

export default function AuditChecklist({ auditId }: { auditId: string }) {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStandard, setNewStandard] = useState("ISO 9001");
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => { fetchChecklists(); }, [auditId]);

  const fetchChecklists = async () => {
    const { data } = await supabase
      .from("audit_checklists")
      .select("*")
      .eq("audit_id", auditId)
      .order("created_at");
    setChecklists((data as any[]) ?? []);
  };

  const fetchItems = async (checklistId: string) => {
    const { data } = await supabase
      .from("audit_checklist_items")
      .select("*")
      .eq("checklist_id", checklistId)
      .order("display_order");
    setItems((data as any[]) ?? []);
  };

  const handleCreateChecklist = async () => {
    if (!newTitle || !user) return;
    const { data, error } = await supabase.from("audit_checklists").insert({
      audit_id: auditId, title: newTitle, standard: newStandard, created_by: user.id,
    } as any).select().single();
    if (error) { toast.error("Erro ao criar checklist"); return; }
    toast.success("Checklist criado!");
    setCreateOpen(false);
    setNewTitle("");
    fetchChecklists();
    if (data) { setSelectedChecklist(data as any); fetchItems((data as any).id); }
  };

  const addItem = async () => {
    if (!selectedChecklist) return;
    const { error } = await supabase.from("audit_checklist_items").insert({
      checklist_id: selectedChecklist.id,
      requirement: "Novo requisito",
      display_order: items.length,
    } as any);
    if (error) toast.error("Erro");
    else fetchItems(selectedChecklist.id);
  };

  const updateItem = async (itemId: string, field: string, value: any) => {
    await supabase.from("audit_checklist_items").update({ [field]: value } as any).eq("id", itemId);
    if (selectedChecklist) {
      fetchItems(selectedChecklist.id);
      recalculateScore(selectedChecklist.id);
    }
  };

  const deleteItem = async (itemId: string) => {
    await supabase.from("audit_checklist_items").delete().eq("id", itemId);
    if (selectedChecklist) fetchItems(selectedChecklist.id);
  };

  const recalculateScore = async (checklistId: string) => {
    const { data } = await supabase.from("audit_checklist_items").select("score, max_score, status").eq("checklist_id", checklistId);
    const allItems = (data as any[]) ?? [];
    const evaluated = allItems.filter(i => i.status !== "nao_avaliado" && i.status !== "nao_aplicavel");
    const totalScore = evaluated.reduce((sum, i) => sum + i.score, 0);
    const maxScore = evaluated.reduce((sum, i) => sum + i.max_score, 0);
    const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    await supabase.from("audit_checklists").update({
      total_score: totalScore, max_score: maxScore, compliance_percentage: pct,
    } as any).eq("id", checklistId);
    fetchChecklists();
  };

  const handleUploadEvidence = async (itemId: string, file: File) => {
    setUploading(itemId);
    const path = `${auditId}/${itemId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("audit-evidence").upload(path, file);
    if (error) { toast.error("Erro no upload"); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("audit-evidence").getPublicUrl(path);
    const item = items.find(i => i.id === itemId);
    const urls = [...(item?.evidence_urls ?? []), urlData.publicUrl];
    await updateItem(itemId, "evidence_urls", urls);
    setUploading(null);
    toast.success("Evidência anexada!");
  };

  const selectChecklist = (cl: Checklist) => {
    setSelectedChecklist(cl);
    fetchItems(cl.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Checklists de Auditoria</h4>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3 w-3" /> Novo Checklist
        </Button>
      </div>

      {checklists.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Nenhum checklist criado para esta auditoria.</p>
      ) : (
        <div className="space-y-2">
          {checklists.map(cl => (
            <div
              key={cl.id}
              onClick={() => selectChecklist(cl)}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${selectedChecklist?.id === cl.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{cl.title}</p>
                  <p className="text-[10px] text-muted-foreground">{cl.standard}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${cl.compliance_percentage >= 80 ? "text-safe" : cl.compliance_percentage >= 50 ? "text-warning" : "text-destructive"}`}>
                    {cl.compliance_percentage}%
                  </p>
                  <p className="text-[10px] text-muted-foreground">{cl.total_score}/{cl.max_score} pts</p>
                </div>
              </div>
              <Progress value={cl.compliance_percentage} className="h-1.5 mt-2" />
            </div>
          ))}
        </div>
      )}

      {selectedChecklist && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-semibold">{selectedChecklist.title}</h5>
            <Button size="sm" variant="outline" className="gap-1" onClick={addItem}>
              <Plus className="h-3 w-3" /> Item
            </Button>
          </div>

          {items.map((item, idx) => (
            <div key={item.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex gap-2 items-start">
                <span className="text-xs text-muted-foreground font-mono mt-1">{idx + 1}.</span>
                <div className="flex-1 space-y-2">
                  <Input
                    defaultValue={item.requirement}
                    onBlur={e => updateItem(item.id, "requirement", e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Requisito..."
                  />
                  <div className="flex gap-2">
                    <Input
                      defaultValue={item.clause ?? ""}
                      onBlur={e => updateItem(item.id, "clause", e.target.value)}
                      className="h-7 text-xs w-28"
                      placeholder="Cláusula"
                    />
                    <Select value={item.status} onValueChange={v => {
                      const score = v === "conforme" ? item.max_score : v === "parcial" ? Math.floor(item.max_score / 2) : 0;
                      updateItem(item.id, "status", v);
                      updateItem(item.id, "score", score);
                    }}>
                      <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className={s.color}>{s.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" min={0} max={item.max_score}
                      defaultValue={item.score}
                      onBlur={e => updateItem(item.id, "score", Number(e.target.value))}
                      className="h-7 text-xs w-16"
                    />
                  </div>
                  <Textarea
                    defaultValue={item.evidence_notes ?? ""}
                    onBlur={e => updateItem(item.id, "evidence_notes", e.target.value)}
                    className="text-xs min-h-[40px]"
                    placeholder="Notas de evidência..."
                  />
                  <div className="flex gap-2 items-center">
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" accept="image/*,application/pdf"
                        capture="environment"
                        onChange={e => e.target.files?.[0] && handleUploadEvidence(item.id, e.target.files[0])} />
                      <div className="flex items-center gap-1 text-xs text-primary hover:underline">
                        {uploading === item.id ? "Enviando..." : <><Camera className="h-3 w-3" /> Evidência</>}
                      </div>
                    </label>
                    {item.evidence_urls.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{item.evidence_urls.length} arquivo(s)</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteItem(item.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Checklist</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Checklist ISO 9001 - Seção 7" />
            </div>
            <div className="grid gap-2">
              <Label>Norma/Padrão</Label>
              <Select value={newStandard} onValueChange={setNewStandard}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ISO 9001">ISO 9001</SelectItem>
                  <SelectItem value="ISO 14001">ISO 14001</SelectItem>
                  <SelectItem value="ISO 45001">ISO 45001</SelectItem>
                  <SelectItem value="ONA">ONA</SelectItem>
                  <SelectItem value="IATF 16949">IATF 16949</SelectItem>
                  <SelectItem value="Personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateChecklist}>Criar Checklist</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
