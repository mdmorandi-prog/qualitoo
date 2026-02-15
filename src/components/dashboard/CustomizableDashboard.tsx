import { useState, useEffect, useCallback } from "react";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Save, RotateCcw, X, GripVertical, Lock, Unlock, Share2, Users, Globe, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { WidgetRenderer, widgetRegistry, type WidgetDefinition } from "./DashboardWidgets";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetConfig {
  widgetId: string;
  layoutKey: string;
}

interface DashboardConfig {
  id?: string;
  layouts: Record<string, Layout[]>;
  widgets: WidgetConfig[];
}

const defaultWidgets: WidgetConfig[] = [
  { widgetId: "ncs_summary", layoutKey: "ncs_summary" },
  { widgetId: "indicators_status", layoutKey: "indicators_status" },
  { widgetId: "docs_status", layoutKey: "docs_status" },
  { widgetId: "events_summary", layoutKey: "events_summary" },
  { widgetId: "capas_summary", layoutKey: "capas_summary" },
  { widgetId: "risks_heatmap", layoutKey: "risks_heatmap" },
  { widgetId: "plans_progress", layoutKey: "plans_progress" },
  { widgetId: "maturity_radar", layoutKey: "maturity_radar" },
];

const generateDefaultLayouts = (widgets: WidgetConfig[]): Record<string, Layout[]> => {
  const lg: Layout[] = widgets.map((w, i) => {
    const def = widgetRegistry.find((r) => r.id === w.widgetId);
    const cols = 12;
    const dw = def?.defaultW ?? 3;
    const dh = def?.defaultH ?? 2;
    const x = (i * dw) % cols;
    const y = Math.floor((i * dw) / cols) * dh;
    return {
      i: w.layoutKey,
      x,
      y,
      w: dw,
      h: dh,
      minW: def?.minW ?? 2,
      minH: def?.minH ?? 2,
    };
  });
  return { lg, md: lg, sm: lg.map((l) => ({ ...l, w: 6, x: (lg.indexOf(l) % 2) * 6 })) };
};

const CustomizableDashboard = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [editing, setEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [sharedRoles, setSharedRoles] = useState<string[]>([]);
  const [sharedDashboards, setSharedDashboards] = useState<any[]>([]);
  const [locked, setLocked] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_dashboard_configs")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .maybeSingle();

    if (data) {
      setConfig({
        id: data.id,
        layouts: (data.layouts as unknown as Record<string, Layout[]>) ?? generateDefaultLayouts(defaultWidgets),
        widgets: (data.widgets as unknown as WidgetConfig[]) ?? defaultWidgets,
      });
      setIsShared(data.is_shared ?? false);
      setSharedRoles((data.shared_with_roles as string[]) ?? []);
    } else {
      setConfig({
        layouts: generateDefaultLayouts(defaultWidgets),
        widgets: defaultWidgets,
      });
    }
    setLoading(false);
  }, [user]);

  // Load shared dashboards from other users
  const loadSharedDashboards = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_dashboard_configs")
      .select("*")
      .eq("is_shared", true)
      .neq("user_id", user.id);
    setSharedDashboards(data ?? []);
  }, [user]);

  useEffect(() => { loadConfig(); loadSharedDashboards(); }, [loadConfig, loadSharedDashboards]);

  const saveConfig = async () => {
    if (!user || !config) return;

    const payload = {
      user_id: user.id,
      config_name: "Padrão",
      layouts: config.layouts as any,
      widgets: config.widgets as any,
      is_default: true,
    };

    if (config.id) {
      const { error } = await supabase
        .from("user_dashboard_configs")
        .update(payload)
        .eq("id", config.id);
      if (error) return toast.error("Erro ao salvar");
    } else {
      const { data, error } = await supabase
        .from("user_dashboard_configs")
        .insert(payload)
        .select()
        .single();
      if (error) return toast.error("Erro ao salvar");
      setConfig((prev) => prev ? { ...prev, id: data.id } : prev);
    }
    toast.success("Dashboard salvo!");
    setEditing(false);
    setLocked(true);
  };

  const saveShareSettings = async () => {
    if (!user || !config?.id) {
      toast.error("Salve o dashboard primeiro antes de compartilhar");
      return;
    }
    const { error } = await supabase
      .from("user_dashboard_configs")
      .update({
        is_shared: isShared,
        shared_with_roles: sharedRoles,
      })
      .eq("id", config.id);
    if (error) return toast.error("Erro ao compartilhar");
    toast.success(isShared ? "Dashboard compartilhado!" : "Compartilhamento removido");
    setShowShareDialog(false);
    loadSharedDashboards();
  };

  const loadSharedDashboard = async (dashId: string) => {
    const { data } = await supabase
      .from("user_dashboard_configs")
      .select("*")
      .eq("id", dashId)
      .single();
    if (data) {
      setConfig({
        id: config?.id,
        layouts: (data.layouts as unknown as Record<string, Layout[]>) ?? generateDefaultLayouts(defaultWidgets),
        widgets: (data.widgets as unknown as WidgetConfig[]) ?? defaultWidgets,
      });
      toast.success(`Layout "${data.config_name}" aplicado!`);
    }
  };

  const toggleRole = (role: string) => {
    setSharedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const resetToDefault = () => {
    setConfig({
      id: config?.id,
      layouts: generateDefaultLayouts(defaultWidgets),
      widgets: defaultWidgets,
    });
    toast.info("Layout restaurado ao padrão");
  };

  const addWidget = (def: WidgetDefinition) => {
    if (!config) return;
    const layoutKey = `${def.id}_${Date.now()}`;
    const newWidget: WidgetConfig = { widgetId: def.id, layoutKey };
    const newWidgets = [...config.widgets, newWidget];

    const newLayout: Layout = {
      i: layoutKey,
      x: 0,
      y: Infinity,
      w: def.defaultW,
      h: def.defaultH,
      minW: def.minW ?? 2,
      minH: def.minH ?? 2,
    };

    const newLayouts: Record<string, Layout[]> = {};
    for (const [bp, layouts] of Object.entries(config.layouts)) {
      newLayouts[bp] = [...layouts, newLayout];
    }
    if (Object.keys(newLayouts).length === 0) {
      newLayouts.lg = [newLayout];
    }

    setConfig({ ...config, widgets: newWidgets, layouts: newLayouts });
    setShowAddWidget(false);
  };

  const removeWidget = (layoutKey: string) => {
    if (!config) return;
    setConfig({
      ...config,
      widgets: config.widgets.filter((w) => w.layoutKey !== layoutKey),
      layouts: Object.fromEntries(
        Object.entries(config.layouts).map(([bp, layouts]) => [
          bp,
          layouts.filter((l) => l.i !== layoutKey),
        ])
      ),
    });
  };

  const onLayoutChange = (_: Layout[], allLayouts: Record<string, Layout[]>) => {
    if (!config || locked) return;
    setConfig({ ...config, layouts: allLayouts });
  };

  if (loading) return <p className="text-muted-foreground">Carregando dashboard...</p>;
  if (!config) return null;

  const activeWidgetIds = config.widgets.map((w) => w.widgetId);
  const availableWidgets = widgetRegistry.filter(
    (r) => !activeWidgetIds.includes(r.id) || widgetRegistry.filter((w) => w.id === r.id).length > 0
  );

  const categories = [...new Set(availableWidgets.map((w) => w.category))];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-2xl font-bold text-foreground">Meu Dashboard</h2>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocked(!locked)}
            title={locked ? "Desbloquear edição" : "Bloquear edição"}
          >
            {locked ? <Lock className="mr-1 h-4 w-4" /> : <Unlock className="mr-1 h-4 w-4" />}
            {locked ? "Bloqueado" : "Editando"}
          </Button>
          {!locked && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowAddWidget(true)}>
                <Plus className="mr-1 h-4 w-4" /> Widget
              </Button>
              <Button variant="outline" size="sm" onClick={resetToDefault}>
                <RotateCcw className="mr-1 h-4 w-4" /> Resetar
              </Button>
              <Button size="sm" onClick={saveConfig}>
                <Save className="mr-1 h-4 w-4" /> Salvar
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowShareDialog(true)}>
            <Share2 className="mr-1 h-4 w-4" /> Compartilhar
          </Button>
        </div>
      </div>

      {/* Shared dashboards from others */}
      {sharedDashboards.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Dashboards compartilhados:</span>
          {sharedDashboards.map((d) => (
            <Button
              key={d.id}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => loadSharedDashboard(d.id)}
            >
              <Globe className="mr-1 h-3 w-3" />
              {d.config_name}
            </Button>
          ))}
        </div>
      )}

      {!locked && (
        <p className="text-xs text-muted-foreground">
          Arraste e redimensione os widgets. Clique no X para remover. Salve quando terminar.
        </p>
      )}

      {/* Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={config.layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={80}
        isDraggable={!locked}
        isResizable={!locked}
        onLayoutChange={onLayoutChange}
        draggableHandle=".widget-drag-handle"
        compactType="vertical"
        margin={[16, 16]}
      >
        {config.widgets.map((w) => {
          const def = widgetRegistry.find((r) => r.id === w.widgetId);
          const canNavigate = locked && def?.navigateTo && onNavigate;
          return (
            <div key={w.layoutKey}>
              <Card
                className={`flex h-full flex-col overflow-hidden transition-shadow ${canNavigate ? "cursor-pointer hover:shadow-lg hover:border-primary/40" : ""}`}
                onClick={() => { if (canNavigate) onNavigate(def.navigateTo!); }}
              >
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 px-3 py-2">
                  {!locked && (
                    <GripVertical className="widget-drag-handle h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
                  )}
                  {def && <def.icon className="h-4 w-4 text-muted-foreground" />}
                  <CardTitle className="flex-1 text-xs font-medium">{def?.label ?? w.widgetId}</CardTitle>
                  {canNavigate && (
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  )}
                  {!locked && (
                    <button onClick={(e) => { e.stopPropagation(); removeWidget(w.layoutKey); }} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-2">
                  <WidgetRenderer widgetId={w.widgetId} />
                </CardContent>
              </Card>
            </div>
          );
        })}
      </ResponsiveGridLayout>

      {/* Add Widget Dialog */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Widget</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-4 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{cat}</p>
                <div className="grid grid-cols-2 gap-2">
                  {availableWidgets
                    .filter((w) => w.category === cat)
                    .map((w) => (
                      <button
                        key={w.id}
                        onClick={() => addWidget(w)}
                        className="flex items-center gap-2 rounded-lg border bg-background p-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
                      >
                        <w.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{w.label}</span>
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Compartilhar Dashboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="share-toggle" className="text-sm font-medium">Compartilhar com outros usuários</Label>
                <p className="text-xs text-muted-foreground">
                  Outros usuários poderão aplicar seu layout de dashboard
                </p>
              </div>
              <Switch
                id="share-toggle"
                checked={isShared}
                onCheckedChange={setIsShared}
              />
            </div>

            {isShared && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Compartilhar com perfis</Label>
                <div className="space-y-2">
                  {["admin", "analyst"].map((role) => (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                        sharedRoles.includes(role)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 capitalize">{role === "admin" ? "Administradores" : "Analistas"}</span>
                      {sharedRoles.includes(role) && (
                        <Badge variant="secondary" className="text-xs">Selecionado</Badge>
                      )}
                    </button>
                  ))}
                </div>
                {sharedRoles.length === 0 && (
                  <p className="text-xs text-warning">
                    Nenhum perfil selecionado — o dashboard ficará visível para todos.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveShareSettings}>
              <Save className="mr-1 h-4 w-4" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomizableDashboard;
