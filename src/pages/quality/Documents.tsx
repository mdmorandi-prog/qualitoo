import { useEffect, useState, useRef } from "react";
import { Plus, Search, Eye, Upload, FileUp, AlertTriangle, ArrowRight, CheckCircle2, FileText, Lock, FileSignature, Shield, ScrollText, Clock, XCircle } from "lucide-react";
import PdfWatermarkViewer from "@/components/documents/PdfWatermarkViewer";
import SignatureDialog from "@/components/documents/SignatureDialog";
import SignatureVerifier from "@/components/documents/SignatureVerifier";
import SignatureAuditLog from "@/components/documents/SignatureAuditLog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { executeWorkflowRules } from "@/lib/workflowEngine";

type DocStatus = "rascunho" | "em_revisao" | "aprovado" | "obsoleto";

interface Doc {
  id: string; title: string; code: string | null; description: string | null;
  category: string | null; sector: string | null; version: number;
  status: DocStatus; content: string | null; valid_until: string | null;
  created_at: string; is_signed: boolean; file_url: string | null;
}

const statusConfig: Record<DocStatus, { label: string; color: string; icon: string }> = {
  rascunho: { label: "Rascunho", color: "bg-muted text-muted-foreground", icon: "📝" },
  em_revisao: { label: "Em Revisão", color: "bg-warning/10 text-warning", icon: "🔍" },
  aprovado: { label: "Aprovado", color: "bg-safe/10 text-safe", icon: "✅" },
  obsoleto: { label: "Obsoleto", color: "bg-destructive/10 text-destructive", icon: "⛔" },
};

const workflowSteps: { status: DocStatus; label: string; color: string }[] = [
  { status: "rascunho", label: "Rascunho", color: "border-muted-foreground bg-muted" },
  { status: "em_revisao", label: "Em Revisão", color: "border-warning bg-warning/10" },
  { status: "aprovado", label: "Aprovado", color: "border-safe bg-safe/10" },
  { status: "obsoleto", label: "Obsoleto", color: "border-destructive bg-destructive/10" },
];

const parseDocumentHeader = (text: string, fileName: string) => {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result: Partial<typeof initialForm> & { is_signed?: boolean } = {};
  const codeMatch = fileName.match(/^([A-Z]{2,5}[-_]\d{2,4})/i);
  if (codeMatch) result.code = codeMatch[1].replace("_", "-").toUpperCase();
  const catMap: Record<string, string> = {
    POP: "POP", IT: "IT", MAN: "Manual", POL: "Política", PRO: "Procedimento",
    REG: "Registro", FOR: "Formulário", FLU: "Fluxograma", NOR: "Norma",
  };
  if (result.code) {
    const prefix = result.code.split(/[-_]/)[0].toUpperCase();
    if (catMap[prefix]) result.category = catMap[prefix];
  }
  if (!result.category) {
    const catMatch = text.match(/(?:tipo|categoria|documento)[:\s]*(POP|IT|Manual|Política|Procedimento|Registro|Formulário|Fluxograma|Norma)/i);
    if (catMatch) result.category = catMatch[1];
  }
  if (!result.category) {
    const fnUpper = fileName.toUpperCase();
    for (const [key, val] of Object.entries(catMap)) {
      if (fnUpper.includes(key)) { result.category = val; break; }
    }
  }
  if (lines.length > 0) {
    const firstLine = lines[0];
    if (firstLine.length > 3 && firstLine.length < 200) result.title = firstLine;
  }
  if (!result.title) {
    result.title = fileName.replace(/\.[^.]+$/, "").replace(/^[A-Z]{2,5}[-_]\d{2,4}[-_]?/i, "").replace(/[-_]/g, " ").trim();
  }
  const sectorPatterns = [
    /(?:setor|departamento|área|unidade)[:\s]+([^\n,;]+)/i,
    /(?:setor|departamento|área|unidade)\s*[-–]\s*([^\n,;]+)/i,
  ];
  for (const pattern of sectorPatterns) {
    const match = text.match(pattern);
    if (match) { result.sector = match[1].trim(); break; }
  }
  if (!result.sector) {
    const sectorKeywords = ["UTI", "Centro Cirúrgico", "Enfermagem", "Farmácia", "Laboratório", "Radiologia", "Administrativo", "RH", "CME", "Emergência", "Ambulatório"];
    const combined = (fileName + " " + (lines[0] || "")).toUpperCase();
    for (const s of sectorKeywords) {
      if (combined.includes(s.toUpperCase())) { result.sector = s; break; }
    }
  }
  if (lines.length > 1 && lines[1].length < 300) result.description = lines[1];
  if (lines.length > 2) result.content = lines.slice(2).join("\n");
  else if (lines.length > 0) result.content = text;
  const fullText = text;
  const validityPatterns = [
    /(?:validade|válido até|vigência|vencimento|data de expiração)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:validade|válido até|vigência)[:\s]*(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i,
  ];
  for (const pattern of validityPatterns) {
    const match = fullText.match(pattern);
    if (match) {
      const dateStr = match[1];
      let parsed: Date | null = null;
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts[2]?.length === 4) parsed = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
        else if (parts[0]?.length === 4) parsed = new Date(dateStr.replace(/\//g, "-"));
      } else {
        parsed = new Date(dateStr);
      }
      if (parsed && !isNaN(parsed.getTime())) {
        result.valid_until = parsed.toISOString().split("T")[0];
      }
      break;
    }
  }
  const signaturePatterns = [
    /assinado?\s*(por|digitalmente|eletronicamente)/i,
    /assinatura[:\s]/i,
    /responsável[:\s]+\S+/i,
    /aprovado\s+por[:\s]+\S+/i,
    /____+/,
    /assinatura\s*digital/i,
    /certificado\s*digital/i,
  ];
  result.is_signed = signaturePatterns.some(p => p.test(fullText));
  return result;
};

const initialForm = { title: "", code: "", description: "", category: "", sector: "", content: "", valid_until: "" };

// Workflow permission rules: who can transition to each status
const workflowPermissions: Record<DocStatus, { from: DocStatus[]; requiredRole: "admin" | "analyst" | "any" }> = {
  rascunho: { from: [], requiredRole: "any" }, // initial state
  em_revisao: { from: ["rascunho"], requiredRole: "any" },
  aprovado: { from: ["em_revisao"], requiredRole: "admin" },
  obsoleto: { from: ["aprovado"], requiredRole: "admin" },
};

const canTransition = (currentStatus: DocStatus, newStatus: DocStatus, isAdmin: boolean, isAnalyst: boolean): boolean => {
  if (currentStatus === newStatus) return true;
  const rule = workflowPermissions[newStatus];
  if (!rule.from.includes(currentStatus)) return false;
  if (rule.requiredRole === "admin" && !isAdmin) return false;
  return true;
};

const Documents = () => {
  const { user, isAdmin, isAnalyst } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [specialFilter, setSpecialFilter] = useState<"pending_sig" | "expired" | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isSigned, setIsSigned] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfViewerDoc, setPdfViewerDoc] = useState<Doc | null>(null);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signDoc, setSignDoc] = useState<Doc | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyDoc, setVerifyDoc] = useState<Doc | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditDoc, setAuditDoc] = useState<Doc | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ ...initialForm });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("quality_documents").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar");
    else setDocs((data as any[]) ?? []);
    setLoading(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setImporting(true);
    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      setFileUrl(urlData.publicUrl);
      let text = "";
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        text = await file.text();
      } else if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        text = await file.text();
      }
      const parsed = parseDocumentHeader(text, file.name);
      setForm(f => ({
        ...f, title: parsed.title || f.title, code: parsed.code || f.code,
        description: parsed.description || f.description, category: parsed.category || f.category,
        sector: parsed.sector || f.sector, content: parsed.content || f.content,
        valid_until: parsed.valid_until || f.valid_until,
      }));
      setIsSigned(parsed.is_signed ?? false);
      toast.success("Arquivo importado! Campos preenchidos automaticamente.");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao importar arquivo");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const { error } = await supabase.from("quality_documents").insert({
      title: form.title, code: form.code || null, description: form.description || null,
      category: form.category || null, sector: form.sector || null,
      content: form.content || null, valid_until: form.valid_until || null, created_by: user.id,
      file_url: fileUrl, is_signed: isSigned,
    } as any);
    if (error) { toast.error("Erro ao criar"); console.error(error); }
    else {
      toast.success("Documento criado!"); setDialogOpen(false); setForm({ ...initialForm }); setFileUrl(null); setIsSigned(false);
      const { data: created } = await supabase.from("quality_documents").select("*").eq("title", form.title).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (created) executeWorkflowRules("quality_documents", "record_created", created, undefined, user.id);
      fetchData();
    }
  };

  const updateStatus = async (id: string, newStatus: DocStatus) => {
    const doc = docs.find(d => d.id === id);
    if (!doc) return;
    if (!canTransition(doc.status, newStatus, isAdmin, isAnalyst)) {
      toast.error(
        newStatus === "aprovado" || newStatus === "obsoleto"
          ? "Apenas administradores podem aprovar ou obsolescer documentos."
          : `Transição inválida: ${statusConfig[doc.status].label} → ${statusConfig[newStatus].label}`
      );
      return;
    }
    const update: any = { status: newStatus };
    if (newStatus === "aprovado") { update.approved_by = user?.id; update.approved_at = new Date().toISOString(); }
    const { error } = await supabase.from("quality_documents").update(update).eq("id", id);
    if (error) toast.error("Erro");
    else {
      toast.success("Status atualizado");
      const updatedRecord = { ...doc, ...update, id };
      executeWorkflowRules("quality_documents", "status_change", updatedRecord, doc, user?.id);
      fetchData();
    }
  };

  const now = new Date();
  const pendingSigCount = docs.filter(d => !d.is_signed && d.status !== "obsoleto").length;
  const expiredCount = docs.filter(d => d.valid_until && new Date(d.valid_until) < now && d.status !== "obsoleto").length;

  const filtered = docs
    .filter(d => filterStatus === "all" || d.status === filterStatus)
    .filter(d => {
      if (specialFilter === "pending_sig") return !d.is_signed && d.status !== "obsoleto";
      if (specialFilter === "expired") return d.valid_until && new Date(d.valid_until) < now && d.status !== "obsoleto";
      return true;
    })
    .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.code && d.code.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Controle de Documentos</h2>
          <p className="text-sm text-muted-foreground">Gestão de procedimentos, políticas e manuais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Documento</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader><DialogTitle className="font-display">Criar Documento</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center">
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx" className="hidden" onChange={handleImportFile} />
                <FileUp className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Importe um documento existente para preencher os campos automaticamente</p>
                <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  <Upload className="h-4 w-4" />{importing ? "Importando..." : "Importar Arquivo"}
                </Button>
                {fileUrl && <p className="mt-2 text-xs text-safe">✓ Arquivo anexado</p>}
              </div>
              <div className="grid gap-2"><Label>Título *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Código</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="POP-001" /></div>
                <div className="grid gap-2"><Label>Validade</Label><Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Categoria</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="POP, Manual, IT..." /></div>
                <div className="grid gap-2"><Label>Setor</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="grid gap-2"><Label>Conteúdo</Label><Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="min-h-[150px]" placeholder="Conteúdo do documento..." /></div>
              <Button onClick={handleCreate} className="w-full">Criar Documento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Document Workflow Pipeline */}
      <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
        <h3 className="mb-4 text-sm font-bold text-foreground">Pipeline de Documentos</h3>
        <div className="flex items-stretch gap-0 overflow-x-auto">
          {workflowSteps.map((step, idx) => {
            const count = docs.filter(d => d.status === step.status).length;
            const isActive = filterStatus === step.status;
            return (
              <div key={step.status} className="flex items-stretch">
                <button
                  onClick={() => setFilterStatus(filterStatus === step.status ? "all" : step.status)}
                  className={`relative flex min-w-[120px] flex-1 flex-col items-center justify-center rounded-lg border-2 px-4 py-3 transition-all ${step.color} ${isActive ? "ring-2 ring-primary shadow-md scale-105" : "hover:scale-[1.02]"}`}
                >
                  <span className="text-lg">{statusConfig[step.status].icon}</span>
                  <span className="mt-1 text-xs font-bold text-foreground">{step.label}</span>
                  <span className="mt-0.5 text-2xl font-bold text-foreground">{count}</span>
                </button>
                {idx < workflowSteps.length - 1 && (
                  <div className="flex items-center px-1.5">
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Filter Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => { setSpecialFilter(specialFilter === "pending_sig" ? null : "pending_sig"); setFilterStatus("all"); }}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${specialFilter === "pending_sig" ? "ring-2 ring-warning border-warning bg-warning/10" : "bg-card shadow-[var(--card-shadow)] hover:shadow-md"}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{pendingSigCount}</p>
            <p className="text-xs text-muted-foreground">Assinaturas Pendentes</p>
          </div>
        </button>
        <button
          onClick={() => { setSpecialFilter(specialFilter === "expired" ? null : "expired"); setFilterStatus("all"); }}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${specialFilter === "expired" ? "ring-2 ring-destructive border-destructive bg-destructive/10" : "bg-card shadow-[var(--card-shadow)] hover:shadow-md"}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
            <p className="text-xs text-muted-foreground">Documentos Vencidos</p>
          </div>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-5">
        {[
          { label: "Total", value: docs.length, color: "text-foreground" },
          { label: "Aprovados", value: docs.filter(d => d.status === "aprovado").length, color: "text-safe" },
          { label: "Em Revisão", value: docs.filter(d => d.status === "em_revisao").length, color: "text-warning" },
          { label: "Obsoletos", value: docs.filter(d => d.status === "obsoleto").length, color: "text-destructive" },
          { label: "Não Assinados", value: docs.filter(d => !d.is_signed && d.status !== "obsoleto").length, color: "text-destructive" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {docs.filter(d => !d.is_signed && d.status !== "obsoleto").length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-foreground">Documentos sem assinatura detectados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {docs.filter(d => !d.is_signed && d.status !== "obsoleto").map(d => d.code || d.title).join(", ")}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Código</TableHead><TableHead>Título</TableHead><TableHead>Versão</TableHead><TableHead>Status</TableHead><TableHead>Assinado</TableHead><TableHead>Validade</TableHead><TableHead>Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum documento.</TableCell></TableRow>
            : filtered.map(d => {
              const isExpired = d.valid_until && new Date(d.valid_until) < now && d.status !== "obsoleto";
              return (
              <TableRow key={d.id} className={isExpired ? "bg-destructive/5" : !d.is_signed && d.status !== "obsoleto" ? "bg-warning/5" : ""}>
                <TableCell className="font-mono text-xs font-semibold">{d.code || "—"}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {d.title}
                    {isExpired && <span className="shrink-0 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">VENCIDO</span>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">v{d.version}</TableCell>
                <TableCell>
                  <Select value={d.status} onValueChange={v => updateStatus(d.id, v as DocStatus)}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([k, v]) => {
                        const allowed = canTransition(d.status, k as DocStatus, isAdmin, isAnalyst);
                        return (
                          <SelectItem key={k} value={k} disabled={!allowed}>
                            <span className="flex items-center gap-1">
                              {!allowed && <Lock className="h-3 w-3 text-muted-foreground" />}
                              {v.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {d.is_signed
                    ? <span className="rounded-full bg-safe/10 px-2 py-0.5 text-xs font-medium text-safe">Sim</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning"><AlertTriangle className="h-3 w-3" /> Não</span>
                  }
                </TableCell>
                <TableCell className={`text-xs ${isExpired ? "font-bold text-destructive" : "text-muted-foreground"}`}>{d.valid_until ? new Date(d.valid_until).toLocaleDateString("pt-BR") : "—"}</TableCell>
                <TableCell className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setSelected(d); setDetailOpen(true); }}><Eye className="h-4 w-4" /></Button>
                  {!d.is_signed && d.status !== "obsoleto" && (
                    <Button variant="ghost" size="sm" onClick={() => { setSignDoc(d); setSignDialogOpen(true); }} title="Assinar documento">
                      <FileSignature className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setVerifyDoc(d); setVerifyOpen(true); }} title="Verificar assinaturas">
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setAuditDoc(d); setAuditOpen(true); }} title="Trilha de auditoria">
                    <ScrollText className="h-4 w-4" />
                  </Button>
                  {d.file_url && (
                    <Button variant="ghost" size="sm" onClick={() => { setPdfViewerDoc(d); setPdfViewerOpen(true); }} title="Visualizar com marca d'água">
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{selected?.code ? `${selected.code} - ` : ""}{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Workflow progress for this document */}
              <div className="flex items-center gap-1">
                {workflowSteps.map((step, idx) => {
                  const stepIdx = workflowSteps.findIndex(s => s.status === selected.status);
                  const isCompleted = idx < stepIdx;
                  const isCurrent = idx === stepIdx;
                  return (
                    <div key={step.status} className="flex items-center">
                      <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${isCurrent ? step.color + " border-2 font-bold" : isCompleted ? "bg-safe/10 text-safe" : "bg-muted text-muted-foreground/50"}`}>
                        {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                        {step.label}
                      </div>
                      {idx < workflowSteps.length - 1 && <ArrowRight className="mx-0.5 h-3 w-3 text-muted-foreground/30" />}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusConfig[selected.status].color}`}>{statusConfig[selected.status].label}</span>
                <span className="text-muted-foreground">Versão {selected.version}</span>
                {selected.valid_until && <span className="text-muted-foreground">Validade: {new Date(selected.valid_until).toLocaleDateString("pt-BR")}</span>}
                {selected.is_signed
                  ? <span className="rounded-full bg-safe/10 px-2 py-1 text-xs font-medium text-safe">✓ Assinado</span>
                  : <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning"><AlertTriangle className="h-3 w-3" /> Não Assinado</span>
                }
              </div>
              {selected.category && <p className="text-xs text-muted-foreground">Categoria: <span className="font-medium text-foreground">{selected.category}</span></p>}
              {selected.sector && <p className="text-xs text-muted-foreground">Setor: <span className="font-medium text-foreground">{selected.sector}</span></p>}
              {selected.file_url && <Button variant="link" size="sm" className="h-auto p-0 gap-1 text-xs text-primary" onClick={() => { setDetailOpen(false); setPdfViewerDoc(selected); setPdfViewerOpen(true); }}><FileUp className="h-3 w-3" /> Ver arquivo original</Button>}
              {selected.description && <div className="rounded-lg bg-secondary/50 p-3"><p className="text-sm text-foreground">{selected.description}</p></div>}
              {selected.content && <div className="rounded-lg border p-4"><pre className="whitespace-pre-wrap text-sm text-foreground">{selected.content}</pre></div>}
              <div className="flex gap-2 border-t pt-4">
                {!selected.is_signed && selected.status !== "obsoleto" && (
                  <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => { setDetailOpen(false); setSignDoc(selected); setSignDialogOpen(true); }}>
                    <FileSignature className="h-4 w-4" /> Assinar
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => { setDetailOpen(false); setVerifyDoc(selected); setVerifyOpen(true); }}>
                  <Shield className="h-4 w-4" /> Verificar Assinaturas
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => { setDetailOpen(false); setAuditDoc(selected); setAuditOpen(true); }}>
                  <ScrollText className="h-4 w-4" /> Auditoria
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {pdfViewerDoc && (
        <PdfWatermarkViewer
          open={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          fileUrl={pdfViewerDoc.file_url!}
          title={`${pdfViewerDoc.code ? pdfViewerDoc.code + " - " : ""}${pdfViewerDoc.title}`}
        />
      )}

      {signDoc && (
        <SignatureDialog
          open={signDialogOpen}
          onOpenChange={setSignDialogOpen}
          document={signDoc}
          onSigned={fetchData}
        />
      )}

      {verifyDoc && (
        <SignatureVerifier
          open={verifyOpen}
          onOpenChange={setVerifyOpen}
          document={verifyDoc}
        />
      )}

      {auditDoc && (
        <SignatureAuditLog
          open={auditOpen}
          onOpenChange={setAuditOpen}
          documentId={auditDoc.id}
          documentTitle={auditDoc.title}
        />
      )}
    </div>
  );
};

export default Documents;
