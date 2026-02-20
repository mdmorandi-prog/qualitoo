import { motion } from "framer-motion";
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
  },
  {
    icon: Clock,
    title: "Auto-Escalonamento por SLA",
    description: "Itens com prazo vencido são automaticamente escalados para o nível hierárquico superior com notificação em tempo real e contagem regressiva visual.",
    tag: "Governança",
  },
  {
    icon: BrainCircuit,
    title: "Classificação de NC por IA",
    description: "A IA analisa título e descrição da NC e sugere severidade, causas raiz prováveis e ações recomendadas antes mesmo do registro.",
    tag: "IA",
  },
  {
    icon: Gauge,
    title: "Score de Maturidade SGQ",
    description: "Índice composto ponderado que avalia a maturidade do sistema em 9 dimensões com gráfico radar e classificação automática (Inicial → Excelência).",
    tag: "Analytics",
  },
  {
    icon: TrendingUp,
    title: "Alertas Preditivos de KPI",
    description: "Regressão linear sobre histórico de medições projeta tendências e alerta quando um indicador tende a sair da meta nos próximos períodos.",
    tag: "IA",
  },
  {
    icon: FileText,
    title: "Relatório Executivo Narrativo por IA",
    description: "Gera automaticamente um relatório gerencial narrativo com análise de tendências, insights e recomendações estratégicas baseadas nos dados reais.",
    tag: "IA",
  },
  {
    icon: QrCode,
    title: "QR Code para Reporte de Ocorrências",
    description: "Gere QR Codes para cada setor. Colaboradores escaneiam e reportam ocorrências instantaneamente pelo celular, sem login.",
    tag: "Mobile",
  },
  {
    icon: MapPin,
    title: "Heat Map de Riscos por Setor",
    description: "Visualização geográfica/setorial dos riscos com mapa de calor dinâmico, permitindo identificar hotspots de risco na instituição.",
    tag: "Visualização",
  },
  {
    icon: ClipboardCheck,
    title: "Briefing de Auditoria por IA",
    description: "Antes de cada auditoria, a IA gera um briefing personalizado com pontos de atenção, NCs abertas, riscos críticos e checklist sugerido.",
    tag: "IA",
  },
  {
    icon: BarChart,
    title: "Benchmarking Anônimo",
    description: "Compare o desempenho do seu SGQ com benchmarks do setor hospitalar em indicadores-chave como taxa de NC, tempo de resolução e conformidade.",
    tag: "Benchmark",
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
            Funcionalidades exclusivas com IA integrada, automações inteligentes e ferramentas que elevam seu SGQ a outro patamar.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-3">
          {innovations.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl border bg-card p-6 shadow-[var(--card-shadow)] transition-all duration-300 hover:shadow-[var(--card-shadow-hover)] hover:border-primary/30 hover:-translate-y-1"
            >
              {/* Glow effect on hover */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />

              <div className="relative">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/20">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${tagColors[item.tag] || ""}`}>
                    {item.tag}
                  </Badge>
                </div>
                <h3 className="mb-2 text-base font-bold text-foreground leading-tight">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom highlight bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-6 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-5"
        >
          {[
            { value: "4", label: "Features com IA" },
            { value: "3", label: "Automações" },
            { value: "10", label: "Exclusividades" },
            { value: "0", label: "Concorrentes com isso" },
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
