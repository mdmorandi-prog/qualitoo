import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import sgqLogo from "@/assets/sgq-logo.png";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Convert username to internal email format
    const email = username === "admin" ? "admin@sgq.local" : `${username}@sgq.local`;
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("Credenciais inválidas. Verifique e tente novamente.");
    } else {
      navigate("/admin");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <img
            src={sgqLogo}
            alt="SGQ Hospitalar"
            className="mx-auto mb-4 h-16 w-16 rounded-xl object-contain"
          />
          <h1 className="font-display text-2xl font-bold text-foreground">SGQ Hospitalar</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sistema de Gestão da Qualidade</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="username" className="text-sm font-semibold">Usuário</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
              placeholder="admin"
              className="mt-1"
              required
              autoComplete="username"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Ex: dmorandi (inicial + sobrenome)
            </p>
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            <LogIn className="h-4 w-4" />
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} DM Consultoria em TI Ltda. Todos os direitos reservados.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
