import { motion } from "framer-motion";
import { Award, Shield, Users, Zap, Globe, Lock } from "lucide-react";

const highlights = [
  { icon: Award, title: "Acreditação ONA/JCI", description: "Ferramentas alinhadas aos padrões de acreditação hospitalar mais exigentes do mercado." },
  { icon: Shield, title: "Segurança & LGPD", description: "Dados protegidos com controle de acesso granular, RLS e conformidade total com a LGPD." },
  { icon: Users, title: "Gestão Colaborativa", description: "Papéis e permissões granulares para equipes multidisciplinares de qualquer porte." },
  { icon: Zap, title: "IA Integrada", description: "Análise de causa raiz, revisão de contratos e assistência inteligente em todo o sistema." },
  { icon: Globe, title: "100% Web", description: "Acesse de qualquer dispositivo, sem instalação. Responsivo e otimizado para mobile." },
  { icon: Lock, title: "Assinatura Digital", description: "Assinatura eletrônica avançada com hash SHA-256 e trilha de auditoria completa." },
];

const HighlightsSection = () => {
  return (
    <section className="bg-primary py-16 text-primary-foreground md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Award className="mx-auto mb-4 h-10 w-10 opacity-80" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Por que o SGQ Hospitalar?</h2>
          <p className="mx-auto max-w-2xl text-primary-foreground/75">
            Uma solução completa para hospitais que buscam excelência operacional e acreditação.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group rounded-xl bg-primary-foreground/5 p-6 backdrop-blur border border-primary-foreground/10 transition-all hover:bg-primary-foreground/10"
            >
              <item.icon className="mb-4 h-8 w-8 opacity-80 transition-transform group-hover:scale-110" />
              <h3 className="mb-2 font-sans text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-primary-foreground/70 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HighlightsSection;
