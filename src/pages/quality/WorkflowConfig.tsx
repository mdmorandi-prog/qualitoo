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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Settings2, Play, Pause, CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight, Zap, Shield } from "lucide-react";
import { toast } from "sonner";
import WorkflowApprovals from "@/components/workflow/WorkflowApprovals";
import WorkflowLog from "@/components/workflow/WorkflowLog";

const MODULE_OPTIONS = [
  { value: "non_conformities", label: "Não Conformidades" },
  { value: "quality_documents", label: "Documentos" },
  { value: "audits", label: "Auditorias" },
  { value: "action_plans", label: "Planos de Ação" },
  { value: "risks", label: "Riscos" },
  { value: "adverse_events", label: "Eventos Adversos" },
  { value: "capas", label: "CAPAs" },
  { value: "trainings", label: "Treinamentos" },
  { value: "suppliers", label: "Fornecedores" },
];

const TRIGGER_OPTIONS = [
  { value: "status_change", label: "Mudança de Status" },
  { value: "record_created", label: "Registro Criado" },
  { value: "record_updated", label: "Registro Atualizado" },
  { value: "field_change", label: "Campo Alterado" },
  { value: "deadline_approaching", label: "Prazo se Aproximando" },
];

const ACTION_TYPES = [
  { value: "change_status", label: "Alterar Status", icon: ArrowRight },
  { value: "send_notification", label: "Enviar Notificação", icon: Zap },
  { value: "create_approval", label: "Criar Aprovação", icon: Shield },
  { value: "assign_responsible", label: "Atribuir Responsável", icon: Settings2 },
  { value: "create_capa", label: "Criar CAPA", icon: Plus },
  { value: "create_action_plan", label: "Criar Plano de Ação", icon: Plus },
  { value: "escalate", label: "Escalar", icon: AlertTriangle },
];

interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  module: string;
  is_active: boolean;
  trigger_event: string;
  conditions: Condition[];
  actions: Action[];
  priority: number;
  created_by: string;
  created_at: string;
}

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  params: Record<string, string>;
}

const WorkflowConfig = () => {
  const { user, isAdmin } = useAuth();
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    module: "",
    trigger_event: "status_change",
    is_active: true,
    priority: 0,
    conditions: [] as Condition[],
    actions: [] as Action[],
  });

  const fetchRules = async () => {
    const { data } = await supabase
      .from("workflow_rules")
      .select("*")
      .order("priority", { ascending: false });
    setRules((data as unknown as WorkflowRule[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const openEditor = (rule?: WorkflowRule) => {
    if (rule) {
      setEditingRule(rule);
      setForm({
        name: rule.name,
        description: rule.description ?? "",
        module: rule.module,
        trigger_event: rule.trigger_event,
        is_active: rule.is_active,
        priority: rule.priority,
        conditions: rule.conditions ?? [],
        actions: rule.actions ?? [],
      });
    } else {
      setEditingRule(null);
      setForm({
        name: "", description: "", module: "", trigger_event: "status_change",
        is_active: true, priority: 0, conditions: [], actions: [],
      });
    }
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.module) return toast.error("Nome e módulo são obrigatórios");

    const payload = {
      name: form.name,
      description: form.description || null,
      module: form.module,
      trigger_event: form.trigger_event,
      is_active: form.is_active,
      priority: form.priority,
      conditions: form.conditions as any,
      actions: form.actions as any,
      created_by: user?.id ?? "",
    };

    if (editingRule) {
      const { error } = await supabase.from("workflow_rules").update(payload).eq("id", editingRule.id);
      if (error) return toast.error("Erro ao atualizar");
      toast.success("Regra atualizada!");
    } else {
      const { error } = await supabase.from("workflow_rules").insert(payload);
      if (error) return toast.error("Erro ao criar");
      toast.success("Regra criada!");
    }
    setShowEditor(false);
    fetchRules();
  };

  const toggleActive = async (rule: WorkflowRule) => {
    await supabase.from("workflow_rules").update({ is_active: !rule.is_active }).eq("id", rule.id);
    fetchRules();
  };

  const deleteRule = async (id: string) => {
    if (!confirm("Excluir esta regra?")) return;
    await supabase.from("workflow_rules").delete().eq("id", id);
    toast.success("Regra excluída");
    fetchRules();
  };

  const addCondition = () => {
    setForm({ ...form, conditions: [...form.conditions, { field: "status", operator: "equals", value: "" }] });
  };

  const updateCondition = (i: number, updates: Partial<Condition>) => {
    const conditions = [...form.conditions];
    conditions[i] = { ...conditions[i], ...updates };
    setForm({ ...form, conditions });
  };

  const removeCondition = (i: number) => {
    setForm({ ...form, conditions: form.conditions.filter((_, idx) => idx !== i) });
  };

  const addAction = () => {
    setForm({ ...form, actions: [...form.actions, { type: "send_notification", params: {} }] });
  };

  const updateAction = (i: number, updates: Partial<Action>) => {
    const actions = [...form.actions];
    actions[i] = { ...actions[i], ...updates };
    setForm({ ...form, actions });
  };

  const removeAction = (i: number) => {
    setForm({ ...form, actions: form.actions.filter((_, idx) => idx !== i) });
  };

  const moduleLabel = (val: string) => MODULE_OPTIONS.find(m => m.value === val)?.label ?? val;
  const triggerLabel = (val: string) => TRIGGER_OPTIONS.find(t => t.value === val)?.label ?? val;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="rules">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Workflow Configurável</h2>
            <p className="text-sm text-muted-foreground">Motor de regras para automação de processos</p>
          </div>
          <TabsList>
            <TabsTrigger value="rules">Regras</TabsTrigger>
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
            <TabsTrigger value="log">Histórico</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => openEditor()}>
              <Plus className="mr-2 h-4 w-4" /> Nova Regra
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16">
                <Settings2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium text-muted-foreground">Nenhuma regra configurada</p>
                <p className="text-sm text-muted-foreground">Crie regras para automatizar fluxos de trabalho</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{rule.name}</h3>
                        <Badge variant={rule.is_active ? "default" : "outline"}>
                          {rule.is_active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge variant="outline">{moduleLabel(rule.module)}</Badge>
                        <Badge variant="outline" className="text-xs">{triggerLabel(rule.trigger_event)}</Badge>
                      </div>
                      {rule.description && <p className="mt-1 text-xs text-muted-foreground">{rule.description}</p>}
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>{rule.conditions?.length ?? 0} condições</span>
                        <span>{rule.actions?.length ?? 0} ações</span>
                        <span>Prioridade: {rule.priority}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.is_active} onCheckedChange={() => toggleActive(rule)} />
                      <Button variant="outline" size="sm" onClick={() => openEditor(rule)}>Editar</Button>
                      {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approvals">
          <WorkflowApprovals />
        </TabsContent>

        <TabsContent value="log">
          <WorkflowLog />
        </TabsContent>
      </Tabs>

      {/* Rule Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Workflow"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <Input placeholder="Nome da regra *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Módulo *</Label>
                  <Select value={form.module} onValueChange={v => setForm({ ...form, module: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{MODULE_OPTIONS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Gatilho</Label>
                  <Select value={form.trigger_event} onValueChange={v => setForm({ ...form, trigger_event: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{TRIGGER_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Prioridade</Label>
                  <Input type="number" className="mt-1" value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} />
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Condições (SE...)</Label>
                <Button variant="outline" size="sm" onClick={addCondition}><Plus className="mr-1 h-3 w-3" /> Condição</Button>
              </div>
              <div className="mt-2 space-y-2">
                {form.conditions.map((cond, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
                    <Input placeholder="Campo" value={cond.field} onChange={e => updateCondition(i, { field: e.target.value })} className="flex-1" />
                    <Select value={cond.operator} onValueChange={v => updateCondition(i, { operator: v })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Igual a</SelectItem>
                        <SelectItem value="not_equals">Diferente de</SelectItem>
                        <SelectItem value="contains">Contém</SelectItem>
                        <SelectItem value="greater_than">Maior que</SelectItem>
                        <SelectItem value="less_than">Menor que</SelectItem>
                        <SelectItem value="is_empty">Está vazio</SelectItem>
                        <SelectItem value="changed_to">Mudou para</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="Valor" value={cond.value} onChange={e => updateCondition(i, { value: e.target.value })} className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={() => removeCondition(i)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                {form.conditions.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Sem condições — a regra será executada sempre que o gatilho ocorrer.</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Ações (ENTÃO...)</Label>
                <Button variant="outline" size="sm" onClick={addAction}><Plus className="mr-1 h-3 w-3" /> Ação</Button>
              </div>
              <div className="mt-2 space-y-2">
                {form.actions.map((action, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <Select value={action.type} onValueChange={v => updateAction(i, { type: v })}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map(a => (
                            <SelectItem key={a.value} value={a.value}>
                              <span className="flex items-center gap-2"><a.icon className="h-3 w-3" />{a.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => removeAction(i)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    {/* Action params */}
                    <div className="mt-2 space-y-2">
                      {action.type === "change_status" && (
                        <Input placeholder="Novo status (ex: em_analise)" value={action.params.new_status ?? ""} onChange={e => updateAction(i, { params: { ...action.params, new_status: e.target.value } })} />
                      )}
                      {action.type === "send_notification" && (
                        <>
                          <Input placeholder="Título da notificação" value={action.params.title ?? ""} onChange={e => updateAction(i, { params: { ...action.params, title: e.target.value } })} />
                          <Textarea placeholder="Mensagem" value={action.params.message ?? ""} onChange={e => updateAction(i, { params: { ...action.params, message: e.target.value } })} rows={2} />
                          <Input placeholder="Para (role: admin/analyst ou user_id)" value={action.params.target ?? ""} onChange={e => updateAction(i, { params: { ...action.params, target: e.target.value } })} />
                        </>
                      )}
                      {action.type === "create_approval" && (
                        <>
                          <Input placeholder="Role do aprovador (admin/analyst)" value={action.params.approver_role ?? ""} onChange={e => updateAction(i, { params: { ...action.params, approver_role: e.target.value } })} />
                          <Input placeholder="Timeout (horas)" type="number" value={action.params.timeout_hours ?? ""} onChange={e => updateAction(i, { params: { ...action.params, timeout_hours: e.target.value } })} />
                        </>
                      )}
                      {action.type === "escalate" && (
                        <>
                          <Input placeholder="Escalar para (role ou user_id)" value={action.params.escalate_to ?? ""} onChange={e => updateAction(i, { params: { ...action.params, escalate_to: e.target.value } })} />
                          <Textarea placeholder="Mensagem de escalonamento" value={action.params.message ?? ""} onChange={e => updateAction(i, { params: { ...action.params, message: e.target.value } })} rows={2} />
                        </>
                      )}
                      {(action.type === "create_capa" || action.type === "create_action_plan") && (
                        <Input placeholder="Título padrão" value={action.params.default_title ?? ""} onChange={e => updateAction(i, { params: { ...action.params, default_title: e.target.value } })} />
                      )}
                      {action.type === "assign_responsible" && (
                        <Input placeholder="User ID do responsável" value={action.params.user_id ?? ""} onChange={e => updateAction(i, { params: { ...action.params, user_id: e.target.value } })} />
                      )}
                    </div>
                  </div>
                ))}
                {form.actions.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Adicione pelo menos uma ação.</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Regra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowConfig;
