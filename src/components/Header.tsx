import { Shield, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-semibold text-foreground">Canal de Denúncias</span>
            <span className="ml-2 hidden rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-block">
              NR1 • Lei 14.457/22
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/consultar"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Consultar Protocolo
          </Link>
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Lock className="h-3 w-3" />
            Painel Admin
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
