import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { History, Eye, ArrowLeftRight, GitCompare, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Version {
  id: string;
  version_number: number;
  title: string;
  code: string | null;
  description: string | null;
  content: string | null;
  file_url: string | null;
  change_summary: string | null;
  created_by: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentTitle: string;
  currentVersion: number;
}

const DocumentVersionHistory = ({ open, onOpenChange, documentId, documentTitle, currentVersion }: Props) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[Version | null, Version | null]>([null, null]);

  useEffect(() => {
    if (open) fetchVersions();
  }, [open, documentId]);

  const fetchVersions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("document_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false });
    setVersions((data as Version[]) ?? []);
    setLoading(false);
  };

  const toggleCompare = (version: Version) => {
    if (!compareVersions[0]) {
      setCompareVersions([version, null]);
    } else if (!compareVersions[1] && compareVersions[0].id !== version.id) {
      setCompareVersions([compareVersions[0], version]);
    } else {
      setCompareVersions([version, null]);
    }
  };

  // Enhanced diff algorithm with line-by-line comparison
  const getDiff = (oldText: string | null, newText: string | null): { type: "same" | "added" | "removed"; line: string }[] => {
    const oldLines = (oldText || "").split("\n");
    const newLines = (newText || "").split("\n");
    const result: { type: "same" | "added" | "removed"; line: string }[] = [];
    
    // Simple LCS-based diff
    const maxLen = Math.max(oldLines.length, newLines.length);
    const oldSet = new Set(oldLines);
    const newSet = new Set(newLines);
    
    // Track used indices for ordering
    let oi = 0, ni = 0;
    while (oi < oldLines.length || ni < newLines.length) {
      if (oi < oldLines.length && ni < newLines.length && oldLines[oi] === newLines[ni]) {
        result.push({ type: "same", line: oldLines[oi] });
        oi++; ni++;
      } else if (oi < oldLines.length && !newSet.has(oldLines[oi])) {
        result.push({ type: "removed", line: oldLines[oi] });
        oi++;
      } else if (ni < newLines.length && !oldSet.has(newLines[ni])) {
        result.push({ type: "added", line: newLines[ni] });
        ni++;
      } else {
        // Changed line
        if (oi < oldLines.length) {
          result.push({ type: "removed", line: oldLines[oi] });
          oi++;
        }
        if (ni < newLines.length) {
          result.push({ type: "added", line: newLines[ni] });
          ni++;
        }
      }
    }
    return result;
  };

  const diffStats = (diff: { type: string }[]) => ({
    added: diff.filter(d => d.type === "added").length,
    removed: diff.filter(d => d.type === "removed").length,
    unchanged: diff.filter(d => d.type === "same").length,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <History className="h-5 w-5" />
            Histórico de Versões — {documentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="outline">Versão atual: v{currentVersion}</Badge>
          <Badge variant="secondary">{versions.length} revisões registradas</Badge>
          <Button
            variant={compareMode ? "default" : "outline"}
            size="sm"
            className="ml-auto gap-1"
            onClick={() => { setCompareMode(!compareMode); setCompareVersions([null, null]); }}
          >
            <ArrowLeftRight className="h-3 w-3" /> Comparar
          </Button>
        </div>

        {compareMode && (
          <div className="mb-4 rounded-lg border bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <GitCompare className="h-4 w-4" />
              {!compareVersions[0] 
                ? "Selecione a primeira versão para comparar"
                : !compareVersions[1]
                ? `v${compareVersions[0].version_number} selecionada — selecione a segunda versão`
                : null}
            </div>
          </div>
        )}

        {compareMode && compareVersions[0] && compareVersions[1] && (() => {
          const [older, newer] = compareVersions[0].version_number < compareVersions[1].version_number
            ? [compareVersions[0], compareVersions[1]]
            : [compareVersions[1], compareVersions[0]];
          const diff = getDiff(older.content, newer.content);
          const stats = diffStats(diff);
          return (
            <div className="mb-4 rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GitCompare className="h-4 w-4 text-primary" />
                  v{older.version_number} → v{newer.version_number}
                </h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-safe font-medium">+{stats.added} adicionadas</span>
                  <span className="text-destructive font-medium">-{stats.removed} removidas</span>
                  <span className="text-muted-foreground">{stats.unchanged} inalteradas</span>
                </div>
              </div>
              
              {/* Visual diff progress bar */}
              <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                {stats.unchanged > 0 && (
                  <div className="bg-muted-foreground/30 h-full" style={{ width: `${(stats.unchanged / (stats.added + stats.removed + stats.unchanged)) * 100}%` }} />
                )}
                {stats.added > 0 && (
                  <div className="bg-safe h-full" style={{ width: `${(stats.added / (stats.added + stats.removed + stats.unchanged)) * 100}%` }} />
                )}
                {stats.removed > 0 && (
                  <div className="bg-destructive h-full" style={{ width: `${(stats.removed / (stats.added + stats.removed + stats.unchanged)) * 100}%` }} />
                )}
              </div>

              <ScrollArea className="max-h-72">
                <div className="space-y-0.5 font-mono text-xs">
                  {diff.map((d, i) => (
                    <div
                      key={i}
                      className={`rounded px-3 py-1 ${
                        d.type === "added"
                          ? "bg-safe/10 text-safe border-l-2 border-safe"
                          : d.type === "removed"
                          ? "bg-destructive/10 text-destructive border-l-2 border-destructive line-through"
                          : "text-muted-foreground/70"
                      }`}
                    >
                      <span className="inline-block w-6 text-right mr-2 text-muted-foreground/40 select-none">
                        {d.type === "added" ? "+" : d.type === "removed" ? "−" : " "}
                      </span>
                      {d.line || " "}
                    </div>
                  ))}
                  {diff.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">Sem diferenças no conteúdo textual</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })()}

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : versions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma revisão anterior registrada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {compareMode && <TableHead className="w-10">Sel.</TableHead>}
                <TableHead>Versão</TableHead>
                <TableHead>Alteração</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map(v => (
                <TableRow key={v.id} className={compareVersions.some(cv => cv?.id === v.id) ? "bg-primary/5" : ""}>
                  {compareMode && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={compareVersions.some(cv => cv?.id === v.id)}
                        onChange={() => toggleCompare(v)}
                        className="h-4 w-4 accent-primary"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className="font-mono">v{v.version_number}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {v.change_summary || "Sem descrição"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(v)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {selectedVersion && (
          <div className="mt-4 rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Versão {selectedVersion.version_number}
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(null)}>Fechar</Button>
            </div>
            <p className="text-xs text-muted-foreground">Título: {selectedVersion.title}</p>
            {selectedVersion.code && <p className="text-xs text-muted-foreground">Código: {selectedVersion.code}</p>}
            {selectedVersion.change_summary && (
              <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-2">
                <History className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                <p className="text-sm italic text-foreground">"{selectedVersion.change_summary}"</p>
              </div>
            )}
            {selectedVersion.content && (
              <ScrollArea className="max-h-60">
                <div className="rounded-lg bg-muted/30 p-3">
                  <pre className="whitespace-pre-wrap text-xs text-foreground">{selectedVersion.content}</pre>
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentVersionHistory;
