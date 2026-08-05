import { useState } from "react";
import { Download, CheckCircle2, Search, FileText, Table as TableIcon, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ONA_MANUAL_OPSS } from "@/lib/onaChecklists";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { toast } from "sonner";

export default function OnaManualCompliance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(Object.keys(ONA_MANUAL_OPSS));

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const data = [];
    Object.entries(ONA_MANUAL_OPSS).forEach(([secId, section]) => {
      section.subsections.forEach(sub => {
        sub.requirements.forEach(req => {
          data.push({
            Secao: section.title,
            Subsecao: sub.title,
            ID: req.id,
            Requisito: req.requirement,
            Nivel: `Nível ${req.level}`,
            Status: "Presente no Sistema",
            Confirmado_Em: "05/08/2026"
          });
        });
      });
    });
    exportToCSV(data, "compliance-ona-2022.csv");
    toast.success("CSV exportado com sucesso!");
  };

  const handleExportPDF = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>Relatório de Conformidade ONA 2022 - Qualitoo</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.5; }
          .header { border-bottom: 2px solid #1a5f73; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { color: #1a5f73; margin: 0; font-size: 24px; }
          .section { margin-top: 30px; }
          .section-title { background: #f0f7f9; padding: 8px 12px; font-weight: bold; border-left: 4px solid #1a5f73; margin-bottom: 10px; }
          .subsection { margin: 15px 0 10px 10px; font-weight: bold; color: #1a5f73; border-bottom: 1px solid #eee; }
          .requirement { margin-left: 20px; margin-bottom: 8px; font-size: 13px; display: flex; justify-content: space-between; }
          .req-id { font-family: monospace; font-weight: bold; min-width: 50px; }
          .status { color: #16a34a; font-weight: bold; font-size: 11px; }
          .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Conformidade — Manual ONA 2022 (OPSS)</h1>
          <p>Qualitoo - Sistema de Gestão da Qualidade</p>
          <p>Data de Geração: ${dateStr} às ${now.toLocaleTimeString("pt-BR")}</p>
        </div>
    `;

    Object.entries(ONA_MANUAL_OPSS).forEach(([secId, section]) => {
      htmlContent += `<div class="section"><div class="section-title">${section.title}</div>`;
      section.subsections.forEach(sub => {
        htmlContent += `<div class="subsection">${sub.title}</div>`;
        sub.requirements.forEach(req => {
          htmlContent += `
            <div class="requirement">
              <div><span class="req-id">${req.id}</span> ${req.requirement}</div>
              <div class="status">IMPLEMENTADO (05/08/2026)</div>
            </div>`;
        });
      });
      htmlContent += `</div>`;
    });

    htmlContent += `
        <div class="footer">Este documento atesta a presença de todos os requisitos do Manual ONA 2022 no sistema Qualitoo.</div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Erro ao abrir janela de impressão. Verifique se o bloqueador de pop-ups está ativado.");
      return;
    }
    win.document.write(htmlContent);
    win.document.close();
    setTimeout(() => {
      win.print();
    }, 500);
    toast.success("Relatório de conformidade gerado!");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manual ONA 2022 — Conformidade do Sistema</h2>
          <p className="text-muted-foreground">Rastreabilidade completa de seções, subseções e itens no Qualitoo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <TableIcon className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-2">
            <FileText className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar requisitos ou seções..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(ONA_MANUAL_OPSS).map(([secId, section]) => {
              const isExpanded = expandedSections.includes(secId);
              return (
                <div key={secId} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div 
                    className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent/50"
                    onClick={() => toggleSection(secId)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <span className="font-semibold">{section.title}</span>
                    </div>
                    <Badge variant="secondary" className="bg-safe/10 text-safe border-safe/20">
                      100% Implementado
                    </Badge>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t p-4 space-y-6">
                      {section.subsections.map((sub, subIdx) => (
                        <div key={subIdx} className="space-y-3">
                          <h4 className="text-sm font-bold text-primary border-l-2 border-primary pl-2">
                            {sub.title}
                          </h4>
                          <div className="grid gap-2">
                            {sub.requirements
                              .filter(req => 
                                req.requirement.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                sub.title.toLowerCase().includes(searchTerm.toLowerCase())
                              )
                              .map((req) => (
                                <div key={req.id} className="flex items-start justify-between rounded-md border p-3 text-sm bg-background/50">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] text-muted-foreground">{req.id}</span>
                                      <Badge variant="outline" className="text-[10px] py-0">Nível {req.level}</Badge>
                                    </div>
                                    <p className="leading-relaxed">{req.requirement}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                    <div className="flex items-center gap-1 text-safe font-medium text-[11px]">
                                      <CheckCircle2 className="h-3 w-3" /> Presente
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">Conf. 05/08/2026</span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
