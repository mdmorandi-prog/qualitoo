import { useState } from "react";
import { Bot, Loader2, Target, Crosshair, FishSymbol } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type NcSeverity = "baixa" | "media" | "alta" | "critica";
type NcStatus = "aberta" | "em_analise" | "plano_acao" | "em_execucao" | "verificacao" | "concluida";

interface NC {
  id: string; title: string; description: string; severity: NcSeverity; status: NcStatus;
  sector: string | null; deadline: string | null; root_cause: string | null;
  corrective_action: string | null; preventive_action: string | null; created_at: string;
}

interface NcDetailContentProps {
  nc: NC;
  updateField: (id: string, field: string, value: string) => Promise<void>;
  createCapaFromNc: (nc: NC) => Promise<void>;
  createActionPlanFromNc: (nc: NC) => Promise<void>;
  onClose: () => void;
  refreshData: () => void;
  onNavigateToCausaRaiz?: () => void;
}

const NcDetailContent = ({
  nc,
  updateField,
  createCapaFromNc,
  createActionPlanFromNc,
  onClose,
  onNavigateToCausaRaiz,
}: NcDetailContentProps) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [rootCauseSummary, setRootCauseSummary] = useState(nc.root_cause ?? "");
  const [corrective, setCorrective] = useState(nc.corrective_action ?? "");
  const [preventive, setPreventive] = useState(nc.preventive_action ?? "");

  const runAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-root-cause`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          title: nc.title,
          description: nc.description,
          severity: nc.severity,
          sector: nc.sector,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Erro na análise de IA");
      }

      const data = await resp.json();

      // Save fields to DB
      const summary = data.root_cause_summary || "";
      setRootCauseSummary(summary);
      setCorrective(data.corrective_action || "");
      setPreventive(data.preventive_action || "");

      await Promise.all([
        updateField(nc.id, "root_cause", summary),
        updateField(nc.id, "corrective_action", data.corrective_action || ""),
        updateField(nc.id, "preventive_action", data.preventive_action || ""),
      ]);

      // Store AI structured data in sessionStorage for the RootCauseAnalysis page
      sessionStorage.setItem("ai_root_cause_data", JSON.stringify({
        ncTitle: nc.title,
        ncId: nc.id,
        rootCauseSummary: summary,
        fiveWhys: data.five_whys || [],
        ishikawa: data.ishikawa || {},
        correctiveAction: data.corrective_action || "",
        preventiveAction: data.preventive_action || "",
      }));

      toast.success("Análise gerada! Redirecionando para Causa Raiz...");

      // Close dialog and navigate to the Root Cause Analysis page
      onClose();
      if (onNavigateToCausaRaiz) {
        setTimeout(() => onNavigateToCausaRaiz(), 300);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro na análise de IA");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="rounded-lg bg-secondary/50 p-3">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">Descrição</p>
        <p className="text-sm text-foreground">{nc.description}</p>
      </div>

      {/* AI Analysis Button */}
      <Button
        onClick={runAiAnalysis}
        disabled={aiLoading}
        className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
      >
        {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
        {aiLoading ? "Analisando com IA..." : "🤖 Qualitoo IA — Análise de Causa Raiz"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        <FishSymbol className="mr-1 inline h-3 w-3" />
        Gera 5 Porquês e Ishikawa (6M) na página de Causa Raiz
      </p>

      {/* Root Cause Summary */}
      <div className="grid gap-2">
        <Label className="text-xs font-semibold">Resumo da Causa Raiz</Label>
        <Textarea
          value={rootCauseSummary}
          onChange={e => setRootCauseSummary(e.target.value)}
          onBlur={e => updateField(nc.id, "root_cause", e.target.value)}
          placeholder="Resumo da causa raiz..."
          className="min-h-[80px]"
        />
      </div>

      {/* Corrective & Preventive Actions */}
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Ação Corretiva</Label>
          <Textarea
            value={corrective}
            onChange={e => setCorrective(e.target.value)}
            onBlur={e => updateField(nc.id, "corrective_action", e.target.value)}
            placeholder="Ação corretiva..."
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-semibold">Ação Preventiva</Label>
          <Textarea
            value={preventive}
            onChange={e => setPreventive(e.target.value)}
            onBlur={e => updateField(nc.id, "preventive_action", e.target.value)}
            placeholder="Ação preventiva..."
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t pt-4">
        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => createCapaFromNc(nc)}>
          <Target className="h-4 w-4" /> Criar CAPA
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => createActionPlanFromNc(nc)}>
          <Crosshair className="h-4 w-4" /> Criar Plano de Ação
        </Button>
      </div>
    </div>
  );
};

export default NcDetailContent;
