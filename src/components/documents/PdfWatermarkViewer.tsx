import { X, Download, ExternalLink } from "lucide-react";
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

const getPublicUrl = (fileUrl: string): string => {
  const parsed = parseStorageUrl(fileUrl);
  const bucket = parsed?.bucket || "documents";
  const path = parsed?.path || fileUrl;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
};

const PdfWatermarkViewer = ({ open, onOpenChange, fileUrl, title }: PdfWatermarkViewerProps) => {
  const publicUrl = open ? getPublicUrl(fileUrl) : "";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = publicUrl;
    a.download = `${title}.pdf`;
    a.target = "_blank";
    a.click();
  };

  const handleOpenNewTab = () => {
    window.open(publicUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3">
          <h3 className="text-sm font-bold text-foreground truncate">{title}</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleOpenNewTab} title="Abrir em nova aba">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
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
          {open && publicUrl && (
            <iframe
              src={publicUrl}
              className="h-full w-full border-0"
              title={`Visualização: ${title}`}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfWatermarkViewer;
