import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportPdfButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

/** Botão padronizado de exportação de relatório em PDF (Sprint 2). */
export const ExportPdfButton = ({
  onClick,
  label = "Exportar PDF",
  className,
  variant = "outline",
  size = "sm",
  disabled,
}: ExportPdfButtonProps) => (
  <Button
    variant={variant}
    size={size}
    onClick={onClick}
    disabled={disabled}
    className={cn("gap-2", className)}
  >
    <FileDown className="h-4 w-4" />
    {label}
  </Button>
);

export default ExportPdfButton;
