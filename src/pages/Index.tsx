import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  UserX,
  AlertTriangle,
  Scale,
  FileSearch,
  Lock,
  ArrowRight,
  HandHeart,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InfoCard from "@/components/InfoCard";

const occurrenceTypes = [
  { icon: UserX, title: "Assédio Moral", description: "Humilhações, isolamento, pressão excessiva, intimidação ou perseguição sistemática no ambiente de trabalho." },
  { icon: AlertTriangle, title: "Assédio Sexual", description: "Condutas de conotação sexual não desejadas, insinuações, toques inapropriados ou chantagem sexual." },
  { icon: Scale, title: "Corrupção e Fraude", description: "Desvio de recursos, fraude em processos, conflito de interesses ou favorecimento indevido." },
  { icon: HandHeart, title: "Segurança do Paciente", description: "Práticas inseguras, negligência nos cuidados, descumprimento de protocolos assistenciais." },
];

const processSteps = [
  { icon: FileSearch, title: "Registro", description: "Sua denúncia é registrada com protocolo único e criptografado." },
  { icon: Lock, title: "Análise", description: "O Comitê de Ética avalia a denúncia de forma independente e sigilosa." },
  { icon: Shield, title: "Resolução", description: "Medidas corretivas são aplicadas com acompanhamento do denunciante." },
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
              Canal Seguro e Confidencial
            </div>
            <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Canal de Denúncias Hospitalar
            </h1>
            <p className="mb-10 text-lg leading-relaxed text-primary-foreground/80 md:text-xl">
              Um espaço seguro para relatar irregularidades, assédio e condutas antiéticas.
              Sua voz é essencial para a saúde e segurança de todos.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-accent text-accent-foreground shadow-lg hover:bg-accent/90"
              >
                <Link to="/denuncia?modo=anonimo">
                  <EyeOff className="h-5 w-5" />
                  Denunciar Anonimamente
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="gap-2 border-primary-foreground/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link to="/denuncia?modo=identificado">
                  <Eye className="h-5 w-5" />
                  Quero Identificar-me
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* O que pode ser denunciado */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">
              O que pode ser denunciado?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Conheça os tipos de ocorrências que podem ser reportados através deste canal, em conformidade com a NR1 e a Lei 14.457/22.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {occurrenceTypes.map((item, i) => (
              <InfoCard key={i} icon={item.icon} title={item.title} description={item.description} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Entendendo o Assédio Moral */}
      <section className="bg-secondary/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="mb-6 text-center text-3xl font-bold text-foreground md:text-4xl">
                Entendendo o Assédio Moral
              </h2>
              <div className="rounded-xl border bg-card p-8 shadow-[var(--card-shadow)]">
                <p className="mb-6 leading-relaxed text-muted-foreground">
                  É importante diferenciar um <strong className="text-foreground">conflito profissional pontual</strong> de{" "}
                  <strong className="text-foreground">assédio moral</strong>. O assédio moral se caracteriza por:
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { title: "Repetitividade", desc: "Condutas que se repetem ao longo do tempo, não sendo um episódio isolado." },
                    { title: "Intencionalidade", desc: "Ações direcionadas a humilhar, constranger ou desestabilizar o profissional." },
                    { title: "Degradação", desc: "Deterioração progressiva do ambiente de trabalho e da saúde do trabalhador." },
                  ].map((item, i) => (
                    <div key={i} className="rounded-lg bg-secondary/80 p-4">
                      <h4 className="mb-2 font-sans text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 rounded-lg bg-primary/5 p-4 text-sm text-muted-foreground">
                  <strong className="text-foreground">Importante:</strong> Um desentendimento pontual ou uma cobrança
                  profissional legítima não configura assédio. Caso tenha dúvidas, registre sua denúncia mesmo assim — o
                  Comitê de Ética avaliará cada caso com imparcialidade.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground md:text-4xl">
            Como funciona o processo?
          </h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {processSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-sans text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Garantias */}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Shield className="mx-auto mb-6 h-12 w-12 opacity-80" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Suas Garantias</h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            O canal opera sob protocolos rigorosos de segurança e confidencialidade.
          </p>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              { title: "Anonimato Garantido", desc: "Denúncias anônimas não podem ser rastreadas. Nenhum dado de identificação é coletado." },
              { title: "Não-Retaliação", desc: "Qualquer retaliação contra denunciantes é tratada como falta gravíssima pela instituição." },
              { title: "Comitê Independente", desc: "A análise é conduzida por agentes de compliance treinados, sem interferência hierárquica." },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-white/5 p-6 backdrop-blur">
                <h3 className="mb-2 font-sans text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-primary-foreground/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Pronto para fazer sua denúncia?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Escolha a forma mais adequada para você. Sua contribuição é fundamental para um ambiente de trabalho mais justo e seguro.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link to="/denuncia?modo=anonimo">
                <EyeOff className="h-5 w-5" />
                Denúncia Anônima
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to="/denuncia?modo=identificado">
                <Eye className="h-5 w-5" />
                Denúncia Identificada
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="gap-2">
              <Link to="/consultar">
                <FileSearch className="h-5 w-5" />
                Consultar Protocolo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
