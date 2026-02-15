import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard, AlertTriangle, FileText, BarChart3, Settings, Sparkles,
  Search, Activity, ClipboardCheck, GitBranch, BrainCircuit, Grip,
} from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao SGQ Hospitalar!",
    description: "Seu sistema completo de Gestão da Qualidade. Vamos fazer um tour rápido pelos principais recursos.",
    tip: null,
  },
  {
    icon: LayoutDashboard,
    title: "Resumo Executivo",
    description: "O painel principal mostra uma visão consolidada de todos os módulos: NCs, indicadores, riscos, documentos e mais.",
    tip: "💡 Os cards coloridos indicam pendências que precisam de atenção imediata.",
  },
  {
    icon: AlertTriangle,
    title: "Não Conformidades",
    description: "Registre, investigue e trate não conformidades com fluxo completo: causa raiz, ação corretiva e CAPA integrados.",
    tip: "💡 Use o botão 'Gerar CAPA' para criar automaticamente uma ação corretiva vinculada.",
  },
  {
    icon: FileText,
    title: "Controle de Documentos",
    description: "Gerencie procedimentos, instruções e manuais com versionamento, aprovação, assinatura digital e controle de validade.",
    tip: "💡 Organize seus documentos em pastas usando a árvore de diretórios no painel lateral.",
  },
  {
    icon: BarChart3,
    title: "Indicadores e Dashboards",
    description: "Monitore KPIs em tempo real, configure metas e crie dashboards personalizados com widgets arrastáveis.",
    tip: "💡 Crie indicadores compostos com fórmulas baseadas em outros KPIs para métricas avançadas.",
  },
  {
    icon: Search,
    title: "Auditorias Internas",
    description: "Planeje e execute auditorias internas com registro de achados, classificação de severidade e planos de ação vinculados.",
    tip: "💡 Use filtros por status para acompanhar achados pendentes de resolução.",
  },
  {
    icon: Activity,
    title: "Gestão de Riscos",
    description: "Matriz de riscos 5×5 com classificação automática de criticidade, controles existentes e planos de mitigação.",
    tip: "💡 Riscos com nível crítico (≥15) geram alertas automáticos no painel executivo.",
  },
  {
    icon: ClipboardCheck,
    title: "Planos de Ação (5W2H)",
    description: "Crie planos de ação estruturados vinculados a NCs, auditorias ou CAPAs com acompanhamento de progresso em tempo real.",
    tip: "💡 Cada campo do 5W2H (O quê, Por quê, Quem...) ajuda a definir a ação com clareza.",
  },
  {
    icon: GitBranch,
    title: "Fluxo CAPA",
    description: "Ações Corretivas e Preventivas em 6 etapas: Identificação → Causa Raiz → Plano → Implementação → Verificação → Fechamento.",
    tip: "💡 Na etapa de verificação, registre evidências de eficácia antes de fechar o CAPA.",
  },
  {
    icon: BrainCircuit,
    title: "Análise de Causa Raiz com IA",
    description: "Use Ishikawa (6M), 5 Porquês e Diagrama de Árvore com assistência de inteligência artificial para investigações aprofundadas.",
    tip: "💡 A IA sugere causas raiz baseadas no histórico de ocorrências similares.",
  },
  {
    icon: Grip,
    title: "Meu Dashboard Personalizado",
    description: "Monte seu próprio painel com widgets arrastáveis. Escolha quais módulos exibir e clique em qualquer widget para navegar diretamente ao módulo.",
    tip: "💡 Desbloqueie o dashboard (ícone de cadeado) para reorganizar os widgets.",
  },
  {
    icon: Settings,
    title: "Busca e Navegação",
    description: "Use Ctrl+K (ou ⌘K) para buscar qualquer módulo rapidamente. O menu lateral pode ser colapsado para mais espaço de trabalho.",
    tip: "💡 A Central de Ajuda (?) contém guias detalhados de cada funcionalidade.",
  },
];

const OnboardingTour = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("sgq_onboarding_done");
    if (!seen) {
      setTimeout(() => setOpen(true), 1000);
    }
  }, []);

  const handleFinish = () => {
    localStorage.setItem("sgq_onboarding_done", "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleFinish(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.description}</DialogDescription>
        </DialogHeader>

        {/* Tip */}
        {current.tip && (
          <div className="rounded-lg bg-accent/10 border border-accent/20 px-4 py-3 text-xs text-foreground leading-relaxed">
            {current.tip}
          </div>
        )}

        {/* Progress bar + step counter */}
        <div className="space-y-2 py-1">
          <Progress value={progress} className="h-1.5" />
          <p className="text-center text-[11px] text-muted-foreground">
            Passo {step + 1} de {steps.length}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-primary" : i < step ? "w-1.5 bg-primary/40" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={handleFinish} className="text-muted-foreground">
            Pular tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {step < steps.length - 1 ? "Próximo" : "Começar! 🚀"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
