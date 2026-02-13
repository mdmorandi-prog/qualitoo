import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const ThemeToggle = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={`text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground ${
        collapsed ? "w-full justify-center" : "w-full justify-start gap-2"
      }`}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {!collapsed && (theme === "dark" ? "Modo Claro" : "Modo Escuro")}
    </Button>
  );
};

export default ThemeToggle;
