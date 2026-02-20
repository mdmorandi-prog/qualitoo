import { useEffect, useState, useRef } from "react";
import { Plus, Search, Eye, Upload, FileUp, AlertTriangle, ArrowRight, CheckCircle2, FileText, Lock, FileSignature, Shield, ScrollText, Clock, XCircle, BookOpenCheck, FolderInput, History, LayoutTemplate, GitBranch, Pencil, Users } from "lucide-react";
import PdfWatermarkViewer from "@/components/documents/PdfWatermarkViewer";
import SignatureDialog from "@/components/documents/SignatureDialog";
import SignatureVerifier from "@/components/documents/SignatureVerifier";
import SignatureAuditLog from "@/components/documents/SignatureAuditLog";
import DocumentSignatureBlock from "@/components/documents/DocumentSignatureBlock";
import FolderTree from "@/components/documents/FolderTree";
import DocumentVersionHistory from "@/components/documents/DocumentVersionHistory";
import DocumentTemplateSelector from "@/components/documents/DocumentTemplateSelector";
import DocumentPermissions from "@/components/documents/DocumentPermissions";
import DocumentWorkflowSteps from "@/components/documents/DocumentWorkflowSteps";
import RichTextEditor from "@/components/documents/RichTextEditor";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { executeWorkflowRules } from "@/lib/workflowEngine";
import {
  ResizableHandle, ResizablePanel, ResizablePanelGroup,
} from "@/components/ui/resizable";

type DocStatus = "rascunho" | "em_revisao" | "aprovado" | "obsoleto";

interface Doc {
  id: string; title: string; code: string | null; description: string | null;
  category: string | null; sector: string | null; version: number;
  status: DocStatus; content: string | null; valid_until: string | null;
  created_at: string; is_signed: boolean; file_url: string | null;
  folder_id: string | null; is_restricted?: boolean;
  content_html?: string | null; content_type?: string;
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

const initialForm = { title: "", code: "", description: "", category: "", sector: "", content: "", valid_until: "", folder_id: "", content_html: "", content_type: "plain" };

const workflowPermissions: Record<DocStatus, { from: DocStatus[]; requiredRole: "admin" | "analyst" | "any" }> = {
  rascunho: { from: [], requiredRole: "any" },
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

// Build hierarchical folder options for select dropdown
const buildFolderOptions = (flatFolders: { id: string; name: string; sector: string | null; parent_id: string | null }[]) => {
  const map: Record<string, typeof flatFolders[0] & { children: string[] }> = {};
  const rootIds: string[] = [];

  // Build lookup
  for (const f of flatFolders) {
    map[f.id] = { ...f, children: [] };
  }
  for (const f of flatFolders) {
    if (f.parent_id && map[f.parent_id]) {
      map[f.parent_id].children.push(f.id);
    } else {
      rootIds.push(f.id);
    }
  }

  // Flatten tree with indentation
  const result: { id: string; name: string; prefix: string }[] = [];
  const walk = (id: string, depth: number) => {
    const node = map[id];
    if (!node) return;
    const indent = depth === 0 ? "" : "    ".repeat(depth - 1) + "└ ";
    result.push({ id: node.id, name: node.name, prefix: indent });
    for (const childId of node.children) {
      walk(childId, depth + 1);
    }
  };
  for (const rootId of rootIds) {
    walk(rootId, 0);
  }
  return result;
};

const Documents = () => {
  const { user, isAdmin, isAnalyst } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isFullTextSearch, setIsFullTextSearch] = useState(false);
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
  const [readConfirmations, setReadConfirmations] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<{ id: string; name: string; sector: string | null; parent_id: string | null }[]>([]);
  const [moveDocDialogOpen, setMoveDocDialogOpen] = useState(false);
  const [moveDocTarget, setMoveDocTarget] = useState<Doc | null>(null);

  // New gap states
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistoryDoc, setVersionHistoryDoc] = useState<Doc | null>(null);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [permissionsDoc, setPermissionsDoc] = useState<Doc | null>(null);
  const [workflowStepsOpen, setWorkflowStepsOpen] = useState(false);
  const [workflowStepsDoc, setWorkflowStepsDoc] = useState<Doc | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editDoc, setEditDoc] = useState<Doc | null>(null);
  const [changeSummary, setChangeSummary] = useState("");

  const [form, setForm] = useState({ ...initialForm });

  useEffect(() => { fetchData(); fetchFolders(); }, []);

  const fetchFolders = async () => {
    const { data } = await supabase.from("document_folders").select("id, name, sector, parent_id").order("display_order");
    if (data) setFolders(data as any[]);
  };

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("quality_documents").select("*").order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar");
    else setDocs((data as any[]) ?? []);
    if (user) {
      const { data: confirms } = await supabase.from("document_read_confirmations").select("document_id").eq("user_id", user.id);
      if (confirms) {
        const map: Record<string, boolean> = {};
        confirms.forEach((c: any) => { map[c.document_id] = true; });
        setReadConfirmations(map);
      }
    }
    setLoading(false);
  };

  // Full-text search
  const performFullTextSearch = async (query: string) => {
    if (!query || query.length < 3) return;
    setLoading(true);
    const tsQuery = query.split(/\s+/).filter(Boolean).join(" & ");
    const { data, error } = await supabase
      .from("quality_documents")
      .select("*")
      .textSearch("search_vector", tsQuery, { config: "portuguese" })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Full-text search error:", error);
      toast.error("Erro na busca");
    } else {
      setDocs((data as any[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isFullTextSearch && search.length >= 3) {
      const timer = setTimeout(() => performFullTextSearch(search), 500);
      return () => clearTimeout(timer);
    } else if (isFullTextSearch && search.length < 3) {
      fetchData();
    }
  }, [search, isFullTextSearch]);

  const confirmRead = async (docId: string) => {
    if (!user) return;
    const { error } = await supabase.from("document_read_confirmations").insert({ document_id: docId, user_id: user.id } as any);
    if (error) { if (error.code === "23505") toast.info("Já confirmado"); else toast.error("Erro"); }
    else { toast.success("Leitura confirmada!"); setReadConfirmations(prev => ({ ...prev, [docId]: true })); }
    await supabase.from("document_access_log").insert({ document_id: docId, user_id: user.id, action: "read_confirmation" } as any);
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

  const handleTemplateSelect = (template: any) => {
    setForm(f => ({
      ...f,
      category: template.category,
      content: template.content_template,
      content_type: "plain",
    }));
    toast.success(`Template "${template.name}" aplicado!`);
  };

  const handleCreate = async () => {
    if (!form.title || !user) { toast.error("Título obrigatório"); return; }
    const insertData: any = {
      title: form.title, code: form.code || null, description: form.description || null,
      category: form.category || null, sector: form.sector || null,
      content: form.content_type === "html" ? null : (form.content || null),
      content_html: form.content_type === "html" ? form.content_html : null,
      content_type: form.content_type,
      valid_until: form.valid_until || null, created_by: user.id,
      file_url: fileUrl, is_signed: isSigned,
      folder_id: form.folder_id || null,
    };
    const { error } = await supabase.from("quality_documents").insert(insertData);
    if (error) { toast.error("Erro ao criar"); console.error(error); }
    else {
      toast.success("Documento criado!"); setDialogOpen(false); setForm({ ...initialForm }); setFileUrl(null); setIsSigned(false);
      const { data: created } = await supabase.from("quality_documents").select("*").eq("title", form.title).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (created) executeWorkflowRules("quality_documents", "record_created", created, undefined, user.id);
      fetchData();
    }
  };

  // Save version before updating document
  const saveVersionAndUpdate = async (doc: Doc, updates: Record<string, any>, summary: string) => {
    if (!user) return;
    // Save current version
    await supabase.from("document_versions").insert({
      document_id: doc.id,
      version_number: doc.version,
      title: doc.title,
      code: doc.code,
      description: doc.description,
      content: doc.content,
      file_url: doc.file_url,
      change_summary: summary || "Atualização do documento",
      created_by: user.id,
    } as any);

    // Update with new version number
    const { error } = await supabase.from("quality_documents").update({
      ...updates,
      version: doc.version + 1,
    } as any).eq("id", doc.id);

    if (error) { toast.error("Erro ao atualizar"); console.error(error); }
    else {
      toast.success(`Documento atualizado para v${doc.version + 1}`);
      setEditMode(false);
      setEditDoc(null);
      setChangeSummary("");
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

      // GAP 4: Distribute on approval
      if (newStatus === "aprovado") {
        try {
          await supabase.functions.invoke("distribute-document", {
            body: {
              documentId: id,
              documentTitle: doc.title,
              documentSector: doc.sector,
              documentCode: doc.code,
            },
          });
          toast.success("Notificações de publicação enviadas!");
        } catch (err) {
          console.error("Distribution error:", err);
        }
      }

      fetchData();
    }
  };

  const moveDocToFolder = async (docId: string, folderId: string | null) => {
    const { error } = await supabase.from("quality_documents").update({ folder_id: folderId } as any).eq("id", docId);
    if (error) toast.error("Erro ao mover documento");
    else { toast.success("Documento movido!"); setMoveDocDialogOpen(false); setMoveDocTarget(null); fetchData(); }
  };

  const toggleRestricted = async (doc: Doc, restricted: boolean) => {
    const { error } = await supabase.from("quality_documents").update({ is_restricted: restricted } as any).eq("id", doc.id);
    if (error) toast.error("Erro ao alterar restrição");
    else { toast.success(restricted ? "Acesso restrito ativado" : "Acesso padrão restaurado"); fetchData(); }
  };

  const now = new Date();
  const pendingSigCount = docs.filter(d => !d.is_signed && d.status !== "obsoleto").length;
  const expiredCount = docs.filter(d => d.valid_until && new Date(d.valid_until) < now && d.status !== "obsoleto").length;

  const getBreadcrumb = (folderId: string | null): string[] => {
    if (!folderId) return [];
    const path: string[] = [];
    let current = folders.find(f => f.id === folderId);
    while (current) {
      path.unshift(current.name);
      current = current.parent_id ? folders.find(f => f.id === current!.parent_id) : undefined;
    }
    return path;
  };

  const breadcrumb = getBreadcrumb(selectedFolderId);

  const filtered = docs
    .filter(d => {
      if (selectedFolderId) return d.folder_id === selectedFolderId;
      return true;
    })
    .filter(d => filterStatus === "all" || d.status === filterStatus)
    .filter(d => {
      if (specialFilter === "pending_sig") return !d.is_signed && d.status !== "obsoleto";
      if (specialFilter === "expired") return d.valid_until && new Date(d.valid_until) < now && d.status !== "obsoleto";
      return true;
    })
    .filter(d => {
      if (isFullTextSearch) return true; // full-text already filtered server-side
      return !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.code && d.code.toLowerCase().includes(search.toLowerCase()));
    });

  const documentContent = (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Controle de Documentos</h2>
          {breadcrumb.length > 0 ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <button onClick={() => setSelectedFolderId(null)} className="hover:text-primary transition-colors">📁 Raiz</button>
              {breadcrumb.map((b, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span>/</span>
                  <span className={i === breadcrumb.length - 1 ? "text-foreground font-medium" : ""}>{b}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Gestão de procedimentos, políticas e manuais</p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Novo Documento</Button></DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle className="font-display">Criar Documento</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Import & Template row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-3 text-center">
                  <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx" className="hidden" onChange={handleImportFile} />
                  <FileUp className="mx-auto h-6 w-6 text-muted-foreground/50" />
                  <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                    <Upload className="h-3 w-3" />{importing ? "Importando..." : "Importar Arquivo"}
                  </Button>
                  {fileUrl && <p className="mt-1 text-[10px] text-safe">✓ Anexado</p>}
                </div>
                <div className="rounded-lg border-2 border-dashed border-primary/25 p-3 text-center">
                  <LayoutTemplate className="mx-auto h-6 w-6 text-primary/50" />
                  <Button variant="outline" size="sm" className="mt-2 gap-1 text-xs border-primary/30 text-primary" onClick={() => setTemplateSelectorOpen(true)}>
                    <LayoutTemplate className="h-3 w-3" /> Usar Template
                  </Button>
                </div>
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
              <div className="grid gap-2">
                <Label>Pasta</Label>
                <Select value={form.folder_id || "none"} onValueChange={v => setForm(f => ({ ...f, folder_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma pasta" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Sem pasta —</SelectItem>
                    {buildFolderOptions(folders).map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.prefix}{opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>

              {/* Content with editor tabs */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo</Label>
                  <Tabs value={form.content_type} onValueChange={v => setForm(f => ({ ...f, content_type: v }))}>
                    <TabsList className="h-7">
                      <TabsTrigger value="plain" className="text-xs px-2 h-5">Texto</TabsTrigger>
                      <TabsTrigger value="html" className="text-xs px-2 h-5">Editor Visual</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                {form.content_type === "html" ? (
                  <RichTextEditor
                    content={form.content_html}
                    onChange={html => setForm(f => ({ ...f, content_html: html }))}
                    placeholder="Use o editor visual..."
                  />
                ) : (
                  <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="min-h-[150px]" placeholder="Conteúdo do documento..." />
                )}
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Documento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search with full-text toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); if (!isFullTextSearch) { /* local filter */ } }}
            placeholder={isFullTextSearch ? "Busca no conteúdo dos documentos..." : "Buscar por título ou código..."}
            className="pl-10 pr-28"
          />
          <button
            onClick={() => { setIsFullTextSearch(!isFullTextSearch); if (isFullTextSearch) fetchData(); }}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-[10px] font-bold transition-all ${
              isFullTextSearch ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
            }`}
          >
            {isFullTextSearch ? "🔍 FULL-TEXT" : "📝 Título/Código"}
          </button>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline */}
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
          <div><p className="text-2xl font-bold text-warning">{pendingSigCount}</p><p className="text-xs text-muted-foreground">Assinaturas Pendentes</p></div>
        </button>
        <button
          onClick={() => { setSpecialFilter(specialFilter === "expired" ? null : "expired"); setFilterStatus("all"); }}
          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${specialFilter === "expired" ? "ring-2 ring-destructive border-destructive bg-destructive/10" : "bg-card shadow-[var(--card-shadow)] hover:shadow-md"}`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
          <div><p className="text-2xl font-bold text-destructive">{expiredCount}</p><p className="text-xs text-muted-foreground">Documentos Vencidos</p></div>
        </button>
      </div>

      {/* Stats */}
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

      {/* Alert for unsigned docs */}
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

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Código</TableHead><TableHead>Título</TableHead><TableHead>Versão</TableHead><TableHead>Status</TableHead><TableHead>Assinado</TableHead><TableHead>Validade</TableHead><TableHead>Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            : filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Nenhum documento{selectedFolderId ? " nesta pasta" : ""}.</TableCell></TableRow>
            : filtered.map(d => {
              const isExpired = d.valid_until && new Date(d.valid_until) < now && d.status !== "obsoleto";
              return (
              <TableRow key={d.id} className={isExpired ? "bg-destructive/5" : !d.is_signed && d.status !== "obsoleto" ? "bg-warning/5" : ""}>
                <TableCell className="font-mono text-xs font-semibold">{d.code || "—"}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {d.title}
                    {isExpired && <span className="shrink-0 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">VENCIDO</span>}
                    {(d as any).is_restricted && <span title="Acesso restrito"><Lock className="h-3 w-3 text-muted-foreground" /></span>}
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
                <TableCell>
                  <div className="flex gap-0.5 flex-wrap">
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(d); setDetailOpen(true); }} title="Detalhes"><Eye className="h-4 w-4" /></Button>
                    {d.status === "aprovado" && !readConfirmations[d.id] && (
                      <Button variant="ghost" size="sm" onClick={() => confirmRead(d.id)} title="Confirmar leitura" className="text-primary"><BookOpenCheck className="h-4 w-4" /></Button>
                    )}
                    {d.status === "aprovado" && readConfirmations[d.id] && (
                      <span className="flex items-center text-safe" title="Leitura confirmada"><CheckCircle2 className="h-4 w-4" /></span>
                    )}
                    {!d.is_signed && d.status !== "obsoleto" && (
                      <Button variant="ghost" size="sm" onClick={() => { setSignDoc(d); setSignDialogOpen(true); }} title="Assinar"><FileSignature className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setVerifyDoc(d); setVerifyOpen(true); }} title="Verificar assinaturas"><Shield className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setAuditDoc(d); setAuditOpen(true); }} title="Auditoria"><ScrollText className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setVersionHistoryDoc(d); setVersionHistoryOpen(true); }} title="Histórico de versões"><History className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setWorkflowStepsDoc(d); setWorkflowStepsOpen(true); }} title="Workflow de aprovação"><GitBranch className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setPermissionsDoc(d); setPermissionsOpen(true); }} title="Permissões"><Users className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditDoc(d); setEditMode(true); }} title="Editar/Nova versão"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => { setMoveDocTarget(d); setMoveDocDialogOpen(true); }} title="Mover"><FolderInput className="h-4 w-4" /></Button>
                    {d.file_url && (
                      <Button variant="ghost" size="sm" onClick={() => { setPdfViewerDoc(d); setPdfViewerOpen(true); }} title="Visualizar PDF"><FileText className="h-4 w-4" /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle className="font-display">{selected?.code ? `${selected.code} - ` : ""}{selected?.title}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-1 flex-wrap">
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
                {(selected as any).is_restricted && <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" /> Restrito</Badge>}
              </div>
              {selected.category && <p className="text-xs text-muted-foreground">Categoria: <span className="font-medium text-foreground">{selected.category}</span></p>}
              {selected.sector && <p className="text-xs text-muted-foreground">Setor: <span className="font-medium text-foreground">{selected.sector}</span></p>}
              {selected.folder_id && (
                <p className="text-xs text-muted-foreground">Pasta: <span className="font-medium text-foreground">{getBreadcrumb(selected.folder_id).join(" / ")}</span></p>
              )}
              {selected.file_url && <Button variant="link" size="sm" className="h-auto p-0 gap-1 text-xs text-primary" onClick={() => { setDetailOpen(false); setPdfViewerDoc(selected); setPdfViewerOpen(true); }}><FileUp className="h-3 w-3" /> Ver arquivo original</Button>}
              {selected.description && <div className="rounded-lg bg-secondary/50 p-3"><p className="text-sm text-foreground">{selected.description}</p></div>}
              {(selected as any).content_html ? (
                <div className="rounded-lg border p-4 prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: (selected as any).content_html }} />
              ) : selected.content ? (
                <div className="rounded-lg border p-4"><pre className="whitespace-pre-wrap text-sm text-foreground">{selected.content}</pre></div>
              ) : null}
              <DocumentSignatureBlock documentId={selected.id} documentTitle={selected.title} />
              <div className="flex gap-2 border-t pt-4 flex-wrap">
                {!selected.is_signed && selected.status !== "obsoleto" && (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDetailOpen(false); setSignDoc(selected); setSignDialogOpen(true); }}>
                    <FileSignature className="h-4 w-4" /> Assinar
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDetailOpen(false); setVerifyDoc(selected); setVerifyOpen(true); }}>
                  <Shield className="h-4 w-4" /> Verificar
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDetailOpen(false); setAuditDoc(selected); setAuditOpen(true); }}>
                  <ScrollText className="h-4 w-4" /> Auditoria
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDetailOpen(false); setVersionHistoryDoc(selected); setVersionHistoryOpen(true); }}>
                  <History className="h-4 w-4" /> Versões
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDetailOpen(false); setWorkflowStepsDoc(selected); setWorkflowStepsOpen(true); }}>
                  <GitBranch className="h-4 w-4" /> Workflow
                </Button>
                <Button variant="outline" size="sm" className="gap-2" onClick={() => { setDetailOpen(false); setPermissionsDoc(selected); setPermissionsOpen(true); }}>
                  <Users className="h-4 w-4" /> Permissões
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/New Version Dialog */}
      <Dialog open={editMode} onOpenChange={v => { if (!v) { setEditMode(false); setEditDoc(null); setChangeSummary(""); } }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Pencil className="h-5 w-5" />
              Editar Documento — Nova Versão (v{editDoc ? editDoc.version + 1 : ""})
            </DialogTitle>
          </DialogHeader>
          {editDoc && (
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 flex items-start gap-3">
                <History className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Versionamento automático</p>
                  <p className="text-xs text-muted-foreground">
                    A versão atual (v{editDoc.version}) será arquivada automaticamente no histórico.
                    Você pode comparar versões depois pelo botão <span className="font-medium text-foreground">Histórico</span>.
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Resumo da Alteração *</Label>
                <Textarea
                  value={changeSummary}
                  onChange={e => setChangeSummary(e.target.value)}
                  placeholder="Descreva as alterações realizadas..."
                  className="min-h-[60px]"
                />
              </div>
              <div className="grid gap-2"><Label>Título</Label><Input defaultValue={editDoc.title} id="edit-title" /></div>
              <div className="grid gap-2"><Label>Descrição</Label><Textarea defaultValue={editDoc.description || ""} id="edit-description" /></div>
              <div className="grid gap-2">
                <Label>Conteúdo</Label>
                {(editDoc as any).content_type === "html" ? (
                  <RichTextEditor
                    content={(editDoc as any).content_html || ""}
                    onChange={html => setEditDoc(prev => prev ? { ...prev, content_html: html } as any : null)}
                  />
                ) : (
                  <Textarea defaultValue={editDoc.content || ""} id="edit-content" className="min-h-[200px]" />
                )}
              </div>
              <Button
                onClick={() => {
                  if (!changeSummary) { toast.error("Informe o resumo da alteração"); return; }
                  const title = (document.getElementById("edit-title") as HTMLInputElement)?.value || editDoc.title;
                  const description = (document.getElementById("edit-description") as HTMLTextAreaElement)?.value || editDoc.description;
                  const content = (editDoc as any).content_type === "html"
                    ? null
                    : ((document.getElementById("edit-content") as HTMLTextAreaElement)?.value || editDoc.content);
                  const contentHtml = (editDoc as any).content_type === "html" ? (editDoc as any).content_html : null;

                  saveVersionAndUpdate(editDoc, {
                    title,
                    description,
                    content,
                    content_html: contentHtml,
                  }, changeSummary);
                }}
                className="w-full"
              >
                Salvar Nova Versão
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={moveDocDialogOpen} onOpenChange={setMoveDocDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Mover para Pasta</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <p className="text-sm text-muted-foreground">Mover "<span className="font-medium text-foreground">{moveDocTarget?.title}</span>" para:</p>
            <Select onValueChange={v => moveDocTarget && moveDocToFolder(moveDocTarget.id, v === "none" ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Selecione a pasta destino" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Sem pasta (raiz) —</SelectItem>
                {folders.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.parent_id ? "  └ " : ""}{f.name} {f.sector ? `(${f.sector})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* All modal components */}
      {pdfViewerDoc && (
        <PdfWatermarkViewer open={pdfViewerOpen} onOpenChange={setPdfViewerOpen} fileUrl={pdfViewerDoc.file_url!} title={`${pdfViewerDoc.code ? pdfViewerDoc.code + " - " : ""}${pdfViewerDoc.title}`} />
      )}

      {signDoc && (
        <SignatureDialog open={signDialogOpen} onOpenChange={setSignDialogOpen} document={signDoc} onSigned={fetchData} />
      )}

      {verifyDoc && (
        <SignatureVerifier open={verifyOpen} onOpenChange={setVerifyOpen} document={verifyDoc} />
      )}

      {auditDoc && (
        <SignatureAuditLog open={auditOpen} onOpenChange={setAuditOpen} documentId={auditDoc.id} documentTitle={auditDoc.title} />
      )}

      {versionHistoryDoc && (
        <DocumentVersionHistory open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen} documentId={versionHistoryDoc.id} documentTitle={versionHistoryDoc.title} currentVersion={versionHistoryDoc.version} />
      )}

      <DocumentTemplateSelector
        open={templateSelectorOpen}
        onOpenChange={setTemplateSelectorOpen}
        onSelect={handleTemplateSelect}
        onSelectHtml={(html, fileName) => {
          setForm(f => ({
            ...f,
            content_html: html,
            content_type: "html",
            title: f.title || fileName.replace(/\.docx?$/i, "").replace(/[-_]/g, " "),
          }));
        }}
      />

      {permissionsDoc && (
        <DocumentPermissions
          open={permissionsOpen}
          onOpenChange={setPermissionsOpen}
          documentId={permissionsDoc.id}
          documentTitle={permissionsDoc.title}
          isRestricted={(permissionsDoc as any).is_restricted ?? false}
          onToggleRestricted={r => toggleRestricted(permissionsDoc, r)}
        />
      )}

      {workflowStepsDoc && (
        <DocumentWorkflowSteps
          open={workflowStepsOpen}
          onOpenChange={setWorkflowStepsOpen}
          documentId={workflowStepsDoc.id}
          documentTitle={workflowStepsDoc.title}
          documentCategory={workflowStepsDoc.category}
          onWorkflowComplete={() => {
            toast.success("Workflow completo! Documento pronto para aprovação.");
            fetchData();
          }}
        />
      )}
    </div>
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-xl border">
      <ResizablePanel defaultSize={20} minSize={15} maxSize={35} className="bg-card">
        <FolderTree selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={80}>
        <div className="p-6 overflow-auto h-full">
          {documentContent}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Documents;
