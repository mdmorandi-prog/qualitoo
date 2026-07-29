import { useState } from "react";
import { Link } from "react-router-dom";
import { Shield, Send, Search, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REQUEST_TYPES: Record<string, string> = {
  acesso: "Acesso aos meus dados",
  correcao: "Correção de dados",
  exclusao: "Exclusão / eliminação de dados",
  portabilidade: "Portabilidade dos dados",
  revogacao_consentimento: "Revogação de consentimento",
  anonimizacao: "Anonimização ou bloqueio",
  informacao_compartilhamento: "Informação sobre compartilhamento",
  oposicao: "Oposição ao tratamento",
};

const STATUS_LABELS: Record<string, string> = {
  recebida: "Recebida",
  em_analise: "Em análise",
  aguardando_titular: "Aguardando informações do titular",
  concluida: "Concluída",
  recusada: "Recusada",
};

const emptyForm = {
  request_type: "", requester_name: "", requester_email: "", requester_document: "",
  requester_phone: "", relationship: "", description: "",
};

const PortalLgpd = () => {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [protocol, setProtocol] = useState<string | null>(null);

  const [lookup, setLookup] = useState("");
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const submit = async () => {
    if (!form.request_type || !form.requester_name || !form.requester_email || !form.description) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.requester_email)) {
      toast.error("Informe um e-mail válido");
      return;
    }
    setSending(true);
    const { data, error } = await supabase
      .from("lgpd_requests" as any)
      .insert({
        request_type: form.request_type,
        requester_name: form.requester_name.trim().slice(0, 200),
        requester_email: form.requester_email.trim().slice(0, 255),
        requester_document: form.requester_document.trim() || null,
        requester_phone: form.requester_phone.trim() || null,
        relationship: form.relationship.trim() || null,
        description: form.description.trim().slice(0, 4000),
      } as any)
      .select("protocol")
      .single();
    setSending(false);
    if (error) { toast.error("Não foi possível registrar sua solicitação."); return; }
    setProtocol((data as any).protocol);
    setForm(emptyForm);
  };

  const doLookup = async () => {
    if (!lookup.trim()) return;
    setLookupLoading(true);
    setLookupResult(null);
    const { data, error } = await supabase.rpc("lookup_lgpd_request" as any, { p_protocol: lookup.trim().toUpperCase() });
    setLookupLoading(false);
    if (error) { toast.error("Erro ao consultar"); return; }
    const row = (data as any[])?.[0];
    if (!row) { toast.error("Protocolo não encontrado"); return; }
    setLookupResult(row);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-display text-xl font-bold text-foreground">Qualitoo</Link>
          <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" /> Portal LGPD</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
        <section className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-foreground">Portal do Titular de Dados</h1>
          <p className="text-muted-foreground">
            Exerça seus direitos previstos no Art. 18 da Lei Geral de Proteção de Dados (Lei 13.709/2018).
            Sua solicitação será respondida em até 15 dias.
          </p>
        </section>

        {protocol ? (
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Solicitação registrada
              </CardTitle>
              <CardDescription>Guarde o protocolo abaixo para acompanhar o andamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-lg border bg-muted/40 p-4 text-center font-mono text-lg font-bold text-foreground">{protocol}</p>
              <Button variant="outline" onClick={() => setProtocol(null)}>Registrar nova solicitação</Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nova solicitação</CardTitle>
              <CardDescription>Os campos marcados com * são obrigatórios.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label>Tipo de solicitação *</Label>
                <Select value={form.request_type} onValueChange={v => setForm(f => ({ ...f, request_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REQUEST_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2"><Label>Nome completo *</Label><Input maxLength={200} value={form.requester_name} onChange={e => setForm(f => ({ ...f, requester_name: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>E-mail *</Label><Input type="email" maxLength={255} value={form.requester_email} onChange={e => setForm(f => ({ ...f, requester_email: e.target.value }))} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-2"><Label>CPF</Label><Input maxLength={20} value={form.requester_document} onChange={e => setForm(f => ({ ...f, requester_document: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Telefone</Label><Input maxLength={30} value={form.requester_phone} onChange={e => setForm(f => ({ ...f, requester_phone: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Vínculo</Label><Input maxLength={100} value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} placeholder="Paciente, colaborador..." /></div>
              </div>
              <div className="grid gap-2">
                <Label>Descreva sua solicitação *</Label>
                <Textarea rows={5} maxLength={4000} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhe o que você deseja em relação aos seus dados pessoais." />
              </div>
              <Button onClick={submit} disabled={sending} className="gap-2 sm:w-fit">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar solicitação
              </Button>
              <p className="text-xs text-muted-foreground">
                Os dados informados serão utilizados exclusivamente para o atendimento desta solicitação,
                com base no cumprimento de obrigação legal (Art. 7º, II da LGPD).
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acompanhar solicitação</CardTitle>
            <CardDescription>Informe o protocolo recebido no momento do registro.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={lookup} onChange={e => setLookup(e.target.value)} placeholder="LGPD-20260729-A1B2C3" />
              <Button variant="outline" onClick={doLookup} disabled={lookupLoading} className="gap-2">
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Consultar
              </Button>
            </div>
            {lookupResult && (
              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <p><strong>Protocolo:</strong> <span className="font-mono">{lookupResult.protocol}</span></p>
                <p><strong>Status:</strong> {STATUS_LABELS[lookupResult.status] ?? lookupResult.status}</p>
                <p><strong>Registrada em:</strong> {new Date(lookupResult.created_at).toLocaleDateString("pt-BR")}</p>
                <p><strong>Prazo de resposta:</strong> {new Date(lookupResult.due_date).toLocaleDateString("pt-BR")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PortalLgpd;
