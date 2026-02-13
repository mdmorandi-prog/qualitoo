import { useState } from "react";
import { Search, BookOpen, FileText, BarChart3, AlertTriangle, ClipboardCheck, Target, GraduationCap, ShieldAlert, Truck, Heart, GitBranch, Ruler, HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface FaqItem {
  question: string;
  answer: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  faqs: FaqItem[];
}

const helpSections: HelpSection[] = [
  {
    id: "geral", title: "Visão Geral", icon: BookOpen, description: "Conceitos gerais do SGQ",
    faqs: [
      { question: "O que é o SGQ Hospitalar?", answer: "O SGQ é um Sistema de Gestão da Qualidade projetado para instituições de saúde, alinhado com normas de acreditação ONA e JCI. Ele integra todos os processos de qualidade em uma plataforma digital unificada." },
      { question: "Como acessar o sistema?", answer: "Acesse com seu e-mail e senha fornecidos pelo administrador. Na tela de login (/admin/login), insira suas credenciais. Se for seu primeiro acesso, solicite as credenciais ao gestor da qualidade." },
      { question: "Como personalizar meu dashboard?", answer: "Acesse 'Meu Dashboard', clique no cadeado para desbloquear a edição, arraste e redimensione widgets, adicione novos clicando em '+ Widget' e salve suas configurações." },
    ],
  },
  {
    id: "ncs", title: "Não Conformidades", icon: AlertTriangle, description: "Registro e tratamento de NCs",
    faqs: [
      { question: "Como registrar uma NC?", answer: "Clique em 'Nova NC', preencha título, descrição, severidade e setor. O status iniciará como 'Aberta'. Você pode usar o Kanban para mover entre os status arrastando os cards." },
      { question: "Como gerar uma CAPA a partir de uma NC?", answer: "Abra os detalhes da NC e clique em 'Gerar CAPA'. O sistema criará automaticamente um registro CAPA vinculado à NC com os dados preenchidos." },
      { question: "Como usar a análise de causa raiz por IA?", answer: "Nos detalhes da NC, clique em 'SGQ IA'. O assistente analisará a descrição e gerará automaticamente o diagrama de Ishikawa e os 5 Porquês para revisão." },
    ],
  },
  {
    id: "indicadores", title: "Indicadores", icon: BarChart3, description: "KPIs e métricas de desempenho",
    faqs: [
      { question: "Como criar um indicador?", answer: "Clique em 'Novo Indicador', defina nome, meta, unidade e frequência de medição. Os limites mínimo e máximo aceitáveis são opcionais." },
      { question: "Como registrar medições?", answer: "Na tabela de indicadores, clique no '+' ao lado do indicador. Insira o valor, data do período e observações opcionais." },
    ],
  },
  {
    id: "documentos", title: "Documentos", icon: FileText, description: "Controle documental",
    faqs: [
      { question: "Qual o fluxo de aprovação?", answer: "Rascunho → Em Revisão (qualquer usuário) → Aprovado (apenas admin) → Obsoleto (apenas admin). A transição respeitará as permissões do seu perfil." },
      { question: "Como importar documentos?", answer: "Ao criar novo documento, clique em 'Importar Arquivo'. O sistema extrai automaticamente título, código, setor e categoria do conteúdo do arquivo." },
    ],
  },
  {
    id: "auditorias", title: "Auditorias", icon: ClipboardCheck, description: "Auditorias internas",
    faqs: [
      { question: "Como planejar uma auditoria?", answer: "Clique em 'Nova Auditoria', defina título, tipo, data, escopo e auditor líder. A auditoria inicia como 'Planejada' e pode ser executada via dispositivo móvel." },
    ],
  },
  {
    id: "riscos", title: "Gestão de Riscos", icon: ShieldAlert, description: "Matriz de riscos e FMEA",
    faqs: [
      { question: "Como funciona a matriz de riscos?", answer: "A matriz 5×5 combina Probabilidade (1-5) com Impacto (1-5). Clique em qualquer célula da matriz para ver os riscos naquela interseção. Cores indicam criticidade." },
      { question: "O que é FMEA?", answer: "Failure Mode and Effects Analysis analisa modos de falha com três dimensões: Severidade, Ocorrência e Detecção (1-10 cada). O RPN (Risk Priority Number) = S × O × D indica a prioridade." },
    ],
  },
  {
    id: "treinamentos", title: "Treinamentos", icon: GraduationCap, description: "Gestão de capacitação",
    faqs: [
      { question: "Como registrar um treinamento?", answer: "Clique em 'Novo Treinamento', preencha título, data, instrutor, carga horária e participantes. Acompanhe o status e a validade dos treinamentos." },
    ],
  },
  {
    id: "fornecedores", title: "Fornecedores", icon: Truck, description: "Qualificação e avaliação",
    faqs: [
      { question: "Como avaliar um fornecedor?", answer: "Nos detalhes do fornecedor, registre avaliações com notas de 0-100 em Qualidade, Entrega, Custo e Conformidade. O score geral é calculado automaticamente." },
    ],
  },
  {
    id: "exportacao", title: "Exportação BI", icon: BarChart3, description: "Integração com ferramentas externas",
    faqs: [
      { question: "Como exportar dados para o Power BI?", answer: "Acesse 'Exportação BI', selecione o módulo, formato CSV, período desejado e clique em 'Exportar'. No Power BI Desktop, use 'Obter Dados → Texto/CSV' para importar." },
      { question: "Como usar o Construtor de Consultas?", answer: "O Construtor de Consultas permite criar queries personalizadas: escolha a tabela, selecione colunas, adicione filtros e exporte os resultados em CSV ou JSON." },
    ],
  },
];

const HelpCenter = () => {
  const [search, setSearch] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedFaqs, setExpandedFaqs] = useState<string[]>([]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleFaq = (key: string) => {
    setExpandedFaqs(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const filteredSections = search
    ? helpSections.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.faqs.some(f => f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
      )
    : helpSections;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2"><HelpCircle className="h-6 w-6" /> Central de Ajuda</h2>
        <p className="text-sm text-muted-foreground">Guias, FAQs e base de conhecimento do SGQ</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar na central de ajuda..." className="pl-10" />
      </div>

      <div className="space-y-3">
        {filteredSections.map(section => {
          const isExpanded = expandedSections.includes(section.id) || !!search;
          const filteredFaqs = search
            ? section.faqs.filter(f => f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase()))
            : section.faqs;

          return (
            <Card key={section.id} className="overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50"
              >
                <section.icon className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                <span className="text-xs text-muted-foreground">{section.faqs.length} pergunta(s)</span>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <CardContent className="border-t pt-3 space-y-2">
                  {filteredFaqs.map((faq, i) => {
                    const faqKey = `${section.id}-${i}`;
                    const faqExpanded = expandedFaqs.includes(faqKey) || !!search;
                    return (
                      <div key={i} className="rounded-lg border bg-background">
                        <button
                          onClick={() => toggleFaq(faqKey)}
                          className="flex w-full items-center gap-2 p-3 text-left text-sm font-medium text-foreground hover:bg-accent/30"
                        >
                          {faqExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-primary" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
                          {faq.question}
                        </button>
                        {faqExpanded && (
                          <div className="border-t px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default HelpCenter;
