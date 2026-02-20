import { useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Props {
  auditId: string;
  auditTitle: string;
  auditType: string;
  sector: string | null;
  scope: string | null;
}

const AiAuditBriefing = ({ auditId, auditTitle, auditType, sector, scope }: Props) => {
  const [loading, setLoading] = useState(false);
  const [briefing, setBriefing] = useState("");
  const [open, setOpen] = useState(false);

  const generate = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-audit-briefing`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token || ""}`,
          },
          body: JSON.stringify({ audit_id: auditId, audit_title: auditTitle, audit_type: auditType, sector, scope }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBriefing(data.briefing);
      toast.success("Briefing gerado!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar briefing");
      setBriefing("Erro ao gerar o briefing. Tente novamente.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="w-full gap-2" onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
        🤖 Gerar Briefing IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Briefing de Auditoria (IA)
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Analisando dados e gerando briefing...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none p-4">
                <ReactMarkdown>{briefing}</ReactMarkdown>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AiAuditBriefing;
