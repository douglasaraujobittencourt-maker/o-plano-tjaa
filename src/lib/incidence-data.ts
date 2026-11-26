// Dados aproximados fornecidos pelo usuário, via NotebookLM. Não são contagens auditadas.
export type Tribunal = "tjgo" | "tjdft";
export type Banca = "verbena" | "fgv";
export type Subtopic = { title: string; description: string; questions?: number; percent?: number };
export type Theme = { title: string; percent: number; questions?: number; subtopics: Subtopic[] };
export type Subject = { name: string; total: number; note: string; themes: Theme[] };
export type IncidenceMap = { exams: number; approximate: boolean; source: string; subjects: Subject[] };
export const incidenceMaps: Partial<Record<Tribunal, Partial<Record<Banca, IncidenceMap>>>> = {
  tjgo: {
    verbena: {
      exams: 40,
      approximate: true,
      source: "NotebookLM · levantamento enviado pelo usuário (atribuição ao Instituto Verbena/UFG pelo contexto, pendente de confirmação da banca no próprio relatório)",
      subjects: [
  {
    "name": "Noções de Administração Pública",
    "total": 145,
    "note": "Presente na prova oficial do TJGO (37.pdf, 18 questões), Administrador (30.pdf), Analista de Negócios (1.pdf) e demais cadernos de gestão.",
    "themes": [
      {
        "title": "Paradigmas e Modelos da Gestão Pública",
        "percent": 25,
        "subtopics": [
          {
            "title": "Modelo Burocrático Weberiano",
            "description": "Dominação racional-legal, formalismo, impessoalidade e controles rígidos a priori fundamentados na desconfiança prévia."
          },
          {
            "title": "Modelo Gerencial e Reforma do Estado (PDRAE 1995)",
            "description": "Foco em resultados, flexibilidade gerencial, controle a posteriori e consolidação do Princípio da Eficiência (EC nº 19/1998)."
          }
        ]
      },
      {
        "title": "Terceiro Setor e Formas de Parceria",
        "percent": 22,
        "subtopics": [
          {
            "title": "Organizações Sociais (OS — Lei nº 9.637/1998)",
            "description": "Qualificação privativa pelo Poder Executivo, Contrato de Gestão e Publicização (transferência de serviços não exclusivos ao setor público não estatal)."
          },
          {
            "title": "OSCIPs (Lei nº 9.790/1999)",
            "description": "Qualificação para celebração do Termo de Parceria com o Poder Público."
          }
        ]
      },
      {
        "title": "Transparência, Governança e Accountability",
        "percent": 20,
        "subtopics": [
          {
            "title": "Lei de Acesso à Informação (LAI — Lei nº 12.527/2011)",
            "description": "Transparência ativa/passiva em linguagem de fácil compreensão, conceito formal de autenticidade e proibição de sigilo em casos de violação de direitos humanos."
          },
          {
            "title": "Governabilidade vs. Governança",
            "description": "Governabilidade (condição política e financeira de decidir) vs. Governança (capacidade técnica, administrativa e instrumental de executar)."
          }
        ]
      },
      {
        "title": "Orçamento Público e Gestão por Processos",
        "percent": 20,
        "subtopics": [
          {
            "title": "Instrumentos Orçamentários (CF/88, Art. 165)",
            "description": "Composição da LOA (Orçamento Fiscal, Seguridade Social e Investimento das Estatais) e papéis do PPA e LDO."
          },
          {
            "title": "Gestão por Processos e Indicadores",
            "description": "Mapeamento de processos judiciais/administrativos, fluxogramas e medição de eficiência, eficácia e efetividade."
          }
        ]
      },
      {
        "title": "Políticas Públicas",
        "percent": 13,
        "subtopics": [
          {
            "title": "Ciclo de Políticas Públicas",
            "description": "Etapa de Formulação de Alternativas (estudo de custos, benefícios e soluções) e modelo de execução Top-Down."
          }
        ]
      }
    ]
  },
  {
    "name": "Legislação Complementar (TJGO e Estado de Goiás)",
    "total": 65,
    "note": "Questões específicas de legislação de Goiás (37.pdf, 36.pdf, 16.pdf e 12.pdf).",
    "themes": [
      {
        "title": "Regimento Interno do TJGO",
        "percent": 45,
        "subtopics": [
          {
            "title": "Competências dos Órgãos Julgadores",
            "description": "Atribuições do Tribunal Pleno (propor alteração do número de membros e solicitar intervenção federal) e da Seção Cível (conflito de competência cível entre Juízes de Direito)."
          },
          {
            "title": "Dinâmica de Distribuição",
            "description": "Regra de distribuição direta de processos sem sorteio ao ocupante de vaga por vacância do relator."
          },
          {
            "title": "Vedações Processuais",
            "description": "Proibição expressa de sustentação oral nos embargos de declaração, nos agravos e nas arguições de suspeição."
          }
        ]
      },
      {
        "title": "Constituição do Estado de Goiás",
        "percent": 30,
        "subtopics": [
          {
            "title": "Estrutura do Judiciário Estadual",
            "description": "Sede na Capital, jurisdição em todo o Estado e composição de, no mínimo, 36 Desembargadores."
          },
          {
            "title": "Prazos da LDO",
            "description": "Envio pelo Poder Executivo até 30 de abril e devolução pelo Legislativo até 30 de junho."
          },
          {
            "title": "Limites Fiscais Municipais",
            "description": "Limite de despesas de Câmaras Municipais fixado em 7% para municípios de até 100 mil habitantes."
          }
        ]
      },
      {
        "title": "Código de Organização Judiciária de Goiás — COJ/GO",
        "percent": 15,
        "subtopics": [
          {
            "title": "Criação de Comarcas",
            "description": "Requisitos cumulativos obrigatórios de população mínima de 30 mil habitantes e eleitorado cadastrado de 3 mil eleitores."
          }
        ]
      },
      {
        "title": "Resolução CNJ nº 325/2020",
        "percent": 10,
        "subtopics": [
          {
            "title": "Gestão Estratégica do Judiciário",
            "description": "Conceito e aplicação de Diretriz Estratégica no âmbito da Estratégia Nacional do Poder Judiciário."
          }
        ]
      }
    ]
  },
  {
    "name": "Língua Portuguesa",
    "total": 460,
    "note": "Matéria presente em todas as 40 provas do acervo, segundo o levantamento.",
    "themes": [
      {
        "title": "Compreensão, Interpretação e Recursos Argumentativos",
        "percent": 40,
        "subtopics": [
          {
            "title": "Análise Textual e Tese",
            "description": "Identificação da tese do texto, inferências semânticas, pressupostos e intenção do enunciador."
          },
          {
            "title": "Recursos Discursivos",
            "description": "Quebra de expectativa no início do texto, identificação de interlocutores e análise do valor polissêmico/ironia."
          }
        ]
      },
      {
        "title": "Sintaxe do Período Composto e Orações",
        "percent": 25,
        "subtopics": [
          {
            "title": "Classificação de Orações",
            "description": "Diferença entre orações subordinadas adjetivas restritivas vs. explicativas e orações subordinadas adverbiais (causais, condicionais e concessivas)."
          },
          {
            "title": "Morfossintaxe Aplicada",
            "description": "Relação entre classe gramatical e função sintática (predicativo do sujeito, adjunto adnominal e complemento nominal)."
          }
        ]
      },
      {
        "title": "Tipologia e Sequências Textuais",
        "percent": 20,
        "subtopics": [
          {
            "title": "Sequências Linguísticas",
            "description": "Identificação da predominância de sequências argumentativas (provocar reflexão), descritivas, narrativas, injuntivas e dialogais."
          }
        ]
      },
      {
        "title": "Pontuação, Crase e Formação de Palavras",
        "percent": 15,
        "subtopics": [
          {
            "title": "Pontuação Estilística",
            "description": "Uso da vírgula justificado pela inversão da ordem direta da frase (adjunto adverbial ou oração anteposta)."
          },
          {
            "title": "Crase e Morfologia",
            "description": "Marcação do acento grave indicativo de crase, regras de acentuação e análise de radicais (ex.: sufixo -metria em Jurimetria)."
          }
        ]
      }
    ]
  },
  {
    "name": "Noções de Direito Administrativo",
    "total": 280,
    "note": "Cadernos jurídicos, administrativos e legislação geral.",
    "themes": [
      {
        "title": "Princípios e Atos Administrativos",
        "percent": 30,
        "subtopics": [
          {
            "title": "Atributos e Elementos do Ato",
            "description": "Presunção de legitimidade (decorrente do princípio da legalidade), tipicidade, motivo, competência e finalidade."
          },
          {
            "title": "Convalidação",
            "description": "Correção de defeitos sanáveis (competência e forma) com efeitos retroativos (ex tunc)."
          },
          {
            "title": "Princípios e Promoção Pessoal",
            "description": "Vedação no Art. 37 da CF de constar nomes, símbolos ou imagens em publicidades oficiais que caracterizem promoção pessoal."
          }
        ]
      },
      {
        "title": "Licitações e Contratos — Lei nº 14.133/2021",
        "percent": 25,
        "subtopics": [
          {
            "title": "Agentes de Contratação",
            "description": "Vedações ao nepotismo (parentesco até 3º grau com licitantes habituais)."
          },
          {
            "title": "Modalidades e Benefícios",
            "description": "Hipóteses do Diálogo Competitivo (inovação tecnológica), regras do Pregão e Margem de Preferência para empresas que cumprem a cota de PCDs."
          }
        ]
      },
      {
        "title": "Improbidade Administrativa — Lei nº 8.429/1992",
        "percent": 20,
        "subtopics": [
          {
            "title": "Atos que Causam Dano ao Erário",
            "description": "Permitir ou facilitar a aquisição/locação de bem ou serviço por preço superior ao de mercado; exigência de conduta estritamente dolosa."
          },
          {
            "title": "Aplicação de Penas",
            "description": "A perda da função pública e a suspensão dos direitos políticos só se efetivam após o trânsito em julgado."
          }
        ]
      },
      {
        "title": "Agentes Públicos e Responsabilidade Civil",
        "percent": 25,
        "subtopics": [
          {
            "title": "Direitos e Estabilidade",
            "description": "Hipóteses de reintegração, disponibilidade proporcional ao tempo de serviço e regras de afastamento para mandato eletivo."
          },
          {
            "title": "Responsabilidade Objetiva do Estado (Art. 37, § 6º da CF)",
            "description": "Aplicação da Teoria do Risco Administrativo e direito de regresso contra o agente nos casos de dolo ou culpa."
          }
        ]
      }
    ]
  },
  {
    "name": "Noções de Direito Constitucional",
    "total": 220,
    "note": "Cadernos jurídicos e de legislação.",
    "themes": [
      {
        "title": "Direitos e Garantias Fundamentais — Art. 5º da CF",
        "percent": 35,
        "subtopics": [
          {
            "title": "Princípios Fundamentais",
            "description": "Inafastabilidade da jurisdição, impenhorabilidade da pequena propriedade rural trabalhada pela família e vedação ao anonimato na livre manifestação."
          },
          {
            "title": "Remédios Constitucionais",
            "description": "Mandado de Segurança (prazo decadencial de 120 dias) e Habeas Corpus."
          }
        ]
      },
      {
        "title": "Servidores Públicos e Organização do Estado",
        "percent": 25,
        "subtopics": [
          {
            "title": "Remuneração por Subsídio (Art. 39, § 4º)",
            "description": "Parcela única sem acréscimo de gratificações/adicionais para membros de Poder e teto remuneratório estadual limitado ao subsídio do Governador."
          }
        ]
      },
      {
        "title": "Poder Judiciário e Precedentes",
        "percent": 25,
        "subtopics": [
          {
            "title": "Regras de Funcionamento",
            "description": "Obrigatoriedade de distribuição imediata de processos em todos os graus e criação de Órgão Especial em tribunais com mais de 25 julgadores."
          },
          {
            "title": "Súmulas Vinculantes",
            "description": "Efeito vinculante em relação aos demais órgãos do Judiciário e à Administração Pública direta e indireta."
          }
        ]
      },
      {
        "title": "Processo Legislativo Estadual",
        "percent": 15,
        "subtopics": [
          {
            "title": "Emenda à Constituição Estadual",
            "description": "Legitimidade para proposta exigindo no mínimo 1/5 dos Deputados Estaduais, o Governador ou mais da metade das Câmaras Municipais."
          }
        ]
      }
    ]
  },
  {
    "name": "História e Geografia de Goiás",
    "total": 25,
    "note": "Questões específicas de Goiás (37.pdf, 36.pdf e 16.pdf).",
    "themes": [
      {
        "title": "História de Goiás",
        "percent": 50,
        "subtopics": [
          {
            "title": "Século XIX e Estrutura Judiciária",
            "description": "Análise do relatório de 1835 sobre a carência de juízes letrados no interior (apenas a Comarca de Goyaz contava com juiz letrado) e as dificuldades na aplicação da lei."
          },
          {
            "title": "Século XX e Urbanismo",
            "description": "O estilo arquitetônico Art Déco em Goiânia (décadas de 1930/40) e o discurso da modernidade como legitimador da construção de Goiânia e Brasília."
          },
          {
            "title": "Política e Sociedade",
            "description": "Coronelismo, religiosidade e folclore político regional."
          }
        ]
      },
      {
        "title": "Geografia e Economia Goiana",
        "percent": 50,
        "subtopics": [
          {
            "title": "Setor Sucroenergético",
            "description": "Expansão canavieira pós-2006 para produção de etanol e cogeração de bioeletricidade, impulsionada pela presença de fatores edafoclimáticos favoráveis no solo e clima de Goiás."
          },
          {
            "title": "Socioeconomia e Comunidades",
            "description": "Povoamento, turismo sustentável e etnodesenvolvimento em territórios quilombolas no Nordeste de Goiás."
          }
        ]
      }
    ]
  }
]
    },
  },
};
