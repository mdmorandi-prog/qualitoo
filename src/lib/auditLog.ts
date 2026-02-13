import { supabase } from "@/integrations/supabase/client";

export const logAuditEvent = async (params: {
  action: string;
  module?: string;
  recordId?: string;
  details?: Record<string, any>;
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_log").insert({
    user_id: user.id,
    user_email: user.email ?? "",
    action: params.action,
    module: params.module ?? null,
    record_id: params.recordId ?? null,
    details: params.details ?? null,
  });
};
