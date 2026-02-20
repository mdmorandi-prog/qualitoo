import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Shield, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const AnimatedNumber = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, target, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [target, count]);

  return (
    <motion.span>
      {rounded.get() !== undefined && (
        <motion.span>{rounded}</motion.span>
      )}
      {suffix}
    </motion.span>
  );
};

const stats = [
  { value: 30, suffix: "+", label: "Módulos Integrados" },
  { value: 100, suffix: "%", label: "Conformidade ONA" },
  { value: 15, suffix: "+", label: "Normas Atendidas" },
];

const badges = [
  "ISO 9001:2015",
  "ONA Nível 3",
  "JCI",
  "Anvisa",
  "LGPD",
];

const HeroSection = () => {
  return (
    <section className="hero-gradient relative overflow-hidden py-20 md:py-32">
      {/* Animated background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2em0wIDEyYzMuMzE0IDAgNi0yLjY4NiA2LTZzLTIuNjg2LTYtNi02LTYgMi42ODYtNiA2IDIuNjg2IDYgNiA2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      {/* Floating orbs */}
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute right-[10%] top-[20%] h-64 w-64 rounded-full bg-accent/10 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 20, 0], opacity: [0.05, 0.15, 0.05] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute left-[5%] bottom-[10%] h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl"
      />

      <div className="container relative mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-4xl text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm border border-primary-foreground/10"
          >
            <Shield className="h-4 w-4" />
            Excelência em Gestão da Qualidade Hospitalar
          </motion.div>

          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            A plataforma completa para{" "}
            <span className="relative">
              <span className="relative z-10 text-accent-foreground">gestão da qualidade</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="absolute bottom-1 left-0 z-0 h-3 w-full origin-left rounded bg-accent/30"
              />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-lg leading-relaxed text-primary-foreground/75 md:text-xl max-w-2xl mx-auto">
            Gerencie não conformidades, indicadores, documentos, auditorias, riscos e acreditação
            em uma única plataforma integrada e segura.
          </p>

          {/* Compliance badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-10 flex flex-wrap justify-center gap-2"
          >
            {badges.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 px-3 py-1 text-xs font-medium text-primary-foreground/80 backdrop-blur-sm"
              >
                <CheckCircle2 className="h-3 w-3 text-accent" />
                {badge}
              </span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              asChild
              size="lg"
              className="gap-2 bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 text-base px-8"
            >
              <Link to="/admin/login">
                <ArrowRight className="h-5 w-5" />
                Acessar o Sistema
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 text-base"
            >
              <a href="#modulos">
                Conhecer Módulos
              </a>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6"
        >
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-primary-foreground md:text-4xl">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-1 text-xs text-primary-foreground/60 font-medium md:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
