import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface PdfWatermarkViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  title: string;
}

/**
 * Extract the storage path from a Supabase public URL.
 * URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 */
const parseStorageUrl = (url: string): { bucket: string; path: string } | null => {
  try {
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (match) return { bucket: match[1], path: decodeURIComponent(match[2]) };
  } catch {}
  return null;
};

const PdfWatermarkViewer = ({ open, onOpenChange, fileUrl, title }: PdfWatermarkViewerProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = async () => {
    if (blobUrl) return; // already loaded
    setLoading(true);
    setError(null);

    const parsed = parseStorageUrl(fileUrl);
    if (!parsed) {
      // Fallback: try opening directly (non-storage URLs)
      setBlobUrl(fileUrl);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke("document-proxy", {
        body: { storagePath: parsed.path, bucketName: parsed.bucket },
      });

      if (fnError) throw fnError;

      // data is already an ArrayBuffer or Blob from the edge function
      const blob = data instanceof Blob ? data : new Blob([data]);
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err: any) {
      console.error("Error loading document:", err);
      setError("Erro ao carregar documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (val) {
      loadDocument();
    } else {
      if (blobUrl && blobUrl !== fileUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      setBlobUrl(null);
      setError(null);
    }
    onOpenChange(val);
  };

  // Trigger load when dialog opens
  if (open && !blobUrl && !loading && !error) {
    loadDocument();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3">
          <h3 className="text-sm font-bold text-foreground truncate">{title}</h3>
          <Button variant="ghost" size="icon" onClick={() => handleOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
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
              src={blobUrl}
              className="h-full w-full border-0"
              title={`Visualização: ${title}`}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfWatermarkViewer;
