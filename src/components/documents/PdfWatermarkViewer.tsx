import { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
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

const getSignedUrl = async (fileUrl: string): Promise<string> => {
  const parsed = parseStorageUrl(fileUrl);
  const bucket = parsed?.bucket || "documents";
  const path = parsed?.path || fileUrl;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error || !data?.signedUrl) {
    throw new Error("Failed to create signed URL for document");
  }
  return data.signedUrl;
};

interface PageSlot {
  pageNum: number;
  width: number;
  height: number;
  rendered: boolean;
}

const PdfWatermarkViewer = ({ open, onOpenChange, fileUrl, title }: PdfWatermarkViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [pageSlots, setPageSlots] = useState<PageSlot[]>([]);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const renderingRef = useRef<Set<number>>(new Set());

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPageSlots([]);
    renderingRef.current.clear();

    try {
      const url = await getSignedUrl(fileUrl);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));

      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = doc;

      const parentWidth = containerRef.current?.clientWidth || 800;
      const slots: PageSlot[] = [];

      // Only read viewport dimensions (very fast, no rendering)
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const vp = page.getViewport({ scale: 1 });
        const scale = (parentWidth - 32) / vp.width;
        slots.push({
          pageNum: i,
          width: Math.floor(vp.width * scale),
          height: Math.floor(vp.height * scale),
          rendered: false,
        });
      }

      setPageSlots(slots);
    } catch (err: any) {
      console.error("[PdfViewer] Error:", err);
      setError("Erro ao carregar documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [fileUrl]);

  // Render a single page into its canvas
  const renderPage = useCallback(async (pageNum: number, canvas: HTMLCanvasElement) => {
    const doc = pdfDocRef.current;
    if (!doc || renderingRef.current.has(pageNum)) return;
    renderingRef.current.add(pageNum);

    try {
      const page = await doc.getPage(pageNum);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = canvas.width / unscaled.width;
      const viewport = page.getViewport({ scale });

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      await page.render({ canvasContext: ctx, viewport }).promise;

      setPageSlots(prev =>
        prev.map(s => (s.pageNum === pageNum ? { ...s, rendered: true } : s))
      );
    } catch (err) {
      console.error(`[PdfViewer] Error rendering page ${pageNum}:`, err);
    }
  }, []);

  // Setup IntersectionObserver to lazy-render pages as they scroll into view
  useEffect(() => {
    if (pageSlots.length === 0) return;

    observerRef.current?.disconnect();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const canvas = entry.target as HTMLCanvasElement;
            const pageNum = Number(canvas.dataset.page);
            if (pageNum && !renderingRef.current.has(pageNum)) {
              renderPage(pageNum, canvas);
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: "200px 0px", // pre-render pages 200px before they're visible
      }
    );

    observerRef.current = observer;

    // Observe all canvas elements
    const canvases = containerRef.current?.querySelectorAll("canvas[data-page]");
    canvases?.forEach((c) => observer.observe(c));

    return () => observer.disconnect();
  }, [pageSlots, renderPage]);

  useEffect(() => {
    if (open && pageSlots.length === 0 && !loading) {
      loadDocument();
    }
  }, [open, loadDocument, pageSlots.length, loading]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setPageSlots([]);
      pdfDocRef.current = null;
      renderingRef.current.clear();
      observerRef.current?.disconnect();
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
              <Button variant="outline" size="sm" onClick={loadDocument}>Tentar novamente</Button>
            </div>
          ) : pageSlots.length > 0 ? (
            <div className="p-4 space-y-4">
              {pageSlots.map((slot) => (
                <canvas
                  key={slot.pageNum}
                  data-page={slot.pageNum}
                  width={slot.width}
                  height={slot.height}
                  className="mx-auto shadow-sm bg-white"
                  style={{ width: slot.width, height: slot.height, maxWidth: "100%" }}
                />
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfWatermarkViewer;
