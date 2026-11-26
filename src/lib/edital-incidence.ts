import { incidenceMaps, type Banca, type Tribunal } from "./incidence-data";
import { officialTopicOrder, tribunalCatalog } from "./tribunal-catalog";

export type IncidenceOrigin = "verbena" | "fgv" | "both";
type Maps = typeof incidenceMaps;

// Exact normalized titles and reviewed equivalences; never match a generic word
// across disciplines. Aliases are activated only when their source theme/subtopic
// exists in the selected bank's incidence data.
const aliases: Record<string, Record<string, string[]>> = {
  "Administração Pública": {
    "Paradigmas e Modelos da Gestão Pública": [
      "Paradigmas da Administração Pública e reformas administrativas"
    ],
    "Modelo Burocrático Weberiano": [
      "Administração pública burocrática (Weber)",
      "Burocracia e disfunções burocráticas",
      "Administração Burocrática",
      "Modelo burocrático"
    ],
    "Modelo Gerencial e Reforma do Estado (PDRAE 1995)": [
      "Nova gestão pública / modelo gerencial",
      "Reforma gerencial no Brasil",
      "Nova gestão pública",
      "Modelo gerencial",
      "PDRAE 1995"
    ],
    "Terceiro Setor e Formas de Parceria": [
      "Terceiro setor: organizações sociais e OSCIPs",
      "Terceiro setor"
    ],
    "Organizações Sociais (OS — Lei nº 9.637/1998)": [
      "Organizações sociais",
      "OS",
      "Lei 9.637/1998",
      "Contrato de Gestão",
      "Publicização"
    ],
    "OSCIPs (Lei nº 9.790/1999)": [
      "OSCIPs",
      "Lei 9.790/1999",
      "Termo de Parceria"
    ],
    "Transparência, Governança e Accountability": [
      "Accountability",
      "Transparência e accountability",
      "Governança: princípios, fundamentos e governança pública",
      "Governança Pública"
    ],
    "Lei de Acesso à Informação (LAI — Lei nº 12.527/2011)": [
      "Transparência no setor público: Lei de Acesso à Informação e Lei da Transparência (o edital cita Lei 12.527/2011 em ambas)",
      "Lei de Acesso à Informação",
      "Lei 12.527/2011",
      "LAI",
      "Transparência ativa e passiva"
    ],
    "Governabilidade vs. Governança": [
      "Governabilidade",
      "Governança",
      "Governança Pública",
      "Governança: princípios, fundamentos e governança pública"
    ],
    "Orçamento Público e Gestão por Processos": [
      "Orçamento público",
      "Gestão por processos"
    ],
    "Instrumentos Orçamentários (CF/88, Art. 165)": [
      "Processo orçamentário e diretrizes orçamentárias",
      "Plano Plurianual (PPA), Lei de Diretrizes Orçamentárias (LDO) e Lei Orçamentária Anual (LOA)",
      "PPA",
      "LDO",
      "LOA",
      "Instrumentos orçamentários"
    ],
    "Gestão por Processos e Indicadores": [
      "Indicadores e mensuração do desempenho governamental",
      "Gestão por processos em organizações públicas",
      "Eficácia e efetividade aplicadas à Administração Pública",
      "Gestão por processos",
      "Indicadores de desempenho",
      "Mapeamento de processos",
      "Fluxogramas"
    ],
    "Ciclo de Políticas Públicas": [
      "Processo das políticas públicas",
      "Formulação de alternativas",
      "Implementação de políticas públicas",
      "Modelo Top-Down"
    ]
  },
  "Língua Portuguesa": {
    "Compreensão, Interpretação e Recursos Argumentativos": [
      "Leitura, interpretação e organização interna de textos de diferentes gêneros",
      "Interpretação de textos",
      "Compreensão e interpretação de textos",
      "Tipos de argumento"
    ],
    "Análise Textual e Tese": [
      "Tese",
      "Inferência e pressuposto",
      "Inferências",
      "Pressupostos",
      "Intenção do enunciador"
    ],
    "Recursos Discursivos": [
      "Polissemia, ironia, comparação, ambiguidade, citação, inferência e pressuposto",
      "Significados contextuais, sentido e emprego dos vocábulos",
      "Polissemia",
      "Ironia"
    ],
    "Sintaxe do Período Composto e Orações": [
      "Coordenação e subordinação",
      "Sintaxe do período composto",
      "Orações subordinadas",
      "Frase, oração, período e termos da oração"
    ],
    "Classificação de Orações": [
      "Orações subordinadas adjetivas",
      "Orações subordinadas adverbiais",
      "Orações restritivas e explicativas"
    ],
    "Morfossintaxe Aplicada": [
      "Classes gramaticais: reconhecimento, emprego e sentido",
      "Frase, oração, período e termos da oração",
      "Predicativo do sujeito",
      "Adjunto adnominal",
      "Complemento nominal",
      "Morfossintaxe"
    ],
    "Tipologia e Sequências Textuais": [
      "Tipologia textual",
      "Sequências descritiva, narrativa e argumentativa",
      "Sequências injuntiva e dialogal"
    ],
    "Sequências Linguísticas": [
      "Sequências descritiva, narrativa e argumentativa",
      "Sequências injuntiva e dialogal",
      "Sequência argumentativa",
      "Sequência descritiva",
      "Sequência narrativa",
      "Sequência injuntiva",
      "Sequência dialogal"
    ],
    "Pontuação, Crase e Formação de Palavras": [
      "Pontuação",
      "Formação das palavras",
      "Composição e derivação",
      "Emprego do sinal indicativo de crase",
      "Crase"
    ],
    "Pontuação Estilística": [
      "Pontuação",
      "Uso da vírgula",
      "Vírgula"
    ],
    "Crase e Morfologia": [
      "Emprego do sinal indicativo de crase",
      "Acentuação gráfica",
      "Formação das palavras",
      "Composição e derivação",
      "Crase",
      "Acentuação"
    ]
  },
  "Direito Administrativo": {
    "Princípios e Atos Administrativos": [
      "Princípios de Direito Administrativo e da administração pública",
      "Princípios expressos e implícitos",
      "Atos administrativos"
    ],
    "Atributos e Elementos do Ato": [
      "Atos administrativos",
      "Elementos, atributos, classificação e espécies dos atos administrativos",
      "Elementos dos atos administrativos",
      "Atributos dos atos administrativos",
      "Presunção de legitimidade",
      "Tipicidade",
      "Motivo, competência e finalidade"
    ],
    "Convalidação": [
      "Anulação, revogação e convalidação dos atos administrativos; competência",
      "Convalidação dos atos administrativos",
      "Convalidação de atos administrativos"
    ],
    "Princípios e Promoção Pessoal": [
      "Princípios de Direito Administrativo e da administração pública",
      "Princípios expressos e implícitos",
      "Princípio da impessoalidade",
      "Promoção pessoal"
    ],
    "Licitações e Contratos — Lei nº 14.133/2021": [
      "Licitações e contratos administrativos",
      "Lei 14.133/2021",
      "Nova Lei de Licitações",
      "Licitação pública: fases, modalidades, dispensa e inexigibilidade (também em Gestão Pública)",
      "Formalização e espécies dos contratos administrativos"
    ],
    "Agentes de Contratação": [
      "Agentes de contratação",
      "Nepotismo nas licitações"
    ],
    "Modalidades e Benefícios": [
      "Modalidades de licitação",
      "Diálogo competitivo",
      "Pregão",
      "Margem de preferência",
      "Licitação pública: fases, modalidades, dispensa e inexigibilidade (também em Gestão Pública)"
    ],
    "Improbidade Administrativa — Lei nº 8.429/1992": [
      "Improbidade administrativa",
      "Lei 8.429/1992"
    ],
    "Atos que Causam Dano ao Erário": [
      "Dano ao erário"
    ],
    "Aplicação de Penas": [
      "Sanções por improbidade administrativa"
    ],
    "Agentes Públicos e Responsabilidade Civil": [
      "Agentes públicos e servidores públicos",
      "Agentes políticos",
      "Responsabilidade civil do Estado",
      "Agentes públicos",
      "Servidores públicos"
    ],
    "Direitos e Estabilidade": [
      "Estabilidade",
      "Reintegração",
      "Disponibilidade",
      "Afastamento para mandato eletivo"
    ],
    "Responsabilidade Objetiva do Estado (Art. 37, § 6º da CF)": [
      "Responsabilidade civil do Estado",
      "Responsabilidade objetiva do Estado",
      "Teoria do risco administrativo",
      "Direito de regresso"
    ]
  },
  "Direito Constitucional": {
    "Direitos e Garantias Fundamentais — Art. 5º da CF": [
      "Direitos e deveres individuais e coletivos",
      "Direito à vida, liberdade, igualdade, segurança e propriedade",
      "Garantias constitucionais individuais, sociais e políticas",
      "Direitos e garantias fundamentais",
      "Art. 5º da CF"
    ],
    "Princípios Fundamentais": [
      "Inafastabilidade da jurisdição",
      "Impenhorabilidade da pequena propriedade rural",
      "Vedação ao anonimato"
    ],
    "Remédios Constitucionais": [
      "Mandado de segurança",
      "Habeas corpus"
    ],
    "Servidores Públicos e Organização do Estado": [
      "Administração pública: disposições gerais e servidores públicos",
      "Servidores públicos"
    ],
    "Remuneração por Subsídio (Art. 39, § 4º)": [
      "Remuneração por subsídio",
      "Subsídio",
      "Teto remuneratório"
    ],
    "Poder Judiciário e Precedentes": [
      "Poder Judiciário e seus órgãos",
      "Princípios e garantias dos membros do Poder Judiciário",
      "Juízes, tribunais estaduais e regionais, STF, STJ e tribunais e juízes dos Estados",
      "Poder Judiciário: disposições gerais e competências dos órgãos",
      "Poder Judiciário"
    ],
    "Regras de Funcionamento": [
      "Distribuição imediata de processos",
      "Órgão Especial"
    ],
    "Súmulas Vinculantes": [
      "Súmula vinculante"
    ],
    "Emenda à Constituição Estadual": [
      "Emenda à Constituição do Estado de Goiás"
    ]
  },
  "Legislação Complementar": {
    "Regimento Interno do TJGO": [
      "Regimento Interno do Tribunal de Justiça de Goiás"
    ],
    "Constituição do Estado de Goiás": [
      "Constituição do Estado de Goiás (também em Legislação Complementar)",
      "Constituição Estadual de Goiás",
      "CE-GO"
    ],
    "Código de Organização Judiciária de Goiás — COJ/GO": [
      "Código de Organização Judiciária de Goiás",
      "COJ/GO"
    ],
    "Resolução CNJ nº 325/2020": [
      "Resolução CNJ 325/2020",
      "Resolução 325/2020"
    ],
    "Gestão Estratégica do Judiciário": [
      "Diretriz estratégica",
      "Estratégia Nacional do Poder Judiciário"
    ]
  },
  "História e Geografia de Goiás": {
    "História de Goiás": [
      "Aspectos históricos e urbanísticos de Goiás e Goiânia"
    ],
    "Século XIX e Estrutura Judiciária": [
      "Estrutura judiciária de Goiás no século XIX"
    ],
    "Século XX e Urbanismo": [
      "Aspectos históricos e urbanísticos de Goiás e Goiânia",
      "Transformações econômicas com a construção de Goiânia e Brasília",
      "Art Déco",
      "Construção de Goiânia e Brasília"
    ],
    "Política e Sociedade": [
      "História política: independência, coronelismo na República Velha e oligarquias",
      "Cultura: culinária regional, festas religiosas, folclore, patrimônio histórico-cultural e turismo",
      "Coronelismo",
      "Religiosidade",
      "Folclore"
    ],
    "Geografia e Economia Goiana": [
      "Modernização da agricultura e urbanização"
    ],
    "Setor Sucroenergético": [
      "Modernização da agricultura e urbanização",
      "Expansão canavieira",
      "Setor sucroenergético de Goiás"
    ],
    "Socioeconomia e Comunidades": [
      "História social: povoamento branco, grupos indígenas, escravidão e cultura negra, movimentos sociais no campo e cultura popular",
      "População: povoamento, migrações, densidade, distribuição demográfica e população economicamente ativa",
      "Cultura: culinária regional, festas religiosas, folclore, patrimônio histórico-cultural e turismo",
      "Comunidades quilombolas",
      "Povoamento",
      "Turismo sustentável"
    ]
  }
};

export function normalizeIncidenceTitle(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/\bn[º°]\s*/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}
function subjectKey(value: string): string {
  return normalizeIncidenceTitle(value).replace(/^nocoes de /, "")
    .replace(/^legislacao complementar tjgo e estado de goias$/, "legislacao complementar");
}

const aliasIndex = new Map(Object.entries(aliases).map(([subject, entries]) => [
  subjectKey(subject),
  new Map(Object.entries(entries).map(([source, targets]) => [
    normalizeIncidenceTitle(source), targets.map(normalizeIncidenceTitle),
  ])),
]));

type Index = Map<string, Map<string, Set<Banca>>>;

export function buildIncidenceIndex(maps: Maps = incidenceMaps): Index {
  const index: Index = new Map();
  for (const tribunal of Object.values(maps)) {
    if (!tribunal) continue;
    for (const bank of ["verbena", "fgv"] as const) {
      const map = tribunal[bank];
      if (!map) continue;
      for (const subject of map.subjects) {
        const key = subjectKey(subject.name);
        const add = (discipline: string, title: string) => {
          if (!index.has(discipline)) index.set(discipline, new Map());
          const topics = index.get(discipline)!;
          if (!topics.has(title)) topics.set(title, new Set());
          topics.get(title)!.add(bank);
        };
        for (const theme of subject.themes) {
          // Zero-incidence themes are not evidence of a bank's coverage.
          if (theme.percent <= 0) continue;
          for (const source of [theme.title, ...theme.subtopics.filter(s => s.percent !== 0 && s.questions !== 0).map(s => s.title)]) {
            const title = normalizeIncidenceTitle(source);
            const targets = [title, ...(aliasIndex.get(key)?.get(title) ?? [])];
            for (const target of targets) add(key, target);
            // The official catalog stores the Constitution of Goiás only once,
            // in Constitutional Law, even when the map lists it under Legislation.
            if (key === "legislacao complementar" && title === "constituicao do estado de goias") {
              for (const target of targets) add("direito constitucional", target);
            }
          }
        }
      }
    }
  }
  return index;
}

const currentIndex = buildIncidenceIndex();

export function incidenceOrigin(subject: string, topic: string, index: Index = currentIndex): IncidenceOrigin | null {
  const banks = index.get(subjectKey(subject))?.get(normalizeIncidenceTitle(topic));
  if (banks?.has("verbena") && banks.has("fgv")) return "both";
  if (banks?.has("verbena")) return "verbena";
  if (banks?.has("fgv")) return "fgv";
  return null;
}

export const incidencePresentation: Record<IncidenceOrigin, { label: string; text: string; badge: string }> = {
  verbena: {
    label: "Instituto Verbena",
    text: "text-amber-800 dark:text-amber-300",
    badge: "border-amber-400 bg-amber-100 text-amber-950 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-200",
  },
  fgv: {
    label: "FGV",
    text: "text-sky-800 dark:text-sky-300",
    badge: "border-sky-400 bg-sky-100 text-sky-950 dark:border-sky-500 dark:bg-sky-950 dark:text-sky-200",
  },
  both: {
    label: "Instituto Verbena + FGV",
    text: "text-violet-800 dark:text-violet-300",
    badge: "border-violet-400 bg-violet-100 text-violet-950 dark:border-violet-500 dark:bg-violet-950 dark:text-violet-200",
  },
};


// Read-only details for the vertical syllabus. A theme's percentage is never
// represented as an individual subtopic's percentage.
export type IncidenceDetail = {
  key: string;
  bank: Banca;
  tribunal: Tribunal;
  theme: string;
  percent: number;
  approximate: boolean;
  highTheme: boolean;
  subtopics: {
    key: string;
    title: string;
    description: string;
    percent?: number;
    questions?: number;
    high: boolean;
    weight: number | null;
  }[];
};

function sourceMatches(discipline: string, source: string, target: string): boolean {
  const normalized = normalizeIncidenceTitle(source);
  return normalized === target || (aliasIndex.get(discipline)?.get(normalized) ?? []).includes(target);
}

export function topicIncidenceDetails(subject: string, topic: string, maps: Maps = incidenceMaps): IncidenceDetail[] {
  const discipline = subjectKey(subject);
  const target = normalizeIncidenceTitle(topic);
  const result: IncidenceDetail[] = [];
  for (const tribunal of ["tjgo", "tjdft"] as const) {
    for (const bank of ["verbena", "fgv"] as const) {
      const map = maps[tribunal]?.[bank];
      if (!map) continue;
      for (const sourceSubject of map.subjects) {
        const sourceKey = subjectKey(sourceSubject.name);
        const constitutionBridge = discipline === "direito constitucional" && sourceKey === "legislacao complementar";
        if (sourceKey !== discipline && !constitutionBridge) continue;
        const maxTheme = Math.max(0, ...sourceSubject.themes.map(t => t.percent));
        for (const theme of sourceSubject.themes) {
          if (theme.percent <= 0) continue;
          if (constitutionBridge && normalizeIncidenceTitle(theme.title) !== "constituicao do estado de goias") continue;
          const themeMatch = sourceMatches(sourceKey, theme.title, target);
          const eligible = theme.subtopics.filter(s => s.percent !== 0 && s.questions !== 0);
          const children = themeMatch ? eligible : eligible.filter(s => sourceMatches(sourceKey, s.title, target));
          if (!themeMatch && !children.length) continue;
          const key = `${tribunal}:${bank}:${sourceKey}:${normalizeIncidenceTitle(theme.title)}`;
          result.push({
            key, bank, tribunal, theme: theme.title, percent: theme.percent,
            approximate: map.approximate, highTheme: theme.percent === maxTheme,
            subtopics: children.map(s => ({
              key: `${key}:${normalizeIncidenceTitle(s.title)}`,
              title: s.title, description: s.description, percent: s.percent, questions: s.questions,
              weight: s.percent ?? (s.questions != null && sourceSubject.total > 0 ? 100 * s.questions / sourceSubject.total : null),
              high: false,
            })),
          });
        }
      }
    }
  }
  // Within this syllabus topic, compare independently per bank and tribunal.
  // Prefer actual child weights; if none exist, use the greatest parent-theme
  // weight among mapped children. Keep ties and never invent individual weights.
  for (const tribunal of ["tjgo", "tjdft"] as const) {
    for (const bank of ["verbena", "fgv"] as const) {
      const details = result.filter(d => d.bank === bank && d.tribunal === tribunal && d.subtopics.length);
      const explicit = details.flatMap(d => d.subtopics).filter(s => s.weight != null);
      if (explicit.length) {
        const max = Math.max(...explicit.map(s => s.weight!));
        for (const d of details) for (const s of d.subtopics) s.high = max > 0 && s.weight === max;
      } else {
        const max = Math.max(0, ...details.map(d => d.percent));
        for (const d of details) for (const s of d.subtopics) s.high = max > 0 && d.percent === max;
      }
    }
  }
  return result.map(d=>({...d,subtopics:orderIncidenceItems(d.subtopics,subject,d.tribunal)})).sort((a,b)=> (a.tribunal===b.tribunal ? incidenceSyllabusRank(subject,a.theme,a.tribunal)-incidenceSyllabusRank(subject,b.theme,b.tribunal) : a.tribunal==="tjgo"?-1:1));
}

// Temas de incidência podem agrupar vários itens do edital: ordenar pelo primeiro
// item correspondente, sem desmembrar percentuais. Sem correspondência, manter ao final.
const goIncidenceAnchors: Record<string,Record<string,number>> = {
  "Administração Pública": {
    "Políticas Públicas": 11,
    "Orçamento Público e Gestão por Processos": 3,
    "Governabilidade vs. Governança": 14,
    "Gestão por Processos e Indicadores": 4,
    "Terceiro Setor e Formas de Parceria": 23
  },
  "Língua Portuguesa": {
    "Análise Textual e Tese": 1,
    "Classificação de Orações": 9,
    "Morfossintaxe Aplicada": 5,
    "Tipologia e Sequências Textuais": 4,
    "Pontuação, Crase e Formação de Palavras": 15
  },
  "Direito Administrativo": {
    "Princípios e Promoção Pessoal": 1,
    "Direitos e Estabilidade": 4,
    "Agentes de Contratação": 9,
    "Modalidades e Benefícios": 9
  },
  "Direito Constitucional": {
    "Princípios Fundamentais": 1,
    "Remédios Constitucionais": 1,
    "Regras de Funcionamento": 7,
    "Súmulas Vinculantes": 7,
    "Processo Legislativo Estadual": 13,
    "Emenda à Constituição Estadual": 13
  },
  "História e Geografia de Goiás": {
    "História de Goiás": 7,
    "Século XIX e Estrutura Judiciária": 7,
    "Século XX e Urbanismo": 4,
    "Política e Sociedade": 7,
    "Geografia e Economia Goiana": 1,
    "Setor Sucroenergético": 6,
    "Socioeconomia e Comunidades": 1
  }
};
export function incidenceSyllabusRank(subject:string,title:string,tribunal:Tribunal):number {
 const key=subjectKey(subject);
 const matter=tribunalCatalog.materias.find(m=>subjectKey(m.titulo_central)===key);
 if(!matter)return Infinity;
 const exam=tribunal==="tjgo"?"bb":"caixa";
 const order=officialTopicOrder(matter.numero,exam);
 const norm=normalizeIncidenceTitle(title);
 // Constituição do Estado de Goiás está vinculada em Constitucional no catálogo,
 // mas aparece entre Resolução CNJ e Código de Organização no Anexo IV.
 if(tribunal==="tjgo"&&matter.numero===205&&norm==="constituicao do estado de goias")return 2.5;
 const explicit=tribunal==="tjgo"?goIncidenceAnchors[matter.titulo_central]?.[title]:undefined;
 if(explicit!==undefined){const idx=order.indexOf(matter.numero*100+explicit);if(idx>=0)return idx;}
 const candidates=tribunalCatalog.assuntos.filter(a=>a.materia_numero===matter.numero&&sourceMatches(key,title,normalizeIncidenceTitle(a.topico_central)));
 const ranks=candidates.map(a=>order.indexOf(a.id)).filter(i=>i>=0);
 return ranks.length?Math.min(...ranks):Infinity;
}
export function orderIncidenceItems<T extends {title:string}>(items:readonly T[],subject:string,tribunal:Tribunal):T[] {
 return [...items].sort((a,b)=>incidenceSyllabusRank(subject,a.title,tribunal)-incidenceSyllabusRank(subject,b.title,tribunal));
}
