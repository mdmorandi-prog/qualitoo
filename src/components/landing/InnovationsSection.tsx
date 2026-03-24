import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, GitBranch, Clock, BrainCircuit, Gauge, TrendingUp,
  FileText, QrCode, MapPin, ClipboardCheck, BarChart,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const innovations = [
  {
    icon: GitBranch,
    title: "Cascata Inteligente NC→CAPA→Plano→KPI",
    description: "Ao registrar uma NC crítica, o sistema cria automaticamente toda a cadeia: CAPA vinculada, Plano de Ação 5W2H e monitoramento do indicador afetado.",
    tag: "Automação",
    features: ["Geração automática de CAPA", "Plano 5W2H pré-preenchido", "Vínculo com indicador afetado", "Monitoramento de eficácia"],
  },
  {
    icon: Clock,
    title: "Auto-Escalonamento por SLA",
    description: "Itens com prazo vencido são automaticamente escalados para o nível hierárquico superior com notificação em tempo real e contagem regressiva visual.",
    tag: "Governança",
    features: ["3 níveis de escalonamento", "Contagem regressiva visual", "Notificação hierárquica", "Log de escalonamentos"],
  },
  {
    icon: BrainCircuit,
    title: "Classificação de NC por IA",
    description: "A IA analisa título e descrição da NC e sugere severidade, causas raiz prováveis e ações recomendadas antes mesmo do registro.",
    tag: "IA",
    features: ["Sugestão de severidade", "Causas raiz similares", "Ações recomendadas", "Aprendizado contínuo"],
  },
  {
    icon: Gauge,
    title: "Score de Maturidade Qualitoo",
    description: "Índice composto ponderado que avalia a maturidade do sistema em 9 dimensões com gráfico radar e classificação automática.",
    tag: "Analytics",
    features: ["9 dimensões avaliadas", "Gráfico radar interativo", "Classificação Inicial → Excelência", "Evolução temporal"],
  },
  {
    icon: TrendingUp,
    title: "Alertas Preditivos de KPI",
    description: "Regressão linear sobre histórico de medições projeta tendências e alerta quando um indicador tende a sair da meta nos próximos períodos.",
    tag: "IA",
    features: ["Regressão linear automática", "Projeção de tendência", "Alerta antecipado", "Intervalo de confiança"],
  },
  {
    icon: FileText,
    title: "Relatório Executivo Narrativo por IA",
    description: "Gera automaticamente um relatório gerencial narrativo com análise de tendências, insights e recomendações estratégicas baseadas nos dados reais.",
    tag: "IA",
    features: ["Texto narrativo gerado por IA", "Análise de tendências", "Recomendações estratégicas", "Export PDF pronto"],
  },
  {
    icon: QrCode,
    title: "QR Code para Reporte de Ocorrências",
    description: "Gere QR Codes para cada setor. Colaboradores escaneiam e reportam ocorrências instantaneamente pelo celular, sem login.",
    tag: "Mobile",
    features: ["QR Code por setor", "Formulário sem login", "Foto e descrição rápida", "Notificação ao gestor"],
  },
  {
    icon: MapPin,
    title: "Heat Map de Riscos por Setor",
    description: "Visualização setorial dos riscos com mapa de calor dinâmico, permitindo identificar hotspots de risco na instituição.",
    tag: "Visualização",
    features: ["16+ setores mapeados", "Densidade por NCs e riscos", "Alertas visuais críticos", "Tooltips interativos"],
  },
  {
    icon: ClipboardCheck,
    title: "Briefing de Auditoria por IA",
    description: "Antes de cada auditoria, a IA gera um briefing personalizado com pontos de atenção, NCs abertas, riscos críticos e checklist sugerido.",
    tag: "IA",
    features: ["Briefing automático pré-auditoria", "NCs abertas relevantes", "Riscos críticos do setor", "Checklist sugerido por IA"],
  },
  {
    icon: BarChart,
    title: "Benchmarking Anônimo",
    description: "Compare o desempenho do seu sistema com benchmarks do setor hospitalar em indicadores-chave como taxa de NC, tempo de resolução e conformidade.",
    tag: "Benchmark",
    features: ["Comparação com setor", "Indicadores-chave", "Dados anonimizados", "Posição no ranking"],
  },
];

const tagColors: Record<string, string> = {
  "Automação": "bg-primary/10 text-primary border-primary/20",
  "Governança": "bg-warning/10 text-warning border-warning/20",
  "IA": "bg-accent/10 text-accent border-accent/20",
  "Analytics": "bg-safe/10 text-safe border-safe/20",
  "Mobile": "bg-secondary text-secondary-foreground border-border",
  "Visualização": "bg-destructive/10 text-destructive border-destructive/20",
  "Benchmark": "bg-primary/10 text-primary border-primary/20",
};

const InnovationsSection = () => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/[0.03] to-background" />
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20"
          >
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <Badge className="mb-4 border-primary/20 bg-primary/5 text-primary" variant="outline">
            Tecnologia Exclusiva
          </Badge>
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Inovações & Exclusividades
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Funcionalidades exclusivas com IA integrada, automações inteligentes e ferramentas que elevam seu sistema a outro patamar.
          </p>
        </motion.div>

        <motion.div layout className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {innovations.map((item, i) => (
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
                {/* Glow effect on hover */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />

                <div className="relative">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${tagColors[item.tag] || ""}`}>
                      {item.tag}
                    </Badge>
                  </div>
                  <h3 className="mb-2 font-sans text-lg font-semibold text-foreground leading-tight">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>

                  {/* Expandable features — same pattern as ModulesSection */}
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
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Bottom highlight bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-6 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-5"
        >
          {[
            { value: "4", label: "Funcionalidades com IA" },
            { value: "3", label: "Automações Inteligentes" },
            { value: "10", label: "Exclusividades" },
            { value: "100%", label: "Integração Nativa" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-2xl font-bold text-primary">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default InnovationsSection;
