import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { History, Eye, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const getDiff = (oldText: string | null, newText: string | null): { added: string[]; removed: string[] } => {
    const oldLines = (oldText || "").split("\n");
    const newLines = (newText || "").split("\n");
    const added = newLines.filter(l => !oldLines.includes(l));
    const removed = oldLines.filter(l => !newLines.includes(l));
    return { added, removed };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <History className="h-5 w-5" />
            Histórico de Versões — {documentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
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

        {compareMode && compareVersions[0] && compareVersions[1] && (
          <div className="mb-4 rounded-lg border bg-muted/30 p-4 space-y-3">
            <h4 className="text-sm font-bold text-foreground">
              Comparando v{compareVersions[0].version_number} ↔ v{compareVersions[1].version_number}
            </h4>
            {(() => {
              const [older, newer] = compareVersions[0].version_number < compareVersions[1].version_number
                ? [compareVersions[0], compareVersions[1]]
                : [compareVersions[1], compareVersions[0]];
              const diff = getDiff(older.content, newer.content);
              return (
                <div className="space-y-2 text-xs font-mono max-h-60 overflow-y-auto">
                  {diff.removed.length > 0 && diff.removed.map((l, i) => (
                    <div key={`r-${i}`} className="bg-destructive/10 text-destructive rounded px-2 py-0.5">- {l}</div>
                  ))}
                  {diff.added.length > 0 && diff.added.map((l, i) => (
                    <div key={`a-${i}`} className="bg-safe/10 text-safe rounded px-2 py-0.5">+ {l}</div>
                  ))}
                  {diff.added.length === 0 && diff.removed.length === 0 && (
                    <p className="text-muted-foreground">Sem diferenças no conteúdo textual</p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

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
                <TableRow key={v.id}>
                  {compareMode && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={compareVersions.some(cv => cv?.id === v.id)}
                        onChange={() => toggleCompare(v)}
                        className="h-4 w-4"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline">v{v.version_number}</Badge>
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
              <h4 className="font-bold text-foreground">Versão {selectedVersion.version_number}</h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(null)}>Fechar</Button>
            </div>
            <p className="text-xs text-muted-foreground">Título: {selectedVersion.title}</p>
            {selectedVersion.code && <p className="text-xs text-muted-foreground">Código: {selectedVersion.code}</p>}
            {selectedVersion.change_summary && (
              <p className="text-sm italic text-muted-foreground">"{selectedVersion.change_summary}"</p>
            )}
            {selectedVersion.content && (
              <div className="rounded-lg bg-muted/30 p-3 max-h-60 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-xs text-foreground">{selectedVersion.content}</pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DocumentVersionHistory;
