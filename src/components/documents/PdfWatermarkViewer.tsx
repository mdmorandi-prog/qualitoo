import { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import * as pdfjsLib from "pdfjs-dist";

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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

const getPublicUrl = (fileUrl: string): string => {
  const parsed = parseStorageUrl(fileUrl);
  const bucket = parsed?.bucket || "documents";
  const path = parsed?.path || fileUrl;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
};

const PdfWatermarkViewer = ({ open, onOpenChange, fileUrl, title }: PdfWatermarkViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  const loadAndRenderAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRendered(false);
    try {
      const url = getPublicUrl(fileUrl);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));

      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const container = canvasContainerRef.current;
      if (!container) return;
      container.innerHTML = "";

      const parentWidth = containerRef.current?.clientWidth || 800;

      const BATCH_SIZE = 3;
      for (let i = 1; i <= doc.numPages; i += BATCH_SIZE) {
        const end = Math.min(i + BATCH_SIZE - 1, doc.numPages);
        for (let p = i; p <= end; p++) {
          const page = await doc.getPage(p);
          const unscaled = page.getViewport({ scale: 1 });
          const scale = (parentWidth - 32) / unscaled.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = "mx-auto mb-4 shadow-sm";
          container.appendChild(canvas);

          const ctx = canvas.getContext("2d")!;
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
        // Yield to UI thread between batches
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      setRendered(true);
    } catch (err: any) {
      console.error("[PdfViewer] Error:", err);
      setError("Erro ao carregar documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [fileUrl]);

  useEffect(() => {
    if (open && !rendered && !loading) {
      loadAndRenderAll();
    }
  }, [open, loadAndRenderAll, rendered, loading]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setRendered(false);
      if (canvasContainerRef.current) canvasContainerRef.current.innerHTML = "";
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
          <div className="flex items-center gap-2">
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
        <div ref={containerRef} className="relative flex-1 overflow-auto">
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
              <Button variant="outline" size="sm" onClick={loadAndRenderAll}>Tentar novamente</Button>
            </div>
          ) : rendered ? (
            <div ref={canvasContainerRef} className="p-4" />
          ) : (
            <div ref={canvasContainerRef} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfWatermarkViewer;
