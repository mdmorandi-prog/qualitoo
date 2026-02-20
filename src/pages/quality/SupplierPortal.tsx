import { useEffect, useState } from "react";
import { Plus, Search, ExternalLink, Eye, Send, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PortalToken {
  id: string; supplier_id: string; token: string; email: string;
  is_active: boolean; last_accessed_at: string | null; expires_at: string | null; created_at: string;
}

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [supRes, tokRes, docRes] = await Promise.all([
      supabase.from("suppliers").select("id, name, contact_email").order("name"),
      supabase.from("supplier_portal_tokens").select("*").order("created_at", { ascending: false }),
      supabase.from("supplier_portal_documents").select("*").order("uploaded_at", { ascending: false }),
    ]);
    setSuppliers((supRes.data as any[]) ?? []);
    setTokens((tokRes.data as any[]) ?? []);
    setDocs((docRes.data as any[]) ?? []);
    setLoading(false);
  };

  const generateToken = async (supplier: Supplier) => {
    if (!supplier.contact_email) {
      toast.error("Fornecedor precisa ter e-mail cadastrado");
      return;
    }
    const token = crypto.randomUUID().replace(/-/g, "");
    const expires = new Date();
    expires.setMonth(expires.getMonth() + 6);

    const { error } = await supabase.from("supplier_portal_tokens").insert({
      supplier_id: supplier.id, token, email: supplier.contact_email,
      expires_at: expires.toISOString(),
    } as any);
    if (error) { toast.error("Erro ao gerar token"); console.error(error); return; }
    toast.success("Token de acesso gerado!");
    fetchAll();
  };

  const revokeToken = async (tokenId: string) => {
    await supabase.from("supplier_portal_tokens").update({ is_active: false } as any).eq("id", tokenId);
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
                      <p className="text-xs font-mono">{t.token.slice(0, 12)}...</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.is_active ? "Ativo" : "Revogado"} • Expira: {t.expires_at ? new Date(t.expires_at).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>
                    {t.is_active && (
                      <Button variant="outline" size="sm" onClick={() => revokeToken(t.id)} className="text-destructive">Revogar</Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-2 gap-1" onClick={() => generateToken(selectedSupplier)}>
                  <Plus className="h-3 w-3" /> Gerar Novo Token
                </Button>
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
