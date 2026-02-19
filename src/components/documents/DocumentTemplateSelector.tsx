import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Check, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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
}

const DocumentTemplateSelector = ({ open, onOpenChange, onSelect }: Props) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);

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

  const categoryColors: Record<string, string> = {
    POP: "bg-primary/10 text-primary",
    IT: "bg-warning/10 text-warning",
    Manual: "bg-safe/10 text-safe",
    Protocolo: "bg-destructive/10 text-destructive",
    Formulário: "bg-accent text-accent-foreground",
  };

  const previewTemplate = templates.find(t => t.id === previewId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <FileText className="h-5 w-5" />
            Templates de Documento
          </DialogTitle>
        </DialogHeader>

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
