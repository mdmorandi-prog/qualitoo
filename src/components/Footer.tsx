import { Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-primary py-8 text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Canal de Denúncias Hospitalar</span>
          </div>
          <div className="text-center text-xs opacity-70">
            <p>Em conformidade com a Lei 14.457/22, NR1 e LGPD</p>
            <p className="mt-1">© {new Date().getFullYear()} DM Consultoria em TI Ltda. Todos os direitos reservados.</p>
          </div>
          <div className="text-xs opacity-70">
            Ref: DM-TI-NR1-2024-001
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
