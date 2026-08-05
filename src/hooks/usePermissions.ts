/**
 * Permissões granulares por ação (read | create | update | delete | approve | export).
 *
 * As ações vivem em user_group_access.permission_actions e são concedidas por setor,
 * através dos grupos de acesso. Administradores possuem todas as ações em todos os setores.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const PERMISSION_ACTIONS = ["read", "create", "update", "delete", "approve", "export"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  read: "Consultar",
  create: "Criar",
  update: "Editar",
  delete: "Excluir",
  approve: "Aprovar",
  export: "Exportar",
};

export const ACTIONS_BY_LEVEL: Record<string, PermissionAction[]> = {
  read: ["read"],
  write: ["read", "create", "update", "export"],
  admin: ["read", "create", "update", "delete", "approve", "export"],
};

export const usePermissions = () => {
  const { user, isAdmin } = useAuth();
  const [bySector, setBySector] = useState<Record<string, PermissionAction[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) { setBySector({}); setLoading(false); return; }
      const { data } = await supabase.rpc("get_user_actions", { _user_id: user.id });
      if (!active) return;
      const map: Record<string, PermissionAction[]> = {};
      for (const row of (data as any[]) ?? []) {
        const list = (row.actions ?? []) as PermissionAction[];
        map[row.sector] = Array.from(new Set([...(map[row.sector] ?? []), ...list]));
      }
      setBySector(map);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [user]);

  const can = useCallback(
    (action: PermissionAction, sector?: string | null) => {
      if (isAdmin) return true;
      if (sector) return (bySector[sector] ?? []).includes(action);
      return Object.values(bySector).some((list) => list.includes(action));
    },
    [bySector, isAdmin],
  );

  return { can, bySector, loading, isAdmin };
};
