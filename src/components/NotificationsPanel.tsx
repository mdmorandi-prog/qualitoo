import { useEffect, useState } from "react";
import { Bell, CheckCheck, AlertTriangle, Clock, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  module: string | null;
  is_read: boolean;
  created_at: string;
}

interface SystemAlert {
  type: "warning" | "danger" | "info";
  icon: any;
  title: string;
  message: string;
  module: string;
}

const NotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      generateSystemAlerts();
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data as any[]) ?? []);
  };

  const generateSystemAlerts = async () => {
    const newAlerts: SystemAlert[] = [];

    // Check for overdue NCs
    const { data: ncs } = await supabase
      .from("non_conformities")
      .select("id, title, deadline, status")
      .neq("status", "concluida")
      .not("deadline", "is", null);

    if (ncs) {
      const overdue = ncs.filter(nc => nc.deadline && new Date(nc.deadline) < new Date());
      if (overdue.length > 0) {
        newAlerts.push({
          type: "danger", icon: AlertTriangle,
          title: `${overdue.length} NC(s) com prazo vencido`,
          message: `Existem não conformidades com prazo expirado que precisam de atenção.`,
          module: "non_conformities",
        });
      }
    }

    // Check for documents expiring soon
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const { data: docs } = await supabase
      .from("quality_documents")
      .select("id, title, valid_until")
      .eq("status", "aprovado")
      .not("valid_until", "is", null);

    if (docs) {
      const expiring = docs.filter(d => d.valid_until && new Date(d.valid_until) < thirtyDaysFromNow);
      if (expiring.length > 0) {
        newAlerts.push({
          type: "warning", icon: FileText,
          title: `${expiring.length} documento(s) perto do vencimento`,
          message: `Documentos que vencem nos próximos 30 dias precisam de revisão.`,
          module: "documents",
        });
      }
    }

    // Check trainings expiring
    const { data: trainings } = await supabase
      .from("trainings")
      .select("id, title, expiry_date")
      .not("expiry_date", "is", null);

    if (trainings) {
      const expiring = trainings.filter(t => t.expiry_date && new Date(t.expiry_date) < thirtyDaysFromNow);
      if (expiring.length > 0) {
        newAlerts.push({
          type: "warning", icon: Clock,
          title: `${expiring.length} treinamento(s) a vencer`,
          message: `Certificações de treinamentos que vencem em breve.`,
          module: "trainings",
        });
      }
    }

    // Check upcoming audits
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const { data: audits } = await supabase
      .from("audits")
      .select("id, title, scheduled_date, status")
      .eq("status", "planejada");

    if (audits) {
      const upcoming = audits.filter(a => {
        const d = new Date(a.scheduled_date);
        return d >= new Date() && d <= sevenDaysFromNow;
      });
      if (upcoming.length > 0) {
        newAlerts.push({
          type: "info", icon: Shield,
          title: `${upcoming.length} auditoria(s) nos próximos 7 dias`,
          message: `Auditorias planejadas para esta semana.`,
          module: "audits",
        });
      }
    }

    // Check adverse events pending investigation
    const { data: events } = await supabase
      .from("adverse_events")
      .select("id, severity, status")
      .in("status", ["notificado"]);

    if (events) {
      const critical = events.filter(e => e.severity === "grave" || e.severity === "sentinela");
      if (critical.length > 0) {
        newAlerts.push({
          type: "danger", icon: AlertTriangle,
          title: `${critical.length} evento(s) grave(s) sem investigação`,
          message: `Eventos adversos graves/sentinela aguardando investigação.`,
          module: "adverse_events",
        });
      }
    }

    setAlerts(newAlerts);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true } as any)
      .eq("user_id", user.id)
      .eq("is_read", false);
    fetchNotifications();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length + alerts.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative gap-2 text-muted-foreground">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-[10px] text-destructive-foreground">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-bold text-foreground">Notificações</h3>
          {notifications.some(n => !n.is_read) && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 gap-1 text-xs">
              <CheckCheck className="h-3 w-3" /> Marcar lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {/* System Alerts */}
          {alerts.map((alert, i) => (
            <div key={`alert-${i}`} className={`border-b px-4 py-3 ${alert.type === "danger" ? "bg-destructive/5" : alert.type === "warning" ? "bg-warning/5" : "bg-accent/5"}`}>
              <div className="flex items-start gap-3">
                <alert.icon className={`mt-0.5 h-4 w-4 ${alert.type === "danger" ? "text-destructive" : alert.type === "warning" ? "text-warning" : "text-accent"}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}

          {/* User Notifications */}
          {notifications.length === 0 && alerts.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : notifications.map(n => (
            <div key={n.id} className={`border-b px-4 py-3 ${!n.is_read ? "bg-primary/5" : ""}`}>
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.message}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsPanel;
