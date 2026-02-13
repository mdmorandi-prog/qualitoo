import { useEffect, useState } from "react";
import { Shield, FileSignature, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Signature {
  id: string;
  signer_name: string;
  signer_email: string;
  signature_hash: string;
  document_hash: string;
  signed_at: string;
  signature_role: string;
  is_verified: boolean;
}

interface DocumentSignatureBlockProps {
  documentId: string;
  documentTitle?: string;
}

const ROLES = [
  { key: "elaborado", label: "Elaborado por", icon: FileSignature },
  { key: "aprovado", label: "Aprovado por", icon: CheckCircle2 },
  { key: "validado", label: "Validado por", icon: Shield },
] as const;

const DocumentSignatureBlock = ({ documentId, documentTitle }: DocumentSignatureBlockProps) => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("document_signatures")
        .select("id, signer_name, signer_email, signature_hash, document_hash, signed_at, signature_role, is_verified")
        .eq("document_id", documentId)
        .is("revoked_at", null)
        .order("signed_at", { ascending: true });
      setSignatures((data as any[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [documentId]);

  if (loading) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/20 p-4 text-center text-xs text-muted-foreground">
        Carregando assinaturas...
      </div>
    );
  }

  const getSignatureForRole = (role: string) =>
    signatures.find(s => s.signature_role === role);

  const hasAnySignature = signatures.length > 0;

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2 border-b border-muted-foreground/20 pb-2">
        <Shield className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-bold text-foreground">Controle de Assinaturas Eletrônicas</h4>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {ROLES.map(({ key, label, icon: Icon }) => {
          const sig = getSignatureForRole(key);
          return (
            <div
              key={key}
              className={`rounded-lg border p-4 transition-colors ${
                sig
                  ? "border-safe/30 bg-safe/5"
                  : "border-dashed border-muted-foreground/20 bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`h-4 w-4 ${sig ? "text-safe" : "text-muted-foreground/50"}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {label}
                </span>
              </div>

              {sig ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">{sig.signer_name}</p>
                  <p className="text-[11px] text-muted-foreground">{sig.signer_email}</p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(sig.signed_at).toLocaleString("pt-BR")}
                  </div>
                  <div className="mt-2 rounded bg-secondary/80 p-2">
                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Hash SHA-256:</p>
                    <p className="font-mono text-[10px] text-foreground break-all leading-relaxed">
                      {sig.signature_hash}
                    </p>
                  </div>
                  {sig.is_verified && (
                    <div className="flex items-center gap-1 text-[11px] text-safe font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Identidade verificada
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center mb-2">
                    <FileSignature className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                  <p className="text-[11px] text-muted-foreground/50">Pendente</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasAnySignature && (
        <div className="rounded bg-secondary/50 px-3 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">
            Assinaturas eletrônicas com integridade garantida por hash criptográfico SHA-256.
            Para verificar a autenticidade, utilize o módulo de Verificação de Assinaturas.
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentSignatureBlock;
