/**
 * Checklists ONA (Organização Nacional de Acreditação) — Manual Brasileiro de
 * Acreditação, estrutura por níveis:
 *  - Nível 1 — Segurança (estrutura, gestão de riscos assistenciais)
 *  - Nível 2 — Gestão Integrada (processos, protocolos, indicadores)
 *  - Nível 3 — Excelência em Gestão (resultados, cultura de melhoria contínua)
 * Cada nível é cumulativo: o nível superior exige a conformidade dos anteriores.
 */

export interface OnaItem {
  clause: string;
  requirement: string;
}

export const ONA_LEVELS: Record<"1" | "2" | "3", { label: string; description: string; items: OnaItem[] }> = {
  "1": {
    label: "ONA Nível 1 — Segurança",
    description: "Requisitos de estrutura, segurança do paciente e conformidade legal.",
    items: [
      { clause: "1.1", requirement: "Alvará sanitário e licenças de funcionamento válidos e disponíveis." },
      { clause: "1.2", requirement: "Responsáveis técnicos habilitados e registrados nos conselhos de classe." },
      { clause: "1.3", requirement: "Corpo funcional dimensionado conforme legislação e perfil assistencial." },
      { clause: "1.4", requirement: "Programa de Gerenciamento de Riscos implantado (RDC 36/2013)." },
      { clause: "1.5", requirement: "Núcleo de Segurança do Paciente (NSP) instituído e atuante." },
      { clause: "1.6", requirement: "Notificação de eventos adversos ao NOTIVISA/ANVISA realizada e documentada." },
      { clause: "1.7", requirement: "Protocolos básicos de segurança do paciente implantados (identificação, cirurgia segura, higiene das mãos, quedas, lesão por pressão, medicamentos)." },
      { clause: "1.8", requirement: "Plano de gerenciamento de resíduos de serviços de saúde (PGRSS) implantado." },
      { clause: "1.9", requirement: "Programa de controle de infecção relacionada à assistência (CCIH) atuante." },
      { clause: "1.10", requirement: "Manutenção preventiva e corretiva de equipamentos e infraestrutura registradas." },
      { clause: "1.11", requirement: "Calibração de equipamentos críticos rastreável à RBC/INMETRO." },
      { clause: "1.12", requirement: "Prontuário do paciente completo, legível, rastreável e com guarda segura." },
      { clause: "1.13", requirement: "Plano de contingência e resposta a emergências e desastres documentado." },
      { clause: "1.14", requirement: "Programa de capacitação inicial e educação continuada das equipes." },
      { clause: "1.15", requirement: "Controle de medicamentos e insumos: armazenamento, validade e rastreabilidade de lotes." },
    ],
  },
  "2": {
    label: "ONA Nível 2 — Gestão Integrada",
    description: "Processos integrados, protocolos clínicos e gestão por indicadores.",
    items: [
      { clause: "2.1", requirement: "Planejamento estratégico formalizado, comunicado e desdobrado por setor." },
      { clause: "2.2", requirement: "Processos assistenciais e de apoio mapeados com interfaces definidas." },
      { clause: "2.3", requirement: "Protocolos clínicos e diretrizes assistenciais baseados em evidência, revisados periodicamente." },
      { clause: "2.4", requirement: "Indicadores de desempenho definidos com metas, responsáveis e periodicidade." },
      { clause: "2.5", requirement: "Análise crítica pela direção realizada em periodicidade definida com registros." },
      { clause: "2.6", requirement: "Gestão documental com controle de versão, distribuição e descarte." },
      { clause: "2.7", requirement: "Programa de auditorias internas com plano anual e trilha de evidências." },
      { clause: "2.8", requirement: "Tratamento de não conformidades com análise de causa raiz e verificação de eficácia." },
      { clause: "2.9", requirement: "Gestão de fornecedores com qualificação, avaliação periódica e critérios de criticidade." },
      { clause: "2.10", requirement: "Pesquisa de satisfação de pacientes e colaboradores com plano de ação sobre os resultados." },
      { clause: "2.11", requirement: "Gestão de pessoas: descrição de cargos, matriz de competências e avaliação de desempenho." },
      { clause: "2.12", requirement: "Gestão da tecnologia da informação com segurança, backup e conformidade LGPD." },
      { clause: "2.13", requirement: "Comunicação interna e transição de cuidado (handover) padronizadas." },
      { clause: "2.14", requirement: "Gestão de custos e sustentabilidade econômico-financeira monitorada." },
    ],
  },
  "3": {
    label: "ONA Nível 3 — Excelência em Gestão",
    description: "Resultados sustentados, comparação externa e cultura de melhoria contínua.",
    items: [
      { clause: "3.1", requirement: "Séries históricas de indicadores com no mínimo 24 meses e tendência favorável." },
      { clause: "3.2", requirement: "Comparação de resultados com referenciais externos (benchmarking) documentada." },
      { clause: "3.3", requirement: "Metas desdobradas atingidas de forma sustentada nos ciclos avaliados." },
      { clause: "3.4", requirement: "Ciclos de melhoria contínua (PDCA/DMAIC) documentados com ganhos comprovados." },
      { clause: "3.5", requirement: "Gestão de riscos corporativos integrada à estratégia (matriz e plano de mitigação)." },
      { clause: "3.6", requirement: "Cultura de segurança avaliada periodicamente com plano de fortalecimento." },
      { clause: "3.7", requirement: "Inovação e uso de tecnologia aplicados aos processos assistenciais e de gestão." },
      { clause: "3.8", requirement: "Responsabilidade socioambiental com programas e resultados mensurados." },
      { clause: "3.9", requirement: "Gestão do conhecimento: lições aprendidas registradas e disseminadas." },
      { clause: "3.10", requirement: "Sistema de governança clínica e corporativa com prestação de contas formalizada." },
      { clause: "3.11", requirement: "Experiência do paciente medida além da satisfação (jornada, PROMs/PREMs)." },
      { clause: "3.12", requirement: "Resultados de segurança do paciente comparados a metas nacionais/internacionais." },
    ],
  },
};

export type OnaLevel = keyof typeof ONA_LEVELS;

/** Itens cumulativos até o nível escolhido. */
export function onaItemsUpTo(level: OnaLevel): OnaItem[] {
  const order: OnaLevel[] = ["1", "2", "3"];
  const idx = order.indexOf(level);
  return order.slice(0, idx + 1).flatMap((l) => ONA_LEVELS[l].items);
}
