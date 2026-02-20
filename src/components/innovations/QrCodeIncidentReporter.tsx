import { useState } from "react";
import { QrCode, Copy, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const QrCodeIncidentReporter = () => {
  const [sector, setSector] = useState("");
  const [location, setLocation] = useState("");

  const baseUrl = window.location.origin;
  const reportUrl = `${baseUrl}/admin?tab=eventos&auto_report=true&sector=${encodeURIComponent(sector)}&location=${encodeURIComponent(location)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(reportUrl);
    toast.success("Link copiado!");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" /> QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            QR Code para Reporte Rápido
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Gere QR Codes para que colaboradores reportem ocorrências escaneando com o celular.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Setor</Label>
              <Input value={sector} onChange={e => setSector(e.target.value)} placeholder="Ex: UTI, CC..." className="h-8 text-sm" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Localização</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Ex: 3º andar" className="h-8 text-sm" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-6">
            <QRCodeSVG
              value={reportUrl}
              size={200}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
            <p className="text-center text-[10px] text-muted-foreground max-w-[200px]">
              Escaneie para reportar uma ocorrência{sector ? ` no setor ${sector}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={copyLink}>
              <Copy className="h-3.5 w-3.5" /> Copiar Link
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => {
              const svg = document.querySelector(".qr-container svg");
              if (svg) toast.success("QR Code pronto para impressão! Use Ctrl+P");
              else window.print();
            }}>
              <Download className="h-3.5 w-3.5" /> Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QrCodeIncidentReporter;
