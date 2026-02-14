import { useState } from "react";
import { Shield, CheckCircle2, Lock, FileSignature, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { sha256, generateSignaturePayload } from "@/lib/crypto";

type SignatureRole = "elaborado" | "aprovado" | "validado";

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    title: string;
    content: string | null;
    code: string | null;
  };
  onSigned: () => void;
  defaultRole?: SignatureRole;
}

type Step = "confirm" | "verify" | "signing" | "done";

const ROLE_LABELS: Record<SignatureRole, string> = {
  elaborado: "Elaborado por",
  aprovado: "Aprovado por",
  validado: "Validado por",
};

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const SignatureDialog = ({ open, onOpenChange, document, onSigned, defaultRole = "elaborado" }: SignatureDialogProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("confirm");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signatureResult, setSignatureResult] = useState<{ hash: string; signedAt: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<SignatureRole>(defaultRole);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);

  const reset = () => {
    setStep("confirm");
    setPassword("");
    setLoading(false);
    setSignatureResult(null);
    setSelectedRole(defaultRole);
    // Don't reset failedAttempts/lockoutUntil on close to persist lockout
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const logAudit = async (action: string, details: Record<string, any> = {}, signatureId?: string, docHash?: string) => {
    await supabase.from("signature_audit_log").insert({
      document_id: document.id,
      signature_id: signatureId || null,
      action,
      actor_id: user?.id || null,
      actor_name: user?.email?.split("@")[0] || null,
      actor_email: user?.email || null,
      ip_address: null,
      user_agent: navigator.userAgent,
      details: details as any,
      document_hash: docHash || null,
    } as any);
  };

  const handleVerifyIdentity = async () => {
    if (!password) { toast.error("Digite sua senha para verificar identidade"); return; }

    // Check lockout
    if (lockoutUntil && new Date() < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil.getTime() - Date.now()) / 1000);
      toast.error(`Muitas tentativas falhas. Tente novamente em ${remainingSec} segundos.`);
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user with password
      const { error } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password,
      });
      if (error) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          const lockout = new Date(Date.now() + LOCKOUT_DURATION_MS);
          setLockoutUntil(lockout);
          toast.error(`Conta temporariamente bloqueada após ${MAX_ATTEMPTS} tentativas falhas. Aguarde 5 minutos.`);
        } else {
          toast.error(`Senha incorreta. ${MAX_ATTEMPTS - newAttempts} tentativa(s) restante(s).`);
        }
        await logAudit("identity_verification_failed", { method: "password", attempts: newAttempts });
        return;
      }
      // Reset on success
      setFailedAttempts(0);
      setLockoutUntil(null);
      await logAudit("identity_verified", { method: "password" });
      toast.success("Identidade verificada!");
      setStep("signing");
      // Auto-sign after verification
      await performSigning();
    } catch {
      toast.error("Erro na verificação");
    } finally {
      setLoading(false);
    }
  };

  const performSigning = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const docContent = document.content || document.title;
      const documentHash = await sha256(docContent);
      const timestamp = new Date().toISOString();
      const signerName = user.email?.split("@")[0] || "Usuário";
      const signerEmail = user.email || "";

      const payload = generateSignaturePayload({
        documentId: document.id,
        documentHash,
        signerId: user.id,
        signerName,
        signerEmail,
        timestamp,
      });
      const signatureHash = await sha256(payload);

      await logAudit("document_signed_started", { document_hash: documentHash }, undefined, documentHash);

      const { data: sig, error } = await supabase.from("document_signatures").insert({
        document_id: document.id,
        signer_id: user.id,
        signer_name: signerName,
        signer_email: signerEmail,
        signature_type: "eletronica",
        document_hash: documentHash,
        signature_hash: signatureHash,
        user_agent: navigator.userAgent,
        verification_method: "senha",
        is_verified: true,
        signed_at: timestamp,
        signature_role: selectedRole,
        metadata: { payload_structure: "v1", algorithm: "SHA-256" } as any,
      } as any).select("id").maybeSingle();

      if (error) throw error;

      // Update document as signed
      await supabase.from("quality_documents").update({ is_signed: true } as any).eq("id", document.id);

      await logAudit("document_signed", {
        signature_hash: signatureHash,
        document_hash: documentHash,
        algorithm: "SHA-256",
      }, sig?.id, documentHash);

      setSignatureResult({ hash: signatureHash, signedAt: timestamp });
      setStep("done");
      toast.success("Documento assinado eletronicamente!");
      onSigned();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao assinar documento");
      setStep("confirm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <FileSignature className="h-5 w-5 text-primary" />
            Assinatura Eletrônica
          </DialogTitle>
        </DialogHeader>

        {step === "confirm" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-secondary/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground">Documento</p>
              <p className="mt-1 text-sm font-medium text-foreground">{document.code ? `${document.code} — ` : ""}{document.title}</p>
            </div>
            <div className="grid gap-2">
              <p className="text-xs font-semibold text-muted-foreground">Assinar como</p>
              <div className="flex gap-2">
                {(Object.entries(ROLE_LABELS) as [SignatureRole, string][]).map(([role, label]) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      selectedRole === role
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted-foreground/20 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-warning" />
                <p className="text-sm font-semibold text-foreground">Declaração de Assinatura</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ao assinar este documento eletronicamente, declaro que li e concordo com seu conteúdo.
                A assinatura será registrada com hash criptográfico SHA-256, identificação do signatário,
                data/hora e informações do dispositivo, garantindo autenticidade e integridade conforme
                os padrões de assinatura eletrônica.
              </p>
            </div>
            <Button onClick={() => { setStep("verify"); logAudit("signature_requested"); }} className="w-full gap-2">
              <Lock className="h-4 w-4" /> Prosseguir com Verificação de Identidade
            </Button>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-secondary/50 p-4 text-center">
              <Shield className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 text-sm font-semibold text-foreground">Verificação de Identidade</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Confirme sua identidade digitando sua senha para prosseguir com a assinatura.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Sua Senha</Label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Digite sua senha de acesso"
                onKeyDown={e => e.key === "Enter" && handleVerifyIdentity()}
              />
            </div>
            <Button onClick={handleVerifyIdentity} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Verificar e Assinar
            </Button>
          </div>
        )}

        {step === "signing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Gerando assinatura criptográfica...</p>
            <p className="text-xs text-muted-foreground">Calculando hash SHA-256 e registrando na trilha de auditoria</p>
          </div>
        )}

        {step === "done" && signatureResult && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-safe/30 bg-safe/5 p-6">
              <CheckCircle2 className="h-12 w-12 text-safe" />
              <p className="text-lg font-bold text-foreground">Documento Assinado!</p>
              <p className="text-xs text-muted-foreground text-center">
                A assinatura eletrônica foi registrada com sucesso e está disponível para verificação.
              </p>
            </div>
            <div className="space-y-2 rounded-lg bg-secondary/50 p-4 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hash:</span>
                <span className="text-foreground truncate max-w-[280px]">{signatureResult.hash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data/Hora:</span>
                <span className="text-foreground">{new Date(signatureResult.signedAt).toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Algoritmo:</span>
                <span className="text-foreground">SHA-256</span>
              </div>
            </div>
            <Button onClick={() => handleClose(false)} variant="outline" className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SignatureDialog;
