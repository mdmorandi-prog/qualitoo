import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Check, Eye, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import mammoth from "mammoth";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string | null;
  content_template: string;
  header_fields: Record<string, string>;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: Template) => void;
  onSelectHtml?: (html: string, fileName: string) => void;
}

const DocumentTemplateSelector = ({ open, onOpenChange, onSelect, onSelectHtml }: Props) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const wordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) fetchTemplates();
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("document_templates")
      .select("*")
      .eq("is_active", true)
      .order("category");
    setTemplates((data as Template[]) ?? []);
    setLoading(false);
  };

  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.docx?$/i)) {
      toast.error("Selecione um arquivo .docx");
      return;
    }
    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      if (result.messages.length > 0) {
        console.warn("Mammoth warnings:", result.messages);
      }
      if (onSelectHtml) {
        onSelectHtml(html, file.name);
      }
      onOpenChange(false);
      toast.success(`Template "${file.name}" carregado! Edite visualmente abaixo.`);
    } catch (err) {
      console.error("Erro ao converter Word:", err);
      toast.error("Erro ao processar o arquivo Word");
    } finally {
      setUploading(false);
      if (wordInputRef.current) wordInputRef.current.value = "";
    }
  };

  const categoryColors: Record<string, string> = {
    POP: "bg-primary/10 text-primary",
    IT: "bg-warning/10 text-warning",
    Manual: "bg-safe/10 text-safe",
    Protocolo: "bg-destructive/10 text-destructive",
    Formulário: "bg-accent text-accent-foreground",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <FileText className="h-5 w-5" />
            Templates de Documento
          </DialogTitle>
        </DialogHeader>

        {/* Word Upload Section */}
        <div className="rounded-xl border-2 border-dashed border-primary/30 p-4 text-center bg-primary/5">
          <input
            ref={wordInputRef}
            type="file"
            accept=".docx"
            className="hidden"
            onChange={handleWordUpload}
          />
          <Upload className="mx-auto h-6 w-6 text-primary/60" />
          <p className="mt-1 text-sm font-medium text-foreground">Importar Template Word (.docx)</p>
          <p className="text-xs text-muted-foreground">O documento será convertido para edição visual</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 gap-1 border-primary/30 text-primary"
            onClick={() => wordInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-3 w-3" />
            {uploading ? "Convertendo..." : "Selecionar .docx"}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-border" />
          <p className="text-center text-xs text-muted-foreground bg-background relative -top-2 mx-auto w-fit px-3">ou escolha um template salvo</p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando templates...</p>
        ) : (
          <div className="grid gap-3">
            {templates.map(t => (
              <div
                key={t.id}
                className={`rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer ${
                  previewId === t.id ? "ring-2 ring-primary border-primary" : "bg-card"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground text-sm">{t.name}</h4>
                      <Badge className={categoryColors[t.category] || "bg-muted text-muted-foreground"}>
                        {t.category}
                      </Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => {
                        onSelect(t);
                        onOpenChange(false);
                      }}
                    >
                      <Check className="h-3 w-3" /> Usar
                    </Button>
                  </div>
                </div>

                {previewId === t.id && (
                  <ScrollArea className="mt-3 h-60 rounded-lg border bg-muted/30 p-3">
                    <pre className="whitespace-pre-wrap text-xs text-foreground font-mono">
                      {t.content_template}
                    </pre>
                  </ScrollArea>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentTemplateSelector;
