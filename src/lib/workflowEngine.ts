/**
 * Workflow Engine - Client-side evaluation and execution of workflow rules.
 * Called when records are created/updated in modules.
 */
import { supabase } from "@/integrations/supabase/client";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  params: Record<string, string>;
}

interface WorkflowRule {
  id: string;
  name: string;
  module: string;
  trigger_event: string;
  conditions: Condition[];
  actions: Action[];
  is_active: boolean;
  priority: number;
}

/**
 * Evaluate and execute workflow rules for a given module event.
 */
export const executeWorkflowRules = async (
  module: string,
  triggerEvent: string,
  record: Record<string, any>,
  previousRecord?: Record<string, any>,
  userId?: string
) => {
  // Fetch active rules for this module and trigger
  const { data: rules } = await supabase
    .from("workflow_rules")
    .select("*")
    .eq("module", module)
    .eq("trigger_event", triggerEvent)
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (!rules || rules.length === 0) return;

  for (const ruleData of rules) {
    const rule = ruleData as unknown as WorkflowRule;
    const conditionsMet = evaluateConditions(rule.conditions, record, previousRecord);

    // Log execution
    const actionsExecuted: string[] = [];

    if (conditionsMet) {
      for (const action of rule.actions) {
        await executeAction(action, module, record, userId);
        actionsExecuted.push(action.type);
      }
    }

    // Write to execution log
    await supabase.from("workflow_execution_log").insert({
      rule_id: rule.id,
      rule_name: rule.name,
      module,
      record_id: record.id ?? null,
      trigger_event: triggerEvent,
      conditions_met: conditionsMet,
      actions_executed: actionsExecuted as any,
      notes: conditionsMet
        ? `Executou ${actionsExecuted.length} ações`
        : "Condições não atendidas",
    });
  }
};

const evaluateConditions = (
  conditions: Condition[],
  record: Record<string, any>,
  previousRecord?: Record<string, any>
): boolean => {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every((cond) => {
    const fieldValue = record[cond.field];
    const prevValue = previousRecord?.[cond.field];

    switch (cond.operator) {
      case "equals":
        return String(fieldValue) === cond.value;
      case "not_equals":
        return String(fieldValue) !== cond.value;
      case "contains":
        return String(fieldValue ?? "").includes(cond.value);
      case "greater_than":
        return Number(fieldValue) > Number(cond.value);
      case "less_than":
        return Number(fieldValue) < Number(cond.value);
      case "is_empty":
        return !fieldValue || fieldValue === "";
      case "changed_to":
        return String(fieldValue) === cond.value && String(prevValue) !== cond.value;
      default:
        return true;
    }
  });
};

const executeAction = async (
  action: Action,
  module: string,
  record: Record<string, any>,
  userId?: string
) => {
  switch (action.type) {
    case "change_status": {
      if (action.params.new_status && record.id) {
        await supabase
          .from(module as any)
          .update({ status: action.params.new_status })
          .eq("id", record.id);
      }
      break;
    }

    case "send_notification": {
      // Determine target users
      const targetUsers: string[] = [];
      if (action.params.target === "admin" || action.params.target === "analyst") {
        const { data: roleUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", action.params.target);
        targetUsers.push(...(roleUsers?.map((r: any) => r.user_id) ?? []));
      } else if (action.params.target) {
        targetUsers.push(action.params.target);
      }

      for (const uid of targetUsers) {
        await supabase.from("notifications").insert({
          user_id: uid,
          title: action.params.title ?? "Notificação do Workflow",
          message: action.params.message ?? `Ação automática no módulo ${module}`,
          type: "workflow",
          module,
          reference_id: record.id ?? null,
        });
      }
      break;
    }

    case "create_approval": {
      // Create approval step if not exists, then create request
      const { data: existingSteps } = await supabase
        .from("workflow_approval_steps")
        .select("id")
        .eq("rule_id", record._rule_id ?? "")
        .limit(1);

      // For simplicity, use the first step or create one
      let stepId: string;
      if (existingSteps && existingSteps.length > 0) {
        stepId = existingSteps[0].id;
      } else {
        // We need a valid rule_id - skip if not available
        break;
      }

      await supabase.from("workflow_approval_requests").insert({
        rule_id: record._rule_id ?? existingSteps?.[0]?.id ?? "",
        step_id: stepId,
        module,
        record_id: record.id,
        record_title: record.title ?? record.name ?? null,
        requested_by: userId ?? null,
      });
      break;
    }

    case "escalate": {
      if (action.params.escalate_to && action.params.message) {
        const targetUsers: string[] = [];
        if (action.params.escalate_to === "admin" || action.params.escalate_to === "analyst") {
          const { data: roleUsers } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("role", action.params.escalate_to);
          targetUsers.push(...(roleUsers?.map((r: any) => r.user_id) ?? []));
        } else {
          targetUsers.push(action.params.escalate_to);
        }

        for (const uid of targetUsers) {
          await supabase.from("notifications").insert({
            user_id: uid,
            title: "⚠️ Escalonamento de Workflow",
            message: action.params.message,
            type: "escalation",
            module,
            reference_id: record.id ?? null,
          });
        }
      }
      break;
    }

    case "create_capa": {
      if (userId) {
        await supabase.from("capas").insert({
          title: action.params.default_title ?? `CAPA - ${record.title ?? ""}`,
          description: `Gerada automaticamente pelo workflow a partir de ${module}`,
          created_by: userId,
          origin_type: module,
          origin_id: record.id ?? null,
          origin_title: record.title ?? null,
        });
      }
      break;
    }

    case "create_action_plan": {
      if (userId) {
        await supabase.from("action_plans").insert({
          title: action.params.default_title ?? `Plano - ${record.title ?? ""}`,
          description: `Gerado automaticamente pelo workflow a partir de ${record.title ?? module}`,
          created_by: userId,
          origin_type: `${module}: ${record.title ?? ""}`,
          origin_id: record.id ?? null,
        });
      }
      break;
    }

    case "assign_responsible": {
      if (action.params.user_id && record.id) {
        await supabase
          .from(module as any)
          .update({ responsible_id: action.params.user_id })
          .eq("id", record.id);
      }
      break;
    }
  }
};
