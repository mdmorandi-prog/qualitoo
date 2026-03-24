import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard, AlertTriangle, BarChart3, FileText, ClipboardCheck,
  Target, GraduationCap, ShieldAlert, TriangleAlert, Crosshair,
  BookOpen, Users2, Truck, Heart, FileBarChart, GitBranch, Gauge, Workflow,
  UserCircle, Ruler, GitPullRequest, Database, Search, Upload, HelpCircle, ShieldCheck, GitMerge, Settings, FishSymbol,
} from "lucide-react";

const modules = [
  { key: "resumo", label: "Resumo Executivo", icon: LayoutDashboard, keywords: "dashboard home início" },
  { key: "meu_dashboard", label: "Meu Dashboard", icon: Gauge, keywords: "personalizado widgets" },
  { key: "ncs", label: "Não Conformidades", icon: AlertTriangle, keywords: "nc desvio problema" },
  { key: "indicadores", label: "Indicadores", icon: BarChart3, keywords: "kpi meta desempenho" },
  { key: "documentos", label: "Documentos", icon: FileText, keywords: "procedimento manual instrução" },
  { key: "auditorias", label: "Auditorias", icon: ClipboardCheck, keywords: "auditoria interna externa" },
  { key: "planos", label: "Planos de Ação", icon: Crosshair, keywords: "5w2h ação corretiva" },
  { key: "riscos", label: "Gestão de Riscos", icon: TriangleAlert, keywords: "matriz risco probabilidade" },
  { key: "treinamentos", label: "Treinamentos", icon: GraduationCap, keywords: "capacitação curso" },
  { key: "atas", label: "Atas de Reunião", icon: BookOpen, keywords: "reunião ata minuta" },
  { key: "eventos", label: "Eventos Adversos", icon: ShieldAlert, keywords: "evento adverso incidente" },
  { key: "capa", label: "CAPA", icon: Target, keywords: "ação corretiva preventiva" },
  { key: "causa_raiz", label: "Análise Causa Raiz", icon: FishSymbol, keywords: "ishikawa 5 porquês árvore" },
  { key: "competencias", label: "Matriz de Competências", icon: Users2, keywords: "competência avaliação" },
  { key: "fornecedores", label: "Fornecedores", icon: Truck, keywords: "fornecedor qualificação" },
  { key: "pesquisas", label: "Pesquisas de Satisfação", icon: Heart, keywords: "nps csat pesquisa" },
  { key: "regulatorio", label: "Relatórios Regulatórios", icon: FileBarChart, keywords: "notivisa anvisa" },
  { key: "processos", label: "Processos BPMN", icon: GitBranch, keywords: "processo mapeamento fluxo" },
  { key: "workflows", label: "Workflows", icon: Workflow, keywords: "fluxo aprovação" },
  { key: "portal", label: "Portal do Colaborador", icon: UserCircle, keywords: "colaborador portal funcionário" },
  { key: "metrologia", label: "Metrologia", icon: Ruler, keywords: "calibração equipamento" },
  { key: "mudancas", label: "Gestão de Mudanças", icon: GitPullRequest, keywords: "mudança change" },
  { key: "exportacao", label: "Exportação BI", icon: Database, keywords: "exportar csv json bi" },
  { key: "consultas", label: "Consultas", icon: Search, keywords: "query builder consulta" },
  { key: "importacao", label: "Importação em Massa", icon: Upload, keywords: "importar csv excel" },
  { key: "fmea", label: "FMEA", icon: GitMerge, keywords: "fmea modo falha rpn" },
  { key: "lgpd", label: "LGPD", icon: ShieldCheck, keywords: "lgpd dados proteção" },
  { key: "ajuda", label: "Central de Ajuda", icon: HelpCircle, keywords: "ajuda faq suporte" },
  { key: "configuracoes", label: "Configurações", icon: Settings, keywords: "config sistema" },
  { key: "usuarios", label: "Usuários", icon: Users2, keywords: "usuário role permissão" },
];

interface GlobalSearchProps {
  onNavigate: (tab: string) => void;
}

const GlobalSearch = ({ onNavigate }: GlobalSearchProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (key: string) => {
    onNavigate(key);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar...</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar módulo, funcionalidade..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Módulos">
            {modules.map((m) => (
              <CommandItem
                key={m.key}
                value={`${m.label} ${m.keywords}`}
                onSelect={() => handleSelect(m.key)}
              >
                <m.icon className="mr-2 h-4 w-4" />
                <span>{m.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default GlobalSearch;
