import { createContext, useContext, useState, type ReactNode } from "react";

export type Locale = "pt" | "en";

const translations: Record<string, Record<Locale, string>> = {
  // Navigation
  "nav.summary": { pt: "Resumo", en: "Summary" },
  "nav.my_dashboard": { pt: "Meu Dashboard", en: "My Dashboard" },
  "nav.non_conformities": { pt: "Não Conformidades", en: "Non-Conformities" },
  "nav.indicators": { pt: "Indicadores", en: "Indicators" },
  "nav.documents": { pt: "Documentos", en: "Documents" },
  "nav.audits": { pt: "Auditorias", en: "Audits" },
  "nav.action_plans": { pt: "Planos de Ação", en: "Action Plans" },
  "nav.risks": { pt: "Riscos", en: "Risks" },
  "nav.trainings": { pt: "Treinamentos", en: "Trainings" },
  "nav.minutes": { pt: "Atas", en: "Minutes" },
  "nav.adverse_events": { pt: "Eventos Adversos", en: "Adverse Events" },
  "nav.capa": { pt: "CAPA", en: "CAPA" },
  "nav.root_cause": { pt: "Causa Raiz", en: "Root Cause" },
  "nav.competencies": { pt: "Competências", en: "Competencies" },
  "nav.suppliers": { pt: "Fornecedores", en: "Suppliers" },
  "nav.satisfaction": { pt: "Satisfação", en: "Satisfaction" },
  "nav.regulatory": { pt: "Regulatório", en: "Regulatory" },
  "nav.processes": { pt: "Processos BPMN", en: "BPMN Processes" },
  "nav.workflows": { pt: "Workflows", en: "Workflows" },
  "nav.users": { pt: "Usuários", en: "Users" },
  "nav.employee_portal": { pt: "Portal Colaborador", en: "Employee Portal" },
  "nav.metrology": { pt: "Metrologia", en: "Metrology" },
  "nav.changes": { pt: "Mudanças", en: "Changes" },
  "nav.data_export": { pt: "Exportação BI", en: "BI Export" },

  // Common
  "common.save": { pt: "Salvar", en: "Save" },
  "common.cancel": { pt: "Cancelar", en: "Cancel" },
  "common.delete": { pt: "Excluir", en: "Delete" },
  "common.edit": { pt: "Editar", en: "Edit" },
  "common.search": { pt: "Buscar...", en: "Search..." },
  "common.loading": { pt: "Carregando...", en: "Loading..." },
  "common.no_results": { pt: "Nenhum resultado encontrado.", en: "No results found." },
  "common.export_pdf": { pt: "Exportar PDF", en: "Export PDF" },
  "common.logout": { pt: "Sair", en: "Logout" },
  "common.collapse": { pt: "Recolher", en: "Collapse" },
  "common.admin": { pt: "Admin", en: "Admin" },
  "common.analyst": { pt: "Analista", en: "Analyst" },

  // Dashboard
  "dashboard.title": { pt: "Resumo Executivo", en: "Executive Summary" },
  "dashboard.subtitle": { pt: "Visão consolidada do Sistema de Gestão da Qualidade", en: "Consolidated view of the Quality Management System" },
  "dashboard.qms_modules": { pt: "Módulos do SGQ", en: "QMS Modules" },
  "dashboard.chart_period": { pt: "Período dos gráficos:", en: "Chart period:" },

  // Auth
  "auth.access_denied": { pt: "Acesso Negado", en: "Access Denied" },
  "auth.no_permission": { pt: "Você não tem permissão para acessar este painel.", en: "You do not have permission to access this panel." },
  "auth.admin_panel": { pt: "Painel Admin", en: "Admin Panel" },
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "pt",
  setLocale: () => {},
  t: (key) => key,
});

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const stored = localStorage.getItem("sgq_locale");
    return (stored === "en" ? "en" : "pt") as Locale;
  });

  const changeLocale = (l: Locale) => {
    setLocale(l);
    localStorage.setItem("sgq_locale", l);
  };

  const t = (key: string): string => {
    return translations[key]?.[locale] ?? key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale: changeLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
