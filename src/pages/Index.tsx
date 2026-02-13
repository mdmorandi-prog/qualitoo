import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  ClipboardCheck,
  BarChart3,
  FileText,
  Search,
  AlertTriangle,
  ArrowRight,
  Award,
  Activity,
  Users,
  Truck,
  Heart,
  FileBarChart,
  GitBranch,
  BrainCircuit,
  GraduationCap,
  Workflow,
  Ruler,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const modules = [
  {
    icon: ClipboardCheck,
    title: "Não Conformidades",
    description: "Registro, análise e tratamento de desvios de qualidade com fluxo CAPA integrado.",
    regulatory: "ISO 9001:2015 (Cláusula 10.2) · ISO 13485 · ONA Nível 2/3 · RDC Anvisa",
  },
  {
    icon: BarChart3,
    title: "Indicadores (KPIs)",
    description: "Monitoramento de indicadores de desempenho com metas, tendências e alertas automáticos.",
    regulatory: "ISO 9001:2015 (Cláusula 9.1) · ONA · PNGS · Programa CQH",
  },
  {
    icon: FileText,
    title: "Controle de Documentos",
    description: "Gestão do ciclo de vida documental com versionamento, aprovação, validade e assinatura eletrônica.",
    regulatory: "ISO 9001:2015 (Cláusula 7.5) · ISO 13485 · ONA · RDC 665/2022 Anvisa",
  },
  {
    icon: Search,
    title: "Auditorias Internas",
    description: "Planejamento, execução e acompanhamento de auditorias com registro de achados e planos de ação.",
    regulatory: "ISO 9001:2015 (Cláusula 9.2) · ISO 19011 · ONA Nível 2/3 · JCI",
  },
  {
    icon: AlertTriangle,
    title: "Eventos Adversos",
    description: "Notificação e investigação de eventos com classificação de gravidade e ações imediatas.",
    regulatory: "RDC 36/2013 Anvisa · NOTIVISA · OMS · JCI IPSG · ONA Nível 3",
  },
  {
    icon: Activity,
    title: "Gestão de Riscos",
    description: "Matriz de riscos 5×5 com avaliação de probabilidade, impacto e planos de mitigação.",
    regulatory: "ISO 31000 · ISO 14971 · ISO 9001:2015 (Cláusula 6.1) · ONA · JCI",
  },
  {
    icon: Truck,
    title: "Gestão de Fornecedores",
    description: "Cadastro, avaliação periódica e qualificação de fornecedores com classificação de criticidade.",
    regulatory: "ISO 9001:2015 (Cláusula 8.4) · ISO 13485 · RDC Anvisa · ONA",
  },
  {
    icon: Heart,
    title: "Pesquisa de Satisfação",
    description: "NPS, CSAT e pesquisas customizadas para monitorar a experiência do paciente.",
    regulatory: "ISO 9001:2015 (Cláusula 9.1.2) · ONA · PNASS · JCI",
  },
  {
    icon: FileBarChart,
    title: "Relatórios Regulatórios",
    description: "Exportação para NOTIVISA/ANVISA com rastreabilidade completa de eventos adversos.",
    regulatory: "RDC 36/2013 · NOTIVISA · Anvisa · Vigilância Sanitária",
  },
  {
    icon: GitBranch,
    title: "Fluxo CAPA",
    description: "Ações Corretivas e Preventivas com 6 etapas: Identificação, Análise de Causa Raiz, Plano de Ação, Implementação, Verificação de Eficácia e Fechamento.",
    regulatory: "ISO 9001:2015 (Cláusula 10.2/10.3) · ISO 13485 · FDA 21 CFR Part 820 · ONA",
  },
  {
    icon: BrainCircuit,
    title: "Análise de Causa Raiz",
    description: "Ferramentas visuais de Ishikawa (6M) e 5 Porquês com assistência de IA para investigação aprofundada.",
    regulatory: "ISO 9001:2015 (Cláusula 10.2) · ISO 13485 · FDA · ICH Q10",
  },
  {
    icon: GraduationCap,
    title: "Treinamentos",
    description: "Gestão de capacitações com controle de validade, participantes e materiais didáticos.",
    regulatory: "ISO 9001:2015 (Cláusula 7.2) · ONA · NR-32 · RDC Anvisa",
  },
  {
    icon: Workflow,
    title: "Mapeamento de Processos",
    description: "Modelagem BPMN com editor visual, execução de instâncias e rastreamento de fluxos.",
    regulatory: "ISO 9001:2015 (Cláusula 4.4) · BPM CBOK · ONA",
  },
  {
    icon: Ruler,
    title: "Metrologia e Calibração",
    description: "Rastreamento de equipamentos, certificados de calibração e alertas de vencimento.",
    regulatory: "ISO 17025 · RBC/Inmetro · RDC 665/2022 Anvisa · ONA",
  },
  {
    icon: RefreshCw,
    title: "Gestão de Mudanças",
    description: "Controle de alterações em processos críticos com análise de impacto e aprovação formal.",
    regulatory: "ISO 9001:2015 (Cláusula 6.3) · ISO 13485 · FDA · ICH Q10",
  },
];

const highlights = [
  { icon: Award, title: "Acreditação ONA/JCI", description: "Ferramentas alinhadas aos padrões de acreditação hospitalar mais exigentes." },
  { icon: Shield, title: "Segurança & LGPD", description: "Dados protegidos com controle de acesso, RLS e conformidade com a LGPD." },
  { icon: Users, title: "Gestão Colaborativa", description: "Papéis e permissões granulares para equipes multidisciplinares." },
];

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2em0wIDEyYzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-primary-foreground">
              <Shield className="h-4 w-4" />
              Excelência em Gestão da Qualidade
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
              SGQ Hospitalar
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-primary-foreground/80 md:text-xl">
              Plataforma integrada para gestão da qualidade, segurança do paciente e acreditação hospitalar.
              Conformidade com ONA, JCI e normas regulatórias.
            </p>
            <Button
              asChild
              size="lg"
              className="gap-2 bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
            >
              <Link to="/admin/login">
                <ArrowRight className="h-5 w-5" />
                Acessar o Sistema
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
              Módulos Integrados
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Gerencie todos os processos de qualidade hospitalar em uma única plataforma.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                viewport={{ once: true }}
                className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)] transition-shadow hover:shadow-lg flex flex-col"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">{item.description}</p>
                {item.regulatory && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2">
                    <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="text-[11px] leading-snug text-primary/80 font-medium">{item.regulatory}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Award className="mx-auto mb-6 h-12 w-12 opacity-80" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Por que o SGQ Hospitalar?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            Uma solução completa para hospitais que buscam excelência operacional e acreditação.
          </p>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {highlights.map((item, i) => (
              <div key={i} className="rounded-xl bg-white/5 p-6 backdrop-blur">
                <item.icon className="mx-auto mb-3 h-8 w-8 opacity-90" />
                <h3 className="mb-2 font-sans text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-primary-foreground/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Pronto para elevar a qualidade?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Acesse o painel administrativo e comece a gerenciar a qualidade hospitalar de forma integrada.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/admin/login">
              <ArrowRight className="h-5 w-5" />
              Acessar o Painel
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
