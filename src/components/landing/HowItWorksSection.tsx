import { motion } from "framer-motion";
import { ClipboardList, Search, Wrench, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Registre",
    description: "Cadastre NCs, eventos adversos, riscos e documentos de forma padronizada.",
  },
  {
    icon: Search,
    title: "Analise",
    description: "Investigue causas raiz com Ishikawa, 5 Porquês e assistência de IA.",
  },
  {
    icon: Wrench,
    title: "Corrija",
    description: "Implemente ações corretivas e preventivas com fluxo CAPA completo.",
  },
  {
    icon: TrendingUp,
    title: "Monitore",
    description: "Acompanhe KPIs, tendências e eficácia das ações em dashboards interativos.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Como Funciona
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Ciclo completo de melhoria contínua — do registro à verificação de eficácia.
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-4xl">
          {/* Connector line */}
          <div className="absolute top-12 left-[10%] right-[10%] hidden h-0.5 bg-border md:block" />

          <div className="grid gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-card shadow-[var(--card-shadow)] border border-border">
                  <step.icon className="h-10 w-10 text-primary" />
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
