import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl rounded-2xl bg-primary p-10 text-center text-primary-foreground shadow-xl md:p-14"
        >
          <Sparkles className="mx-auto mb-4 h-10 w-10 opacity-80" />
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Pronto para elevar a qualidade?
          </h2>
          <p className="mb-8 text-primary-foreground/75 max-w-lg mx-auto">
            Acesse o painel administrativo e comece a gerenciar a qualidade hospitalar com o Qualitoo de forma integrada, segura e em conformidade.
          </p>
          <Button
            asChild
            size="lg"
            className="gap-2 bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 text-base px-8"
          >
            <Link to="/admin/login">
              <ArrowRight className="h-5 w-5" />
              Acessar o Painel
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
