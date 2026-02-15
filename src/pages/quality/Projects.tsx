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
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, FolderKanban, ArrowLeft, Edit2, BarChart3, ListTodo, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import GanttChart from "@/components/gantt/GanttChart";

interface Project {
  id: string;
  title: string;
  description: string | null;
  sector: string | null;
  responsible: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  progress: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  responsible: string | null;
  start_date: string;
  end_date: string;
  progress: number;
  status: string;
  depends_on: string | null;
  is_milestone: boolean;
  display_order: number;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  suspenso: "Suspenso",
  cancelado: "Cancelado",
};

const statusColors: Record<string, string> = {
  planejamento: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  em_andamento: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  concluido: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  suspenso: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const taskStatusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const Projects = () => {
  const { user, isAdmin } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ title: "", description: "", sector: "", responsible: "", start_date: "", end_date: "" });
  const [taskForm, setTaskForm] = useState({ title: "", responsible: "", start_date: "", end_date: "", is_milestone: false });
  const [viewMode, setViewMode] = useState<"gantt" | "list">("gantt");

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error) setProjects((data as any[]) ?? []);
    setLoading(false);
  };

  const fetchTasks = async (projectId: string) => {
    const { data, error } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true });
    if (!error) setTasks((data as any[]) ?? []);
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { if (selectedProject) fetchTasks(selectedProject.id); }, [selectedProject]);

  const handleCreateProject = async () => {
    if (!form.title.trim()) return toast.error("Título é obrigatório");
    if (!form.start_date) return toast.error("Data de início é obrigatória");
    const { error } = await supabase.from("projects").insert({
      title: form.title,
      description: form.description || null,
      sector: form.sector || null,
      responsible: form.responsible || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      created_by: user?.id ?? "",
    } as any);
    if (error) return toast.error("Erro ao criar projeto");
    toast.success("Projeto criado!");
    setShowNewDialog(false);
    setForm({ title: "", description: "", sector: "", responsible: "", start_date: "", end_date: "" });
    fetchProjects();
  };

  const handleUpdateProjectStatus = async (id: string, status: string) => {
    await supabase.from("projects").update({ status } as any).eq("id", id);
    fetchProjects();
    if (selectedProject?.id === id) setSelectedProject({ ...selectedProject, status });
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Excluir este projeto e todas as tarefas?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Projeto excluído");
    if (selectedProject?.id === id) setSelectedProject(null);
    fetchProjects();
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim() || !selectedProject) return toast.error("Título é obrigatório");
    if (!taskForm.start_date || !taskForm.end_date) return toast.error("Datas são obrigatórias");
    const { error } = await supabase.from("project_tasks").insert({
      project_id: selectedProject.id,
      title: taskForm.title,
      responsible: taskForm.responsible || null,
      start_date: taskForm.start_date,
      end_date: taskForm.end_date,
      is_milestone: taskForm.is_milestone,
      display_order: tasks.length,
    } as any);
    if (error) return toast.error("Erro ao criar tarefa");
    toast.success("Tarefa criada!");
    setShowTaskDialog(false);
    setTaskForm({ title: "", responsible: "", start_date: "", end_date: "", is_milestone: false });
    fetchTasks(selectedProject.id);
    recalcProgress(selectedProject.id);
  };

  const handleUpdateTaskProgress = async (taskId: string, progress: number) => {
    const status = progress === 100 ? "concluida" : progress > 0 ? "em_andamento" : "pendente";
    await supabase.from("project_tasks").update({ progress, status } as any).eq("id", taskId);
    fetchTasks(selectedProject!.id);
    recalcProgress(selectedProject!.id);
  };

  const handleDeleteTask = async (taskId: string) => {
    await supabase.from("project_tasks").delete().eq("id", taskId);
    fetchTasks(selectedProject!.id);
    recalcProgress(selectedProject!.id);
  };

  const recalcProgress = async (projectId: string) => {
    const { data } = await supabase.from("project_tasks").select("progress").eq("project_id", projectId);
    if (data && data.length > 0) {
      const avg = Math.round((data as any[]).reduce((s, t) => s + t.progress, 0) / data.length);
      await supabase.from("projects").update({ progress: avg } as any).eq("id", projectId);
      fetchProjects();
    }
  };

  // Stats
  const totalProjects = projects.length;
  const inProgress = projects.filter(p => p.status === "em_andamento").length;
  const overdue = projects.filter(p => p.end_date && new Date(p.end_date) < new Date() && p.status !== "concluido" && p.status !== "cancelado").length;
  const avgProgress = totalProjects ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / totalProjects) : 0;

  // Detail view
  if (selectedProject) {
    const pStart = selectedProject.start_date;
    const pEnd = selectedProject.end_date || (tasks.length > 0 ? tasks.reduce((max, t) => t.end_date > max ? t.end_date : max, tasks[0].end_date) : new Date(new Date(pStart).getTime() + 30 * 86400000).toISOString().slice(0, 10));

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setSelectedProject(null)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{selectedProject.title}</h2>
            <p className="text-xs text-muted-foreground">{selectedProject.description}</p>
          </div>
          <Badge className={statusColors[selectedProject.status]}>{statusLabels[selectedProject.status]}</Badge>
          <Select value={selectedProject.status} onValueChange={v => handleUpdateProjectStatus(selectedProject.id, v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>📅 {new Date(pStart).toLocaleDateString("pt-BR")} → {pEnd ? new Date(pEnd).toLocaleDateString("pt-BR") : "—"}</span>
          {selectedProject.sector && <span>🏥 {selectedProject.sector}</span>}
          {selectedProject.responsible && <span>👤 {selectedProject.responsible}</span>}
          <span className="flex items-center gap-2">
            Progresso: <Progress value={selectedProject.progress} className="w-24 h-2" />
            <span className="font-medium">{selectedProject.progress}%</span>
          </span>
        </div>

        {/* View toggle + add task */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant={viewMode === "gantt" ? "default" : "outline"} onClick={() => setViewMode("gantt")}>
            <BarChart3 className="mr-1 h-3 w-3" /> Gantt
          </Button>
          <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
            <ListTodo className="mr-1 h-3 w-3" /> Lista
          </Button>
          <div className="flex-1" />
          <Button size="sm" onClick={() => { setTaskForm({ title: "", responsible: "", start_date: pStart, end_date: pEnd || pStart, is_milestone: false }); setShowTaskDialog(true); }}>
            <Plus className="mr-1 h-3 w-3" /> Nova Tarefa
          </Button>
        </div>

        {/* Gantt or List */}
        {viewMode === "gantt" ? (
          <GanttChart tasks={tasks} projectStart={pStart} projectEnd={pEnd} />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma tarefa</TableCell></TableRow>
                ) : tasks.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {t.is_milestone && <span className="text-amber-500 mr-1">◆</span>}
                      {t.title}
                    </TableCell>
                    <TableCell className="text-sm">{t.responsible || "—"}</TableCell>
                    <TableCell className="text-sm">{new Date(t.start_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-sm">{new Date(t.end_date).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[t.progress]}
                          max={100}
                          step={5}
                          className="w-20"
                          onValueChange={([v]) => handleUpdateTaskProgress(t.id, v)}
                        />
                        <span className="text-xs w-8">{t.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === "concluida" ? "default" : t.status === "em_andamento" ? "secondary" : "outline"} className="text-xs">
                        {taskStatusLabels[t.status] || t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTask(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Task dialog */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Título da tarefa *" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              <Input placeholder="Responsável" value={taskForm.responsible} onChange={e => setTaskForm({ ...taskForm, responsible: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Início</label>
                  <Input type="date" value={taskForm.start_date} onChange={e => setTaskForm({ ...taskForm, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fim</label>
                  <Input type="date" value={taskForm.end_date} onChange={e => setTaskForm({ ...taskForm, end_date: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={taskForm.is_milestone} onCheckedChange={v => setTaskForm({ ...taskForm, is_milestone: !!v })} />
                <label className="text-sm">Marcar como Marco (Milestone)</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTaskDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateTask}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Project list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projetos</h2>
          <p className="text-sm text-muted-foreground">Gestão de projetos com gráfico de Gantt</p>
        </div>
        <Button onClick={() => { setForm({ title: "", description: "", sector: "", responsible: "", start_date: new Date().toISOString().slice(0, 10), end_date: "" }); setShowNewDialog(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Projeto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{totalProjects}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{inProgress}</p><p className="text-xs text-muted-foreground">Em Andamento</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-destructive">{overdue}</p><p className="text-xs text-muted-foreground flex items-center justify-center gap-1"><AlertTriangle className="h-3 w-3" /> Atrasados</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{avgProgress}%</p><p className="text-xs text-muted-foreground">Progresso Médio</p></CardContent></Card>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum projeto cadastrado</p>
            <p className="text-sm text-muted-foreground">Crie seu primeiro projeto</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => (
            <Card key={p.id} className="group cursor-pointer transition-shadow hover:shadow-md" onClick={() => setSelectedProject(p)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  <Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge>
                </div>
                {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {p.sector && <span>🏥 {p.sector}</span>}
                  {p.responsible && <span>👤 {p.responsible}</span>}
                  <span>📅 {new Date(p.start_date).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Progress value={p.progress} className="flex-1 h-2" />
                  <span className="text-xs font-medium">{p.progress}%</span>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => setSelectedProject(p)}>
                    <BarChart3 className="mr-1 h-3 w-3" /> Gantt
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProject(p.id)} className="ml-auto text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New project dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título do projeto *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Setor" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} />
              <Input placeholder="Responsável" value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Data de Início *</label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Previsão de Término</label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateProject}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
