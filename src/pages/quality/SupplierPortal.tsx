import { useEffect, useState } from "react";
import { Plus, Search, ExternalLink, Eye, Send, FileText, Link2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/auditLog";

interface PortalToken {
  id: string; supplier_id: string; token: string; email: string;
  is_active: boolean; last_accessed_at: string | null; expires_at: string | null; created_at: string;
  access_count: number | null; last_ip: string | null; revoked_at: string | null;
}

interface AccessLogEntry {
  id: string; token_id: string | null; supplier_id: string | null; action: string;
  ip_address: string | null; created_at: string;
}

/** Política de segurança: tokens do portal expiram em no máximo 7 dias. */
const TOKEN_TTL_DAYS = 7;

interface PortalDoc {
  id: string; supplier_id: string; document_name: string; document_type: string;
  file_url: string | null; status: string; notes: string | null; uploaded_at: string;
}

interface Supplier {
  id: string; name: string; contact_email: string | null;
}

const SupplierPortal = () => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [tokens, setTokens] = useState<PortalToken[]>([]);
  const [docs, setDocs] = useState<PortalDoc[]>([]);
  const [accessLog, setAccessLog] = useState<AccessLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [supRes, tokRes, docRes, logRes] = await Promise.all([
      supabase.from("suppliers").select("id, name, contact_email").order("name"),
      supabase.from("supplier_portal_tokens").select("*").order("created_at", { ascending: false }),
      supabase.from("supplier_portal_documents").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("supplier_portal_access_log").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setSuppliers((supRes.data as any[]) ?? []);
    setTokens((tokRes.data as any[]) ?? []);
    setDocs((docRes.data as any[]) ?? []);
    setAccessLog((logRes.data as any[]) ?? []);
    setLoading(false);
  };

  const generateToken = async (supplier: Supplier) => {
    if (!supplier.contact_email) {
      toast.error("Fornecedor precisa ter e-mail cadastrado");
      return;
    }
    // Token forte (256 bits) com expiração forçada em 7 dias
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    const expires = new Date();
    expires.setDate(expires.getDate() + TOKEN_TTL_DAYS);

    const { data: created, error } = await supabase.from("supplier_portal_tokens").insert({
      supplier_id: supplier.id, token, email: supplier.contact_email,
      expires_at: expires.toISOString(), created_by: user?.id ?? null,
    } as any).select("id").maybeSingle();
    if (error) { toast.error("Erro ao gerar token"); console.error(error); return; }
    await logAuditEvent({
      action: "generate_supplier_token", module: "supplier_portal",
      recordId: created?.id, details: { supplier: supplier.name, expires_at: expires.toISOString() },
    });
    toast.success(`Token gerado! Válido por ${TOKEN_TTL_DAYS} dias.`);
    fetchAll();
  };

  const revokeToken = async (tokenId: string) => {
    await supabase.from("supplier_portal_tokens")
      .update({ is_active: false, revoked_at: new Date().toISOString() } as any)
      .eq("id", tokenId);
    await logAuditEvent({ action: "revoke_supplier_token", module: "supplier_portal", recordId: tokenId });
    toast.success("Token revogado");
    fetchAll();
  };

  const updateDocStatus = async (docId: string, status: string) => {
    await supabase.from("supplier_portal_documents").update({
      status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id,
    } as any).eq("id", docId);
    toast.success("Status atualizado");
    fetchAll();
  };

  const openDetail = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setDetailOpen(true);
  };

  const filtered = suppliers.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const getSupplierTokens = (supplierId: string) => tokens.filter(t => t.supplier_id === supplierId);
  const getSupplierDocs = (supplierId: string) => docs.filter(d => d.supplier_id === supplierId);

  const portalUrl = `${window.location.origin}/supplier-portal`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Portal do Fornecedor</h2>
          <p className="text-sm text-muted-foreground">Gestão de acesso externo para fornecedores</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Fornecedores", value: suppliers.length, color: "text-foreground" },
          { label: "Tokens Ativos", value: tokens.filter(t => t.is_active).length, color: "text-safe" },
          { label: "Docs Pendentes", value: docs.filter(d => d.status === "pendente").length, color: "text-warning" },
          { label: "Docs Aprovados", value: docs.filter(d => d.status === "aprovado").length, color: "text-accent" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar fornecedor..." className="pl-10" /></div>

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Fornecedor</TableHead><TableHead>E-mail</TableHead><TableHead>Token</TableHead><TableHead>Documentos</TableHead><TableHead>Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.map(s => {
              const sTokens = getSupplierTokens(s.id);
              const sDocs = getSupplierDocs(s.id);
              const activeToken = sTokens.find(t => t.is_active);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-xs">{s.contact_email || "—"}</TableCell>
                  <TableCell>
                    {activeToken ? (
                      <Badge className="bg-safe/10 text-safe text-[10px]">Ativo</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground text-[10px]">Sem acesso</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-[10px]">{sDocs.length} doc(s)</Badge>
                      {sDocs.filter(d => d.status === "pendente").length > 0 && (
                        <Badge className="bg-warning/10 text-warning text-[10px]">{sDocs.filter(d => d.status === "pendente").length} pendente(s)</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(s)}><Eye className="h-4 w-4" /></Button>
                      {!activeToken && s.contact_email && (
                        <Button variant="ghost" size="sm" onClick={() => generateToken(s)} title="Gerar Token"><Link2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Portal - {selectedSupplier?.name}</DialogTitle></DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Tokens de Acesso</h4>
                {getSupplierTokens(selectedSupplier.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum token gerado.</p>
                ) : getSupplierTokens(selectedSupplier.id).map(t => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 mb-2">
                    <div>
                      <p className="text-xs font-mono">{t.token.slice(0, 6)}••••••{t.token.slice(-4)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.is_active ? "Ativo" : "Revogado"} • Expira: {t.expires_at ? new Date(t.expires_at).toLocaleString("pt-BR") : "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Acessos: {t.access_count ?? 0} • Último: {t.last_accessed_at ? new Date(t.last_accessed_at).toLocaleString("pt-BR") : "nunca"}
                        {t.last_ip ? ` • IP ${t.last_ip}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {t.is_active && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(t.token); toast.success("Token copiado!"); }} title="Copiar token"><Copy className="h-3 w-3" /></Button>
                          <Button variant="outline" size="sm" onClick={() => revokeToken(t.id)} className="text-destructive">Revogar</Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={() => generateToken(selectedSupplier)}>
                  <Plus className="h-3 w-3" /> Gerar Novo Token
                </Button>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  Política de segurança: expiração forçada em {TOKEN_TTL_DAYS} dias, limite de 30 acessos por hora
                  e registro de todos os acessos (data, IP e ação).
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Trilha de Acessos</h4>
                {accessLog.filter(l => l.supplier_id === selectedSupplier.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum acesso registrado.</p>
                ) : (
                  <div className="max-h-52 space-y-1 overflow-y-auto">
                    {accessLog.filter(l => l.supplier_id === selectedSupplier.id).map(l => (
                      <div key={l.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-[11px]">
                        <span className={l.action === "rate_limited" ? "text-destructive font-medium" : "text-foreground"}>
                          {l.action === "rate_limited" ? "Bloqueado por limite de acessos" : l.action}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(l.created_at).toLocaleString("pt-BR")}{l.ip_address ? ` • ${l.ip_address}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Documentos Enviados</h4>
                {getSupplierDocs(selectedSupplier.id).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum documento enviado pelo fornecedor.</p>
                ) : getSupplierDocs(selectedSupplier.id).map(d => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border p-3 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{d.document_name}</p>
                        <p className="text-[10px] text-muted-foreground">{d.document_type} • {new Date(d.uploaded_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={d.status === "aprovado" ? "bg-safe/10 text-safe" : d.status === "rejeitado" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>
                        {d.status}
                      </Badge>
                      {d.status === "pendente" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs text-safe" onClick={() => updateDocStatus(d.id, "aprovado")}>Aprovar</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => updateDocStatus(d.id, "rejeitado")}>Rejeitar</Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierPortal;
