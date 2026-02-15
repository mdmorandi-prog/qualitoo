import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, BarChart3, FileText, Search, AlertTriangle, Activity,
  Truck, Heart, FileBarChart, GitBranch, BrainCircuit, GraduationCap,
  Workflow, Ruler, RefreshCw, BookOpen, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const categories = [
  { id: "all", label: "Todos" },
  { id: "conformidade", label: "Conformidade" },
  { id: "gestao", label: "Gestão" },
  { id: "analise", label: "Análise" },
  { id: "operacional", label: "Operacional" },
];

const modules = [
  {
    icon: ClipboardCheck, title: "Não Conformidades", category: "conformidade",
    description: "Registro, análise e tratamento de desvios de qualidade com fluxo CAPA integrado.",
    regulatory: "ISO 9001:2015 (10.2) · ISO 13485 · ONA · Anvisa",
    features: ["Classificação por severidade", "Prazos automáticos", "Vínculo com CAPA"],
  },
  {
    icon: BarChart3, title: "Indicadores (KPIs)", category: "analise",
    description: "Monitoramento de indicadores com metas, tendências e alertas automáticos.",
    regulatory: "ISO 9001:2015 (9.1) · ONA · PNGS · CQH",
    features: ["Indicadores compostos", "Gráficos de tendência", "Alertas de meta"],
  },
  {
    icon: FileText, title: "Controle de Documentos", category: "gestao",
    description: "Gestão do ciclo de vida documental com versionamento, aprovação e assinatura eletrônica.",
    regulatory: "ISO 9001:2015 (7.5) · ISO 13485 · ONA · Anvisa",
    features: ["Versionamento", "Assinatura digital", "Controle de validade"],
  },
  {
    icon: Search, title: "Auditorias Internas", category: "conformidade",
    description: "Planejamento, execução e acompanhamento de auditorias com registro de achados.",
    regulatory: "ISO 9001:2015 (9.2) · ISO 19011 · ONA · JCI",
    features: ["Checklists customizáveis", "Achados vinculados", "Planos de ação"],
  },
  {
    icon: AlertTriangle, title: "Eventos Adversos", category: "conformidade",
    description: "Notificação e investigação de eventos com classificação de gravidade.",
    regulatory: "RDC 36/2013 · NOTIVISA · OMS · JCI · ONA",
    features: ["Classificação OMS", "Ações imediatas", "Relatório NOTIVISA"],
  },
  {
    icon: Activity, title: "Gestão de Riscos", category: "analise",
    description: "Matriz de riscos 5×5 com avaliação de probabilidade, impacto e mitigação.",
    regulatory: "ISO 31000 · ISO 14971 · ISO 9001:2015 (6.1) · JCI",
    features: ["Matriz 5×5", "Heat map", "FMEA integrado"],
  },
  {
    icon: Truck, title: "Gestão de Fornecedores", category: "operacional",
    description: "Cadastro, avaliação periódica e qualificação com classificação de criticidade.",
    regulatory: "ISO 9001:2015 (8.4) · ISO 13485 · Anvisa · ONA",
    features: ["Score de desempenho", "Qualificação periódica", "Criticidade"],
  },
  {
    icon: Heart, title: "Pesquisa de Satisfação", category: "gestao",
    description: "NPS, CSAT e pesquisas customizadas para monitorar a experiência do paciente.",
    regulatory: "ISO 9001:2015 (9.1.2) · ONA · PNASS · JCI",
    features: ["NPS automático", "CSAT", "Relatórios de tendência"],
  },
  {
    icon: FileBarChart, title: "Relatórios Regulatórios", category: "conformidade",
    description: "Exportação para NOTIVISA/ANVISA com rastreabilidade completa.",
    regulatory: "RDC 36/2013 · NOTIVISA · Anvisa",
    features: ["Export NOTIVISA", "Rastreabilidade", "Vigilância sanitária"],
  },
  {
    icon: GitBranch, title: "Fluxo CAPA", category: "conformidade",
    description: "Ações Corretivas e Preventivas com 6 etapas completas.",
    regulatory: "ISO 9001:2015 (10.2/10.3) · ISO 13485 · FDA · ONA",
    features: ["6 etapas", "Verificação de eficácia", "Fechamento formal"],
  },
  {
    icon: BrainCircuit, title: "Análise de Causa Raiz", category: "analise",
    description: "Ishikawa (6M), 5 Porquês e assistência de IA para investigação aprofundada.",
    regulatory: "ISO 9001:2015 (10.2) · ISO 13485 · FDA · ICH Q10",
    features: ["Ishikawa com IA", "5 Porquês", "Diagrama de Árvore"],
  },
  {
    icon: GraduationCap, title: "Treinamentos", category: "gestao",
    description: "Gestão de capacitações com controle de validade e materiais didáticos.",
    regulatory: "ISO 9001:2015 (7.2) · ONA · NR-32 · Anvisa",
    features: ["Controle de validade", "Listas de presença", "Certificados"],
  },
  {
    icon: Workflow, title: "Mapeamento de Processos", category: "operacional",
    description: "Modelagem BPMN com editor visual, execução de instâncias e rastreamento.",
    regulatory: "ISO 9001:2015 (4.4) · BPM CBOK · ONA",
    features: ["Editor BPMN visual", "Execução de fluxos", "Histórico"],
  },
  {
    icon: Ruler, title: "Metrologia e Calibração", category: "operacional",
    description: "Rastreamento de equipamentos, certificados e alertas de vencimento.",
    regulatory: "ISO 17025 · Inmetro · Anvisa · ONA",
    features: ["Certificados digitais", "Alertas automáticos", "Histórico"],
  },
  {
    icon: RefreshCw, title: "Gestão de Mudanças", category: "gestao",
    description: "Controle de alterações em processos com análise de impacto e aprovação.",
    regulatory: "ISO 9001:2015 (6.3) · ISO 13485 · FDA · ICH Q10",
    features: ["Análise de impacto", "Aprovação formal", "Rastreabilidade"],
  },
];

const ModulesSection = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const filtered = activeCategory === "all"
    ? modules
    : modules.filter((m) => m.category === activeCategory);

  return (
    <section id="modulos" className="py-16 md:py-24 scroll-mt-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Módulos Integrados
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Gerencie todos os processos de qualidade hospitalar em uma única plataforma.
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat.id)}
              className="gap-1.5"
            >
              {cat.id === "all" && <Filter className="h-3.5 w-3.5" />}
              {cat.label}
            </Button>
          ))}
        </div>

        <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, i) => (
              <motion.div
                key={item.title}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setExpandedCard(expandedCard === i ? null : i)}
                className="group cursor-pointer rounded-xl border bg-card p-6 shadow-[var(--card-shadow)] transition-all hover:shadow-[var(--card-shadow-hover)] hover:border-primary/30 flex flex-col"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {item.category}
                  </Badge>
                </div>
                <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">{item.description}</p>

                {/* Expandable features */}
                <AnimatePresence>
                  {expandedCard === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-1.5 border-t pt-4">
                        {item.features.map((f) => (
                          <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="h-1 w-1 rounded-full bg-accent" />
                            {f}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {item.regulatory && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2">
                    <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="text-[11px] leading-snug text-primary/80 font-medium">{item.regulatory}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default ModulesSection;
