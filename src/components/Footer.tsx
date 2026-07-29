const Footer = () => {
  return (
    <footer className="border-t bg-primary py-8 text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Qualitoo</span>
          </div>
          <div className="text-center text-xs opacity-70">
            <p>Gestão da Qualidade Hospitalar</p>
            <p className="mt-1">© {new Date().getFullYear()} DM Consultoria em TI Ltda. Todos os direitos reservados.</p>
          </div>
          <div className="flex items-center gap-4 text-xs opacity-70">
            <a href="/portal-lgpd" className="underline underline-offset-4 hover:opacity-100">Portal do Titular (LGPD)</a>
            <span>Ref: DM-TI-SGQ-2025-001</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
