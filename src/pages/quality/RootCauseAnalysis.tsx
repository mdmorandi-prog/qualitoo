import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, FishSymbol, Bot, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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

// Tree Diagram Component
interface TreeNode {
  id: string;
  label: string;
  children: TreeNode[];
}

const TreeDiagram = () => {
  const [rootProblem, setRootProblem] = useState("Problema Principal");
  const [tree, setTree] = useState<TreeNode>({
    id: "root",
    label: "",
    children: [
      { id: "c1", label: "", children: [] },
      { id: "c2", label: "", children: [] },
    ],
  });

  const updateNodeLabel = useCallback((nodes: TreeNode, nodeId: string, label: string): TreeNode => {
    if (nodes.id === nodeId) return { ...nodes, label };
    return { ...nodes, children: nodes.children.map(c => updateNodeLabel(c, nodeId, label)) };
  }, []);

  const addChild = useCallback((nodes: TreeNode, parentId: string): TreeNode => {
    if (nodes.id === parentId) {
      return { ...nodes, children: [...nodes.children, { id: `n_${Date.now()}`, label: "", children: [] }] };
    }
    return { ...nodes, children: nodes.children.map(c => addChild(c, parentId)) };
  }, []);

  const removeNode = useCallback((nodes: TreeNode, nodeId: string): TreeNode => {
    return { ...nodes, children: nodes.children.filter(c => c.id !== nodeId).map(c => removeNode(c, nodeId)) };
  }, []);

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    return (
      <div key={node.id} className="ml-4 first:ml-0" style={{ marginLeft: depth > 0 ? 24 : 0 }}>
        <div className="flex items-center gap-1.5 mb-1">
          {depth > 0 && <div className="h-4 w-3 border-l-2 border-b-2 border-primary/30 rounded-bl" />}
          <div className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${depth === 0 ? "bg-primary/10 border-primary" : "bg-card"}`}>
            <Input
              value={node.label}
              onChange={e => setTree(prev => updateNodeLabel(prev, node.id, e.target.value))}
              placeholder={depth === 0 ? "Causa principal" : `Sub-causa nível ${depth}`}
              className="h-7 border-0 bg-transparent text-xs p-0 shadow-none focus-visible:ring-0"
            />
            <Button variant="ghost" size="sm" onClick={() => setTree(prev => addChild(prev, node.id))} className="h-5 w-5 p-0 text-muted-foreground hover:text-primary" title="Adicionar sub-causa">
              <Plus className="h-3 w-3" />
            </Button>
            {depth > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setTree(prev => removeNode(prev, node.id))} className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive" title="Remover">
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {node.children.length > 0 && (
          <div className="border-l-2 border-primary/20 ml-3 pl-1">
            {node.children.map(c => renderNode(c, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
        <Label className="text-sm font-bold">Problema / Efeito</Label>
        <Input value={rootProblem} onChange={e => setRootProblem(e.target.value)} placeholder="Descreva o problema..." className="mt-2" />
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
        <h3 className="mb-4 text-sm font-bold text-foreground">Árvore de Causas</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground">
            {rootProblem || "Problema"}
          </div>
          <div className="h-0.5 w-8 bg-primary/30" />
        </div>
        <div className="space-y-1">
          {tree.children.map(c => renderNode(c, 1))}
        </div>
        <Button variant="outline" size="sm" className="mt-4 gap-1" onClick={() => setTree(prev => addChild(prev, "root"))}>
          <Plus className="h-3 w-3" /> Adicionar Causa Raiz
        </Button>
      </div>
    </div>
  );
};

const RootCauseAnalysis = () => {
  const [aiSource, setAiSource] = useState<string | null>(null);

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

  // Load AI-generated data from sessionStorage if available
  useEffect(() => {
    const raw = sessionStorage.getItem("ai_root_cause_data");
    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      sessionStorage.removeItem("ai_root_cause_data");

      setAiSource(data.ncTitle || "NC");

      // Fill Ishikawa
      const aiIshikawa = data.ishikawa || {};
      const categories: Record<string, string[]> = {};
      for (const cat of ISHIKAWA_CATEGORIES) {
        const causes = aiIshikawa[cat.key];
        categories[cat.key] = Array.isArray(causes) && causes.length > 0 ? causes : [""];
      }
      setIshikawa({
        problem: data.ncTitle || "",
        categories,
      });

      // Fill 5 Whys
      const aiWhys = data.fiveWhys || [];
      const whys = aiWhys.length > 0
        ? aiWhys.map((w: any) => ({ question: w.question || "Por que?", answer: w.answer || "" }))
        : [
            { question: "Por que isso aconteceu?", answer: "" },
            { question: "Por que?", answer: "" },
            { question: "Por que?", answer: "" },
            { question: "Por que?", answer: "" },
            { question: "Por que?", answer: "" },
          ];

      setFiveWhys({
        problem: data.ncTitle || "",
        whys,
        rootCause: data.rootCauseSummary || "",
      });

      toast.success("Dados da análise de IA carregados para revisão!");
    } catch {
      // ignore parse errors
    }
  }, []);

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

      {/* AI Source Banner */}
      {aiSource && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <Bot className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              Análise gerada por IA para: <span className="text-primary">{aiSource}</span>
            </p>
            <p className="text-xs text-muted-foreground">Revise e edite os dados abaixo antes de aprovar.</p>
          </div>
          <CheckCircle2 className="h-5 w-5 text-safe" />
        </div>
      )}

      <Tabs defaultValue="ishikawa" className="w-full">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="ishikawa" className="gap-2"><FishSymbol className="h-4 w-4" /> Ishikawa (6M)</TabsTrigger>
          <TabsTrigger value="five_whys">5 Porquês</TabsTrigger>
          <TabsTrigger value="tree">Diagrama de Árvore</TabsTrigger>
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

        {/* TREE DIAGRAM */}
        <TabsContent value="tree" className="space-y-6">
          <TreeDiagram />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RootCauseAnalysis;
