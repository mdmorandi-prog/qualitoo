import { useState } from "react";
import {
  Search, BookOpen, FileText, BarChart3, AlertTriangle, ClipboardCheck,
  Target, GraduationCap, ShieldAlert, Truck, Heart, GitBranch, Ruler,
  HelpCircle, ChevronDown, ChevronRight, Crosshair, Users2, UserCircle,
  Workflow, Gauge, RefreshCw, Upload, Database, GitMerge, ShieldCheck,
  Handshake, FolderKanban, Settings, Activity, BrainCircuit, FishSymbol,
  ListChecks, BarChart, Calendar, Globe, FileBarChart, Kanban,
} from "lucide-react";
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
      { question: "O que é o SGQ Hospitalar?", answer: "O SGQ é um Sistema de Gestão da Qualidade projetado para instituições de saúde, alinhado com normas de acreditação ONA e JCI. Ele integra todos os processos de qualidade em uma plataforma digital unificada com mais de 30 módulos integrados." },
      { question: "Como acessar o sistema?", answer: "Acesse com seu e-mail e senha fornecidos pelo administrador. Na tela de login (/admin/login), insira suas credenciais. Se for seu primeiro acesso, solicite as credenciais ao gestor da qualidade." },
      { question: "Como personalizar meu dashboard?", answer: "Acesse 'Meu Dashboard', clique no cadeado para desbloquear a edição, arraste e redimensione widgets, adicione novos clicando em '+ Widget' e salve suas configurações." },
      { question: "Como usar a busca global?", answer: "Pressione Ctrl+K (ou ⌘K no Mac) para abrir a busca rápida. Digite o nome de qualquer módulo ou funcionalidade para navegar instantaneamente." },
      { question: "Quais módulos estão disponíveis?", answer: "O sistema possui 30+ módulos: Não Conformidades, Indicadores, Documentos, Auditorias (com Checklists), Planos de Ação (com Kanban), Riscos, CAPAs, Causa Raiz (IA), Eventos Adversos, Treinamentos, Competências, Fornecedores (com Scoring A/B/C e Portal), Pesquisas, Atas de Reunião, Relatórios Regulatórios, BPMN, Workflows, Metrologia, Mudanças, Contratos (IA Jurídica), Projetos/Gantt, FMEA, LGPD, Portal do Colaborador, Dashboard Personalizado, Exportação BI, Query Builder, Importação em Massa, Análise Crítica pela Direção, Planejamento Estratégico (BSC/SWOT), Relatórios Agendados e Central de Ajuda." },
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
      { question: "O que são indicadores compostos?", answer: "Indicadores compostos são KPIs calculados a partir de fórmulas baseadas em outros indicadores. Marque 'Indicador composto' ao criar e defina a fórmula e os indicadores-fonte." },
    ],
  },
  {
    id: "documentos", title: "Documentos", icon: FileText, description: "Controle documental com versionamento, workflow e permissões",
    faqs: [
      { question: "Qual o fluxo de aprovação?", answer: "Rascunho → Em Revisão (qualquer usuário) → Aprovado (apenas admin) → Obsoleto (apenas admin). A transição respeitará as permissões do seu perfil. Além disso, workflows multi-etapa podem ser configurados com templates customizáveis." },
      { question: "Como importar documentos?", answer: "Ao criar novo documento, clique em 'Importar Arquivo'. O sistema extrai automaticamente título, código, setor e categoria do conteúdo do arquivo." },
      { question: "Como funciona a assinatura digital?", answer: "Documentos aprovados podem ser assinados eletronicamente. O sistema gera um hash SHA-256, registra geolocalização, IP e timestamp, criando uma trilha de auditoria completa e verificável." },
      { question: "Como organizar documentos em pastas?", answer: "Use a árvore de pastas no painel lateral para criar hierarquias. Clique com botão direito para criar subpastas, renomear ou mover documentos entre pastas." },
      { question: "Como funciona o versionamento automático?", answer: "Ao editar um documento, a versão atual é arquivada automaticamente no histórico antes de salvar as alterações. O sistema exige um resumo da alteração e incrementa a versão automaticamente (ex: v1 → v2). Você pode acessar todas as versões anteriores pelo botão 'Histórico'." },
      { question: "Como comparar versões de um documento?", answer: "No Histórico de Versões, ative o modo 'Comparar', selecione duas versões e o sistema exibirá um diff visual linha-a-linha: linhas adicionadas aparecem em verde, removidas em vermelho, com uma barra de proporção e contadores de alterações." },
      { question: "Como usar o editor visual (WYSIWYG)?", answer: "Ao criar ou editar um documento, alterne para 'Editor Visual' nas abas de conteúdo. O editor suporta formatação rica: negrito, itálico, sublinhado, títulos, listas, tabelas e alinhamento de texto. O conteúdo é salvo em HTML para renderização fiel." },
      { question: "Como usar templates de documentos?", answer: "Ao criar novo documento, clique em 'Usar Template'. Selecione entre os modelos disponíveis (POP, IT, Manual, Protocolo Clínico). O template preenche automaticamente a estrutura do conteúdo com seções padrão para o tipo de documento." },
      { question: "Como configurar permissões por documento?", answer: "Clique no ícone de 'Permissões' na tabela de documentos. Ative 'Acesso restrito' para limitar o acesso apenas a usuários ou grupos específicos, sobrepondo a permissão de setor padrão. Cada permissão pode ter nível (Leitura, Escrita, Admin) e data de expiração." },
      { question: "O que são permissões temporárias?", answer: "Ao adicionar uma permissão individual a um documento, você pode definir uma data de expiração. Após essa data, a permissão é automaticamente revogada. O sistema exibe indicadores visuais: barra de progresso de validade, alertas para permissões vencidas ou prestes a vencer (≤7 dias)." },
      { question: "Como funciona o workflow multi-etapa?", answer: "Clique em 'Workflow' nos detalhes do documento. Aplique um template de workflow (ex: Elaboração → Revisão → Validação → Aprovação Final). Cada etapa possui responsável, tipo e status. O progresso é exibido com um indicador circular de etapas e uma barra de porcentagem (%). Quando todas as etapas são aprovadas, o workflow é marcado como completo." },
      { question: "O que acontece quando um documento é aprovado?", answer: "Ao aprovar um documento, o sistema aciona automaticamente a distribuição: uma notificação é enviada a todos os colaboradores do setor relevante, informando sobre a nova versão publicada. O registro de aprovação inclui data, hora e responsável." },
      { question: "Como funciona a busca Full-Text?", answer: "Ative o modo 'FULL-TEXT' na barra de busca. O sistema pesquisará no conteúdo completo dos documentos (título, código, descrição, texto e categoria) usando indexação GIN do PostgreSQL com suporte a idioma português." },
    ],
  },
  {
    id: "auditorias", title: "Auditorias", icon: ClipboardCheck, description: "Auditorias internas e externas com checklists",
    faqs: [
      { question: "Como planejar uma auditoria?", answer: "Clique em 'Nova Auditoria', defina título, tipo, data, escopo e auditor líder. A auditoria inicia como 'Planejada' e pode ser executada via dispositivo móvel." },
      { question: "Como registrar achados?", answer: "Durante a execução, clique em 'Adicionar Achado' para registrar não conformidades ou observações. Cada achado pode ser vinculado a uma NC ou plano de ação." },
      { question: "Como usar o Checklist de Auditoria?", answer: "Nos detalhes da auditoria, acesse a aba 'Checklists'. Clique em 'Novo Checklist', defina título e norma de referência (ISO 9001, ONA, JCI, etc.). Adicione itens de verificação com requisito, cláusula da norma e pontuação máxima." },
      { question: "Como funciona a pontuação do checklist?", answer: "Cada item do checklist pode receber uma pontuação de 0 até o máximo definido (padrão: 10). O status de cada item pode ser: Conforme, Não Conforme, Parcial, Não Aplicável ou Não Avaliado. O sistema calcula automaticamente a pontuação total, pontuação máxima e o percentual de conformidade (%)." },
      { question: "Como anexar evidências aos itens do checklist?", answer: "Em cada item do checklist, clique no ícone de câmera ou upload para adicionar evidências (fotos, vídeos, documentos). As URLs das evidências são registradas junto com notas de evidência descritivas. Isso permite auditoria baseada em evidências conforme exigido pela ISO 19011." },
      { question: "Posso ter múltiplos checklists por auditoria?", answer: "Sim. Cada auditoria pode ter múltiplos checklists, permitindo verificação por norma diferente (ex: um checklist ISO 9001 e outro ONA na mesma auditoria). Cada checklist tem sua própria pontuação e percentual de conformidade independentes." },
    ],
  },
  {
    id: "planos", title: "Planos de Ação (5W2H)", icon: Crosshair, description: "Ações corretivas com Kanban",
    faqs: [
      { question: "Como criar um plano de ação?", answer: "Clique em 'Novo Plano', preencha o título e os campos 5W2H: O quê (What), Por quê (Why), Quem (Who), Quando (When), Onde (Where), Como (How) e Quanto (How Much)." },
      { question: "Como vincular a uma NC ou auditoria?", answer: "Ao criar o plano, selecione a origem (NC, Auditoria ou CAPA). O vínculo será registrado automaticamente, permitindo rastreabilidade completa." },
      { question: "Como acompanhar o progresso?", answer: "Cada plano possui uma barra de progresso atualizável. Filtre por status (Pendente, Em Andamento, Concluído, Atrasado) para priorizar ações críticas." },
      { question: "Como usar a visualização Kanban?", answer: "Alterne entre as visualizações 'Lista' e 'Kanban' usando os botões no topo da página. No modo Kanban, os planos são exibidos em colunas por status (Pendente, Em Andamento, Concluído, Atrasado, Cancelado). Arraste e solte os cards entre as colunas para atualizar o status automaticamente." },
      { question: "O Kanban atualiza o status automaticamente?", answer: "Sim. Ao arrastar um card para uma nova coluna, o sistema atualiza o status do plano de ação no banco de dados em tempo real. O card exibe título, responsável, progresso (%) e prazos para fácil identificação visual." },
    ],
  },
  {
    id: "riscos", title: "Gestão de Riscos", icon: Activity, description: "Matriz de riscos 5×5",
    faqs: [
      { question: "Como funciona a matriz de riscos?", answer: "A matriz 5×5 combina Probabilidade (1-5) com Impacto (1-5). Clique em qualquer célula da matriz para ver os riscos naquela interseção. Cores indicam criticidade." },
      { question: "Quando um risco gera alerta?", answer: "Riscos com nível crítico (Probabilidade × Impacto ≥ 15) geram alertas automáticos no painel executivo e notificações para os responsáveis." },
    ],
  },
  {
    id: "capa", title: "Fluxo CAPA", icon: GitBranch, description: "Ações Corretivas e Preventivas",
    faqs: [
      { question: "Quais são as 6 etapas do CAPA?", answer: "1) Identificação do problema, 2) Análise de Causa Raiz, 3) Plano de Ação, 4) Implementação, 5) Verificação de Eficácia, 6) Fechamento formal. Cada etapa possui campos específicos." },
      { question: "Como verificar a eficácia?", answer: "Na etapa 5, registre o método de verificação, a data e o resultado. Marque se o CAPA foi eficaz. Somente CAPAs com eficácia comprovada podem ser fechados formalmente." },
    ],
  },
  {
    id: "causa_raiz", title: "Análise de Causa Raiz", icon: BrainCircuit, description: "Ishikawa, 5 Porquês e IA",
    faqs: [
      { question: "Quais metodologias estão disponíveis?", answer: "O sistema oferece três ferramentas: Diagrama de Ishikawa (6M: Mão de obra, Método, Máquina, Material, Meio ambiente, Medição), 5 Porquês e Diagrama de Árvore." },
      { question: "Como a IA auxilia na análise?", answer: "O assistente de IA (baseado em RAG e Machine Learning) analisa a descrição da NC e sugere causas raiz baseadas no histórico de ocorrências similares, preenchendo automaticamente os diagramas." },
    ],
  },
  {
    id: "eventos", title: "Eventos Adversos", icon: ShieldAlert, description: "Incidentes e segurança do paciente",
    faqs: [
      { question: "Como notificar um evento adverso?", answer: "Clique em 'Novo Evento', preencha tipo (Incidente, Near Miss, Evento Sentinela), gravidade, descrição, localização e ações imediatas tomadas." },
      { question: "Como gerar o relatório NOTIVISA?", answer: "Eventos com classificação grave ou sentinela podem ser exportados no formato NOTIVISA através do módulo de Relatórios Regulatórios." },
    ],
  },
  {
    id: "treinamentos", title: "Treinamentos", icon: GraduationCap, description: "Gestão de capacitação",
    faqs: [
      { question: "Como registrar um treinamento?", answer: "Clique em 'Novo Treinamento', preencha título, data, instrutor, carga horária e participantes. Acompanhe o status e a validade dos treinamentos." },
      { question: "Como controlar a validade?", answer: "Defina a data de validade ao criar o treinamento. O sistema alertará automaticamente quando treinamentos estiverem próximos do vencimento." },
    ],
  },
  {
    id: "competencias", title: "Matriz de Competências", icon: Users2, description: "Avaliação e gap analysis",
    faqs: [
      { question: "Como mapear competências?", answer: "Crie competências por categoria (técnica, comportamental), defina quais funções necessitam de cada competência e registre avaliações periódicas com níveis de 1 a 5." },
      { question: "O que é gap analysis?", answer: "O sistema compara o nível atual de cada colaborador com o nível requerido para sua função, identificando lacunas de competência que precisam ser desenvolvidas." },
    ],
  },
  {
    id: "fornecedores", title: "Fornecedores", icon: Truck, description: "Qualificação, scoring A/B/C e portal externo",
    faqs: [
      { question: "Como avaliar um fornecedor?", answer: "Nos detalhes do fornecedor, registre avaliações com notas de 0-100 em Qualidade, Entrega, Custo e Conformidade. O score geral é calculado automaticamente." },
      { question: "Como classificar a criticidade?", answer: "Fornecedores são classificados como Alta, Média ou Baixa criticidade. Fornecedores críticos exigem qualificação periódica mais rigorosa." },
      { question: "Como funciona o Scoring A/B/C com critérios ponderados?", answer: "Acesse 'Gestão de Fornecedores' e configure os critérios de avaliação (ex: Qualidade 40%, Prazo de Entrega 25%, Preço 20%, Certificações 15%). O sistema calcula o score ponderado e classifica automaticamente: A (≥80 pontos - Excelente), B (60-79 - Regular) e C (<60 - Insatisfatório). O histórico de avaliações é mantido para análise de tendência." },
      { question: "Como registrar uma avaliação periódica?", answer: "Clique em 'Nova Avaliação' no fornecedor. Preencha as notas para cada critério ponderado. O sistema calcula o score total, atribui a classificação A/B/C e registra no histórico com data e avaliador." },
    ],
  },
  {
    id: "portal_fornecedor", title: "Portal do Fornecedor", icon: Globe, description: "Área self-service para fornecedores externos",
    faqs: [
      { question: "O que é o Portal do Fornecedor?", answer: "É uma área autenticada exclusiva para fornecedores acessarem externamente. O fornecedor pode visualizar pendências, enviar documentos (certidões, certificados, laudos), responder avaliações e acompanhar NCs vinculadas ao seu cadastro." },
      { question: "Como gerar um token de acesso para o fornecedor?", answer: "Acesse 'Portal do Fornecedor', selecione o fornecedor na lista e clique em 'Gerar Token'. O sistema cria um token de acesso único com validade configurável. Compartilhe o link de acesso com o fornecedor para que ele entre na área self-service." },
      { question: "Que documentos o fornecedor pode enviar?", answer: "O fornecedor pode fazer upload de certidões negativas, certificações ISO, laudos técnicos, alvarás e qualquer documento exigido no processo de qualificação. Os documentos são armazenados no bucket 'supplier-docs' com rastreabilidade completa." },
      { question: "Como revogar o acesso do fornecedor?", answer: "No Portal do Fornecedor, localize o token ativo e clique em 'Revogar'. O acesso é imediatamente cancelado e o fornecedor não poderá mais utilizar o link." },
    ],
  },
  {
    id: "pesquisas", title: "Pesquisas de Satisfação", icon: Heart, description: "NPS, CSAT e pesquisas customizadas",
    faqs: [
      { question: "Quais tipos de pesquisa são suportados?", answer: "O sistema suporta NPS (Net Promoter Score), CSAT (Customer Satisfaction Score) e pesquisas customizadas com perguntas de múltipla escolha, escala e texto livre." },
      { question: "Como analisar os resultados?", answer: "Os resultados são consolidados automaticamente com gráficos de tendência. O NPS é calculado como % Promotores - % Detratores." },
    ],
  },
  {
    id: "atas", title: "Atas de Reunião", icon: BookOpen, description: "Registro com transcrição de voz",
    faqs: [
      { question: "Como registrar uma ata?", answer: "Clique em 'Nova Ata', defina título, data, tipo e participantes. Preencha pauta, discussões, decisões e itens de ação com responsáveis e prazos." },
      { question: "Como usar a transcrição de voz?", answer: "Clique no ícone de microfone para gravar. A IA transcreverá o áudio automaticamente, e o texto será inserido no campo de discussões para edição." },
    ],
  },
  {
    id: "regulatorio", title: "Relatórios Regulatórios", icon: ShieldAlert, description: "NOTIVISA, ANVISA e vigilância",
    faqs: [
      { question: "Quais relatórios podem ser gerados?", answer: "Relatórios NOTIVISA para eventos adversos, relatórios de vigilância sanitária (ANVISA) e consolidações periódicas para acreditação ONA/JCI." },
      { question: "Como exportar um relatório?", answer: "Selecione o tipo de relatório, o período desejado e clique em 'Gerar'. O sistema compilará os dados automaticamente no formato exigido pelo órgão regulador." },
    ],
  },
  {
    id: "processos", title: "Processos BPMN", icon: Workflow, description: "Mapeamento e execução de fluxos",
    faqs: [
      { question: "Como criar um processo BPMN?", answer: "Use o editor visual para arrastar e soltar elementos: Início, Tarefas, Gateways (decisão), Eventos e Fim. Conecte os elementos para definir o fluxo." },
      { question: "Como executar uma instância?", answer: "Com o processo salvo, clique em 'Executar'. Cada instância é rastreada individualmente com log de atividades e status de cada etapa." },
    ],
  },
  {
    id: "workflows", title: "Workflows Configuráveis", icon: Settings, description: "Fluxos de aprovação",
    faqs: [
      { question: "Como configurar um workflow?", answer: "Defina etapas de aprovação com responsáveis e condições. Os workflows podem ser aplicados a documentos, NCs, CAPAs e outros registros que exijam aprovação." },
      { question: "Como acompanhar aprovações pendentes?", answer: "O painel de notificações lista todas as aprovações pendentes. Você também pode visualizar o log completo de aprovações de cada registro." },
    ],
  },
  {
    id: "metrologia", title: "Metrologia e Calibração", icon: Ruler, description: "Equipamentos e certificados",
    faqs: [
      { question: "Como cadastrar um equipamento?", answer: "Clique em 'Novo Equipamento', preencha nome, número de série, fabricante, modelo, localização e categoria. Defina o intervalo de calibração." },
      { question: "Como registrar uma calibração?", answer: "Nos detalhes do equipamento, clique em 'Nova Calibração'. Registre data, resultado (Aprovado/Reprovado), número do certificado, desvio e próxima data." },
    ],
  },
  {
    id: "mudancas", title: "Gestão de Mudanças", icon: RefreshCw, description: "Controle de alterações",
    faqs: [
      { question: "Como solicitar uma mudança?", answer: "Clique em 'Nova Solicitação', descreva a mudança, justificativa, processos e documentos afetados. A solicitação passará por análise de impacto e aprovação formal." },
      { question: "Qual o fluxo de aprovação?", answer: "Solicitada → Em Análise → Aprovada → Implementada → Verificada. Cada transição requer aprovação do responsável designado." },
    ],
  },
  {
    id: "contratos", title: "Gestão de Contratos", icon: Handshake, description: "Vigência e análise jurídica por IA",
    faqs: [
      { question: "Como cadastrar um contrato?", answer: "Clique em 'Novo Contrato', preencha título, contraparte, data de início e duração. Faça upload do documento para análise automática pela IA jurídica." },
      { question: "Como funciona a IA jurídica?", answer: "A IA analisa o contrato e identifica fragilidades baseando-se no Código Civil, LGPD, CDC e RDCs da ANVISA, com cada recomendação citando o embasamento legal." },
    ],
  },
  {
    id: "projetos", title: "Projetos e Gantt", icon: FolderKanban, description: "Gestão de projetos de qualidade",
    faqs: [
      { question: "Como criar um projeto?", answer: "Clique em 'Novo Projeto', defina título, descrição, responsável, datas e setor. Adicione tarefas com dependências e marcos para visualizar no gráfico de Gantt." },
      { question: "Como usar o gráfico de Gantt?", answer: "O Gantt mostra todas as tarefas no tempo com barras de progresso. Tarefas com dependências são conectadas visualmente. Marcos são destacados com ícones específicos." },
    ],
  },
  {
    id: "fmea", title: "FMEA", icon: GitMerge, description: "Análise de modos de falha",
    faqs: [
      { question: "O que é FMEA?", answer: "Failure Mode and Effects Analysis analisa modos de falha com três dimensões: Severidade, Ocorrência e Detecção (1-10 cada). O RPN (Risk Priority Number) = S × O × D indica a prioridade." },
      { question: "Como priorizar ações?", answer: "Itens com RPN elevado (tipicamente > 100) devem receber atenção prioritária. O sistema ordena automaticamente por RPN e destaca itens críticos em vermelho." },
    ],
  },
  {
    id: "lgpd", title: "Conformidade LGPD", icon: ShieldCheck, description: "Proteção de dados pessoais",
    faqs: [
      { question: "Como mapear dados pessoais?", answer: "Clique em 'Novo Mapeamento', identifique o tipo de dado, categoria, finalidade, base legal, período de retenção e local de armazenamento." },
      { question: "Quais bases legais são suportadas?", answer: "O sistema suporta todas as bases legais da LGPD: Consentimento, Obrigação Legal, Execução de Contrato, Legítimo Interesse, Proteção da Vida, Tutela da Saúde, entre outras." },
    ],
  },
  {
    id: "analise_critica", title: "Análise Crítica pela Direção", icon: BarChart, description: "Reuniões formais ISO 9001 §9.3",
    faqs: [
      { question: "O que é a Análise Crítica pela Direção?", answer: "É a reunião formal exigida pela ISO 9001:2015 (cláusula 9.3) onde a Alta Direção avalia o desempenho do SGQ. O módulo estrutura os inputs obrigatórios (status de NCs, auditorias, indicadores, riscos, feedback de clientes, fornecedores, ações anteriores, oportunidades de melhoria e mudanças) e os outputs (decisões, recursos necessários e melhorias)." },
      { question: "Como criar uma análise crítica?", answer: "Clique em 'Nova Análise Crítica', defina título, data, participantes e setor. O formulário possui campos estruturados para todos os 9 inputs e 4 outputs conforme ISO 9001 §9.3." },
      { question: "Como funciona a agregação automática de dados?", answer: "Clique em 'Auto-agregar dados do sistema'. O sistema consulta automaticamente NCs (total, abertas, por severidade), auditorias recentes, indicadores fora da meta, riscos críticos e status de ações anteriores, preenchendo os campos de input com um snapshot real dos dados do SGQ." },
      { question: "Quais são os inputs obrigatórios da ISO 9001 §9.3?", answer: "1) Status de ações de análises anteriores, 2) Mudanças internas/externas, 3) Desempenho (NCs, auditorias, indicadores, satisfação), 4) Adequação de recursos, 5) Eficácia de ações para riscos/oportunidades, 6) Oportunidades de melhoria, 7) Desempenho de fornecedores, 8) Resultados de auditorias, 9) Feedback de clientes." },
      { question: "Quais são os outputs obrigatórios?", answer: "1) Decisões e ações tomadas, 2) Oportunidades de melhoria identificadas, 3) Necessidades de recursos, 4) Ações específicas a serem implementadas. Cada output pode ser vinculado a planos de ação para rastreabilidade." },
    ],
  },
  {
    id: "estrategia", title: "Planejamento Estratégico (BSC/SWOT)", icon: Target, description: "Balanced Scorecard e análise SWOT",
    faqs: [
      { question: "O que é o Balanced Scorecard (BSC)?", answer: "O BSC organiza objetivos estratégicos em 4 perspectivas: Financeira, Cliente, Processos Internos e Aprendizado/Crescimento. Cada objetivo pode ter indicadores vinculados, metas quantitativas e planos de ação associados para execução estratégica." },
      { question: "Como criar um plano estratégico?", answer: "Clique em 'Novo Plano', defina título, período, responsável e descrição. O plano servirá como container para objetivos BSC e itens SWOT." },
      { question: "Como adicionar objetivos BSC?", answer: "Dentro do plano, acesse a aba 'BSC' e clique em 'Novo Objetivo'. Selecione a perspectiva (Financeira, Cliente, Processos, Aprendizado), defina o objetivo, meta, unidade e valor atual. O progresso é calculado automaticamente como (valor atual / meta × 100)." },
      { question: "Como vincular indicadores e planos de ação ao BSC?", answer: "Ao criar um objetivo BSC, você pode vincular um indicador existente do módulo de Indicadores e um plano de ação do módulo de Planos de Ação 5W2H. Isso cria rastreabilidade completa: Estratégia → Indicador → Ação." },
      { question: "O que é a análise SWOT?", answer: "SWOT (Strengths, Weaknesses, Opportunities, Threats) é uma ferramenta de análise estratégica. O sistema permite cadastrar itens em cada quadrante, classificar por prioridade (Alta, Média, Baixa), definir ações associadas e vincular planos de ação para tratamento." },
      { question: "Como usar o SWOT integrado?", answer: "Dentro do plano estratégico, acesse a aba 'SWOT'. Adicione itens clicando no quadrante desejado (Forças, Fraquezas, Oportunidades, Ameaças). Para cada item, defina descrição, prioridade e ação associada. Vincule a um plano de ação existente para execução." },
    ],
  },
  {
    id: "relatorios_agendados", title: "Relatórios Agendados", icon: Calendar, description: "Envio automático de relatórios periódicos",
    faqs: [
      { question: "O que são relatórios agendados?", answer: "São relatórios configurados para serem gerados e enviados automaticamente por email em frequências definidas (diário, semanal ou mensal). Ideal para gestores que precisam de atualizações periódicas sem acessar o sistema." },
      { question: "Como configurar um relatório agendado?", answer: "Clique em 'Novo Relatório Agendado', selecione o módulo (NCs, Indicadores, Auditorias, Planos de Ação, etc.), defina a frequência (diário, semanal, mensal), formato (PDF, Excel, CSV) e os emails dos destinatários." },
      { question: "Quais módulos podem ser agendados?", answer: "Todos os principais módulos: Não Conformidades, Indicadores, Auditorias (com checklists), Planos de Ação, CAPAs, Riscos, Eventos Adversos, Fornecedores, Treinamentos e Análise Crítica." },
      { question: "Como pausar ou cancelar um agendamento?", answer: "Na lista de relatórios agendados, alterne o switch 'Ativo' para pausar o envio temporariamente. Para excluir definitivamente, clique no ícone de lixeira." },
    ],
  },
  {
    id: "portal", title: "Portal do Colaborador", icon: UserCircle, description: "Acesso individual do colaborador",
    faqs: [
      { question: "O que o colaborador pode acessar?", answer: "O portal oferece acesso a treinamentos pendentes e concluídos, documentos que necessitam leitura, NCs atribuídas e histórico de atividades pessoais." },
      { question: "Como confirmar leitura de documentos?", answer: "Ao abrir um documento no portal, clique em 'Confirmar Leitura'. A confirmação é registrada com data, hora e identificação do colaborador." },
    ],
  },
  {
    id: "dashboard", title: "Dashboard Personalizado", icon: Gauge, description: "Widgets arrastáveis e configuráveis",
    faqs: [
      { question: "Como adicionar widgets?", answer: "Desbloqueie o dashboard (ícone de cadeado), clique em '+ Widget' e selecione entre os 20+ widgets disponíveis. Arraste para posicionar e redimensione conforme necessário." },
      { question: "As configurações são salvas?", answer: "Sim, o layout e a visibilidade dos widgets são persistidos automaticamente por usuário. Cada pessoa tem seu próprio dashboard personalizado." },
    ],
  },
  {
    id: "exportacao", title: "Exportação BI", icon: Database, description: "Integração com ferramentas externas",
    faqs: [
      { question: "Como exportar dados para o Power BI?", answer: "Acesse 'Exportação BI', selecione o módulo, formato CSV, período desejado e clique em 'Exportar'. No Power BI Desktop, use 'Obter Dados → Texto/CSV' para importar." },
      { question: "Quais formatos são suportados?", answer: "O sistema exporta em CSV, JSON e Excel (.xlsx). Todos os formatos mantêm a estrutura completa dos dados com cabeçalhos descritivos." },
    ],
  },
  {
    id: "consultas", title: "Consultas (Query Builder)", icon: Search, description: "Construtor visual de consultas",
    faqs: [
      { question: "Como usar o Construtor de Consultas?", answer: "Selecione a tabela desejada, escolha as colunas, adicione filtros com condições (igual, contém, maior que) e execute. Os resultados podem ser exportados em CSV ou JSON." },
      { question: "Posso cruzar dados entre módulos?", answer: "Sim, o Query Builder permite consultas que cruzam dados de diferentes módulos, facilitando análises integradas de qualidade." },
    ],
  },
  {
    id: "importacao", title: "Importação em Massa", icon: Upload, description: "Importação via planilhas",
    faqs: [
      { question: "Quais formatos são aceitos?", answer: "O sistema aceita arquivos CSV e Excel (.xlsx). Faça upload do arquivo, mapeie as colunas para os campos do sistema e valide antes de confirmar a importação." },
      { question: "Como funciona a validação?", answer: "Após o mapeamento, o sistema valida todos os registros e apresenta erros (campos obrigatórios, formatos inválidos) antes da importação definitiva." },
    ],
  },
  {
    id: "usuarios", title: "Gerenciamento de Usuários", icon: Users2, description: "Cadastro, perfis e permissões por módulo",
    faqs: [
      { question: "Como cadastrar um novo usuário?", answer: "Acesse 'Gerenciamento de Usuários' no menu lateral, clique em 'Novo Usuário'. Preencha: nome de exibição, nome de usuário (formato: inicial + sobrenome, ex: dmorandi), senha temporária e perfil (Administrador ou Analista). O nome de usuário será mapeado internamente para @sgq.local." },
      { question: "Qual a diferença entre Administrador e Analista?", answer: "Administrador: acesso irrestrito a todos os módulos, setores e configurações do sistema. Analista: acesso restrito aos módulos habilitados e aos setores vinculados aos seus Grupos de Acesso. Sem grupo, o analista não visualiza registros com setor definido." },
      { question: "Como definir quais módulos um usuário pode acessar?", answer: "Nos detalhes do usuário, a seção 'Acesso por Módulo' permite habilitar/desabilitar cada módulo individualmente. Apenas os módulos marcados aparecerão no menu lateral do usuário." },
      { question: "Como redefinir a senha de um usuário?", answer: "Nos detalhes do usuário, clique em 'Redefinir Senha'. Uma nova senha temporária será gerada e deverá ser informada ao colaborador para que ele acesse o sistema." },
      { question: "Qual o passo a passo completo para dar acesso a um novo colaborador?", answer: "1) Crie o usuário em 'Gerenciamento de Usuários' com perfil Analista. 2) Habilite os módulos necessários na seção 'Acesso por Módulo'. 3) Acesse 'Grupos de Acesso' e adicione o usuário ao grupo correspondente aos setores dele (ex: grupo 'Assistencial' para enfermeiros). 4) Defina o nível de permissão (Leitura, Escrita ou Admin) e, se necessário, uma data de expiração." },
    ],
  },
  {
    id: "grupos_acesso", title: "Grupos de Acesso", icon: ShieldCheck, description: "Controle de acesso por setor (similar ao Active Directory)",
    faqs: [
      { question: "O que são Grupos de Acesso?", answer: "Grupos de Acesso organizam os setores da instituição em conjuntos funcionais (ex: 'Assistencial' agrupa Enfermagem, Fisioterapia, Nutrição). Ao vincular um usuário a um grupo, ele passa a visualizar e editar apenas os registros dos setores daquele grupo, garantindo segregação de dados." },
      { question: "Como criar um Grupo de Acesso?", answer: "Acesse 'Grupos de Acesso' no menu lateral, clique em 'Novo Grupo'. Defina um nome (ex: 'Administrativo'), uma cor identificadora, uma descrição e selecione os setores que compõem o grupo (ex: RH, Financeiro, Compras, Jurídico). Clique em 'Criar Grupo'." },
      { question: "Como adicionar um usuário a um grupo?", answer: "Abra o grupo desejado, clique na aba 'Membros' e depois em 'Adicionar Membro'. Selecione o usuário, defina o nível de permissão (Leitura, Escrita ou Admin) e, opcionalmente, uma data de expiração para acesso temporário." },
      { question: "Quais são os níveis de permissão?", answer: "Leitura: o usuário visualiza documentos e registros dos setores do grupo, mas não pode editá-los. Escrita: além de visualizar, pode criar e editar registros nos setores do grupo. Admin: acesso total ao grupo, incluindo a gestão de permissões e membros." },
      { question: "O que acontece se um analista não estiver em nenhum grupo?", answer: "O analista verá apenas registros que não possuem setor definido (campo setor nulo). Todos os registros vinculados a um setor específico ficarão invisíveis até que ele seja adicionado a um grupo que inclua aquele setor." },
      { question: "Posso dar acesso temporário a um setor?", answer: "Sim. Ao adicionar um membro ao grupo, defina uma data de expiração. Após essa data, o acesso é automaticamente revogado. Útil para auditores externos, consultores ou projetos com prazo definido." },
      { question: "Um usuário pode pertencer a vários grupos?", answer: "Sim. O acesso é cumulativo: se um analista está no grupo 'Assistencial' (Enfermagem, UTI) e no grupo 'Apoio' (TI, Manutenção), ele verá registros de todos esses setores." },
      { question: "Como editar os setores de um grupo existente?", answer: "Abra o grupo, na aba 'Setores', clique em 'Editar'. Marque ou desmarque os setores desejados e clique em 'Salvar'. A alteração afeta imediatamente todos os membros do grupo." },
    ],
  },
  {
    id: "configuracoes", title: "Configurações do Sistema", icon: Settings, description: "Personalização e parâmetros",
    faqs: [
      { question: "Quais configurações estão disponíveis?", answer: "Prazos padrão para NCs, setores da organização, campos personalizados por tipo de NC, configuração de e-mails automáticos e parâmetros gerais do sistema." },
      { question: "Como trocar o idioma?", answer: "O sistema suporta Português e Inglês. Use o seletor de idioma no cabeçalho para alternar. A preferência é salva automaticamente no navegador." },
    ],
  },
  {
    id: "inovacoes", title: "Inovações Exclusivas", icon: BrainCircuit, description: "10 funcionalidades que só nosso sistema possui",
    faqs: [
      { question: "O que é a Cascata Inteligente NC→CAPA→Plano→KPI?", answer: "Ao registrar uma NC crítica, o sistema cria automaticamente toda a cadeia de tratamento: uma CAPA vinculada, um Plano de Ação 5W2H preenchido e o monitoramento do indicador afetado. Isso elimina etapas manuais e garante rastreabilidade completa da não conformidade até a medição de eficácia." },
      { question: "Como funciona o Auto-Escalonamento por SLA?", answer: "Itens com prazo vencido (NCs, CAPAs, Planos de Ação) são automaticamente escalados para o nível hierárquico superior. O painel de SLA mostra contagem regressiva visual, percentual de atraso e notificação em tempo real para gestores. O escalonamento segue a cadeia: Responsável → Coordenador → Gerente → Diretor." },
      { question: "Como usar a Classificação de NC por IA?", answer: "Ao registrar uma NC, clique em '🤖 Classificar com IA'. A IA analisa título e descrição e sugere: severidade (baixa/média/alta/crítica) com nível de confiança, causas raiz prováveis, categoria sugerida, avaliação de risco e ações recomendadas. Clique na severidade sugerida para aplicá-la automaticamente ao formulário." },
      { question: "O que é o Score de Maturidade SGQ?", answer: "É um índice composto ponderado que avalia a maturidade do sistema em 9 dimensões: Documentação, Indicadores, Não Conformidades, Auditorias, Riscos, CAPAs, Treinamentos, Fornecedores e Processos. O resultado é exibido em gráfico radar com classificação automática de 5 níveis: Inicial (0-20), Básico (21-40), Definido (41-60), Gerenciado (61-80) e Excelência (81-100)." },
      { question: "Como funcionam os Alertas Preditivos de KPI?", answer: "O sistema aplica regressão linear sobre o histórico de medições de cada indicador e projeta tendências futuras. Se a projeção indicar que o KPI tende a sair da meta nos próximos períodos, um alerta preditivo é gerado automaticamente com a data estimada de violação, permitindo ação preventiva antes que o problema ocorra." },
      { question: "O que é o Relatório Executivo Narrativo por IA?", answer: "A IA gera automaticamente um relatório gerencial narrativo completo contendo: resumo executivo, análise de tendências dos indicadores, status consolidado de NCs e CAPAs, pontos de atenção em auditorias, análise de riscos críticos e recomendações estratégicas. Tudo baseado nos dados reais do sistema, pronto para apresentação à diretoria." },
      { question: "Como funciona o QR Code para Reporte de Ocorrências?", answer: "Gere QR Codes personalizados para cada setor ou equipamento. Colaboradores escaneiam o código com o celular e acessam um formulário simplificado para reportar ocorrências instantaneamente, sem necessidade de login no sistema. O reporte é registrado automaticamente com setor, data e hora." },
      { question: "O que é o Heat Map de Riscos por Setor?", answer: "É uma visualização geográfica/setorial dos riscos em formato de mapa de calor dinâmico. Setores com maior concentração de riscos críticos aparecem em cores mais quentes (vermelho), permitindo identificar rapidamente os hotspots de risco na instituição para priorização de ações." },
      { question: "Como funciona o Briefing de Auditoria por IA?", answer: "Antes de cada auditoria, a IA gera um briefing personalizado contendo: NCs abertas do setor auditado, riscos críticos ativos, indicadores fora da meta, CAPAs pendentes, checklists sugeridos por norma e pontos de atenção específicos. O auditor recebe um pacote completo de informações para conduzir a auditoria de forma eficiente." },
      { question: "O que é o Benchmarking Anônimo?", answer: "Compare o desempenho do seu SGQ com benchmarks do setor hospitalar em indicadores-chave como taxa de NC por leito, tempo médio de resolução, índice de conformidade em auditorias e maturidade geral. Os dados de comparação são anonimizados e baseados em médias setoriais, permitindo identificar oportunidades de melhoria." },
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
        <p className="text-sm text-muted-foreground">Guias, FAQs e base de conhecimento do SGQ — {helpSections.length} módulos documentados</p>
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
