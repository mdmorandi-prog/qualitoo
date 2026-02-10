import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileSearch, Clock, CheckCircle2, AlertCircle, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

interface ReportResult {
  protocol: string;
  is_anonymous: boolean;
  type: string;
  date: string;
  location: string;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; icon: any; color: string }> = {
  nova: { label: "Recebida - Aguardando análise", icon: Clock, color: "bg-warning/10 text-warning" },
  em_analise: { label: "Em análise pelo Comitê de Ética", icon: Clock, color: "bg-accent/10 text-accent" },
  concluida: { label: "Concluída", icon: CheckCircle2, color: "bg-safe/10 text-safe" },
  arquivada: { label: "Arquivada", icon: Archive, color: "bg-muted text-muted-foreground" },
};

const TrackReport = () => {
  const [protocolInput, setProtocolInput] = useState("");
  const [result, setResult] = useState<ReportResult | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const clean = protocolInput.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);

    const { data, error } = await supabase.rpc("lookup_report_by_protocol", {
      p_protocol: clean,
    });

    if (error || !data || (data as any[]).length === 0) {
      setResult(null);
    } else {
      setResult((data as any[])[0] as ReportResult);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-start justify-center px-4 py-16 md:py-24">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <FileSearch className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
              Consultar Protocolo
            </h1>
            <p className="mb-8 text-muted-foreground">
              Insira o código de protocolo recebido ao registrar sua denúncia.
            </p>
          </motion.div>

          <div className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
            <Label htmlFor="protocol" className="text-sm font-semibold">
              Código do Protocolo
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="protocol"
                placeholder="Ex: A1B2C3D4E5F6"
                value={protocolInput}
                onChange={(e) => {
                  setProtocolInput(e.target.value.toUpperCase());
                  setResult(undefined);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="font-mono uppercase tracking-wider"
                maxLength={12}
              />
              <Button onClick={handleSearch} className="gap-2 shrink-0" disabled={loading}>
                <Search className="h-4 w-4" />
                {loading ? "..." : "Buscar"}
              </Button>
            </div>

            {result === null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 flex items-start gap-3 rounded-lg bg-destructive/10 p-4"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Protocolo não encontrado</p>
                  <p className="text-xs text-muted-foreground">
                    Verifique se o código foi digitado corretamente.
                  </p>
                </div>
              </motion.div>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4"
              >
                <div className="flex items-center gap-2 rounded-lg bg-safe/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-safe" />
                  <span className="text-sm font-semibold text-foreground">Denúncia Localizada</span>
                </div>
                <div className="space-y-3 rounded-lg border bg-background p-4">
                  <Row label="Protocolo" value={result.protocol} />
                  <Row label="Modo" value={result.is_anonymous ? "Anônimo" : "Identificado"} />
                  <Row label="Tipo" value={result.type} />
                  <Row label="Data da Ocorrência" value={result.date} />
                  <Row label="Local" value={result.location} />
                  <Row label="Registrado em" value={new Date(result.created_at).toLocaleDateString("pt-BR")} />
                </div>
                {(() => {
                  const s = statusLabels[result.status] ?? statusLabels.nova;
                  return (
                    <div className={`flex items-center gap-2 rounded-lg p-3 ${s.color}`}>
                      <s.icon className="h-4 w-4" />
                      <span className="text-sm">
                        Status: <strong className="text-foreground">{s.label}</strong>
                      </span>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="text-right text-sm font-medium text-foreground">{value}</span>
  </div>
);

export default TrackReport;
