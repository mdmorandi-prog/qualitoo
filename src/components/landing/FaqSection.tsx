import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O sistema atende aos requisitos da ONA Nível 3?",
    answer: "Sim. O SGQ Hospitalar foi projetado para atender integralmente os requisitos de acreditação ONA em todos os níveis (1, 2 e 3), incluindo gestão de riscos, indicadores de desempenho, gestão de documentos e melhoria contínua.",
  },
  {
    question: "Como funciona a conformidade com a LGPD?",
    answer: "O sistema possui um módulo dedicado de conformidade LGPD com mapeamento de dados pessoais, base legal, período de retenção e controle de consentimento. Além disso, todo o acesso é controlado por políticas de segurança em nível de linha (RLS).",
  },
  {
    question: "Preciso instalar algum software?",
    answer: "Não. O SGQ Hospitalar é 100% baseado em nuvem e acessível via navegador web. Funciona em desktops, tablets e smartphones sem necessidade de instalação.",
  },
  {
    question: "Como funciona a assinatura eletrônica de documentos?",
    answer: "Utilizamos assinatura eletrônica avançada com hash SHA-256, registro de IP, geolocalização e user agent. Cada assinatura gera um código de verificação único e uma trilha de auditoria completa e imutável.",
  },
  {
    question: "Quantos usuários podem acessar o sistema?",
    answer: "Não há limite de usuários. O sistema suporta papéis e permissões granulares, permitindo configurar acessos específicos por módulo, setor e função para toda a equipe multidisciplinar.",
  },
  {
    question: "O sistema gera relatórios para a Anvisa?",
    answer: "Sim. O módulo de Relatórios Regulatórios exporta dados no formato exigido pela Anvisa/NOTIVISA, com rastreabilidade completa de eventos adversos e notificações de vigilância sanitária.",
  },
];

const FaqSection = () => {
  return (
    <section className="py-16 md:py-24 bg-secondary/20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
            Perguntas Frequentes
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Tire suas dúvidas sobre o sistema.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border bg-card px-5 shadow-sm"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FaqSection;
