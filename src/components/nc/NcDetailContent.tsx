import { useState } from "react";
import { Bot, Loader2, Target, Crosshair, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type NcSeverity = "baixa" | "media" | "alta" | "critica";
type NcStatus = "aberta" | "em_analise" | "plano_acao" | "em_execucao" | "verificacao" | "concluida";

interface NC {
  id: string; title: string; description: string; severity: NcSeverity; status: NcStatus;
  sector: string | null; deadline: string | null; root_cause: string | null;
  corrective_action: string | null; preventive_action: string | null; created_at: string;
}

interface FiveWhy {
  question: string;
  answer: string;
}

interface IshikawaData {
  mao_de_obra: string[];
  metodo: string[];
  maquina: string[];
  material: string[];
  meio_ambiente: string[];
  medida: string[];
}

const ishikawaLabels: Record<keyof IshikawaData, { label: string; icon: string }> = {
  mao_de_obra: { label: "Mão de Obra", icon: "👤" },
  metodo: { label: "Método", icon: "📋" },
  maquina: { label: "Máquina", icon: "⚙️" },
  material: { label: "Material", icon: "📦" },
  meio_ambiente: { label: "Meio Ambiente", icon: "🌿" },
  medida: { label: "Medida", icon: "📏" },
};

interface NcDetailContentProps {
  nc: NC;
  updateField: (id: string, field: string, value: string) => Promise<void>;
  createCapaFromNc: (nc: NC) => Promise<void>;
  createActionPlanFromNc: (nc: NC) => Promise<void>;
  onClose: () => void;
  refreshData: () => void;
}

const NcDetailContent = ({
  nc,
  updateField,
  createCapaFromNc,
  createActionPlanFromNc,
}: NcDetailContentProps) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [rootCauseSummary, setRootCauseSummary] = useState(nc.root_cause ?? "");
  const [corrective, setCorrective] = useState(nc.corrective_action ?? "");
  const [preventive, setPreventive] = useState(nc.preventive_action ?? "");
  const [fiveWhys, setFiveWhys] = useState<FiveWhy[]>([]);
  const [ishikawa, setIshikawa] = useState<IshikawaData | null>(null);
  const [aiAnalyzed, setAiAnalyzed] = useState(false);

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

      // Set structured data for visual display
      setRootCauseSummary(data.root_cause_summary || "");
      setFiveWhys(data.five_whys || []);
      setIshikawa(data.ishikawa || null);
      setCorrective(data.corrective_action || "");
      setPreventive(data.preventive_action || "");
      setAiAnalyzed(true);

      // Save summary to root_cause field in DB
      await Promise.all([
        updateField(nc.id, "root_cause", data.root_cause_summary || ""),
        updateField(nc.id, "corrective_action", data.corrective_action || ""),
        updateField(nc.id, "preventive_action", data.preventive_action || ""),
      ]);

      toast.success("Análise de causa raiz preenchida pela IA!");
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
        {aiLoading ? "Analisando com IA..." : "🤖 SGQ IA — Análise de Causa Raiz"}
      </Button>

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

      {/* 5 Whys Visual Section */}
      <Accordion type="single" collapsible defaultValue={aiAnalyzed ? "five-whys" : undefined}>
        <AccordionItem value="five-whys" className="rounded-lg border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-bold hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">5</span>
              5 Porquês
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {fiveWhys.length > 0 ? (
              <div className="space-y-3">
                {fiveWhys.map((w, i) => (
                  <div key={i} className="relative pl-8">
                    {/* Connector line */}
                    {i < fiveWhys.length - 1 && (
                      <div className="absolute left-[13px] top-8 h-[calc(100%+4px)] w-0.5 bg-border" />
                    )}
                    {/* Step number */}
                    <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="rounded-lg border bg-secondary/30 p-3">
                      <p className="text-xs font-semibold text-primary">{w.question}</p>
                      <div className="mt-1 flex items-start gap-1.5">
                        <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="text-sm text-foreground">{w.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Clique em "SGQ IA" para gerar a análise dos 5 Porquês automaticamente.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Ishikawa 6M Visual Section */}
      <Accordion type="single" collapsible defaultValue={aiAnalyzed ? "ishikawa" : undefined}>
        <AccordionItem value="ishikawa" className="rounded-lg border bg-card">
          <AccordionTrigger className="px-4 py-3 text-sm font-bold hover:no-underline">
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">6M</span>
              Diagrama de Ishikawa (6M)
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {ishikawa ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {(Object.keys(ishikawaLabels) as (keyof IshikawaData)[]).map(key => {
                  const config = ishikawaLabels[key];
                  const causes = ishikawa[key] || [];
                  return (
                    <div
                      key={key}
                      className="rounded-lg border bg-secondary/30 p-3"
                    >
                      <div className="mb-2 flex items-center gap-1.5">
                        <span className="text-base">{config.icon}</span>
                        <span className="text-xs font-bold text-foreground">{config.label}</span>
                      </div>
                      {causes.length > 0 ? (
                        <ul className="space-y-1">
                          {causes.map((cause, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                              {cause}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/50">Sem causas identificadas</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Clique em "SGQ IA" para gerar o diagrama de Ishikawa automaticamente.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
