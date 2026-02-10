import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index: number;
}

const InfoCard = ({ icon: Icon, title, description, index }: InfoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      className="group rounded-xl border bg-card p-6 shadow-[var(--card-shadow)] transition-shadow hover:shadow-[var(--card-shadow-hover)]"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 font-sans text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default InfoCard;
