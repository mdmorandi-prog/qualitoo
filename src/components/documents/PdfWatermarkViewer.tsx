import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PdfWatermarkViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  title: string;
}

const PdfWatermarkViewer = ({ open, onOpenChange, fileUrl, title }: PdfWatermarkViewerProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3">
          <h3 className="text-sm font-bold text-foreground truncate">{title}</h3>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
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
          <iframe
            src={fileUrl}
            className="h-full w-full border-0"
            title={`Visualização: ${title}`}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PdfWatermarkViewer;
