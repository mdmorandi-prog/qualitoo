import { useState } from "react";
import { BrainCircuit, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AiClassification {
  suggested_severity: string;
  confidence: number;
  suggested_root_causes: string[];
  suggested_category: string;
  risk_assessment: string;
  recommended_actions: string[];
  similar_patterns: string;
}

interface Props {
  title: string;
  description: string;
  sector: string;
  onApplySeverity?: (severity: string) => void;
}

const sevColors: Record<string, string> = {
  baixa: "bg-safe/10 text-safe",
  media: "bg-warning/10 text-warning",
  alta: "bg-destructive/10 text-destructive",
  critica: "bg-destructive/20 text-destructive font-bold",
};

const AiClassifyButton = ({ title, description, sector, onApplySeverity }: Props) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiClassification | null>(null);

  const classify = async () => {
    if (!title || !description) { toast.error("Preencha título e descrição para classificar"); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-classify-nc`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ title, description, sector }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast.success("Classificação IA concluída!");
    } catch (e: any) {
      toast.error(e.message || "Erro na classificação IA");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={classify}
        disabled={loading || !title || !description}
        className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
        {loading ? "Analisando com IA..." : "🤖 Classificar com IA"}
      </Button>

      {result && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-primary">Análise da IA</span>
            <span className="text-[10px] text-muted-foreground">({Math.round((result.confidence || 0) * 100)}% confiança)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Severidade sugerida:</span>
            <Badge className={`${sevColors[result.suggested_severity] || "bg-secondary"} cursor-pointer`} onClick={() => onApplySeverity?.(result.suggested_severity)}>
              {result.suggested_severity} — clique para aplicar
            </Badge>
          </div>

          {result.suggested_root_causes?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Causas raiz sugeridas:</p>
              {result.suggested_root_causes.map((c, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px] text-foreground">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                  {c}
                </div>
              ))}
            </div>
          )}

          {result.recommended_actions?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground mb-1">Ações recomendadas:</p>
              {result.recommended_actions.map((a, i) => (
                <div key={i} className="text-[11px] text-muted-foreground">• {a}</div>
              ))}
            </div>
          )}

          {result.risk_assessment && (
            <p className="text-[10px] text-muted-foreground italic">{result.risk_assessment}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AiClassifyButton;
