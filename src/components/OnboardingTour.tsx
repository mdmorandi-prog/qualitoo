import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, AlertTriangle, FileText, BarChart3, Settings, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Bem-vindo ao SGQ Hospitalar!",
    description: "Seu sistema completo de Gestão da Qualidade. Vamos fazer um tour rápido pelos principais recursos.",
  },
  {
    icon: LayoutDashboard,
    title: "Resumo Executivo",
    description: "O painel principal mostra uma visão consolidada de todos os módulos: NCs, indicadores, riscos, documentos e mais.",
  },
  {
    icon: AlertTriangle,
    title: "Gestão de Não Conformidades",
    description: "Registre, investigue e trate não conformidades com fluxo completo: causa raiz, ação corretiva e CAPA integrados.",
  },
  {
    icon: FileText,
    title: "Controle de Documentos",
    description: "Gerencie procedimentos, instruções e manuais com versionamento, aprovação, assinatura digital e controle de validade.",
  },
  {
    icon: BarChart3,
    title: "Indicadores e Dashboards",
    description: "Monitore KPIs em tempo real, configure metas e crie dashboards personalizados com widgets arrastáveis.",
  },
  {
    icon: Settings,
    title: "Busca e Navegação",
    description: "Use Ctrl+K (ou ⌘K) para buscar qualquer módulo rapidamente. O menu lateral pode ser colapsado para mais espaço.",
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

  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleFinish(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.description}</DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" size="sm" onClick={handleFinish}>
            Pular tour
          </Button>
          <Button size="sm" onClick={handleNext}>
            {step < steps.length - 1 ? "Próximo" : "Começar!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingTour;
