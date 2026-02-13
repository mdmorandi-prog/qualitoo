import { useState, useEffect } from "react";
import { X, Loader2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PdfWatermarkViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  title: string;
}

const parseStorageUrl = (url: string): { bucket: string; path: string } | null => {
  try {
    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+?)(?:\?.*)?$/);
    if (match) return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {}
  return null;
};

const PdfWatermarkViewer = ({ open, onOpenChange, fileUrl, title }: PdfWatermarkViewerProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);

    const parsed = parseStorageUrl(fileUrl);
    const bucket = parsed?.bucket || "documents";
    const path = parsed?.path || fileUrl;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/document-proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": anonKey,
          "Authorization": `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ storagePath: path, bucketName: bucket }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const url = URL.createObjectURL(pdfBlob);
      setBlobUrl(url);
    } catch (err: any) {
      console.error("Error loading document via proxy:", err);
      setError("Erro ao carregar documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && !blobUrl && !loading && !error) {
      loadDocument();
    }
  }, [open]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setError(null);
    }
    onOpenChange(val);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${title}.pdf`;
    a.click();
  };

  const handleOpenNewTab = () => {
    if (!blobUrl) return;
    window.open(blobUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3">
          <h3 className="text-sm font-bold text-foreground truncate">{title}</h3>
          <div className="flex items-center gap-1">
            {blobUrl && (
              <>
                <Button variant="ghost" size="icon" onClick={handleOpenNewTab} title="Abrir em nova aba">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
                  <Download className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {/* Watermark overlay */}
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-wrap items-center justify-center gap-24 overflow-hidden opacity-[0.08]">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="select-none whitespace-nowrap text-3xl font-black uppercase tracking-widest text-foreground"
                style={{ transform: "rotate(-35deg)" }}
              >
                CÓPIA CONTROLADA
              </span>
            ))}
          </div>
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando documento...</p>
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={loadDocument}>Tentar novamente</Button>
            </div>
          ) : blobUrl ? (
            <iframe
              src={`${blobUrl}#toolbar=0&navpanes=0`}
              className="h-full w-full border-0"
              title={`Visualização: ${title}`}
              sandbox="allow-same-origin allow-scripts"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfWatermarkViewer;
