import { useState, useEffect, useRef, useCallback } from "react";
import { X, Loader2, Download, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const loadPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getPublicUrl(fileUrl);
      console.log("[PdfViewer] Loading PDF from:", url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      setBlobUrl(URL.createObjectURL(blob));

      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
    } catch (err: any) {
      console.error("[PdfViewer] Error:", err);
      setError("Erro ao carregar documento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [fileUrl]);

  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    const page = await pdfDoc.getPage(pageNum);
    const container = containerRef.current;
    const containerWidth = container.clientWidth;

    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = canvasRef.current;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
  }, [pdfDoc]);

  useEffect(() => {
    if (open && !pdfDoc && !loading) {
      loadPdf();
    }
  }, [open, loadPdf, pdfDoc, loading]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, renderPage]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setPdfDoc(null);
      setCurrentPage(1);
      setTotalPages(0);
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
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
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
              <Button variant="outline" size="sm" onClick={loadPdf}>Tentar novamente</Button>
            </div>
          ) : pdfDoc ? (
            <div className="flex justify-center">
              <canvas ref={canvasRef} className="max-w-full" />
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfWatermarkViewer;
