import { useState, useEffect } from "react";
import { Shield, ShieldCheck, ShieldX, Clock, User, Hash, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { sha256 } from "@/lib/crypto";
import { toast } from "sonner";

interface SignatureVerifierProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    title: string;
    content: string | null;
    code: string | null;
  };
}

interface Signature {
  id: string;
  signer_name: string;
  signer_email: string;
  document_hash: string;
  signature_hash: string;
  signed_at: string;
  is_verified: boolean;
  verification_method: string;
  signature_type: string;
  revoked_at: string | null;
}

const SignatureVerifier = ({ open, onOpenChange, document }: SignatureVerifierProps) => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<"valid" | "invalid" | "pending">("pending");

  useEffect(() => {
    if (open) fetchSignatures();
  }, [open]);

  const fetchSignatures = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("document_id", document.id)
      .order("signed_at", { ascending: false });
    if (error) toast.error("Erro ao carregar assinaturas");
    else setSignatures((data as any[]) ?? []);
    setLoading(false);
  };

  const verifyIntegrity = async () => {
    setVerifying(true);
    try {
      const currentHash = await sha256(document.content || document.title);
      const allValid = signatures.every(s => s.document_hash === currentHash && !s.revoked_at);
      setIntegrityStatus(allValid && signatures.length > 0 ? "valid" : "invalid");

      // Log audit
      await supabase.from("signature_audit_log").insert({
        document_id: document.id,
        action: "signature_verified",
        actor_id: null,
        details: { result: allValid ? "valid" : "invalid", current_hash: currentHash, signatures_count: signatures.length } as any,
        document_hash: currentHash,
      } as any);

      toast[allValid ? "success" : "error"](
        allValid ? "Integridade verificada!" : "Documento foi alterado após assinatura!"
      );
    } catch {
      toast.error("Erro na verificação");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Shield className="h-5 w-5 text-primary" />
            Verificação de Assinaturas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Documento</p>
            <p className="text-sm font-medium text-foreground">{document.code ? `${document.code} — ` : ""}{document.title}</p>
          </div>

          {/* Integrity Check */}
          <div className={`flex items-center justify-between rounded-lg border p-4 ${
            integrityStatus === "valid" ? "border-safe/30 bg-safe/5" :
            integrityStatus === "invalid" ? "border-destructive/30 bg-destructive/5" :
            "border-border bg-card"
          }`}>
            <div className="flex items-center gap-3">
              {integrityStatus === "valid" ? (
                <ShieldCheck className="h-6 w-6 text-safe" />
              ) : integrityStatus === "invalid" ? (
                <ShieldX className="h-6 w-6 text-destructive" />
              ) : (
                <Shield className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {integrityStatus === "valid" ? "Integridade Verificada" :
                   integrityStatus === "invalid" ? "Integridade Comprometida" :
                   "Verificação Pendente"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {integrityStatus === "valid" ? "O documento não foi alterado após a assinatura." :
                   integrityStatus === "invalid" ? "O conteúdo do documento foi modificado ou não há assinaturas." :
                   "Clique para verificar a integridade do documento."}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={verifyIntegrity} disabled={verifying || loading}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
            </Button>
          </div>

          {/* Signatures List */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-foreground">Assinaturas ({signatures.length})</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : signatures.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma assinatura registrada.</p>
            ) : (
              <div className="space-y-3">
                {signatures.map(sig => (
                  <div key={sig.id} className={`rounded-lg border p-4 ${sig.revoked_at ? "border-destructive/20 bg-destructive/5" : "bg-card"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{sig.signer_name}</p>
                          <p className="text-xs text-muted-foreground">{sig.signer_email}</p>
                        </div>
                      </div>
                      {sig.revoked_at ? (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">REVOGADA</span>
                      ) : sig.is_verified ? (
                        <span className="rounded-full bg-safe/10 px-2 py-0.5 text-[10px] font-bold text-safe">VERIFICADA</span>
                      ) : (
                        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">PENDENTE</span>
                      )}
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(sig.signed_at).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        <span className="font-mono truncate max-w-[400px]">{sig.signature_hash}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>Tipo: {sig.signature_type === "eletronica" ? "Eletrônica" : sig.signature_type} | Verificação: {sig.verification_method === "senha" ? "Senha" : sig.verification_method}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureVerifier;
