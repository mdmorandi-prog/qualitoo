import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Play, Eye, Edit2, Trash2, GitBranch } from "lucide-react";
import { toast } from "sonner";
import BpmnEditor from "@/components/bpmn/BpmnEditor";
import ProcessExecutionPanel from "@/components/bpmn/ProcessExecutionPanel";

interface BpmnProcess {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  sector: string | null;
  version: number;
  status: string;
  nodes: any[];
  edges: any[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

const ProcessMapping = () => {
  const { user, isAdmin } = useAuth();
  const [processes, setProcesses] = useState<BpmnProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingProcess, setEditingProcess] = useState<BpmnProcess | null>(null);
  const [executingProcess, setExecutingProcess] = useState<BpmnProcess | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", sector: "" });

  const fetchProcesses = async () => {
    const { data, error } = await supabase
      .from("bpmn_processes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error) setProcesses((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProcesses(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error("Título é obrigatório");
    const { error } = await supabase.from("bpmn_processes").insert({
      title: form.title,
      description: form.description || null,
      category: form.category || null,
      sector: form.sector || null,
      created_by: user?.id ?? "",
    });
    if (error) return toast.error("Erro ao criar processo");
    toast.success("Processo criado!");
    setShowNewDialog(false);
    setForm({ title: "", description: "", category: "", sector: "" });
    fetchProcesses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este processo?")) return;
    const { error } = await supabase.from("bpmn_processes").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Processo excluído");
    fetchProcesses();
  };

  const statusColors: Record<string, string> = {
    rascunho: "bg-muted text-muted-foreground",
    publicado: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    arquivado: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  if (editingProcess) {
    return (
      <BpmnEditor
        process={editingProcess}
        onBack={() => { setEditingProcess(null); fetchProcesses(); }}
      />
    );
  }

  if (executingProcess) {
    return (
      <ProcessExecutionPanel
        process={executingProcess}
        onBack={() => { setExecutingProcess(null); fetchProcesses(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Mapeamento de Processos</h2>
          <p className="text-sm text-muted-foreground">Editor BPMN visual com execução de fluxos</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Processo
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : processes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitBranch className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum processo cadastrado</p>
            <p className="text-sm text-muted-foreground">Crie seu primeiro mapeamento BPMN</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {processes.map((p) => (
            <Card key={p.id} className="group relative overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <Badge className={statusColors[p.status] ?? ""}>
                    {p.status === "rascunho" ? "Rascunho" : p.status === "publicado" ? "Publicado" : "Arquivado"}
                  </Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {p.category && <span>📂 {p.category}</span>}
                  {p.sector && <span>🏥 {p.sector}</span>}
                  <span>v{p.version}</span>
                  <span>{(p.nodes as any[])?.length ?? 0} nós</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingProcess(p)}>
                    <Edit2 className="mr-1 h-3 w-3" /> Editar
                  </Button>
                  {p.status === "publicado" && (
                    <Button size="sm" onClick={() => setExecutingProcess(p)}>
                      <Play className="mr-1 h-3 w-3" /> Executar
                    </Button>
                  )}
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="ml-auto text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Processo BPMN</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título do processo *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Categoria" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <Input placeholder="Setor" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessMapping;
