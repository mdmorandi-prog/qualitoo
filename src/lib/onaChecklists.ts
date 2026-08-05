/**
 * Checklists ONA (Organização Nacional de Acreditação) — Manual Brasileiro de Acreditação
 * Versão 2022 (Organizações Prestadoras de Serviços de Saúde - OPSS)
 * Estrutura robusta por Seções, Subseções e Requisitos.
 */

export interface OnaRequirement {
  id: string;
  requirement: string;
  level: 1 | 2 | 3;
}

export interface OnaSubsection {
  title: string;
  requirements: OnaRequirement[];
}

export interface OnaSection {
  title: string;
  subsections: OnaSubsection[];
}

export const ONA_MANUAL_OPSS: Record<string, OnaSection> = {
  "1": {
    title: "1. Liderança e Gestão",
    subsections: [
      {
        title: "1.1 Governança e Liderança",
        requirements: [
          { id: "1.1.1", requirement: "A organização define e comunica sua identidade organizacional (missão, visão e valores).", level: 1 },
          { id: "1.1.2", requirement: "A governança/liderança assegura a conformidade legal e ética da organização.", level: 1 },
          { id: "1.1.3", requirement: "A liderança promove a cultura de segurança e a melhoria contínua.", level: 2 },
          { id: "1.1.4", requirement: "A organização demonstra sustentabilidade e resultados econômico-financeiros.", level: 3 },
        ],
      },
      {
        title: "1.2 Planejamento e Organização",
        requirements: [
          { id: "1.2.1", requirement: "O planejamento estratégico é formalizado, comunicado e desdobrado em planos de ação operacionais por setor.", level: 2 },
          { id: "1.2.2", requirement: "A estrutura organizacional é compatível com o perfil assistencial e volume de serviços.", level: 1 },
          { id: "1.2.3", requirement: "A organização demonstra processos de sucessão para cargos críticos de liderança.", level: 3 },
        ],
      },
      {
        title: "1.3 Gestão de Pessoas",
        requirements: [
          { id: "1.3.1", requirement: "A organização dimensiona o quadro de pessoal conforme legislação, complexidade e carga de trabalho.", level: 1 },
          { id: "1.3.2", requirement: "Existe um programa de integração, treinamento e educação continuada para os colaboradores.", level: 1 },
          { id: "1.3.3", requirement: "A organização monitora o desempenho individual e o clima organizacional periodicamente.", level: 2 },
          { id: "1.3.4", requirement: "A organização possui política de retenção de talentos e desenvolvimento de competências.", level: 3 },
        ],
      },
      {
        title: "1.4 Gestão de Processos",
        requirements: [
          { id: "1.4.1", requirement: "Os processos principais da organização são mapeados e possuem fluxos definidos.", level: 2 },
          { id: "1.4.2", requirement: "Existem indicadores de desempenho para os processos críticos com análise crítica periódica.", level: 2 },
          { id: "1.4.3", requirement: "A organização utiliza benchmarking para comparar seus processos com referências de excelência.", level: 3 },
        ],
      },
    ],
  },
  "2": {
    title: "2. Gestão da Qualidade e Segurança",
    subsections: [
      {
        title: "2.1 Segurança do Paciente",
        requirements: [
          { id: "2.1.1", requirement: "O Núcleo de Segurança do Paciente (NSP) está instituído, atuante e com reuniões documentadas.", level: 1 },
          { id: "2.1.2", requirement: "Protocolos básicos implantados: Identificação do Paciente, Quedas, Lesão por Pressão, Cirurgia Segura, Higiene das Mãos e Segurança na Prescrição, Uso e Administração de Medicamentos.", level: 1 },
          { id: "2.1.3", requirement: "Existe um sistema de notificação, investigação e análise de causas de incidentes e eventos adversos.", level: 1 },
          { id: "2.1.4", requirement: "A organização divulga os resultados da segurança do paciente para as equipes e lideranças.", level: 2 },
        ],
      },
      {
        title: "2.2 Gestão de Riscos",
        requirements: [
          { id: "2.2.1", requirement: "A organização realiza o gerenciamento de riscos assistenciais, ocupacionais e ambientais.", level: 1 },
          { id: "2.2.2", requirement: "A gestão de riscos é integrada aos processos de tomada de decisão estratégica.", level: 2 },
          { id: "2.2.3", requirement: "A organização utiliza ferramentas como FMEA para análise proativa de riscos em processos críticos.", level: 3 },
          { id: "2.2.4", requirement: "Existe plano de contingência para os riscos críticos identificados e testado periodicamente.", level: 2 },
        ],
      },
      {
        title: "2.3 Gestão da Qualidade",
        requirements: [
          { id: "2.3.1", requirement: "A organização utiliza indicadores de estrutura, processo e resultado para monitorar o desempenho.", level: 2 },
          { id: "2.3.2", requirement: "São realizados ciclos de melhoria contínua (PDCA/DMAIC) baseados em evidências.", level: 3 },
          { id: "2.3.3", requirement: "A organização realiza auditorias internas do sistema de gestão da qualidade periodicamente.", level: 2 },
        ],
      },
    ],
  },
  "3": {
    title: "3. Apoio à Assistência",
    subsections: [
      {
        title: "3.1 Gestão de Tecnologias e Infraestrutura",
        requirements: [
          { id: "3.1.1", requirement: "A organização garante a manutenção preventiva e corretiva de equipamentos médicos e prediais.", level: 1 },
          { id: "3.1.2", requirement: "Existe controle de calibração rastreável para equipamentos de medição e precisão.", level: 1 },
          { id: "3.1.3", requirement: "A infraestrutura física atende às normas de segurança, acessibilidade e vigilância sanitária (RDC 50).", level: 1 },
          { id: "3.1.4", requirement: "A gestão de tecnologias em saúde inclui a avaliação de custo-efetividade e segurança (Tecnovigilância).", level: 2 },
        ],
      },
      {
        title: "3.2 Gestão de Suprimentos e Farmácia",
        requirements: [
          { id: "3.2.1", requirement: "O armazenamento de medicamentos e insumos garante a integridade, temperatura e validade.", level: 1 },
          { id: "3.2.2", requirement: "A organização possui processos para rastreabilidade de medicamentos (lote e validade).", level: 1 },
          { id: "3.2.3", requirement: "A farmácia clínica atua na análise de prescrição, reconciliação medicamentosa e farmacovigilância.", level: 2 },
          { id: "3.2.4", requirement: "A organização avalia periodicamente o desempenho de seus fornecedores críticos.", level: 2 },
        ],
      },
      {
        title: "3.3 Prevenção e Controle de Infecções (SCIH)",
        requirements: [
          { id: "3.3.1", requirement: "Existe um Serviço de Controle de Infecção Hospitalar (SCIH) com programa de controle anual.", level: 1 },
          { id: "3.3.2", requirement: "Monitoramento das taxas de infecção relacionada à assistência à saúde (IRAS).", level: 1 },
          { id: "3.3.3", requirement: "Uso racional de antimicrobianos é monitorado e orientado pela CCIH.", level: 2 },
        ],
      },
    ],
  },
  "4": {
    title: "4. Atenção ao Paciente",
    subsections: [
      {
        title: "4.1 Acesso e Atendimento",
        requirements: [
          { id: "4.1.1", requirement: "O atendimento respeita os direitos e deveres do paciente e seus familiares.", level: 1 },
          { id: "4.1.2", requirement: "Existe sistema de triagem/classificação de risco para o atendimento inicial.", level: 1 },
          { id: "4.1.3", requirement: "A organização garante a privacidade e o sigilo das informações do paciente (LGPD).", level: 1 },
        ],
      },
      {
        title: "4.2 Prontuário e Documentação",
        requirements: [
          { id: "4.2.1", requirement: "O registro em prontuário (físico ou eletrônico) é completo, legível, datado e assinado.", level: 1 },
          { id: "4.2.2", requirement: "O acesso ao prontuário é restrito a profissionais autorizados.", level: 1 },
          { id: "4.2.3", requirement: "A organização utiliza protocolos clínicos baseados em diretrizes institucionais.", level: 2 },
        ],
      },
      {
        title: "4.3 Ciclo Assistencial",
        requirements: [
          { id: "4.3.1", requirement: "A transição de cuidado (handover) é padronizada e documentada entre turnos e setores.", level: 2 },
          { id: "4.3.2", requirement: "O planejamento da alta hospitalar é iniciado precocemente e envolve o paciente/família.", level: 2 },
          { id: "4.3.3", requirement: "A organização monitora a experiência do paciente (HCAHPS/NPS) e desfechos clínicos.", level: 3 },
        ],
      },
    ],
  },
  "5": {
    title: "5. Diagnóstico e Terapêutica",
    subsections: [
      {
        title: "5.1 Métodos Diagnósticos (Laboratório, Imagem, etc.)",
        requirements: [
          { id: "5.1.1", requirement: "Os laudos e resultados são liberados em tempo oportuno conforme criticidade (tempo de resposta).", level: 1 },
          { id: "5.1.2", requirement: "Existe controle de qualidade interno e participação em programas de proficiência externa.", level: 2 },
          { id: "5.1.3", requirement: "A comunicação de resultados críticos é padronizada, documentada e imediata.", level: 1 },
        ],
      },
    ],
  },
  "6": {
    title: "6. Apoio Técnico e Logística",
    subsections: [
      {
        title: "6.1 Higiene e Limpeza",
        requirements: [
          { id: "6.1.1", requirement: "Os processos de limpeza e desinfecção de superfícies são padronizados e validados.", level: 1 },
          { id: "6.1.2", requirement: "A gestão de resíduos (PGRSS) cumpre integralmente a legislação vigente.", level: 1 },
        ],
      },
      {
        title: "6.2 Nutrição e Dietética",
        requirements: [
          { id: "6.2.1", requirement: "A produção de alimentos segue as boas práticas de fabricação (BPF) e vigilância sanitária.", level: 1 },
          { id: "6.2.2", requirement: "A assistência nutricional é integrada ao plano terapêutico do paciente.", level: 2 },
          { id: "6.2.3", requirement: "A organização monitora a satisfação e o estado nutricional dos pacientes assistidos.", level: 3 },
        ],
      },
      {
        title: "6.3 Processamento de Roupas",
        requirements: [
          { id: "6.3.1", requirement: "O processamento de roupas (próprio ou terceirizado) segue as normas de segurança e higiene vigentes.", level: 1 },
          { id: "6.3.2", requirement: "Existe controle de qualidade e fluxo unidirecional para evitar contaminação cruzada.", level: 1 },
        ],
      },
    ],
  },
  "7": {
    title: "7. Apoio Administrativo e Logística",
    subsections: [
      {
        title: "7.1 Manutenção Predial e Utilidades",
        requirements: [
          { id: "7.1.1", requirement: "A organização garante o fornecimento ininterrupto de energia, água e gases medicinais (planos de contingência).", level: 1 },
          { id: "7.1.2", requirement: "A manutenção preventiva da infraestrutura predial é executada e registrada.", level: 1 },
        ],
      },
      {
        title: "7.2 Segurança Patrimonial e Meio Ambiente",
        requirements: [
          { id: "7.2.1", requirement: "Existe plano de segurança patrimonial para proteção de pessoas e bens.", level: 1 },
          { id: "7.2.2", requirement: "A organização demonstra ações de responsabilidade socioambiental.", level: 3 },
        ],
      },
    ],
  },
};

// Funções utilitárias para o sistema

export function getAllOnaRequirements(level: 1 | 2 | 3) {
  const all: OnaRequirement[] = [];
  Object.values(ONA_MANUAL_OPSS).forEach(section => {
    section.subsections.forEach(sub => {
      sub.requirements.forEach(req => {
        if (req.level <= level) {
          all.push(req);
        }
      });
    });
  });
  return all;
}

export function getOnaItemsFormatted(level: 1 | 2 | 3) {
  // Mantém compatibilidade com a interface antiga OnaItem para não quebrar componentes existentes
  return getAllOnaRequirements(level).map(req => ({
    clause: req.id,
    requirement: req.requirement
  }));
}
