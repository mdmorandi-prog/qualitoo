import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Shows toast alerts for critical items when the dashboard first loads.
 * Only fires once per session to avoid spamming the user.
 */
export const useDashboardAlerts = () => {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const check = async () => {
      const now = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(now.getDate() + 30);
      const sevenDays = new Date();
      sevenDays.setDate(now.getDate() + 7);

      const [ncRes, docRes, trainRes, audRes, evRes] = await Promise.all([
        supabase.from("non_conformities").select("id, title, deadline, status, severity").neq("status", "concluida").not("deadline", "is", null),
        supabase.from("quality_documents").select("id, title, valid_until, status").eq("status", "aprovado").not("valid_until", "is", null),
        supabase.from("trainings").select("id, title, expiry_date").not("expiry_date", "is", null),
        supabase.from("audits").select("id, title, scheduled_date, status").eq("status", "planejada"),
        supabase.from("adverse_events").select("id, severity, status").in("status", ["notificado"]),
      ]);

      const ncs = (ncRes.data as any[]) ?? [];
      const docs = (docRes.data as any[]) ?? [];
      const trains = (trainRes.data as any[]) ?? [];
      const audits = (audRes.data as any[]) ?? [];
      const events = (evRes.data as any[]) ?? [];

      // Overdue NCs
      const overdueNcs = ncs.filter(nc => nc.deadline && new Date(nc.deadline) < now);
      if (overdueNcs.length > 0) {
        toast.error(`${overdueNcs.length} NC(s) com prazo vencido`, {
          description: "Acesse Não Conformidades para tratar.",
          duration: 8000,
        });
      }

      // Critical NCs
      const criticalNcs = ncs.filter(nc => nc.severity === "critica" || nc.severity === "alta");
      if (criticalNcs.length > 0 && overdueNcs.length === 0) {
        toast.warning(`${criticalNcs.length} NC(s) crítica(s) em aberto`, {
          description: "Atenção imediata necessária.",
          duration: 6000,
        });
      }

      // Docs expiring
      const expiringDocs = docs.filter(d => d.valid_until && new Date(d.valid_until) < thirtyDays);
      if (expiringDocs.length > 0) {
        toast.warning(`${expiringDocs.length} documento(s) perto do vencimento`, {
          description: "Revisão necessária nos próximos 30 dias.",
          duration: 6000,
        });
      }

      // Trainings expiring
      const expiringTrains = trains.filter(t => t.expiry_date && new Date(t.expiry_date) < thirtyDays && new Date(t.expiry_date) > now);
      if (expiringTrains.length > 0) {
        toast.warning(`${expiringTrains.length} treinamento(s) a vencer`, {
          description: "Certificações expiram nos próximos 30 dias.",
          duration: 6000,
        });
      }

      // Upcoming audits
      const upcomingAudits = audits.filter(a => {
        const d = new Date(a.scheduled_date);
        return d >= now && d <= sevenDays;
      });
      if (upcomingAudits.length > 0) {
        toast.info(`${upcomingAudits.length} auditoria(s) nos próximos 7 dias`, {
          description: "Verifique o planejamento.",
          duration: 6000,
        });
      }

      // Critical adverse events
      const criticalEvents = events.filter(e => e.severity === "grave" || e.severity === "sentinela");
      if (criticalEvents.length > 0) {
        toast.error(`${criticalEvents.length} evento(s) grave(s) sem investigação`, {
          description: "Investigação imediata necessária.",
          duration: 8000,
        });
      }
    };

    // Small delay so toasts don't compete with page load
    setTimeout(check, 1500);
  }, []);
};
