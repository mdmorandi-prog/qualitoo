import { useState } from "react";
import { Plus, Trash2, FishSymbol } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ISHIKAWA_CATEGORIES = [
  { key: "mao_de_obra", label: "Mão de Obra", color: "bg-accent" },
  { key: "metodo", label: "Método", color: "bg-primary" },
  { key: "maquina", label: "Máquina", color: "bg-warning" },
  { key: "material", label: "Material", color: "bg-safe" },
  { key: "meio_ambiente", label: "Meio Ambiente", color: "bg-destructive" },
  { key: "medida", label: "Medida", color: "bg-muted-foreground" },
];

interface IshikawaData {
  problem: string;
  categories: Record<string, string[]>;
}

interface FiveWhys {
  problem: string;
  whys: { question: string; answer: string }[];
  rootCause: string;
}

const RootCauseAnalysis = () => {
  const [ishikawa, setIshikawa] = useState<IshikawaData>({
    problem: "",
    categories: Object.fromEntries(ISHIKAWA_CATEGORIES.map(c => [c.key, [""]])),
  });

  const [fiveWhys, setFiveWhys] = useState<FiveWhys>({
    problem: "",
    whys: [
      { question: "Por que isso aconteceu?", answer: "" },
      { question: "Por que?", answer: "" },
      { question: "Por que?", answer: "" },
      { question: "Por que?", answer: "" },
      { question: "Por que?", answer: "" },
    ],
    rootCause: "",
  });

  const addCause = (category: string) => {
    setIshikawa(prev => ({
      ...prev,
      categories: { ...prev.categories, [category]: [...prev.categories[category], ""] },
    }));
  };

  const removeCause = (category: string, index: number) => {
    setIshikawa(prev => ({
      ...prev,
      categories: { ...prev.categories, [category]: prev.categories[category].filter((_, i) => i !== index) },
    }));
  };

  const updateCause = (category: string, index: number, value: string) => {
    setIshikawa(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: prev.categories[category].map((c, i) => i === index ? value : c),
      },
    }));
  };

  const updateWhy = (index: number, value: string) => {
    setFiveWhys(prev => ({
      ...prev,
      whys: prev.whys.map((w, i) => i === index ? { ...w, answer: value } : w),
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Análise de Causa Raiz</h2>
        <p className="text-sm text-muted-foreground">Ferramentas visuais: Diagrama de Ishikawa (6M) e 5 Porquês</p>
      </div>

      <Tabs defaultValue="ishikawa" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="ishikawa" className="gap-2"><FishSymbol className="h-4 w-4" /> Ishikawa (6M)</TabsTrigger>
          <TabsTrigger value="five_whys">5 Porquês</TabsTrigger>
        </TabsList>

        {/* ISHIKAWA */}
        <TabsContent value="ishikawa" className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
            <Label className="text-sm font-bold">Problema / Efeito</Label>
            <Input value={ishikawa.problem} onChange={e => setIshikawa(prev => ({ ...prev, problem: e.target.value }))} placeholder="Descreva o problema a ser analisado..." className="mt-2" />
          </div>

          {/* Visual Fishbone */}
          <div className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
            <div className="relative">
              {/* Central spine */}
              <div className="flex items-center justify-center">
                <div className="h-1 flex-1 bg-primary/30" />
                <div className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                  {ishikawa.problem || "Problema"}
                </div>
              </div>

              {/* Categories in grid */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ISHIKAWA_CATEGORIES.map(cat => (
                  <div key={cat.key} className="rounded-lg border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${cat.color}`} />
                      <span className="text-sm font-bold text-foreground">{cat.label}</span>
                    </div>
                    <div className="space-y-2">
                      {ishikawa.categories[cat.key].map((cause, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input value={cause} onChange={e => updateCause(cat.key, i, e.target.value)} placeholder={`Causa ${i + 1}...`} className="h-8 text-sm" />
                          {ishikawa.categories[cat.key].length > 1 && (
                            <Button variant="ghost" size="sm" onClick={() => removeCause(cat.key, i)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addCause(cat.key)} className="h-7 w-full gap-1 text-xs text-muted-foreground">
                        <Plus className="h-3 w-3" /> Adicionar Causa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
            <Label className="text-sm font-bold">Resumo da Análise</Label>
            <div className="mt-3 space-y-2">
              {ISHIKAWA_CATEGORIES.map(cat => {
                const causes = ishikawa.categories[cat.key].filter(c => c.trim());
                if (causes.length === 0) return null;
                return (
                  <div key={cat.key} className="flex items-start gap-2">
                    <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${cat.color}`} />
                    <div>
                      <span className="text-xs font-bold text-foreground">{cat.label}: </span>
                      <span className="text-xs text-muted-foreground">{causes.join(", ")}</span>
                    </div>
                  </div>
                );
              })}
              {Object.values(ishikawa.categories).every(arr => arr.every(c => !c.trim())) && (
                <p className="text-xs text-muted-foreground">Preencha as causas nas categorias acima para ver o resumo.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 5 PORQUÊS */}
        <TabsContent value="five_whys" className="space-y-6">
          <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
            <Label className="text-sm font-bold">Problema Inicial</Label>
            <Input value={fiveWhys.problem} onChange={e => setFiveWhys(prev => ({ ...prev, problem: e.target.value }))} placeholder="Descreva o problema..." className="mt-2" />
          </div>

          <div className="space-y-3">
            {fiveWhys.whys.map((why, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {i === 0 ? "Por que isso aconteceu?" : `Por que "${fiveWhys.whys[i - 1].answer || "..."}"?`}
                  </span>
                </div>
                <Textarea value={why.answer} onChange={e => updateWhy(i, e.target.value)} placeholder={`Resposta para o ${i + 1}º por quê...`} className="min-h-[60px]" />
                {i < fiveWhys.whys.length - 1 && why.answer && (
                  <div className="mt-2 flex justify-center">
                    <div className="h-6 w-0.5 bg-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
            <Label className="text-sm font-bold text-primary">Causa Raiz Identificada</Label>
            <Textarea value={fiveWhys.rootCause} onChange={e => setFiveWhys(prev => ({ ...prev, rootCause: e.target.value }))} placeholder="Com base nas respostas acima, qual é a causa raiz?" className="mt-2 border-primary/30" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RootCauseAnalysis;
