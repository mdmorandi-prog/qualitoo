import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ShieldCheck } from "lucide-react";

interface TwoFactorVerifyProps {
  onVerified: () => void;
  onCancel: () => void;
}

const TwoFactorVerify = ({ onVerified, onCancel }: TwoFactorVerifyProps) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factorsData.totp[0];
      if (!totpFactor) throw new Error("Nenhum fator TOTP encontrado.");

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      onVerified();
    } catch (err: any) {
      setError(err.message || "Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Verificação 2FA</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Insira o código de 6 dígitos gerado pelo seu aplicativo autenticador.
      </p>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="mfa-code" className="text-sm font-semibold">
          Código de Verificação
        </Label>
        <Input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          onKeyDown={handleKeyDown}
          placeholder="000000"
          className="mt-1 text-center tracking-[0.5em] text-lg font-mono"
          autoFocus
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Voltar
        </Button>
        <Button onClick={handleVerify} disabled={code.length !== 6 || loading} className="flex-1">
          {loading ? "Verificando..." : "Verificar"}
        </Button>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
