import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ShieldCheck, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface TwoFactorSetupProps {
  onEnabled: () => void;
  onCancelled: () => void;
}

const TwoFactorSetup = ({ onEnabled, onCancelled }: TwoFactorSetupProps) => {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const enroll = async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) {
        setError("Erro ao iniciar configuração 2FA: " + error.message);
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    };
    enroll();
  }, []);

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      toast.success("Autenticação 2FA ativada com sucesso!");
      onEnabled();
    } catch (err: any) {
      setError(err.message || "Código inválido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-primary">
        <ShieldCheck className="h-5 w-5" />
        <h3 className="font-semibold text-lg">Configurar Autenticação 2FA</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Escaneie o QR Code abaixo com um aplicativo autenticador (Google Authenticator, Authy, etc.) e insira o código gerado.
      </p>

      {qrCode && (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl border bg-white p-3">
            <img src={qrCode} alt="QR Code 2FA" className="h-48 w-48" />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs font-mono">
            <span className="select-all">{secret}</span>
            <button onClick={handleCopySecret} className="text-muted-foreground hover:text-foreground">
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="totp-code" className="text-sm font-semibold">
          Código do Autenticador
        </Label>
        <Input
          id="totp-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="mt-1 text-center tracking-[0.5em] text-lg font-mono"
        />
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onCancelled} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleVerify} disabled={verifyCode.length !== 6 || loading} className="flex-1">
          {loading ? "Verificando..." : "Ativar 2FA"}
        </Button>
      </div>
    </div>
  );
};

export default TwoFactorSetup;
