import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, LogOut, LayoutDashboard, AlertTriangle, BarChart3, FileText, ClipboardCheck, Target, TriangleAlert, GraduationCap, Users, FishSymbol, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import NotificationsPanel from "@/components/NotificationsPanel";
import AdverseEvents from "@/pages/quality/AdverseEvents";
import Capas from "@/pages/quality/Capas";
import RootCauseAnalysis from "@/pages/quality/RootCauseAnalysis";
import CompetencyMatrix from "@/pages/quality/CompetencyMatrix";

const tabs = [
  { key: "resumo", label: "Resumo", icon: LayoutDashboard },
  { key: "eventos", label: "Eventos Adversos", icon: ShieldAlert },
  { key: "capa", label: "CAPA", icon: Target },
  { key: "causa_raiz", label: "Causa Raiz", icon: FishSymbol },
  { key: "competencias", label: "Competências", icon: GraduationCap },
];

const AdminDashboard = () => {
  const { user, signOut, isAdmin, isAnalyst, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "resumo";

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [authLoading, user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  if (authLoading) {
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
          <Button onClick={handleLogout} variant="outline" className="mt-4">Sair</Button>
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
              <span className="text-lg font-semibold text-foreground">SGQ Hospitalar</span>
              <Badge variant="secondary" className="ml-2 text-xs">{isAdmin ? "Admin" : "Analista"}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPanel />
            <Button variant="ghost" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setTab}>
          <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {tabs.map(t => (
              <TabsTrigger key={t.key} value={t.key} className="gap-2 rounded-lg border border-transparent px-3 py-2 text-sm data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <t.icon className="h-4 w-4" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="resumo">
            <DashboardSummary />
          </TabsContent>
          <TabsContent value="eventos">
            <AdverseEvents />
          </TabsContent>
          <TabsContent value="capa">
            <Capas />
          </TabsContent>
          <TabsContent value="causa_raiz">
            <RootCauseAnalysis />
          </TabsContent>
          <TabsContent value="competencias">
            <CompetencyMatrix />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Inline dashboard summary
const DashboardSummary = () => {
  const [stats, setStats] = useState({
    adverse_events: 0, adverse_critical: 0,
    capas_open: 0, capas_verification: 0,
    ncs_open: 0, docs_expiring: 0,
    trainings_expiring: 0, audits_upcoming: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const now = new Date();
      const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30);

      const [evRes, capaRes, ncRes, docRes, trainRes, auditRes] = await Promise.all([
        supabase.from("adverse_events").select("id, severity, status"),
        supabase.from("capas").select("id, status"),
        supabase.from("non_conformities").select("id, status"),
        supabase.from("quality_documents").select("id, valid_until, status").eq("status", "aprovado"),
        supabase.from("trainings").select("id, expiry_date"),
        supabase.from("audits").select("id, scheduled_date, status").eq("status", "planejada"),
      ]);

      const events = (evRes.data as any[]) ?? [];
      const capas = (capaRes.data as any[]) ?? [];
      const ncs = (ncRes.data as any[]) ?? [];
      const docs = (docRes.data as any[]) ?? [];
      const trainings = (trainRes.data as any[]) ?? [];
      const audits = (auditRes.data as any[]) ?? [];

      setStats({
        adverse_events: events.length,
        adverse_critical: events.filter(e => (e.severity === "grave" || e.severity === "sentinela") && e.status !== "encerrado").length,
        capas_open: capas.filter(c => c.status !== "encerrada").length,
        capas_verification: capas.filter(c => c.status === "verificacao_eficacia").length,
        ncs_open: ncs.filter(n => n.status !== "concluida").length,
        docs_expiring: docs.filter(d => d.valid_until && new Date(d.valid_until) < thirtyDays).length,
        trainings_expiring: trainings.filter(t => t.expiry_date && new Date(t.expiry_date) < thirtyDays).length,
        audits_upcoming: audits.filter(a => { const d = new Date(a.scheduled_date); const week = new Date(); week.setDate(week.getDate() + 7); return d >= now && d <= week; }).length,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Eventos Adversos", value: stats.adverse_events, sub: `${stats.adverse_critical} críticos`, icon: ShieldAlert, color: "text-destructive", danger: stats.adverse_critical > 0 },
    { label: "CAPAs Abertas", value: stats.capas_open, sub: `${stats.capas_verification} em verificação`, icon: Target, color: "text-accent", danger: false },
    { label: "NCs Abertas", value: stats.ncs_open, sub: "não conformidades", icon: AlertTriangle, color: "text-warning", danger: stats.ncs_open > 5 },
    { label: "Docs a Vencer", value: stats.docs_expiring, sub: "próximos 30 dias", icon: FileText, color: "text-foreground", danger: stats.docs_expiring > 0 },
    { label: "Treinamentos", value: stats.trainings_expiring, sub: "certificações a vencer", icon: GraduationCap, color: "text-accent", danger: stats.trainings_expiring > 0 },
    { label: "Auditorias", value: stats.audits_upcoming, sub: "próximos 7 dias", icon: ClipboardCheck, color: "text-primary", danger: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Resumo Executivo</h2>
        <p className="text-sm text-muted-foreground">Visão consolidada de todos os módulos de qualidade</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <div key={i} className={`rounded-xl border bg-card p-5 shadow-[var(--card-shadow)] ${c.danger ? "border-destructive/30" : ""}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
              </div>
              <c.icon className={`h-8 w-8 opacity-20 ${c.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
        <h3 className="mb-4 font-display text-lg font-bold text-foreground">Módulos Disponíveis</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Eventos Adversos", desc: "Notificação de incidentes, near-misses e eventos sentinela", icon: ShieldAlert },
            { name: "CAPA", desc: "Ações corretivas e preventivas com verificação de eficácia", icon: Target },
            { name: "Análise de Causa Raiz", desc: "Ishikawa (6M) e 5 Porquês interativos", icon: FishSymbol },
            { name: "Matriz de Competências", desc: "Mapeamento e avaliação de competências por cargo", icon: GraduationCap },
            { name: "Notificações", desc: "Alertas automáticos de prazos, vencimentos e escalações", icon: AlertTriangle },
          ].map((m, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border bg-secondary/30 p-4">
              <m.icon className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
