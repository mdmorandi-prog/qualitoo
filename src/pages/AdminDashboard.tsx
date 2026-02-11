import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Shield, LogOut, LayoutDashboard, AlertTriangle, BarChart3, FileText,
  ClipboardCheck, Target, GraduationCap, FishSymbol, ShieldAlert,
  TriangleAlert, FileCheck, Crosshair, BookOpen, Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import NotificationsPanel from "@/components/NotificationsPanel";
import { supabase } from "@/integrations/supabase/client";

// Lazy imports for code splitting
import AdverseEvents from "@/pages/quality/AdverseEvents";
import Capas from "@/pages/quality/Capas";
import RootCauseAnalysis from "@/pages/quality/RootCauseAnalysis";
import CompetencyMatrix from "@/pages/quality/CompetencyMatrix";
import NonConformities from "@/pages/quality/NonConformities";
import Indicators from "@/pages/quality/Indicators";
import Documents from "@/pages/quality/Documents";
import Audits from "@/pages/quality/Audits";
import ActionPlans from "@/pages/quality/ActionPlans";
import RiskManagement from "@/pages/quality/RiskManagement";
import Trainings from "@/pages/quality/Trainings";
import MeetingMinutes from "@/pages/quality/MeetingMinutes";

const tabs = [
  { key: "resumo", label: "Resumo", icon: LayoutDashboard },
  { key: "ncs", label: "Não Conformidades", icon: AlertTriangle },
  { key: "indicadores", label: "Indicadores", icon: BarChart3 },
  { key: "documentos", label: "Documentos", icon: FileText },
  { key: "auditorias", label: "Auditorias", icon: ClipboardCheck },
  { key: "planos", label: "Planos de Ação", icon: Crosshair },
  { key: "riscos", label: "Riscos", icon: TriangleAlert },
  { key: "treinamentos", label: "Treinamentos", icon: GraduationCap },
  { key: "atas", label: "Atas", icon: BookOpen },
  { key: "eventos", label: "Eventos Adversos", icon: ShieldAlert },
  { key: "capa", label: "CAPA", icon: Target },
  { key: "causa_raiz", label: "Causa Raiz", icon: FishSymbol },
  { key: "competencias", label: "Competências", icon: Users2 },
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

  const setTab = (tab: string) => setSearchParams({ tab });

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
          <ScrollArea className="mb-6 w-full">
            <TabsList className="inline-flex w-max gap-1 bg-transparent p-0">
              {tabs.map(t => (
                <TabsTrigger key={t.key} value={t.key} className="gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-xs data-[state=active]:border-primary/30 data-[state=active]:bg-primary/10 data-[state=active]:text-primary sm:text-sm">
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="resumo"><DashboardSummary onNavigate={setTab} /></TabsContent>
          <TabsContent value="ncs"><NonConformities /></TabsContent>
          <TabsContent value="indicadores"><Indicators /></TabsContent>
          <TabsContent value="documentos"><Documents /></TabsContent>
          <TabsContent value="auditorias"><Audits /></TabsContent>
          <TabsContent value="planos"><ActionPlans /></TabsContent>
          <TabsContent value="riscos"><RiskManagement /></TabsContent>
          <TabsContent value="treinamentos"><Trainings /></TabsContent>
          <TabsContent value="atas"><MeetingMinutes /></TabsContent>
          <TabsContent value="eventos"><AdverseEvents /></TabsContent>
          <TabsContent value="capa"><Capas /></TabsContent>
          <TabsContent value="causa_raiz"><RootCauseAnalysis /></TabsContent>
          <TabsContent value="competencias"><CompetencyMatrix /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

// Dashboard Summary
const DashboardSummary = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const [stats, setStats] = useState({
    ncs_open: 0, ncs_critical: 0,
    indicators_below: 0, indicators_total: 0,
    docs_expiring: 0, docs_total: 0,
    audits_upcoming: 0, audits_total: 0,
    plans_pending: 0, plans_total: 0,
    risks_critical: 0, risks_total: 0,
    trainings_expiring: 0, trainings_total: 0,
    meetings_total: 0,
    events_critical: 0, events_total: 0,
    capas_open: 0, capas_total: 0,
    competencies_gaps: 0,
  });

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const thirtyDays = new Date(); thirtyDays.setDate(now.getDate() + 30);
      const sevenDays = new Date(); sevenDays.setDate(now.getDate() + 7);

      const [ncRes, indRes, measRes, docRes, audRes, planRes, riskRes, trainRes, meetRes, evRes, capaRes, compEvalRes] = await Promise.all([
        supabase.from("non_conformities").select("id, status, severity"),
        supabase.from("quality_indicators").select("id, target_value"),
        supabase.from("indicator_measurements").select("id, indicator_id, value").order("period_date", { ascending: false }),
        supabase.from("quality_documents").select("id, status, valid_until"),
        supabase.from("audits").select("id, status, scheduled_date"),
        supabase.from("action_plans").select("id, status"),
        supabase.from("risks").select("id, risk_level, status"),
        supabase.from("trainings").select("id, status, expiry_date"),
        supabase.from("meeting_minutes").select("id"),
        supabase.from("adverse_events").select("id, severity, status"),
        supabase.from("capas").select("id, status"),
        supabase.from("competency_evaluations").select("id, level"),
      ]);

      const ncs = (ncRes.data as any[]) ?? [];
      const inds = (indRes.data as any[]) ?? [];
      const meas = (measRes.data as any[]) ?? [];
      const docs = (docRes.data as any[]) ?? [];
      const auds = (audRes.data as any[]) ?? [];
      const plans = (planRes.data as any[]) ?? [];
      const risks = (riskRes.data as any[]) ?? [];
      const trains = (trainRes.data as any[]) ?? [];
      const meets = (meetRes.data as any[]) ?? [];
      const events = (evRes.data as any[]) ?? [];
      const capas = (capaRes.data as any[]) ?? [];
      const evals = (compEvalRes.data as any[]) ?? [];

      // Calculate indicators below target
      const indBelow = inds.filter(ind => {
        const lastMeas = meas.find(m => m.indicator_id === ind.id);
        return lastMeas && lastMeas.value < ind.target_value;
      }).length;

      setStats({
        ncs_open: ncs.filter(n => n.status !== "concluida").length,
        ncs_critical: ncs.filter(n => (n.severity === "alta" || n.severity === "critica") && n.status !== "concluida").length,
        indicators_below: indBelow, indicators_total: inds.length,
        docs_expiring: docs.filter(d => d.status === "aprovado" && d.valid_until && new Date(d.valid_until) < thirtyDays).length,
        docs_total: docs.length,
        audits_upcoming: auds.filter(a => a.status === "planejada" && new Date(a.scheduled_date) <= sevenDays && new Date(a.scheduled_date) >= now).length,
        audits_total: auds.length,
        plans_pending: plans.filter(p => p.status === "pendente").length, plans_total: plans.length,
        risks_critical: risks.filter(r => (r.risk_level ?? 0) >= 15).length, risks_total: risks.length,
        trainings_expiring: trains.filter(t => t.expiry_date && new Date(t.expiry_date) < thirtyDays && new Date(t.expiry_date) > now).length,
        trainings_total: trains.length,
        meetings_total: meets.length,
        events_critical: events.filter(e => (e.severity === "grave" || e.severity === "sentinela") && e.status !== "encerrado").length,
        events_total: events.length,
        capas_open: capas.filter(c => c.status !== "encerrada").length, capas_total: capas.length,
        competencies_gaps: evals.filter(e => e.level < 3).length,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "NCs Abertas", value: stats.ncs_open, sub: `${stats.ncs_critical} críticas`, color: "text-destructive", danger: stats.ncs_critical > 0, tab: "ncs" },
    { label: "Indicadores", value: stats.indicators_below, sub: `abaixo da meta (de ${stats.indicators_total})`, color: "text-warning", danger: stats.indicators_below > 0, tab: "indicadores" },
    { label: "Docs a Vencer", value: stats.docs_expiring, sub: `próx. 30 dias (de ${stats.docs_total})`, color: "text-foreground", danger: stats.docs_expiring > 0, tab: "documentos" },
    { label: "Auditorias", value: stats.audits_upcoming, sub: `próx. 7 dias (de ${stats.audits_total})`, color: "text-accent", danger: false, tab: "auditorias" },
    { label: "Planos Pendentes", value: stats.plans_pending, sub: `de ${stats.plans_total} total`, color: "text-warning", danger: stats.plans_pending > 5, tab: "planos" },
    { label: "Riscos Críticos", value: stats.risks_critical, sub: `de ${stats.risks_total} mapeados`, color: "text-destructive", danger: stats.risks_critical > 0, tab: "riscos" },
    { label: "Treinamentos", value: stats.trainings_expiring, sub: `a vencer (de ${stats.trainings_total})`, color: "text-warning", danger: stats.trainings_expiring > 0, tab: "treinamentos" },
    { label: "Eventos Graves", value: stats.events_critical, sub: `sem investigação (de ${stats.events_total})`, color: "text-destructive", danger: stats.events_critical > 0, tab: "eventos" },
    { label: "CAPAs Abertas", value: stats.capas_open, sub: `de ${stats.capas_total} total`, color: "text-accent", danger: false, tab: "capa" },
    { label: "Gaps Competência", value: stats.competencies_gaps, sub: "avaliações < nível 3", color: "text-warning", danger: stats.competencies_gaps > 0, tab: "competencias" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Resumo Executivo</h2>
        <p className="text-sm text-muted-foreground">Visão consolidada do Sistema de Gestão da Qualidade</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c, i) => (
          <button key={i} onClick={() => onNavigate(c.tab)} className={`rounded-xl border bg-card p-4 text-left shadow-[var(--card-shadow)] transition-all hover:shadow-[var(--card-shadow-hover)] ${c.danger ? "border-destructive/30" : ""}`}>
            <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{c.sub}</p>
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
        <h3 className="mb-4 font-display text-lg font-bold text-foreground">Módulos do SGQ</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tabs.filter(t => t.key !== "resumo").map((t, i) => (
            <button key={i} onClick={() => onNavigate(t.key)} className="flex items-center gap-3 rounded-lg border bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60">
              <t.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
