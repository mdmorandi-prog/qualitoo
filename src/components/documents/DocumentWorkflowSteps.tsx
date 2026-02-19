import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Clock, GitBranch, MessageSquare, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import StepIndicator from "@/components/StepIndicator";

interface WorkflowStep {
  id: string;
  document_id: string;
  step_order: number;
  step_name: string;
  step_type: string;
  assigned_to: string | null;
  assigned_role: string | null;
  status: string;
  comments: string | null;
  completed_at: string | null;
  completed_by: string | null;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  category: string | null;
  steps: { step_name: string; step_type: string; assigned_role: string }[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  documentCategory: string | null;
  onWorkflowComplete?: () => void;
}

const stepStatusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pendente: { label: "Pendente", icon: <Clock className="h-4 w-4" />, color: "bg-muted text-muted-foreground" },
  aprovado: { label: "Aprovado", icon: <CheckCircle2 className="h-4 w-4" />, color: "bg-safe/10 text-safe" },
  rejeitado: { label: "Rejeitado", icon: <XCircle className="h-4 w-4" />, color: "bg-destructive/10 text-destructive" },
  pulado: { label: "Pulado", icon: <Clock className="h-4 w-4" />, color: "bg-warning/10 text-warning" },
};

const stepTypeLabel: Record<string, string> = {
  review: "Revisão",
  approval: "Aprovação",
  validation: "Validação",
};

const DocumentWorkflowSteps = ({ open, onOpenChange, documentId, documentTitle, documentCategory, onWorkflowComplete }: Props) => {
  const { user, isAdmin, isAnalyst } = useAuth();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionComment, setActionComment] = useState("");
  const [actingStepId, setActingStepId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchSteps();
      fetchTemplates();
    }
  }, [open, documentId]);

  const fetchSteps = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("document_workflow_steps")
      .select("*")
      .eq("document_id", documentId)
      .order("step_order");
    setSteps((data as WorkflowStep[]) ?? []);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("document_workflow_templates")
      .select("*")
      .eq("is_active", true);
    setTemplates((data as unknown as WorkflowTemplate[]) ?? []);
  };

  const applyTemplate = async (template: WorkflowTemplate) => {
    if (!user) return;
    await supabase.from("document_workflow_steps").delete().eq("document_id", documentId);
    const stepsToInsert = template.steps.map((s: any, i: number) => ({
      document_id: documentId,
      step_order: i + 1,
      step_name: s.step_name,
      step_type: s.step_type,
      assigned_role: s.assigned_role,
      status: "pendente",
    }));
    const { error } = await supabase.from("document_workflow_steps").insert(stepsToInsert);
    if (error) { toast.error("Erro ao aplicar template"); console.error(error); }
    else { toast.success(`Template "${template.name}" aplicado!`); fetchSteps(); }
  };

  const actOnStep = async (stepId: string, action: "aprovado" | "rejeitado") => {
    if (!user) return;
    setActingStepId(stepId);
    const { error } = await supabase
      .from("document_workflow_steps")
      .update({
        status: action,
        comments: actionComment || null,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
      })
      .eq("id", stepId);

    if (error) { toast.error("Erro ao atualizar etapa"); }
    else {
      toast.success(action === "aprovado" ? "Etapa aprovada!" : "Etapa rejeitada!");
      setActionComment("");
      fetchSteps();
      const updatedSteps = steps.map(s => s.id === stepId ? { ...s, status: action } : s);
      const allApproved = updatedSteps.every(s => s.status === "aprovado" || s.status === "pulado");
      if (allApproved && onWorkflowComplete) onWorkflowComplete();
    }
    setActingStepId(null);
  };

  const canActOnStep = (step: WorkflowStep): boolean => {
    if (step.status !== "pendente") return false;
    const prevStep = steps.find(s => s.step_order === step.step_order - 1);
    if (prevStep && prevStep.status === "pendente") return false;
    if (step.assigned_role === "admin" && !isAdmin) return false;
    if (step.assigned_role === "analyst" && !isAdmin && !isAnalyst) return false;
    if (step.assigned_to && step.assigned_to !== user?.id && !isAdmin) return false;
    return true;
  };

  const matchingTemplates = templates.filter(
    t => !t.category || t.category === documentCategory
  );

  const completedCount = steps.filter(s => s.status === "aprovado" || s.status === "pulado").length;
  const rejectedCount = steps.filter(s => s.status === "rejeitado").length;
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  // Find current active step index for StepIndicator
  const currentStepIndex = steps.findIndex(s => s.status === "pendente");
  const effectiveCurrentStep = currentStepIndex === -1 ? steps.length : currentStepIndex;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <GitBranch className="h-5 w-5" />
            Workflow de Aprovação — {documentTitle}
          </DialogTitle>
        </DialogHeader>

        {steps.length > 0 && (
          <div className="space-y-4">
            {/* Visual Step Indicator */}
            <div className="py-2">
              <StepIndicator
                steps={steps.map(s => s.step_name)}
                currentStep={effectiveCurrentStep}
              />
            </div>

            {/* Progress Bar with Percentage */}
            <div className="space-y-2 rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Progresso do Workflow</span>
                  {rejectedCount > 0 && (
                    <Badge variant="destructive" className="text-[10px]">
                      {rejectedCount} rejeitada{rejectedCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <span className="text-2xl font-bold text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{completedCount} de {steps.length} etapas concluídas</span>
                {progress === 100 && (
                  <span className="text-safe font-bold flex items-center gap-1">
                    <Check className="h-3 w-3" /> Workflow completo
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {steps.length === 0 && !loading && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center py-2">
              Nenhum workflow configurado. Selecione um template:
            </p>
            <div className="grid gap-2">
              {matchingTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className="flex items-start gap-3 rounded-lg border p-3 text-left hover:bg-muted/50 transition-all"
                >
                  <GitBranch className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.steps.length} etapas: {t.steps.map((s: any) => s.step_name).join(" → ")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const config = stepStatusConfig[step.status] || stepStatusConfig.pendente;
              const canAct = canActOnStep(step);

              return (
                <div
                  key={step.id}
                  className={`rounded-xl border p-4 transition-all ${
                    canAct ? "ring-1 ring-primary/30 border-primary/30 bg-primary/[0.02]" : ""
                  } ${step.status === "aprovado" ? "border-safe/30 bg-safe/[0.02]" : ""}
                    ${step.status === "rejeitado" ? "border-destructive/30 bg-destructive/[0.02]" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${config.color}`}>
                        {step.status === "pendente" ? idx + 1 : config.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{step.step_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">
                            {stepTypeLabel[step.step_type] || step.step_type}
                          </Badge>
                          {step.assigned_role && (
                            <Badge variant="secondary" className="text-[10px]">
                              {step.assigned_role === "admin" ? "Administrador" : "Analista"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={config.color}>{config.label}</Badge>
                  </div>

                  {step.comments && (
                    <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>"{step.comments}"</span>
                    </div>
                  )}

                  {step.completed_at && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Concluído em {new Date(step.completed_at).toLocaleString("pt-BR")}
                    </p>
                  )}

                  {canAct && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      <Textarea
                        placeholder="Comentário (opcional)..."
                        value={actionComment}
                        onChange={e => setActionComment(e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => actOnStep(step.id, "aprovado")}
                          disabled={actingStepId === step.id}
                        >
                          {actingStepId === step.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Aprovar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 gap-1"
                          onClick={() => actOnStep(step.id, "rejeitado")}
                          disabled={actingStepId === step.id}
                        >
                          <XCircle className="h-3 w-3" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentWorkflowSteps;
