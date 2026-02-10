import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  LogOut,
  FileText,
  Clock,
  CheckCircle2,
  Archive,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ReportStatus = "nova" | "em_analise" | "concluida" | "arquivada";

interface Report {
  id: string;
  protocol: string;
  is_anonymous: boolean;
  type: string;
  date: string;
  location: string;
  sector: string | null;
  shift: string | null;
  accused_name: string | null;
  accused_role: string | null;
  description: string;
  has_witnesses: boolean;
  witness_info: string | null;
  wants_follow_up: boolean;
  contact_info: string | null;
  identity_name: string | null;
  identity_role: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<ReportStatus, { label: string; icon: any; color: string }> = {
  nova: { label: "Nova", icon: AlertTriangle, color: "bg-warning/10 text-warning" },
  em_analise: { label: "Em Análise", icon: Clock, color: "bg-accent/10 text-accent" },
  concluida: { label: "Concluída", icon: CheckCircle2, color: "bg-safe/10 text-safe" },
  arquivada: { label: "Arquivada", icon: Archive, color: "bg-muted text-muted-foreground" },
};

const AdminDashboard = () => {
  const { user, signOut, isAdmin, isAnalyst, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user && (isAdmin || isAnalyst)) {
      fetchReports();
    }
  }, [user, isAdmin, isAnalyst]);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar denúncias");
      console.error(error);
    } else {
      setReports((data as Report[]) ?? []);
    }
    setLoading(false);
  };

  const updateStatus = async (reportId: string, status: ReportStatus) => {
    const { error } = await supabase
      .from("reports")
      .update({ status } as any)
      .eq("id", reportId);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Status atualizado");
      fetchReports();
      if (selected?.id === reportId) {
        setSelected((prev) => prev ? { ...prev, status } : null);
      }
    }
  };

  const saveNotes = async () => {
    if (!selected) return;
    const { error } = await supabase
      .from("reports")
      .update({ admin_notes: adminNotes } as any)
      .eq("id", selected.id);

    if (error) {
      toast.error("Erro ao salvar parecer");
    } else {
      toast.success("Parecer salvo");
      fetchReports();
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const filtered = filterStatus === "all"
    ? reports
    : reports.filter((r) => r.status === filterStatus);

  const stats = {
    total: reports.length,
    nova: reports.filter((r) => r.status === "nova").length,
    em_analise: reports.filter((r) => r.status === "em_analise").length,
    concluida: reports.filter((r) => r.status === "concluida").length,
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!isAdmin && !isAnalyst) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="mb-2 text-xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar este painel.</p>
          <Button onClick={handleLogout} variant="outline" className="mt-4">
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold text-foreground">Painel do Comitê</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {isAdmin ? "Admin" : "Analista"}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total, icon: FileText, color: "text-foreground" },
            { label: "Novas", value: stats.nova, icon: AlertTriangle, color: "text-warning" },
            { label: "Em Análise", value: stats.em_analise, icon: Clock, color: "text-accent" },
            { label: "Concluídas", value: stats.concluida, icon: CheckCircle2, color: "text-safe" },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 opacity-20 ${s.color}`} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Report List */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-foreground">Denúncias</h2>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="nova">Novas</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                  <SelectItem value="arquivada">Arquivadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border bg-card shadow-[var(--card-shadow)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Protocolo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                        Nenhuma denúncia encontrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((r) => {
                      const sc = statusConfig[r.status];
                      return (
                        <TableRow
                          key={r.id}
                          className={`cursor-pointer ${selected?.id === r.id ? "bg-primary/5" : ""}`}
                          onClick={() => {
                            setSelected(r);
                            setAdminNotes(r.admin_notes ?? "");
                          }}
                        >
                          <TableCell className="font-mono text-xs font-semibold">{r.protocol}</TableCell>
                          <TableCell className="text-sm">{r.type}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${sc.color}`}>
                              <sc.icon className="h-3 w-3" />
                              {sc.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="sticky top-24 space-y-4"
              >
                <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
                  <h3 className="mb-4 font-display text-lg font-bold text-foreground">Detalhes</h3>
                  <div className="space-y-3 text-sm">
                    <DetailRow label="Protocolo" value={selected.protocol} />
                    <DetailRow label="Modo" value={selected.is_anonymous ? "Anônimo" : "Identificado"} />
                    <DetailRow label="Tipo" value={selected.type} />
                    <DetailRow label="Data Ocorrência" value={selected.date} />
                    <DetailRow label="Local" value={selected.location} />
                    {selected.sector && <DetailRow label="Setor" value={selected.sector} />}
                    {selected.shift && <DetailRow label="Turno" value={selected.shift} />}
                    {selected.accused_name && <DetailRow label="Denunciado" value={selected.accused_name} />}
                    {selected.accused_role && <DetailRow label="Cargo Denunciado" value={selected.accused_role} />}
                    {!selected.is_anonymous && selected.identity_name && (
                      <DetailRow label="Denunciante" value={selected.identity_name} />
                    )}
                    <DetailRow label="Testemunhas" value={selected.has_witnesses ? "Sim" : "Não"} />
                    {selected.witness_info && <DetailRow label="Info Testemunhas" value={selected.witness_info} />}
                    {selected.wants_follow_up && selected.contact_info && (
                      <DetailRow label="Contato" value={selected.contact_info} />
                    )}
                  </div>

                  <div className="mt-4 rounded-lg bg-secondary/50 p-3">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Descrição</p>
                    <p className="text-sm text-foreground">{selected.description}</p>
                  </div>
                </div>

                {/* Status & Notes */}
                <div className="rounded-xl border bg-card p-5 shadow-[var(--card-shadow)]">
                  <h3 className="mb-3 text-sm font-bold text-foreground">Gerenciar</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Alterar Status</p>
                      <Select
                        value={selected.status}
                        onValueChange={(v) => updateStatus(selected.id, v as ReportStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nova">Nova</SelectItem>
                          <SelectItem value="em_analise">Em Análise</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="arquivada">Arquivada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Parecer do Comitê</p>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Adicione observações, pareceres ou encaminhamentos..."
                        className="min-h-[100px]"
                      />
                      <Button onClick={saveNotes} size="sm" className="mt-2 w-full">
                        Salvar Parecer
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border bg-card text-center">
                <div>
                  <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Selecione uma denúncia para ver os detalhes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
    <span className="text-xs font-medium text-muted-foreground">{label}</span>
    <span className="text-right text-sm font-medium text-foreground">{value}</span>
  </div>
);

export default AdminDashboard;
