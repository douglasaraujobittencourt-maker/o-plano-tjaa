// Dados aproximados fornecidos pelo usuário, via NotebookLM. Não são contagens auditadas.
export type Tribunal = "tjgo" | "tjdft";
export type Banca = "verbena" | "fgv";
// IDs oficiais opcionais: permanecem estáveis se o título ou a numeração do mapa mudar.
export type Subtopic = { title: string; description: string; questions?: number; percent?: number; editalTopicIds?: readonly number[] };
export type Theme = { title: string; percent: number; questions?: number; subtopics: Subtopic[]; editalTopicIds?: readonly number[] };
export type Subject = { name: string; total: number; note: string; themes: Theme[] };
export type IncidenceMap = { exams: number; approximate: boolean; source: string; subjects: Subject[] };
export const incidenceMaps: Partial<Record<Tribunal, Partial<Record<Banca, IncidenceMap>>>> = {
  tjgo: {
    verbena: {
      exams: 40,
      approximate: true,
      source: "Análise e levantamento dos valores aproximados de 40 provas realizadas pelo Instituto Verbena de tribunais em todas as áreas.",
      subjects: [
  {
    "name": "Noções de Administração Pública",
    "total": 145,
    "note": "Questões nas 40 provas.",
    "themes": [
      {
        "title": "Paradigmas e Modelos da Gestão Pública",
        "percent": 25,
        "subtopics": [
          {
            "title": "Modelo Burocrático Weberiano",
            "description": "Dominação racional-legal, formalismo, impessoalidade e controles rígidos a priori fundamentados na desconfiança prévia.",
            "editalTopicIds": [
              20101
            ]
          },
          {
            "title": "Modelo Gerencial e Reforma do Estado (PDRAE 1995)",
            "description": "Foco em resultados, flexibilidade gerencial, controle a posteriori e consolidação do Princípio da Eficiência (EC nº 19/1998).",
            "editalTopicIds": [
              20102
            ]
          }
        ],
        "editalTopicIds": [
          20107
        ]
      },
      {
        "title": "Terceiro Setor e Formas de Parceria",
        "percent": 22,
        "subtopics": [
          {
            "title": "Organizações Sociais (OS — Lei nº 9.637/1998)",
            "description": "Qualificação privativa pelo Poder Executivo, celebração do Contrato de Gestão e processo de Publicização (transferência de serviços não exclusivos ao setor público não estatal).",
            "editalTopicIds": [
              20123
            ]
          },
          {
            "title": "OSCIPs (Lei nº 9.790/1999)",
            "description": "Qualificação para celebração do Termo de Parceria com o Poder Público.",
            "editalTopicIds": [
              20123
            ]
          }
        ],
        "editalTopicIds": [
          20123
        ]
      },
      {
        "title": "Transparência, Governança e Accountability",
        "percent": 20,
        "subtopics": [
          {
            "title": "Lei de Acesso à Informação (LAI — Lei nº 12.527/2011)",
            "description": "Transparência ativa/passiva em linguagem de fácil compreensão, conceito formal de autenticidade e proibição de sigilo em casos de violação de direitos humanos.",
            "editalTopicIds": [
              20121
            ]
          },
          {
            "title": "Governabilidade vs. Governança",
            "description": "Governabilidade (condição política e financeira de decidir) vs. Governança (capacidade técnica, administrativa e instrumental de executar).",
            "editalTopicIds": [
              20115
            ]
          }
        ],
        "editalTopicIds": [
          20114
        ]
      },
      {
        "title": "Orçamento Público e Gestão por Processos",
        "percent": 20,
        "subtopics": [
          {
            "title": "Instrumentos Orçamentários (CF/88, Art. 165)",
            "description": "Composição da LOA (Orçamento Fiscal, Seguridade Social e Investimento das Estatais) e papéis do PPA e LDO.",
            "editalTopicIds": [
              20113
            ]
          },
          {
            "title": "Gestão por Processos e Indicadores",
            "description": "Mapeamento de processos judiciais/administrativos, fluxogramas e medição de eficiência, eficácia e efetividade.",
            "editalTopicIds": [
              20122
            ]
          }
        ],
        "editalTopicIds": [
          20103
        ]
      },
      {
        "title": "Políticas Públicas",
        "percent": 13,
        "subtopics": [
          {
            "title": "Ciclo de Políticas Públicas",
            "description": "Etapa de Formulação de Alternativas (estudo de custos, benefícios e soluções) e modelo de execução Top-Down.",
            "editalTopicIds": [
              20111
            ]
          }
        ],
        "editalTopicIds": [
          20111
        ]
      }
    ]
  },
  {
    "name": "Legislação Complementar (TJGO e Estado de Goiás)",
    "total": 65,
    "note": "Questões específicas de legislação de Goiás.",
    "themes": [
      {
        "title": "Regimento Interno do TJGO",
        "percent": 45,
        "subtopics": [
          {
            "title": "Competências dos Órgãos Julgadores",
            "description": "Atribuições do Tribunal Pleno (propor alteração do número de membros e solicitar intervenção federal) e da Seção Cível (conflito de competência cível entre Juízes de Direito).",
            "editalTopicIds": [
              20501
            ]
          },
          {
            "title": "Dinâmica de Distribuição",
            "description": "Regra de distribuição direta de processos sem sorteio ao ocupante de vaga por vacância do relator.",
            "editalTopicIds": [
              20501
            ]
          },
          {
            "title": "Vedações Processuais",
            "description": "Proibição expressa de sustentação oral nos embargos de declaração, nos agravos e nas arguições de suspeição.",
            "editalTopicIds": [
              20501
            ]
          }
        ],
        "editalTopicIds": [
          20501
        ]
      },
      {
        "title": "Constituição do Estado de Goiás",
        "percent": 30,
        "subtopics": [
          {
            "title": "Estrutura do Judiciário Estadual",
            "description": "Sede na Capital, jurisdição em todo o Estado e composição de, no mínimo, 36 Desembargadores.",
            "editalTopicIds": [
              20413
            ]
          },
          {
            "title": "Prazos da LDO",
            "description": "Envio pelo Poder Executivo até 30 de abril e devolução pelo Legislativo até 30 de junho.",
            "editalTopicIds": [
              20413
            ]
          },
          {
            "title": "Limites Fiscais Municipais",
            "description": "Limite de despesas de Câmaras Municipais fixado em 7% para municípios de até 100 mil habitantes.",
            "editalTopicIds": [
              20413
            ]
          }
        ],
        "editalTopicIds": [
          20413
        ]
      },
      {
        "title": "Código de Organização Judiciária de Goiás — COJ/GO",
        "percent": 15,
        "subtopics": [
          {
            "title": "Criação de Comarcas",
            "description": "Requisitos cumulativos obrigatórios de população mínima de 30 mil habitantes e eleitorado cadastrado de 3 mil eleitores.",
            "editalTopicIds": [
              20504
            ]
          }
        ],
        "editalTopicIds": [
          20504
        ]
      },
      {
        "title": "Resolução CNJ nº 325/2020",
        "percent": 10,
        "subtopics": [
          {
            "title": "Gestão Estratégica do Judiciário",
            "description": "Conceito e aplicação de Diretriz Estratégica no âmbito da Estratégia Nacional do Poder Judiciário.",
            "editalTopicIds": [
              20503
            ]
          }
        ],
        "editalTopicIds": [
          20503
        ]
      }
    ]
  },
  {
    "name": "Língua Portuguesa",
    "total": 460,
    "note": "Questões nas 40 provas.",
    "themes": [
      {
        "title": "Compreensão, Interpretação e Recursos Argumentativos",
        "percent": 40,
        "subtopics": [
          {
            "title": "Análise Textual e Tese",
            "description": "Identificação da tese do texto, inferências semânticas, pressupostos e intenção do enunciador.",
            "editalTopicIds": [
              20201
            ]
          },
          {
            "title": "Recursos Discursivos",
            "description": "Quebra de expectativa no início do texto, identificação de interlocutores e análise do valor polissêmico/ironia.",
            "editalTopicIds": [
              20218
            ]
          }
        ],
        "editalTopicIds": [
          20201
        ]
      },
      {
        "title": "Sintaxe do Período Composto e Orações",
        "percent": 25,
        "subtopics": [
          {
            "title": "Classificação de Orações",
            "description": "Diferença entre orações subordinadas adjetivas restritivas vs. explicativas e orações subordinadas adverbiais (causais, condicionais e concessivas).",
            "editalTopicIds": [
              20209
            ]
          },
          {
            "title": "Morfossintaxe Aplicada",
            "description": "Relação entre classe gramatical e função sintática (predicativo do sujeito, adjunto adnominal e complemento nominal).",
            "editalTopicIds": [
              20205
            ]
          }
        ],
        "editalTopicIds": [
          20209
        ]
      },
      {
        "title": "Tipologia e Sequências Textuais",
        "percent": 20,
        "subtopics": [
          {
            "title": "Sequências Linguísticas",
            "description": "Identificação da predominância de sequências argumentativas (provocar reflexão), descritivas, narrativas, injuntivas e dialogais.",
            "editalTopicIds": [
              20204
            ]
          }
        ],
        "editalTopicIds": [
          20204
        ]
      },
      {
        "title": "Pontuação, Crase e Formação de Palavras",
        "percent": 15,
        "subtopics": [
          {
            "title": "Pontuação Estilística",
            "description": "Uso da vírgula justificado pela inversão da ordem direta da frase (adjunto adverbial ou oração anteposta).",
            "editalTopicIds": [
              20215
            ]
          },
          {
            "title": "Crase e Morfologia",
            "description": "Marcação do acento grave indicativo de crase, regras de acentuação e análise de radicais (ex.: sufixo -metria em \"Jurimetria\").",
            "editalTopicIds": [
              20235
            ]
          }
        ],
        "editalTopicIds": [
          20215
        ]
      }
    ]
  },
  {
    "name": "Noções de Direito Administrativo",
    "total": 280,
    "note": "Questões nas 40 provas.",
    "themes": [
      {
        "title": "Princípios e Atos Administrativos",
        "percent": 30,
        "subtopics": [
          {
            "title": "Atributos e Elementos do Ato",
            "description": "Presunção de legitimidade (decorrente do princípio da legalidade), tipicidade, motivo, competência e finalidade.",
            "editalTopicIds": [
              20311
            ]
          },
          {
            "title": "Convalidação",
            "description": "Correção de defeitos sanáveis (competência e forma) com efeitos retroativos (ex tunc).",
            "editalTopicIds": [
              20312
            ]
          },
          {
            "title": "Princípios e Promoção Pessoal",
            "description": "Vedação no Art. 37 da CF de constar nomes, símbolos ou imagens em publicidades oficiais que caracterizem promoção pessoal.",
            "editalTopicIds": [
              20301
            ]
          }
        ],
        "editalTopicIds": [
          20301
        ]
      },
      {
        "title": "Licitações e Contratos — Lei nº 14.133/2021",
        "percent": 25,
        "subtopics": [
          {
            "title": "Agentes de Contratação",
            "description": "Vedações ao nepotismo (parentesco até 3º grau com licitantes habituais).",
            "editalTopicIds": [
              20309
            ]
          },
          {
            "title": "Modalidades e Benefícios",
            "description": "Hipóteses do Diálogo Competitivo (inovação tecnológica), regras do Pregão e Margem de Preferência para empresas que cumprem a cota de PCDs.",
            "editalTopicIds": [
              20309
            ]
          }
        ],
        "editalTopicIds": [
          20309
        ]
      },
      {
        "title": "Improbidade Administrativa — Lei nº 8.429/1992",
        "percent": 20,
        "subtopics": [
          {
            "title": "Atos que Causam Dano ao Erário",
            "description": "Permitir ou facilitar a aquisição/locação de bem ou serviço por preço superior ao de mercado; exigência de conduta estritamente dolosa.",
            "editalTopicIds": [
              20325
            ]
          },
          {
            "title": "Aplicação de Penas",
            "description": "A perda da função pública e a suspensão dos direitos políticos só se efetivam após o trânsito em julgado.",
            "editalTopicIds": [
              20325
            ]
          }
        ],
        "editalTopicIds": [
          20325
        ]
      },
      {
        "title": "Agentes Públicos e Responsabilidade Civil",
        "percent": 25,
        "subtopics": [
          {
            "title": "Direitos e Estabilidade",
            "description": "Hipóteses de reintegração, disponibilidade proporcional ao tempo de serviço e regras de afastamento para mandato eletivo.",
            "editalTopicIds": [
              20304
            ]
          },
          {
            "title": "Responsabilidade Objetiva do Estado (Art. 37, § 6º da CF)",
            "description": "Aplicação da Teoria do Risco Administrativo e direito de regresso contra o agente nos casos de dolo ou culpa.",
            "editalTopicIds": [
              20326
            ]
          }
        ],
        "editalTopicIds": [
          20304
        ]
      }
    ]
  },
  {
    "name": "Noções de Direito Constitucional",
    "total": 220,
    "note": "Questões nas 40 provas.",
    "themes": [
      {
        "title": "Direitos e Garantias Fundamentais — Art. 5º da CF",
        "percent": 35,
        "subtopics": [
          {
            "title": "Princípios Fundamentais",
            "description": "Inafastabilidade da jurisdição, impenhorabilidade da pequena propriedade rural trabalhada pela família e vedação ao anonimato na livre manifestação.",
            "editalTopicIds": [
              20401
            ]
          },
          {
            "title": "Remédios Constitucionais",
            "description": "Mandado de Segurança (prazo decadencial de 120 dias) e Habeas Corpus.",
            "editalTopicIds": [
              20401
            ]
          }
        ],
        "editalTopicIds": [
          20401
        ]
      },
      {
        "title": "Servidores Públicos e Organização do Estado",
        "percent": 25,
        "subtopics": [
          {
            "title": "Remuneração por Subsídio (Art. 39, § 4º)",
            "description": "Parcela única sem acréscimo de gratificações/adicionais para membros de Poder e teto remuneratório estadual limitado ao subsídio do Governador.",
            "editalTopicIds": [
              20406
            ]
          }
        ],
        "editalTopicIds": [
          20406
        ]
      },
      {
        "title": "Poder Judiciário e Precedentes",
        "percent": 25,
        "subtopics": [
          {
            "title": "Regras de Funcionamento",
            "description": "Obrigatoriedade de distribuição imediata de processos em todos os graus e criação de Órgão Especial em tribunais com mais de 25 julgadores.",
            "editalTopicIds": [
              20407
            ]
          },
          {
            "title": "Súmulas Vinculantes",
            "description": "Efeito vinculante em relação aos demais órgãos do Judiciário e à Administração Pública direta e indireta.",
            "editalTopicIds": [
              20407
            ]
          }
        ],
        "editalTopicIds": [
          20407
        ]
      },
      {
        "title": "Processo Legislativo Estadual",
        "percent": 15,
        "subtopics": [
          {
            "title": "Emenda à Constituição Estadual",
            "description": "Legitimidade para proposta exigindo no mínimo 1/5 dos Deputados Estaduais, o Governador ou mais da metade das Câmaras Municipais.",
            "editalTopicIds": [
              20413
            ]
          }
        ],
        "editalTopicIds": [
          20413
        ]
      }
    ]
  },
  {
    "name": "História e Geografia de Goiás",
    "total": 25,
    "note": "Questões específicas de Goiás.",
    "themes": [
      {
        "title": "História de Goiás",
        "percent": 50,
        "subtopics": [
          {
            "title": "Século XIX e Estrutura Judiciária",
            "description": "Análise do relatório de 1835 sobre a carência de juízes letrados no interior (apenas a Comarca de Goyaz contava com juiz letrado) e as dificuldades na aplicação da lei.",
            "editalTopicIds": [
              20609
            ]
          },
          {
            "title": "Século XX e Urbanismo",
            "description": "O estilo arquitetônico Art Déco em Goiânia (décadas de 1930/40) e o discurso da modernidade como legitimador da construção de Goiânia e Brasília.",
            "editalTopicIds": [
              20609
            ]
          },
          {
            "title": "Política e Sociedade",
            "description": "Coronelismo, religiosidade e folclore político regional.",
            "editalTopicIds": [
              20607
            ]
          }
        ],
        "editalTopicIds": [
          20601
        ]
      },
      {
        "title": "Geografia e Economia Goiana",
        "percent": 50,
        "subtopics": [
          {
            "title": "Setor Sucroenergético",
            "description": "Expansão canavieira pós-2006 para produção de etanol e cogeração de bioeletricidade, impulsionada pela presença de fatores edafoclimáticos favoráveis no solo e clima de Goiás.",
            "editalTopicIds": [
              20606
            ]
          },
          {
            "title": "Socioeconomia e Comunidades",
            "description": "Povoamento, turismo sustentável e etnodesenvolvimento em territórios quilombolas no Nordeste de Goiás.",
            "editalTopicIds": [
              20601
            ]
          }
        ],
        "editalTopicIds": [
          20602
        ]
      }
    ]
  }
]
    },
  },
};
