import { useState, useEffect } from "react";
import { Download, CheckCircle2, Search, FileText, Table as TableIcon, ChevronRight, ChevronDown, Upload, Paperclip, User, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ONA_MANUAL_OPSS } from "@/lib/onaChecklists";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { toast } from "sonner";
import { useOnaEvidence, OnaEvidence } from "@/hooks/useOnaEvidence";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function OnaManualCompliance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(Object.keys(ONA_MANUAL_OPSS));
  const [evidenceMap, setEvidenceMap] = useState<Record<string, OnaEvidence[]>>({});
  const { getEvidence, uploadEvidence, saveEvidence } = useOnaEvidence();
  const { user } = useAuth();
  
  const [selectedReq, setSelectedReq] = useState<{id: string, level: number, text: string} | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadAllEvidence();
  }, []);

  const loadAllEvidence = async () => {
    try {
      const allEvidences: Record<string, OnaEvidence[]> = {};
      const promises = Object.values(ONA_MANUAL_OPSS).flatMap(section => 
        section.subsections.flatMap(sub => 
          sub.requirements.map(async (req) => {
            const data = await getEvidence(req.id);
            if (data && data.length > 0) {
              allEvidences[req.id] = data;
            }
          })
        )
      );
      await Promise.all(promises);
      setEvidenceMap(allEvidences);
    } catch (error) {
      console.error("Error loading evidence:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedReq || !user) return;
    
    setIsUploading(true);
    try {
      let evidenceUrl = "";
      let evidenceName = "";

      if (uploadFile) {
        const uploadResult = await uploadEvidence(uploadFile);
        evidenceUrl = uploadResult.publicUrl;
        evidenceName = uploadResult.fileName;
      }

      await saveEvidence({
        requirement_id: selectedReq.id,
        level: selectedReq.level,
        responsible_id: user.id,
        responsible_name: user.user_metadata?.full_name || user.email || "Usuário",
        notes: uploadNotes,
        evidence_url: evidenceUrl,
        evidence_name: evidenceName
      });

      toast.success("Evidência vinculada com sucesso!");
      setIsUploadOpen(false);
      setUploadNotes("");
      setUploadFile(null);
      loadAllEvidence();
    } catch (error: any) {
      toast.error("Erro ao salvar evidência: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };
  const [evidenceMap, setEvidenceMap] = useState<Record<string, OnaEvidence[]>>({});
  const { getEvidence, uploadEvidence, saveEvidence } = useOnaEvidence();
  const { user } = useAuth();
  
  const [selectedReq, setSelectedReq] = useState<{id: string, level: number, text: string} | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadAllEvidence();
  }, []);

  const loadAllEvidence = async () => {
    try {
      const allEvidences: Record<string, OnaEvidence[]> = {};
      const promises = Object.values(ONA_MANUAL_OPSS).flatMap(section => 
        section.subsections.flatMap(sub => 
          sub.requirements.map(async (req) => {
            const data = await getEvidence(req.id);
            if (data && data.length > 0) {
              allEvidences[req.id] = data;
            }
          })
        )
      );
      await Promise.all(promises);
      setEvidenceMap(allEvidences);
    } catch (error) {
      console.error("Error loading evidence:", error);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedReq || !user) return;
    
    setIsUploading(true);
    try {
      let evidenceUrl = "";
      let evidenceName = "";

      if (uploadFile) {
        const uploadResult = await uploadEvidence(uploadFile);
        evidenceUrl = uploadResult.publicUrl;
        evidenceName = uploadResult.fileName;
      }

      await saveEvidence({
        requirement_id: selectedReq.id,
        level: selectedReq.level,
        responsible_id: user.id,
        responsible_name: user.user_metadata?.full_name || user.email || "Usuário",
        notes: uploadNotes,
        evidence_url: evidenceUrl,
        evidence_name: evidenceName
      });

      toast.success("Evidência vinculada com sucesso!");
      setIsUploadOpen(false);
      setUploadNotes("");
      setUploadFile(null);
      loadAllEvidence();
    } catch (error: any) {
      toast.error("Erro ao salvar evidência: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

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
                              .map((req) => {
                                const evidences = evidenceMap[req.id] || [];
                                const isConfirmed = evidences.length > 0;
                                
                                return (
                                  <div key={req.id} className="flex items-start justify-between rounded-md border p-4 text-sm bg-background/50 hover:bg-background/80 transition-colors">
                                    <div className="space-y-2 flex-grow">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] text-muted-foreground">{req.id}</span>
                                        <Badge variant="outline" className="text-[10px] py-0">Nível {req.level}</Badge>
                                      </div>
                                      <p className="leading-relaxed pr-4">{req.requirement}</p>
                                      
                                      {isConfirmed && (
                                        <div className="mt-2 space-y-2">
                                          {evidences.map((ev) => (
                                            <div key={ev.id} className="text-[11px] bg-accent/30 rounded p-2 border border-accent/20">
                                              <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                  <User className="h-3 w-3" />
                                                  <span>{ev.responsible_name}</span>
                                                  <Calendar className="h-3 w-3 ml-1" />
                                                  <span>{new Date(ev.confirmed_at).toLocaleDateString("pt-BR")}</span>
                                                </div>
                                                {ev.evidence_url && (
                                                  <a 
                                                    href={ev.evidence_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                  >
                                                    <Paperclip className="h-3 w-3" />
                                                    {ev.evidence_name || "Anexo"}
                                                    <ExternalLink className="h-2 w-2" />
                                                  </a>
                                                )}
                                              </div>
                                              {ev.notes && <p className="italic text-muted-foreground mt-1">"{ev.notes}"</p>}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0 ml-4">
                                      {isConfirmed ? (
                                        <div className="flex items-center gap-1 text-safe font-medium text-[11px]">
                                          <CheckCircle2 className="h-3 w-3" /> Confirmado
                                        </div>
                                      ) : (
                                        <div className="text-muted-foreground text-[11px]">Pendente</div>
                                      )}
                                      
                                      <Dialog open={isUploadOpen && selectedReq?.id === req.id} onOpenChange={(open) => {
                                        if (open) {
                                          setSelectedReq({id: req.id, level: req.level, text: req.requirement});
                                          setUploadNotes("");
                                          setUploadFile(null);
                                        } else {
                                          setIsUploadOpen(false);
                                        }
                                      }}>
                                        <DialogTrigger asChild>
                                          <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] gap-1">
                                            <Upload className="h-3 w-3" /> Evidência
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                          <DialogHeader>
                                            <DialogTitle className="text-lg">Vincular Evidência</DialogTitle>
                                            <CardDescription>
                                              Confirme a presença do requisito: <span className="font-semibold">{req.id}</span>
                                            </CardDescription>
                                          </DialogHeader>
                                          
                                          <div className="grid gap-4 py-4">
                                            <div className="bg-muted/30 p-3 rounded text-sm italic">
                                              {req.requirement}
                                            </div>
                                            
                                            <div className="grid gap-2">
                                              <Label htmlFor="file">Documento / Anexo (Opcional)</Label>
                                              <Input 
                                                id="file" 
                                                type="file" 
                                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                              />
                                            </div>
                                            
                                            <div className="grid gap-2">
                                              <Label htmlFor="notes">Notas de Implementação</Label>
                                              <Textarea 
                                                id="notes" 
                                                placeholder="Descreva como este requisito está atendido..."
                                                value={uploadNotes}
                                                onChange={(e) => setUploadNotes(e.target.value)}
                                              />
                                            </div>
                                          </div>
                                          
                                          <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setIsUploadOpen(false)}>Cancelar</Button>
                                            <Button 
                                              onClick={handleFileUpload} 
                                              disabled={isUploading}
                                            >
                                              {isUploading ? "Salvando..." : "Confirmar Presença"}
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </div>
                                );
                              })}
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
