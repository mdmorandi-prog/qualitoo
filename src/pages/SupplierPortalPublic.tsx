import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Upload, ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Doc { id: string; document_name: string; document_type: string | null; status: string | null; uploaded_at: string }
interface Session { supplier: { id: string; name: string } | null; documents: Doc[]; email: string; expires_at: string | null }

const DOC_TYPES = ["Alvará Sanitário", "Licença de Funcionamento", "Certidão Negativa", "Certificação ISO", "Laudo Técnico", "Contrato Social", "Outros"];
const MAX_BYTES = 10 * 1024 * 1024;

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
  r.onerror = reject;
  r.readAsDataURL(file);
});

const statusClass = (s: string | null) =>
  s === "aprovado" ? "bg-safe/10 text-safe" : s === "rejeitado" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning";

const SupplierPortalPublic = () => {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get("token") ?? "");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("supplier-portal-access", { body: { token: token.trim(), ...body } });
    if (error) {
      let msg = "Não foi possível acessar o portal";
      try { const j = await (error as any).context?.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
    return data as Session;
  };

  const enter = async () => {
    if (!token.trim()) { toast.error("Cole o token recebido"); return; }
    setLoading(true);
    try { setSession(await call({ action: "portal_access" })); }
    catch (e: any) { toast.error(e.message); setSession(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (params.get("token")) enter(); /* eslint-disable-next-line */ }, []);

  const send = async () => {
    if (!file || !docName.trim()) { toast.error("Informe o nome e selecione o arquivo"); return; }
    if (file.size > MAX_BYTES) { toast.error("Arquivo maior que 10 MB"); return; }
    setSending(true);
    try {
      const file_base64 = await toBase64(file);
      const res = await call({
        action: "upload", document_name: docName.trim(), document_type: docType, notes,
        file_name: file.name, content_type: file.type || "application/octet-stream", file_base64,
      });
      setSession(res);
      setDocName(""); setNotes(""); setFile(null);
      (document.getElementById("supplier-file") as HTMLInputElement | null)?.value && ((document.getElementById("supplier-file") as HTMLInputElement).value = "");
      toast.success("Documento enviado! A equipe da Qualidade fará a análise.");
    } catch (e: any) { toast.error(e.message); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Qualitoo · Portal do Fornecedor</h1>
            <p className="text-xs text-muted-foreground">Envio seguro de documentos para qualificação</p>
          </div>
          {session && (
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setSession(null); setToken(""); }}>
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {!session ? (
          <div className="mx-auto max-w-md rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Acesse com seu token</h2>
            </div>
            <Label htmlFor="token">Token de acesso</Label>
            <Input id="token" value={token} onChange={e => setToken(e.target.value)} placeholder="Cole aqui o token recebido" className="mt-1 font-mono" onKeyDown={e => e.key === "Enter" && enter()} />
            <Button className="mt-4 w-full" onClick={enter} disabled={loading}>{loading ? "Validando..." : "Entrar"}</Button>
            <p className="mt-3 text-[11px] text-muted-foreground">O token é válido por até 7 dias. Todos os acessos são registrados por segurança.</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
              <p className="text-xs text-muted-foreground">Fornecedor</p>
              <p className="text-lg font-semibold text-foreground">{session.supplier?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {session.email}{session.expires_at ? ` · Acesso válido até ${new Date(session.expires_at).toLocaleString("pt-BR")}` : ""}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground"><Upload className="h-4 w-4" /> Enviar documento</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Tipo de documento</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="docname">Nome do documento</Label>
                  <Input id="docname" className="mt-1" value={docName} onChange={e => setDocName(e.target.value)} placeholder="Ex: Alvará 2026" maxLength={200} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="supplier-file">Arquivo (PDF, imagem ou Word, até 10 MB)</Label>
                  <Input id="supplier-file" type="file" className="mt-1" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea id="notes" className="mt-1" value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000} />
                </div>
              </div>
              <Button className="mt-4" onClick={send} disabled={sending}>{sending ? "Enviando..." : "Enviar documento"}</Button>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
              <h3 className="mb-3 font-semibold text-foreground">Documentos enviados</h3>
              {session.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum documento enviado ainda.</p>
              ) : session.documents.map(d => (
                <div key={d.id} className="mb-2 flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.document_name}</p>
                      <p className="text-[11px] text-muted-foreground">{d.document_type ?? "—"} · {new Date(d.uploaded_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <Badge className={statusClass(d.status)}>{d.status ?? "pendente"}</Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SupplierPortalPublic;
