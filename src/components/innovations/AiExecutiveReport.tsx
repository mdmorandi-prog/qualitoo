import { useState } from "react";
import { FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const AiExecutiveReport = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [open, setOpen] = useState(false);

  const generate = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-executive-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: "{}",
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data.report);
      toast.success("Relatório executivo gerado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar relatório");
      setReport("Erro ao gerar o relatório. Tente novamente.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2" onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        Relatório IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Relatório Executivo Narrativo (IA)
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Gerando relatório...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none p-4">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiExecutiveReport;
