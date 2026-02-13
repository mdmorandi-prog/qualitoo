import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LogOut, LayoutDashboard, AlertTriangle, BarChart3, FileText,
  ClipboardCheck, Target, GraduationCap, FishSymbol, ShieldAlert,
  TriangleAlert, Crosshair, BookOpen, Users2, Menu, X, PanelLeftClose, PanelLeft,
  Download, Shield, Settings, Truck, Heart, FileBarChart, GitBranch, Gauge, Workflow,
} from "lucide-react";
import sgqLogo from "@/assets/sgq-logo.png";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import NotificationsPanel from "@/components/NotificationsPanel";
import { useDashboardAlerts } from "@/hooks/useDashboardAlerts";
import { supabase } from "@/integrations/supabase/client";
import { NcTrendChart, RiskDistributionChart, ActionPlansChart, EventsTrendChart, IndicatorsVsTargetChart, type DateFilter } from "@/components/dashboard/DashboardCharts";
import { MaturityRadarChart } from "@/components/dashboard/MaturityRadarChart";
import { exportDashboardPdf } from "@/lib/exportPdf";

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
import UserManagement from "@/pages/quality/UserManagement";
import Suppliers from "@/pages/quality/Suppliers";
import SatisfactionSurveys from "@/pages/quality/SatisfactionSurveys";
import RegulatoryReports from "@/pages/quality/RegulatoryReports";
import ProcessMapping from "@/pages/quality/ProcessMapping";
import CustomizableDashboard from "@/components/dashboard/CustomizableDashboard";
import WorkflowConfig from "@/pages/quality/WorkflowConfig";

const allTabs = [
  { key: "resumo", label: "Resumo", icon: LayoutDashboard },
  { key: "meu_dashboard", label: "Meu Dashboard", icon: Gauge },
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
  { key: "fornecedores", label: "Fornecedores", icon: Truck },
  { key: "pesquisas", label: "Satisfação", icon: Heart },
  { key: "regulatorio", label: "Regulatório", icon: FileBarChart },
  { key: "processos", label: "Processos BPMN", icon: GitBranch },
  { key: "workflows", label: "Workflows", icon: Workflow },
  { key: "usuarios", label: "Usuários", icon: Settings, adminOnly: true },
] as const;

const contentMap: Record<string, React.FC> = {
  meu_dashboard: CustomizableDashboard,
  ncs: NonConformities, indicadores: Indicators, documentos: Documents,
  auditorias: Audits, planos: ActionPlans, riscos: RiskManagement,
  treinamentos: Trainings, atas: MeetingMinutes, eventos: AdverseEvents,
  capa: Capas, causa_raiz: RootCauseAnalysis, competencias: CompetencyMatrix,
  fornecedores: Suppliers, pesquisas: SatisfactionSurveys, regulatorio: RegulatoryReports,
  processos: ProcessMapping, workflows: WorkflowConfig, usuarios: UserManagement,
};

const AdminDashboard = () => {
  const { user, signOut, isAdmin, isAnalyst, loading: authLoading } = useAuth();
  useDashboardAlerts();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "resumo";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [allowedModules, setAllowedModules] = useState<string[] | null>(null);

  // Fetch module access for non-admin users
  useEffect(() => {
    if (!user || isAdmin) {
      setAllowedModules(null); // Admin sees all
      return;
    }
    supabase
      .from("user_module_access")
      .select("module_key")
      .eq("user_id", user.id)
      .eq("can_access", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAllowedModules(data.map((d: any) => d.module_key));
        } else {
          setAllowedModules(null); // No restrictions configured = show all
        }
      });
  }, [user, isAdmin]);

  // Filter tabs based on access
  const tabs = allTabs.filter(t => {
    if ("adminOnly" in t && t.adminOnly && !isAdmin) return false;
    if (isAdmin || !allowedModules) return true;
    if (t.key === "resumo") return true; // Always show summary
    return allowedModules.includes(t.key);
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/admin/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
    if (isMobile) setCollapsed(false);
  }, [isMobile]);

  const handleLogout = async () => { await signOut(); navigate("/admin/login"); };
  const setTab = (tab: string) => {
    setSearchParams({ tab });
    if (isMobile) setSidebarOpen(false);
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
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

  const ActiveContent = activeTab === "resumo" ? null : contentMap[activeTab];

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed && !isMobile ? "w-16" : "w-64"} lg:relative lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className={`flex h-16 shrink-0 items-center border-b border-sidebar-border ${collapsed && !isMobile ? "justify-center px-2" : "justify-between px-4"}`}>
          {collapsed && !isMobile ? (
            <img src={sgqLogo} alt="SGQ" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <img src={sgqLogo} alt="SGQ" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-tight">SGQ Hospitalar</span>
                  <Badge className="mt-0.5 w-fit border-0 bg-sidebar-accent text-[10px] text-sidebar-accent-foreground">
                    {isAdmin ? "Admin" : "Analista"}
                  </Badge>
                </div>
              </div>
              {isMobile && (
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground hover:bg-sidebar-accent">
                  <X className="h-5 w-5" />
                </Button>
              )}
            </>
          )}
        </div>

        {/* Sidebar Nav */}
        <ScrollArea className={`flex-1 py-4 ${collapsed && !isMobile ? "px-2" : "px-3"}`}>
          <nav className="space-y-1">
            {tabs.map(t => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  title={collapsed && !isMobile ? t.label : undefined}
                  className={`flex w-full items-center rounded-lg transition-colors ${
                    collapsed && !isMobile ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                  } text-sm font-medium ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4 shrink-0" />
                  {!(collapsed && !isMobile) && <span className="truncate">{t.label}</span>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className={`shrink-0 border-t border-sidebar-border ${collapsed && !isMobile ? "p-2" : "p-3"}`}>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={`mb-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground ${
                collapsed ? "w-full justify-center" : "w-full justify-start gap-2"
              }`}
            >
              {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> <span className="text-xs">Recolher</span></>}
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground ${
              collapsed && !isMobile ? "w-full justify-center" : "w-full justify-start gap-2"
            }`}
          >
            <LogOut className="h-4 w-4" /> {!(collapsed && !isMobile) && "Sair"}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-sm font-semibold text-foreground">
              {tabs.find(t => t.key === activeTab)?.label ?? "Resumo"}
            </h1>
          </div>
          <NotificationsPanel />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {activeTab === "resumo" ? (
            <DashboardSummary onNavigate={setTab} />
          ) : ActiveContent ? (
            <ActiveContent />
          ) : null}
        </main>
        <footer className="shrink-0 border-t px-4 py-2 text-center text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} DM Consultoria em TI Ltda. Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
};

// Dashboard Summary
const DashboardSummary = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: sixMonthsAgo.toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Resumo Executivo</h2>
          <p className="text-sm text-muted-foreground">Visão consolidada do Sistema de Gestão da Qualidade</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => { exportDashboardPdf(); }}>
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
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

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-[var(--card-shadow)]">
        <span className="text-xs font-semibold text-muted-foreground">Período dos gráficos:</span>
        <input
          type="date"
          value={dateFilter.startDate}
          onChange={e => setDateFilter(f => ({ ...f, startDate: e.target.value }))}
          className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
        />
        <span className="text-xs text-muted-foreground">até</span>
        <input
          type="date"
          value={dateFilter.endDate}
          onChange={e => setDateFilter(f => ({ ...f, endDate: e.target.value }))}
          className="rounded-md border bg-background px-2 py-1 text-xs text-foreground"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MaturityRadarChart />
        <NcTrendChart filter={dateFilter} />
        <RiskDistributionChart />
        <ActionPlansChart filter={dateFilter} />
        <EventsTrendChart filter={dateFilter} />
        <IndicatorsVsTargetChart />
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-[var(--card-shadow)]">
        <h3 className="mb-4 font-display text-lg font-bold text-foreground">Módulos do SGQ</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {allTabs.filter(t => t.key !== "resumo" && !("adminOnly" in t && t.adminOnly)).map((t, i) => (
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
