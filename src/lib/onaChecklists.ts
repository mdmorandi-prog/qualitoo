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
          { id: "1.2.1", requirement: "O planejamento estratégico é desdobrado em planos de ação operacionais.", level: 2 },
          { id: "1.2.2", requirement: "A estrutura organizacional é compatível com o perfil assistencial e volume de serviços.", level: 1 },
        ],
      },
      {
        title: "1.3 Gestão de Pessoas",
        requirements: [
          { id: "1.3.1", requirement: "A organização dimensiona o quadro de pessoal conforme legislação e complexidade.", level: 1 },
          { id: "1.3.2", requirement: "Existe um programa de integração e capacitação continuada para os colaboradores.", level: 1 },
          { id: "1.3.3", requirement: "A organização monitora o desempenho e o clima organizacional.", level: 2 },
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
          { id: "2.1.1", requirement: "O Núcleo de Segurança do Paciente (NSP) está instituído e operante.", level: 1 },
          { id: "2.1.2", requirement: "Os protocolos básicos de segurança (identificação, quedas, LP, cirurgia segura, etc) estão implantados.", level: 1 },
          { id: "2.1.3", requirement: "Existe um sistema de notificação e análise de incidentes e eventos adversos.", level: 1 },
        ],
      },
      {
        title: "2.2 Gestão de Riscos",
        requirements: [
          { id: "2.2.1", requirement: "A organização realiza o gerenciamento de riscos assistenciais e ocupacionais.", level: 1 },
          { id: "2.2.2", requirement: "A gestão de riscos é integrada aos processos de tomada de decisão.", level: 2 },
          { id: "2.2.3", requirement: "A organização utiliza ferramentas preditivas para mitigação de riscos críticos.", level: 3 },
        ],
      },
      {
        title: "2.3 Gestão da Qualidade",
        requirements: [
          { id: "2.3.1", requirement: "A organização utiliza indicadores para monitorar o desempenho dos processos.", level: 2 },
          { id: "2.3.2", requirement: "São realizados ciclos de melhoria (PDCA) baseados em fatos e dados.", level: 3 },
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
          { id: "3.1.1", requirement: "A organização garante a manutenção preventiva e corretiva de equipamentos críticos.", level: 1 },
          { id: "3.1.2", requirement: "Existe controle de calibração rastreável para equipamentos de medição.", level: 1 },
          { id: "3.1.3", requirement: "A infraestrutura física atende às normas de segurança e vigilância sanitária.", level: 1 },
        ],
      },
      {
        title: "3.2 Gestão de Suprimentos e Farmácia",
        requirements: [
          { id: "3.2.1", requirement: "O armazenamento de medicamentos e insumos garante a integridade e validade.", level: 1 },
          { id: "3.2.2", requirement: "A organização possui processos para rastreabilidade de produtos para saúde.", level: 1 },
          { id: "3.2.3", requirement: "A farmácia clínica atua na reconciliação medicamentosa e monitoramento de eventos.", level: 2 },
        ],
      },
    ],
  },
  "4": {
    title: "4. Atenção ao Paciente",
    subsections: [
      {
        title: "4.1 Processo Assistencial",
        requirements: [
          { id: "4.1.1", requirement: "O atendimento respeita os direitos do paciente e seus familiares.", level: 1 },
          { id: "4.1.2", requirement: "O registro em prontuário é completo, legível e temporal.", level: 1 },
          { id: "4.1.3", requirement: "A transição de cuidado (handover) é padronizada e segura.", level: 2 },
          { id: "4.1.4", requirement: "A organização monitora a experiência e o desfecho clínico do paciente.", level: 3 },
        ],
      },
    ],
  },
  "5": {
    title: "5. Diagnóstico e Terapêutica",
    subsections: [
      {
        title: "5.1 Métodos Diagnósticos",
        requirements: [
          { id: "5.1.1", requirement: "Os laudos e resultados são liberados em tempo oportuno conforme criticidade.", level: 1 },
          { id: "5.1.2", requirement: "Existe controle de qualidade (interno e externo) para exames laboratoriais/imagem.", level: 2 },
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
