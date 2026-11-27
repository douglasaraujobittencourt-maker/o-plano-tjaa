// Transcrição dos 83 assuntos do material de mapeamento TJGO 2021, seis disciplinas.
// Não preencher os detalhes ausentes por inferência. Chave composta preserva referências entre matérias.
export type GoStudyDetail = {title:string;subtopics:readonly string[];charge:string|null};
export const goStudyDetails:Readonly<Record<string,GoStudyDetail>> = {
  "201:20107": {
    "title": "Paradigmas da Administração Pública e reformas administrativas",
    "subtopics": [
      "Evolução Histórica dos Modelos Estatais e o Plano Diretor da Reforma do Aparelho do Estado (PDRAE de 1995)."
    ],
    "charge": "Diferenciação entre a administração patrimonialista (confusão entre bens públicos e privados), burocrática (foco no processo) e gerencial (foco no cidadão e nos resultados). O PDRAE/1995 é cobrado destacando a divisão do Estado em quatro setores: Núcleo Estratégico, Atividades Exclusivas, Serviços Não Exclusivos e Produção de Bens/Serviços para o Mercado."
  },
  "201:20101": {
    "title": "Administração pública burocrática",
    "subtopics": [
      "Princípios da Dominação Racional-Legal Weberiana e Mecanismos de Controle A Priori."
    ],
    "charge": "Caracterização do modelo surgido na metade do século XIX, fundamentado no formalismo, na impessoalidade, na hierarquia funcional, na profissionalização e nos rígidos controles administrativos prévios motivados pela desconfiança antecedente."
  },
  "201:20108": {
    "title": "Burocracia e disfunções burocráticas",
    "subtopics": [
      "Identificação das Disfunções Burocráticas (Merton)."
    ],
    "charge": "Cobrança sobre o excesso de apego aos regulamentos (ritualismo), categorização como base do processo de tomada de decisão, superconformidade com as rotinas, exibição de sinais de autoridade e resistência às mudanças, que transformam os meios em fins."
  },
  "201:20102": {
    "title": "Nova gestão pública",
    "subtopics": [
      "Gerencialismo (NPM - New Public Management) e o Princípio da Eficiência (EC nº 19/1998)."
    ],
    "charge": "Foco na descentralização administrativa, na delegação de autoridade, na autonomia operacional com cobrança/controle a posteriori dos resultados, na contratualização de metas e na introdução do Princípio da Eficiência no art. 37 da Constituição Federal."
  },
  "201:20109": {
    "title": "Estado do bem-estar social",
    "subtopics": [
      "Transição do Welfare State para o Estado Regulador e Prestador Indireto."
    ],
    "charge": "Papel do Estado na garantia de direitos sociais fundamentais e os limites fiscais/administrativos que impulsionaram as reformas de descentralização e parceria com a sociedade civil."
  },
  "201:20110": {
    "title": "Princípios e fundamentos da administração pública",
    "subtopics": [
      "Princípios Expressos e Implícitos (LIMPE - Legalidade, Impessoalidade, Moralidade, Publicidade e Eficiência)."
    ],
    "charge": "Conflito e aplicação prática dos princípios constitutivos da atuação administrativa, com foco na supremacia do interesse público e na indisponibilidade do interesse público."
  },
  "201:20111": {
    "title": "O processo das políticas públicas",
    "subtopics": [
      "Etapas do Ciclo de Políticas Públicas (Formulação de Alternativas e Implementação)."
    ],
    "charge": "Foco na etapa de Formulação de Alternativas (análise de impacto, custos, benefícios e escolha da solução) e na diferenciação entre os modelos de implementação Top-Down (verticalizado/decisorial) e Bottom-Up (participativo/operacional)."
  },
  "201:20112": {
    "title": "Ferramentas de planejamento no setor público: planos; programas de governo; processo orçamentário; Plano Plurianual - PPA; Lei de Diretrizes Orçamentárias - LDO; Lei Orçamentária Anual – LOA",
    "subtopics": [
      "Estrutura e Composição Obrigatória da Lei Orçamentária Anual (LOA - Art. 165, § 5º da CF)."
    ],
    "charge": "A LOA engloba três orçamentos: o Orçamento Fiscal, o Orçamento de Investimento das Estatais e o Orçamento da Seguridade Social. Cobram-se também as funções do PPA (diretrizes, objetivos e metas de médio prazo - 4 anos) e da LDO (metas e prioridades anuais, orientando a elaboração da LOA)."
  },
  "201:20114": {
    "title": "Governança: princípios da governança; fundamentos e governança pública",
    "subtopics": [
      "Princípios de Governança Pública (Integridade, Transparência, Equidade e Prestação de Contas)."
    ],
    "charge": "Governança como a capacidade técnica, administrativa, gerencial e instrumental que a Administração Pública possui para formular, implementar e avaliar políticas públicas de forma eficiente e responsiva."
  },
  "201:20115": {
    "title": "Governabilidade",
    "subtopics": [
      "Conceito e Distinção entre Governabilidade e Governança."
    ],
    "charge": "Governabilidade refere-se às condições políticas, financeiras, institucionais e de legitimidade social de um governo para tomar decisões e exercer o poder (apoio no Legislativo e pacto social)."
  },
  "201:20116": {
    "title": "Accountability",
    "subtopics": [
      "Dimensões da Accountability (Vertical, Horizontal e Social)."
    ],
    "charge": "Accountability Horizontal (mútuo controle entre órgãos e Poderes estatais, como Tribunais de Contas e Judiciário) e os componentes formais: answerability (obrigação de prestar contas/justificar) e enforcement (capacidade de impor sanções pelo descumprimento)."
  },
  "201:20117": {
    "title": "Estado, Governo e Administração Pública",
    "subtopics": [
      "Conceitos Fundamentais e Separação Funcional."
    ],
    "charge": "Estado como ente soberano (Povo, Território e Governo Soberano); Governo como função política e de alta direção (transitória e condutora); Administração Pública como aparelho operacional encarregado da execução permanente das leis e serviços públicos."
  },
  "201:20118": {
    "title": "Planejamento estratégico no setor público e indicadores de desempenho",
    "subtopics": [
      "Os 6 \"Es\" dos Indicadores de Desempenho (Eficiência, Eficácia, Efetividade, Execução, Excelência e Economicidade)."
    ],
    "charge": "Diferenciação essencial entre Eficiência (relação insumo/produto, otimização de recursos), Eficácia (alcance de metas/objetivos previstos) e Efetividade (impacto real e transformação gerada na sociedade)."
  },
  "201:20119": {
    "title": "Parcerias público-privadas",
    "subtopics": [
      "Modalidades de Concessão de Serviços Públicos (Lei nº 11.079/2004)."
    ],
    "charge": "Distinção entre Concessão Patrocinada (tarifa dos usuários + contraprestação pecuniária do parceiro público) e Concessão Administrativa (Administração Pública como usuária direta ou indireta, pagando integralmente a contraprestação)."
  },
  "201:20120": {
    "title": "Controles na administração pública",
    "subtopics": [
      "Classificação das Formas de Controle (Interno x Externo; Prévio, Concomitante e Posterior)."
    ],
    "charge": "Controle exercido pelo Poder Judiciário sobre os atos administrativos (controle de legalidade e legitimidade, vedado adentrar no mérito administrativo), bem como o controle externo a cargo do Poder Legislativo com auxílio do Tribunal de Contas."
  },
  "201:20121": {
    "title": "Transparência no setor público (Lei de Acesso à Informação e Lei da Transparência – Lei nº 12.527/2011)",
    "subtopics": [
      "Diretrizes de Acesso, Conceito de Autenticidade e Proibição de Sigilo em Violações de Direitos Humanos."
    ],
    "charge": "Obrigatoriedade de divulgação em linguagem de fácil compreensão; conceito de autenticidade (garantia de origem, emissão ou modificação por indivíduo/sistema determinado); e o regramento expresso do art. 21, que veda qualquer restrição de acesso a informações e documentos que versem sobre violação de direitos humanos praticada por agentes públicos."
  },
  "201:20122": {
    "title": "Gestão por processos em organizações públicas",
    "subtopics": [
      "Mapeamento, Modelagem e Redesenho de Fluxos de Trabalho (BPM Business Process Management)."
    ],
    "charge": "Etapas da gestão por processos (AS-IS / situacional vs. TO-BE / futuro desejado), eliminação de gargalos funcionais, integração de setores e padronização de procedimentos no âmbito judiciário e administrativo."
  },
  "201:20105": {
    "title": "Inovação no setor público",
    "subtopics": [
      "Laboratórios de Inovação e Transformação Digital de Serviços."
    ],
    "charge": "Criação de soluções focadas nas necessidades dos usuários, simplificação administrativa, desburocratização e adoção de metodologias ágeis em ambientes do Judiciário."
  },
  "201:20123": {
    "title": "Terceiro setor (organizações sociais e OSCIPs)",
    "subtopics": [
      "Regime Jurídico das OS (Lei nº 9.637/1998) vs. OSCIPs (Lei nº 9.790/1999)."
    ],
    "charge": "Organizações Sociais (OS): qualificação realizada privativamente por decreto do Poder Executivo (ato discricionário), celebram Contrato de Gestão e inserem-se no processo de Publicização. OSCIPs: qualificação como ato vinculado pelo Ministério da Justiça e celebração do Termo de Parceria."
  },
  "205:20501": {
    "title": "Regimento Interno do Tribunal de Justiça do Estado de Goiás",
    "subtopics": [
      "Tribunal Pleno: Atribuição privativa para propor à Assembleia Legislativa a alteração do número de membros do TJGO e solicitar intervenção federal no Estado.",
      "Seção Cível: Competência para julgar conflitos de competência em matéria cível entre Juízes de Direito ou seus substitutos.",
      "Vacância e Distribuição: Processos que ficarem sem relator por vacância são distribuídos diretamente, sem novo sorteio, ao Desembargador que ocupar a vaga na mesma câmara.",
      "Vedações de Sustentação Oral: Proibição expressa de sustentação oral nos embargos de declaração, nos agravos e nas arguições de suspeição."
    ],
    "charge": null
  },
  "205:20502": {
    "title": "Lei Estadual nº 9.129 de 22 de dezembro de 1981 (com atualizações da Lei nº 20.816/2020)",
    "subtopics": [
      "Organização dos Quadros de Pessoal e Regras de Carreira do Poder Judiciário Goiano."
    ],
    "charge": "Disposições sobre investidura, cargos de provimento efetivo e em comissão, progressão funcional e atribuições gerais das carreiras analíticas e de apoio do TJGO."
  },
  "205:20503": {
    "title": "Resolução nº 325 de 29 de junho de 2020 do Conselho Nacional de Justiça (CNJ)",
    "subtopics": [
      "Definição e Aplicação de \"Diretriz Estratégica\"."
    ],
    "charge": "Entendimento do conceito de Diretriz Estratégica como as indicações, instruções ou orientações norteadoras da execução da Estratégia Nacional do Poder Judiciário e de suas metas institucionais."
  },
  "205:20413": {
    "title": "Constituição do Estado de Goiás",
    "subtopics": [
      "Composição do TJGO (Art. 125/126): Tribunal com sede na Capital, jurisdição em todo o Estado e composto por, no mínimo, 36 Desembargadores.",
      "Prazos do Processo Orçamentário da LDO: Envio pelo Poder Executivo ao Legislativo até 30 de abril e devolução aprovada até 30 de junho de cada exercício.",
      "Limites de Despesas de Câmaras Municipais: Fixação do limite máximo de gasto de 7% do somatório da receita tributária para municípios de até 100 mil habitantes."
    ],
    "charge": null
  },
  "205:20504": {
    "title": "Código de Organização Judiciária de Goiás (COJ/GO)",
    "subtopics": [
      "Requisitos Cumulativos Obrigatórios para Criação de Nova Comarca."
    ],
    "charge": "A criação de comarca no Estado de Goiás exige concomitantemente população mínima de 30 mil habitantes e eleitorado cadastrado de no mínimo 3 mil eleitores."
  },
  "202:20201": {
    "title": "Leitura e análise de textos de diferentes gêneros textuais",
    "subtopics": [
      "Inferência Semântica e Dedução da Tese Central."
    ],
    "charge": "Leitura de artigos jornalísticos, crônicas e ensaios com foco em deduzir a intenção do autor e a tese que sustenta a argumentação do texto."
  },
  "202:20217": {
    "title": "Linguagem verbal e não-verbal",
    "subtopics": [
      "Relação Semântico-Discursiva entre Texto e Imagem."
    ],
    "charge": "Leitura combinada em charges, tiras e cartazes publicitários/institucionais, analisando como o elemento visual complementa ou ironiza a mensagem escrita."
  },
  "202:20218": {
    "title": "Mecanismos de produção de sentidos nos textos: polissemia, ironia, comparação, ambiguidade, citação, inferência, pressuposto",
    "subtopics": [
      "Identificação de Ironia, Pressupostos e Quebra de Expectativa."
    ],
    "charge": "Cobrança de questões que exigem identificar o ponto exato em que o texto introduz uma quebra de expectativa discursiva para gerar humor ou crítica reflexiva."
  },
  "202:20202": {
    "title": "Significados contextuais das expressões linguísticas",
    "subtopics": [
      "Denotatividade vs. Conotatividade e Sinonímia Contextual."
    ],
    "charge": "Substituição de vocábulos ou expressões por equivalentes contextuais sem alteração do sentido denotativo ou conotativo construído no parágrafo."
  },
  "202:20203": {
    "title": "Organização do texto: Fatores de textualidade (coesão, coerência, intertextualidade, informatividade, intencionalidade, aceitabilidade, situacionalidade)",
    "subtopics": [
      "Coesão Referencial por Pronomes Anafóricos."
    ],
    "charge": "Identificação do elemento antecedente retomado por pronomes relativos (que, cujo) ou demonstrativos (isso, este, aquele) no fluxo textual."
  },
  "202:20220": {
    "title": "Progressão temática",
    "subtopics": [
      "Articulação de Parágrafos e Introdução de Informações Novas."
    ],
    "charge": "Análise de como o texto introduz novos conceitos mantendo o núcleo temático central sem rupturas lógicas."
  },
  "206:20601": {
    "title": "Aspectos da História Social de Goiás: o povoamento branco, os grupos indígenas, a escravidão e cultura negra, os movimentos sociais no campo e a cultura popular",
    "subtopics": [
      "Estrutura Social e Judiciária do Século XIX no Período Imperial."
    ],
    "charge": "Análise histórica fundamentada nos relatórios provisórios de 1835 sobre a extrema carência de bacharéis letrados nas comarcas do interior de Goiás (apenas a Comarca de Goyaz dispunha de Juiz de Direito letrado), ocasionando morosidade e graves dificuldades na aplicação das leis formais."
  },
  "206:20602": {
    "title": "Aspectos da história econômica de Goiás: a mineração no século XVIII, a agropecuária nos séculos XIX e XX, a estrada de ferro e a modernização da economia goiana, as transformações econômicas com a construção de Goiânia e Brasília, industrialização, infraestrutura e planejamento; modernização da agricultura e urbanização do território goiano",
    "subtopics": [
      "Expansão do Setor Sucroenergético a partir de 2006."
    ],
    "charge": "Crescimento acelerado da cultura da cana-de-açúcar em Goiás focado na produção de etanol e na cogeração de bioeletricidade a partir do bagaço, impulsionado por fatores edafoclimáticos extremamente favoráveis (qualidade do solo e clima) e por políticas de incentivo fiscal."
  },
  "206:20607": {
    "title": "Aspectos da história política de Goiás: a independência em Goiás, o Coronelismo na República Velha, as oligarquias, a Revolução de 1930, a administração política de 1930 até os dias atuais",
    "subtopics": [
      "O Coronelismo, Folclore Político e as Campanhas Eleitorais do Século XX."
    ],
    "charge": "Caracterização do mandonismo local, alianças oligárquicas regionais, religiosidade e práticas culturais inseridas na dinâmica política cotidiana goiana."
  },
  "206:20609": {
    "title": "Aspectos históricos e urbanísticos de Goiás e de Goiânia",
    "subtopics": [
      "Estilo Arquitetônico Art Déco e o Discurso Político da Modernidade."
    ],
    "charge": "O acervo arquitetônico Art Déco na construção dos edifícios públicos pioneiros de Goiânia nas décadas de 1930/1940 (linhas retas, simetria e formas geométricas) e a utilização do ideário de \"modernidade\" e \"marcha para o oeste\" para legitimar a mudança da capital da cidade de Goiás para Goiânia (1933) e a posterior transferência da capital federal para Brasília (1960)."
  },
  "206:20610": {
    "title": "Aspectos da Cultura Goiana: culinária regional, festas religiosas, folclore, patrimônio histórico-cultural e turismo",
    "subtopics": [
      "Festas Tradicionais e Patrimônio Imaterial (Procissão do Fogaréu e Cavalhadas)."
    ],
    "charge": "Manifestações religiosas e culturais de Pirenópolis e da cidade de Goiás como atrativos turísticos e marcas da identidade histórica goiana."
  },
  "206:20611": {
    "title": "População goiana: povoamento, migrações, densidade, distribuição demográfica, população economicamente ativa",
    "subtopics": [
      "Dinâmica de Migração e Concentração Populacional no Eixo Goiânia-Anápolis-Brasília."
    ],
    "charge": "Fluxos migratórios atraídos pela expansão da fronteira agrícola e pela industrialização, gerando forte adensamento populacional na Região Metropolitana de Goiânia."
  },
  "206:20612": {
    "title": "As regiões goianas e as desigualdades regionais",
    "subtopics": [
      "Disparidades Socioeconômicas entre o Sul/Sudoeste e o Norte/Nordeste Goiano."
    ],
    "charge": "Contraste entre a elevada produtividade agrícola e industrial do Sul/Sudoeste goiano e os menores índices de desenvolvimento humano (IDH) do Nordeste de Goiás."
  },
  "206:20613": {
    "title": "Aspectos físicos do território goiano: hidrografia, clima, relevo e vegetação",
    "subtopics": [
      "Domínio do Bioma Cerrado e Bacias Hidrográficas."
    ],
    "charge": "Características do Cerrado (estação seca bem definida e estação chuvosa), relevo de planaltos e o papel de Goiás como divisor de águas de importantes bacias hidrográficas nacionais (Tocantins-Araguaia e São Francisco)."
  },
  "206:20614": {
    "title": "Atualidades econômicas, políticas e sociais do Estado de Goiás",
    "subtopics": [
      "Etnodesenvolvimento e Desafios Socioambientais em Territórios Quilombolas."
    ],
    "charge": "Projetos de sustentabilidade, preservação do meio ambiente e incentivo ao turismo comunitário nos territórios Kalunga localizados no Nordeste de Goiás."
  },
  "202:20204": {
    "title": "Sequências textuais: descritiva, narrativa, argumentativa, injuntiva, dialogal",
    "subtopics": [
      "Predomínio de Sequências Argumentativas em Artigos e Ensaios."
    ],
    "charge": "Distinção prática entre a sequência argumentativa (cujo objetivo é defender um ponto de vista e convencer o leitor) e as sequências descritivas, narrativas ou injuntivas presentes em trechos do mesmo texto."
  },
  "202:20222": {
    "title": "Tipos de argumento",
    "subtopics": [
      "Argumento de Autoridade e Argumentação por Causa/Consequência."
    ],
    "charge": "Identificação das estratégias persuasivas utilizadas pelo autor para respaldar a tese (citações de especialistas, dados estatísticos ou nexos causais)."
  },
  "202:20223": {
    "title": "Funcionalidade e características dos gêneros textuais oficiais: ofício, memorando, e-mail, carta comercial, aviso etc.",
    "subtopics": [
      "Atributos da Redação Oficial (Clareza, Concisão, Impessoalidade e Uso do Padrão Culto)."
    ],
    "charge": "Conformidade com o Manual de Redação da Presidência da República, uniformidade do fecho e adequação dos pronomes de tratamento."
  },
  "202:20206": {
    "title": "Uso dos pronomes",
    "subtopics": [
      "Emprego Anafórico e Catafórico dos Demonstrativos (Este/Esse/Isto/Isso)."
    ],
    "charge": "Uso de este/isto para o que vai ser dito ou elemento imediatamente próximo, e esse/isso para o que já foi mencionado no texto."
  },
  "202:20215": {
    "title": "Pontuação",
    "subtopics": [
      "Emprego da Vírgula pela Inversão da Ordem Direta da Frase."
    ],
    "charge": "Justificativa sintática da vírgula pelo deslocamento de adjuntos adverbiais longos ou orações subordinadas adverbiais antepostas à oração principal."
  },
  "202:20224": {
    "title": "Características dos diferentes discursos (jornalístico, político, acadêmico, publicitário, literário, científico etc.)",
    "subtopics": [
      "Marcas de Persuasão nos Discursos Publicitário e Jornalístico."
    ],
    "charge": "Identificação do grau de subjetividade, adjetivação e escolha lexical direcionada ao público-alvo de cada discursos."
  },
  "202:20209": {
    "title": "Organização da frase: Processos de coordenação e de subordinação",
    "subtopics": [
      "Sintaxe do Período Composto — Orações Adjetivas e Adverbiais."
    ],
    "charge": "Diferenciação semântico-gramatical entre orações subordinadas adjetivas restritivas (sem vírgulas) e explicativas (com vírgulas), além do valor lógico de orações adverbiais causais, condicionais e concessivas."
  },
  "202:20225": {
    "title": "Verbos que constituem predicado e verbos que não constituem predicado",
    "subtopics": [
      "Verbos Nocionais vs. Verbos de Ligação (Predicado Verbal, Nominal e Verbo-Nominal)."
    ],
    "charge": "Análise do papel sintático dos verbos na estruturação do predicado e na atribuição de predicativos ao sujeito ou ao objeto."
  },
  "202:20208": {
    "title": "Tempos e modos verbais",
    "subtopics": [
      "Emprego do Modo Subjuntivo e Correlação Verbal."
    ],
    "charge": "Articulação harmônica entre tempos verbais no período composto (ex.: imperfeito do subjuntivo + futuro do pretérito do indicativo)."
  },
  "202:20210": {
    "title": "Concordância verbal e nominal",
    "subtopics": [
      "Concordância Verbal com Sujeito Composto, Expressões Partitivas e Partícula Passivadora (se)."
    ],
    "charge": "Regras de concordância em voz passiva sintética (ex.: \"Vende-se casa\" vs. \"Vendem-se casas\") e com expressões como \"a maioria de\", \"grande parte de\"."
  },
  "202:20211": {
    "title": "Regência dos nomes e dos verbos",
    "subtopics": [
      "Regência Verbal associada ao Emprego do Acento Grave de Crase."
    ],
    "charge": "Verificação da exigência de preposição pelo verbo antecedente combinada com a presença de artigo feminino no termo regido."
  },
  "202:20226": {
    "title": "Constituição e funcionalidade do Sujeito",
    "subtopics": [
      "Identificação do Sujeito Indeterminado e Orações sem Sujeito (Verbos Impessoais)."
    ],
    "charge": "Casos de impessoalidade dos verbos haver (no sentido de existir/ocorrer) e fazer (indicando tempo decorrido), mantendo-se obrigatoriamente na 3ª pessoa do singular."
  },
  "202:20205": {
    "title": "Classes de palavras",
    "subtopics": [
      "Valor Sintático-Semântico das Conjunções Coordenativas e Subordinativas."
    ],
    "charge": "Reconhecimento do valor lógico introduzido por conectivos como contudo, todavia, porquanto, conquanto, visto que, à medida que."
  },
  "202:20212": {
    "title": "Formação das palavras: Composição, derivação",
    "subtopics": [
      "Derivação Sufixal e Significado de Radicais Técnicos."
    ],
    "charge": "Análise morfológica de sufixos formadores de substantivos/adjetivos e compreensão de radicais gregos/latinos (ex.: o sufixo -metria indicando medição no termo \"Jurimetria\")."
  },
  "202:20213": {
    "title": "Ortografia oficial, fonemas e acentuação gráfica",
    "subtopics": [
      "Regras Formais de Acentuação Gráfica (Proparoxítonas, Paroxítonas e Oxítonas)."
    ],
    "charge": "Exigência de justificativa gramatical para o uso do acento gráfico (ex.: a regra de que todas as proparoxítonas são acentuadas)."
  },
  "202:20229": {
    "title": "Variação linguística: estilística, sociocultural, geográfica, histórica",
    "subtopics": [
      "Marcas de Variação Sociocultural e Geográfica no Texto."
    ],
    "charge": "Identificação de dialetos, regionalismos ou jargões profissionais e o respeito à adequação contextual da linguagem."
  },
  "202:20216": {
    "title": "Variação entre modalidades da língua (fala e escrita), norma e uso",
    "subtopics": [
      "Distinção entre Registro Informal/Oralidade e Padrão Formulto Escrito."
    ],
    "charge": "Questões exigindo a reescrita de trechos informais para adequação estrita às regras da gramática normativa."
  },
  "203:20301": {
    "title": "Princípios de Direito Administrativo",
    "subtopics": [
      "Princípio da Impessoalidade e Publicidade (Art. 37, § 1º da CF/88)."
    ],
    "charge": "Vedação absoluta de constar nomes, símbolos ou imagens em publicidades de obras e serviços públicos que caracterizem promoção pessoal de autoridades ou servidores."
  },
  "203:20310": {
    "title": "Regime Jurídico-Administrativo",
    "subtopics": [
      "Bipolariedade do Regime: Supremacia vs. Indisponibilidade do Interesse Público."
    ],
    "charge": "Equilíbrio entre as prerrogativas especiais da Administração Pública (poderes de império) e as restrições impostas em garantia aos direitos dos administrados."
  },
  "203:20302": {
    "title": "Administração Pública direta e indireta",
    "subtopics": [
      "Caracterização das Entidades da Administração Indireta (Autarquias, Fundações, EP e SEM)."
    ],
    "charge": "Autarquias criadas diretamente por lei específica (personalidade de direito público), enquanto Empresas Públicas e Sociedades de Economia Mista têm criação autorizada por lei (direito privado)."
  },
  "203:20303": {
    "title": "Atos Administrativos: elementos e atributos",
    "subtopics": [
      "Presunção de Legitimidade e Atributos/Elementos do Ato."
    ],
    "charge": "A presunção de legitimidade e veracidade decorre diretamente do princípio da legalidade. Exige-se também o domínio dos 5 elementos (Competência, Finalidade, Forma, Motivo e Objeto)."
  },
  "203:20311": {
    "title": "Classificações e espécies dos atos administrativos",
    "subtopics": [
      "Atos Normativos, Ordinatórios e Vinculados vs. Discricionários."
    ],
    "charge": "Diferenciação entre atos que expressam a margem de conveniência e oportunidade da Administração e atos de aplicação estrita da lei."
  },
  "203:20312": {
    "title": "Anulação, revogação e convalidação dos atos administrativos",
    "subtopics": [
      "Regime Jurídico da Convalidação (Ex Tunc)."
    ],
    "charge": "A convalidação suprime defeito sanável de ato ilegal (vícios de competência não exclusiva e forma não essencial), produzindo efeitos retroativos (ex tunc) à data de edição do ato original."
  },
  "203:20312:competencia": {
    "title": "Competência administrativa",
    "subtopics": [
      "Delegação e Avocação de Competência (Lei nº 9.784/1999)."
    ],
    "charge": "Hipóteses de vedação da delegação (edição de atos normativos, decisão de recursos administrativos e matérias de competência exclusiva)."
  },
  "203:20313": {
    "title": "Contratos administrativos: formalização e espécies",
    "subtopics": [
      "Cláusulas Exorbitantes e Alteração Unilateral do Contrato."
    ],
    "charge": "Prerrogativas estatais de rescisão unilateral, modificação de quantitativos e aplicação de penalidades contratuais."
  },
  "203:20307": {
    "title": "Licitação: Lei n. 8.666/93 e Lei nº 14.133, de 01 de abril de 2021",
    "subtopics": [
      "Agentes de Contratação, Modalidades Novas e Margem de Preferência."
    ],
    "charge": "Exigência de que os agentes de contratação não possuam vínculo de parentesco (até 3º grau) com licitantes habituais; hipóteses de cabimento do Diálogo Competitivo; e concessão de margem de preferência para empresas com reserva legal de vagas para pessoas com deficiência (PCD)."
  },
  "203:20314": {
    "title": "Recursos administrativos: critérios e prazos",
    "subtopics": [
      "Efeitos dos Recursos Administrativos (Devolutivo e Suspensivo)."
    ],
    "charge": "Regra geral do efeito apenas devolutivo, salvo previsão legal expressa em contrário ou concessão de efeito suspensivo por justa causa."
  },
  "203:20305": {
    "title": "Processos administrativos e prescrição administrativa",
    "subtopics": [
      "Princípios do Processo Administrativo (Contraditório, Ampla Defesa e Verdade Real)."
    ],
    "charge": "Prazo prescricional de 5 anos para a Administração anular atos administrativos ilegais dos quais decorram efeitos favoráveis aos destinatários (salvo comprovada má-fé)."
  },
  "203:20316": {
    "title": "Agentes públicos: agentes políticos e servidores públicos",
    "subtopics": [
      "Provimento, Estabilidade e Reintegração vs. Disponibilidade."
    ],
    "charge": "Reintegração como retorno do servidor estável demitido ilegalmente (com ressarcimento de direitos); e colocação em disponibilidade com remuneração proporcional ao tempo de serviço quando extinto o cargo."
  },
  "203:20306": {
    "title": "Controle da Administração Pública",
    "subtopics": [
      "Atos de Improbidade Administrativa (Lei nº 8.429/1992 com alterações da Lei nº 14.230/2021)."
    ],
    "charge": "Caracterização dos atos que causam prejuízo ao erário (como permitir/facilitar a aquisição ou locação por preço superior ao de mercado); exigência estrita de dolo; e efetivação da perda da função pública e suspensão dos direitos políticos somente após o trânsito em julgado."
  },
  "203:20317": {
    "title": "Organizações sociais",
    "subtopics": [
      "Requisitos de Qualificação e Regime de Bens/Pessoal."
    ],
    "charge": "Formalização por Contrato de Gestão e a cessão de servidores públicos com ônus para o cessionário."
  },
  "204:20401": {
    "title": "Direitos e deveres fundamentais; Direitos e deveres individuais e coletivos, direito à vida, à liberdade, à igualdade, à segurança e à propriedade",
    "subtopics": [
      "Garantias do Artigo 5º da CF/88 (Inafastabilidade da Jurisdição, Impenhorabilidade e Manifestação do Pensamento)."
    ],
    "charge": "Inafastabilidade: A lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito (art. 5º, XXXV). Impenhorabilidade: A pequena propriedade rural trabalhada pela família não será objeto de penhora para pagamento de débitos decorrentes de sua atividade produtiva. Manifestação: Livre manifestação do pensamento, sendo vedado o anonimato."
  },
  "204:20402": {
    "title": "Direitos sociais",
    "subtopics": [
      "Rol dos Direitos Sociais do Art. 6º e Direitos dos Trabalhadores (Art. 7º)."
    ],
    "charge": "Aplicação dos direitos sociais aos servidores públicos e cláusula da reserva do possível vinculada ao mínimo existencial."
  },
  "204:20409": {
    "title": "Direitos difusos",
    "subtopics": [
      "Tutela Constitucional dos Interesses Difusos e Coletivos via Ação Popular e Ação Civil Pública."
    ],
    "charge": "Legitimidade do cidadão para propor Ação Popular para anular ato lesivo ao patrimônio público, moralidade administrativa, meio ambiente e patrimônio histórico/cultural."
  },
  "204:20403": {
    "title": "Nacionalidade e cidadania",
    "subtopics": [
      "Hipóteses de Nacionalidade Nata e Perda da Nacionalidade (Art. 12 da CF)."
    ],
    "charge": "Cargos privativos de brasileiro nato e as novas regras de perda da nacionalidade brasileira introduzidas por emenda constitucional."
  },
  "204:20404": {
    "title": "Direitos políticos",
    "subtopics": [
      "Condições de Elegibilidade e Inelegibilidades (Art. 14 da CF)."
    ],
    "charge": "Idades mínimas para cargos eletivos e inelegibilidade reflexa de parentes do Chefe do Executivo."
  },
  "204:20410": {
    "title": "Garantias constitucionais individuais, sociais e políticas",
    "subtopics": [
      "Remédios Constitucionais (Mandado de Segurança, Habeas Data e Mandado de Injunção)."
    ],
    "charge": "Prazo decadencial de 120 dias para impetração do Mandado de Segurança e cabimento do Habeas Data para assegurar o conhecimento de informações relativas à pessoa do impetrante."
  },
  "204:20405": {
    "title": "Princípios constitucionais: individuais e da administração pública",
    "subtopics": [
      "Aplicação dos Princípios Constitucionais à Atividade Administrativa e Judiciária."
    ],
    "charge": "Exigência de motivação das decisões e transparência dos atos públicos."
  },
  "204:20411": {
    "title": "Poder constituinte",
    "subtopics": [
      "Poder Constituinte Originário vs. Derivado Reformador (Limitações às Emendas Constitucionais)."
    ],
    "charge": "Limitações materiais (Cláusulas Pétreas do art. 60, § 4º) e limitações formais/procedimentais de votação."
  },
  "204:20406": {
    "title": "Normas constitucionais relativas à Administração Pública e aos servidores públicos da Administração Pública",
    "subtopics": [
      "Remuneração por Subsídio (Art. 39, § 4º da CF) e Teto Remuneratório."
    ],
    "charge": "Fixação da remuneração de membros de Poder por subsídio em parcela única, vedado o acréscimo de qualquer gratificação ou adicional; e teto no âmbito estadual limitado ao subsídio do Governador no Executivo e Desembargadores do TJ no Judiciário."
  },
  "204:20412": {
    "title": "Constituição Federal",
    "subtopics": [
      "Supremacia Constitucional e Controle de Constitucionalidade."
    ],
    "charge": "Princípios fundamentais da República Federativa do Brasil e a hierarquia das normas."
  },
  "204:20413": {
    "title": "Constituição do Estado de Goiás",
    "subtopics": [
      "Processo Legislativo Estadual — Proposta de Emenda à Constituição Estadual (PEC Estadual)."
    ],
    "charge": "Legitimidade para propor Emenda à Constituição de Goiás: exige no mínimo 1/5 dos Deputados Estaduais, o Governador do Estado ou mais da metade das Câmaras Municipais manifestando-se pela maioria relativa de seus membros."
  },
  "204:20414": {
    "title": "Princípios e garantias dos membros do poder judiciário",
    "subtopics": [
      "Garantias Institucionais e Funcionais dos Magistrados (Vitaliciedade, Inamovibilidade e Irredutibilidade de Subsídio)."
    ],
    "charge": "Prazo de 2 anos de efetivo exercício para aquisição da vitaliciedade e as hipóteses excepcionais de perda do cargo por decisão do tribunal ou sentença judicial transitada em julgado."
  },
  "204:20407": {
    "title": "Poder Judiciário: juízes, Tribunais Estaduais e Regionais, do Supremo Tribunal Federal, do Superior Tribunal de Justiça, dos Tribunais e Juízes dos Estados",
    "subtopics": [
      "Obrigatoriedade de Distribuição Imediata e Criação do Órgão Especial (Art. 93 e 95 da CF)."
    ],
    "charge": "Princípio da distribuição imediata de processos em todos os graus de jurisdição; e possibilidade de constituição de Órgão Especial em tribunais com número superior a 25 julgadores (mínimo de 11 e máximo de 25 membros)."
  }
};
export const goStudyWeights:Readonly<Record<number,{questions:number;weight:number;points:number}>> = {
 201:{questions:18,weight:2,points:36},205:{questions:10,weight:2,points:20},
 202:{questions:15,weight:1,points:15},203:{questions:7,weight:2,points:14},
 204:{questions:5,weight:2,points:10},206:{questions:5,weight:1,points:5},
};
export function getGoStudyDetail(matter:number,id:number|string):GoStudyDetail|undefined{
 return goStudyDetails[matter+":"+id];
}
