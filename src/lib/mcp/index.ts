import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listIndicators from "./tools/list-indicators";
import listNonconformities from "./tools/list-nonconformities";
import createNonconformity from "./tools/create-nonconformity";
import listActionPlans from "./tools/list-action-plans";
import listAudits from "./tools/list-audits";
import listRisks from "./tools/list-risks";
import whoami from "./tools/whoami";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "qualitoo-mcp",
  title: "Qualitoo",
  version: "0.1.0",
  instructions:
    "Ferramentas do Qualitoo — Sistema de Gestão da Qualidade Hospitalar. " +
    "Use as tools de leitura para consultar indicadores, não conformidades, planos de ação, auditorias e riscos do usuário autenticado. " +
    "Use `create_nonconformity` para registrar uma nova NC. Todas as chamadas respeitam as permissões (RLS) do usuário.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoami,
    listIndicators,
    listNonconformities,
    createNonconformity,
    listActionPlans,
    listAudits,
    listRisks,
  ],
});
