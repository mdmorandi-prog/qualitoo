import { Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <div>
            <span className="text-lg font-semibold text-foreground">Qualitoo</span>
            <span className="ml-2 hidden rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-block">
              Gestão da Qualidade
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
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
