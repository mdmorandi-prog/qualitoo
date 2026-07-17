import { supabase } from "@/integrations/supabase/client";

const SENSITIVE_KEYS = [
  "password", "pass", "token", "secret", "api_key", "apikey",
  "private_key", "authorization", "auth", "cookie", "session",
  "ssn", "cpf", "cnpj", "credit_card", "card_number", "cvv", "pin",
];

function sanitize(value: any, depth = 0): any {
  if (depth > 5 || value == null) return value;
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      const lower = k.toLowerCase();
      if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = sanitize(v, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "string" && value.length > 2000) {
    return value.slice(0, 2000) + "...[truncated]";
  }
  return value;
}

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
    details: params.details ? sanitize(params.details) : null,
  });
};
