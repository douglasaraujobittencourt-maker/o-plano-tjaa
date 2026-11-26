// TJGO 02/2021, Anexo IV, pp. 29–30; TJDFT 01/2022 (retificado 11/10/2022), Anexo I, pp. 52–54.
// Chaves estáveis, fora do intervalo dos catálogos antigos. Tópicos comuns compartilham uma única chave.
// As colunas legadas bb/caixa são apenas adaptadores internos (TJGO/TJDFT); não representam bancos.
import type { Catalog, Assunto, Materia } from "./edital-caixa-bb-data";
type Tribunal = "TJGO" | "TJDFT" | "Ambos";
type Item = readonly [Tribunal, string];
type Group = { id:number; name:string; hours:number; questions?:number; points?:number; items:readonly Item[] };
const B="Ambos", G="TJGO", D="TJDFT";
export const tribunalGroups:readonly Group[]=[
{id:201,name:"Administração Pública",hours:4,questions:18,points:36,items:[
[B,"Administração pública burocrática (Weber)"],[B,"Nova gestão pública / modelo gerencial"],[B,"Processo orçamentário e diretrizes orçamentárias"],[B,"Indicadores e mensuração do desempenho governamental"],[G,"Inovação no setor público"],[D,"Mudança e inovação organizacional"],
[G,"Paradigmas da Administração Pública e reformas administrativas"],[G,"Burocracia e disfunções burocráticas"],[G,"Estado do bem-estar social"],[G,"Princípios e fundamentos da administração pública"],[G,"Processo das políticas públicas"],[G,"Ferramentas de planejamento no setor público: planos e programas de governo"],[G,"Plano Plurianual (PPA), Lei de Diretrizes Orçamentárias (LDO) e Lei Orçamentária Anual (LOA)"],[G,"Governança: princípios, fundamentos e governança pública"],[G,"Governabilidade"],[G,"Accountability"],[G,"Estado, Governo e Administração Pública"],[G,"Planejamento estratégico no setor público"],[G,"Parcerias público-privadas"],[G,"Controles na administração pública"],[G,"Transparência no setor público: Lei de Acesso à Informação e Lei da Transparência (o edital cita Lei 12.527/2011 em ambas)"],[G,"Gestão por processos em organizações públicas"],[G,"Terceiro setor: organizações sociais e OSCIPs"],
[D,"Modelo patrimonialista de gestão pública"],[D,"Eficácia e efetividade aplicadas à Administração Pública"]]},
{id:202,name:"Língua Portuguesa",hours:2.5,questions:15,points:15,items:[
[B,"Leitura, interpretação e organização interna de textos de diferentes gêneros"],[B,"Significados contextuais, sentido e emprego dos vocábulos"],[B,"Coesão textual"],[B,"Sequências descritiva, narrativa e argumentativa"],[B,"Classes gramaticais: reconhecimento, emprego e sentido"],[B,"Uso dos pronomes"],[D,"Padrões gerais de colocação pronominal"],[B,"Tempos e modos verbais"],[B,"Coordenação e subordinação"],[B,"Concordância nominal e verbal"],[B,"Regência nominal e verbal"],[B,"Formação das palavras"],[B,"Ortografia oficial"],[B,"Acentuação gráfica"],[B,"Pontuação"],[B,"Variação linguística e norma culta/uso"],
[G,"Linguagem verbal e não verbal"],[G,"Polissemia, ironia, comparação, ambiguidade, citação, inferência e pressuposto"],[G,"Coerência, intertextualidade, informatividade, intencionalidade, aceitabilidade e situacionalidade"],[G,"Progressão temática"],[G,"Sequências injuntiva e dialogal"],[G,"Tipos de argumento"],[G,"Gêneros oficiais: ofício, memorando, e-mail, carta comercial e aviso"],[G,"Discursos jornalístico, político, acadêmico, publicitário, literário e científico"],[G,"Verbos que constituem e que não constituem predicado"],[G,"Constituição e funcionalidade do sujeito"],[G,"Composição e derivação"],[G,"Fonemas"],[G,"Variação estilística, sociocultural, geográfica, histórica e entre fala e escrita"],
[D,"Gêneros literário e não literário"],[D,"Campos semânticos"],[D,"Flexão dos nomes e verbos"],[D,"Frase, oração, período e termos da oração"],[D,"Transitividade"],[D,"Emprego do sinal indicativo de crase"],[D,"Reescrita: substituição, deslocamento e paralelismo"]]},
{id:203,name:"Direito Administrativo",hours:2.5,questions:7,points:14,items:[
[B,"Princípios de Direito Administrativo e da administração pública"],[B,"Administração direta e indireta"],[B,"Atos administrativos"],[B,"Agentes públicos e servidores públicos"],[B,"Processo administrativo"],[B,"Controle da Administração Pública"],[B,"Licitações e contratos administrativos"],[B,"Lei 8.666/1993 (referência histórica, revogada)"],[B,"Lei 14.133/2021"],
[G,"Regime jurídico-administrativo"],[G,"Elementos, atributos, classificação e espécies dos atos administrativos"],[G,"Anulação, revogação e convalidação dos atos administrativos; competência"],[G,"Formalização e espécies dos contratos administrativos"],[G,"Recursos administrativos: critérios e prazos"],[G,"Prescrição administrativa"],[G,"Agentes políticos"],[G,"Organizações sociais"],
[D,"Organização administrativa: centralização, descentralização e desconcentração"],[D,"Princípios expressos e implícitos"],[D,"Órgãos públicos"],[D,"Regime jurídico dos servidores civis da União: Lei 8.112/1990"],[D,"Processo administrativo: Lei 9.784/1999 e Lei DF 2.834/2001"],[D,"Poderes administrativos"],[D,"Controle administrativo, judicial, legislativo e dos tribunais de contas; responsabilização"],[D,"Improbidade administrativa"],[D,"Responsabilidade civil do Estado"],[D,"Lei 10.520/2002 (referência histórica, revogada)"],[D,"Licitação pública: fases, modalidades, dispensa e inexigibilidade (também em Gestão Pública)"]]},
{id:204,name:"Direito Constitucional",hours:2,questions:5,points:10,items:[
[B,"Direitos e deveres individuais e coletivos"],[B,"Direitos sociais"],[B,"Nacionalidade e cidadania"],[B,"Direitos políticos"],[B,"Princípios fundamentais / constitucionais"],[B,"Administração pública: disposições gerais e servidores públicos"],[B,"Poder Judiciário e seus órgãos"],
[G,"Direito à vida, liberdade, igualdade, segurança e propriedade"],[G,"Direitos difusos"],[G,"Garantias constitucionais individuais, sociais e políticas"],[G,"Poder constituinte"],[G,"Constituição Federal"],[G,"Constituição do Estado de Goiás (também em Legislação Complementar)"],[G,"Princípios e garantias dos membros do Poder Judiciário"],[G,"Juízes, tribunais estaduais e regionais, STF, STJ e tribunais e juízes dos Estados"],
[D,"Constituição: conceito e classificações"],[D,"Partidos políticos"],[D,"Organização político-administrativa: União, Estados, DF, Municípios e Territórios"],[D,"Poder Judiciário: disposições gerais e competências dos órgãos"],[D,"CNJ: composição e competência"],[D,"Funções essenciais à Justiça: Ministério Público, advocacia e defensoria públicas"]]},
{id:205,name:"Legislação Complementar",hours:0,questions:10,points:20,items:[
[G,"Regimento Interno do TJGO"],[G,"Lei Estadual 9.129/1981, com atualizações da Lei 20.816/2020"],[G,"Resolução CNJ 325/2020"],[G,"Código de Organização Judiciária de Goiás"]]},
{id:206,name:"História e Geografia de Goiás",hours:0,questions:5,points:5,items:[
[G,"História social: povoamento branco, grupos indígenas, escravidão e cultura negra, movimentos sociais no campo e cultura popular"],[G,"História econômica: mineração no século XVIII, agropecuária nos séculos XIX e XX"],[G,"Estrada de ferro e modernização da economia goiana"],[G,"Transformações econômicas com a construção de Goiânia e Brasília"],[G,"Industrialização, infraestrutura e planejamento"],[G,"Modernização da agricultura e urbanização"],[G,"História política: independência, coronelismo na República Velha e oligarquias"],[G,"Revolução de 1930 e administração política de 1930 até os dias atuais"],[G,"Aspectos históricos e urbanísticos de Goiás e Goiânia"],[G,"Cultura: culinária regional, festas religiosas, folclore, patrimônio histórico-cultural e turismo"],[G,"População: povoamento, migrações, densidade, distribuição demográfica e população economicamente ativa"],[G,"Regiões goianas e desigualdades regionais"],[G,"Aspectos físicos: hidrografia, clima, relevo e vegetação"],[G,"Atualidades econômicas, políticas e sociais de Goiás"]]},
{id:207,name:"Gestão de Pessoas e complementos de AFO",hours:0,items:[
[D,"Modelos de gestão de pessoas e sua evolução"],[D,"Gestão estratégica de pessoas"],[D,"Processos de gestão de pessoas"],[D,"Treinamento e desenvolvimento"],[D,"Avaliação do desempenho humano"],[D,"Modelagem do trabalho: descrição e análise de cargos, desenho de cargos e coleta de dados"],[D,"Motivação"],[D,"Gestão por competências"],[D,"Gestão de processos de mudança organizacional: conceito de mudança"],[D,"Análise dos ambientes interno e externo"],[D,"Estratégias de gestão de pessoas para sustentar a mudança"],[D,"Missão, visão de futuro e valores"],[D,"Indicadores de desempenho de gestão de pessoas"],[D,"Orçamento público: princípios orçamentários e emendas ao orçamento"],[D,"Receita e despesa públicas: conceito, categorias de classificação e estágios"],[D,"Suprimento de fundos"],[D,"Restos a pagar"],[D,"Despesas de exercícios anteriores"],[D,"MCASP 9ª edição, Parte I – Procedimentos Contábeis Orçamentários, Portaria Conjunta STN/SOF/ME 117/2021 (referência histórica)"]]},
{id:208,name:"Ética no Serviço Público",hours:0,items:[
[D,"Ética e moral"],[D,"Ética, princípios e valores"],[D,"Ética e democracia: exercício da cidadania"],[D,"Ética e função pública; ética no setor público"],[D,"Lei 8.112/1990: regime disciplinar, deveres e proibições, acumulação, responsabilidade e penalidades"],[D,"Lei 8.429/1992 e alterações: disposições gerais e atos de improbidade administrativa"],[D,"Código de Ética dos Servidores do TJDFT: Resolução 9/2019 e Portaria Conjunta 76/2020"]]},
{id:209,name:"Direito Processual Civil",hours:0,items:[
[D,"Lei 13.105/2015 (Código de Processo Civil)"],[D,"Princípios do processo: devido processo legal, contraditório, ampla defesa e juiz natural"],[D,"Jurisdição e princípio da inércia"],[D,"Ação: condições, elementos e classificação"],[D,"Cooperação internacional: disposições gerais, auxílio direto e carta rogatória"],[D,"Competência: disposições gerais, modificação e incompetência"],[D,"Pressupostos processuais e preclusão"],[D,"Sujeitos do processo: capacidade processual e postulatória"],[D,"Deveres das partes e procuradores; procuradores; sucessão e substituição"],[D,"Litisconsórcio e intervenção de terceiros"],[D,"Juiz: poderes, deveres, responsabilidade, impedimentos e suspeição"],[D,"Auxiliares da Justiça; Ministério Público; Advocacia Pública; Defensoria Pública"],[D,"Atos processuais: forma, tempo, lugar, prazos e comunicação"],[D,"Nulidades, distribuição e registro, valor da causa"],[D,"Tutela provisória e tutela de urgência: disposições gerais"],[D,"Formação, suspensão e extinção do processo"],[D,"Processo de conhecimento e cumprimento de sentença; procedimento comum"],[D,"Petição inicial: requisitos, pedido e indeferimento"],[D,"Improcedência liminar do pedido"],[D,"Audiência de conciliação ou mediação"],[D,"Contestação, reconvenção e revelia"],[D,"Providências preliminares e saneamento"],[D,"Julgamento conforme o estado do processo"],[D,"Audiência de instrução e julgamento"],[D,"Provas"],[D,"Sentença e coisa julgada"],[D,"Cumprimento da sentença e sua impugnação"],[D,"Atos judiciais: despachos, decisões interlocutórias e sentenças"],[D,"Recursos: disposições gerais, apelação, agravo de instrumento, agravo interno e embargos de declaração"],[D,"Recursos para STF e STJ"],[D,"Controle judicial dos atos administrativos; mandado de segurança"],[D,"Lei 11.419/2006 (Processo Judicial Eletrônico)"]]},
{id:210,name:"Legislação Institucional do TJDFT",hours:0,items:[
[D,"Regimento Interno do TJDFT: Portaria GPR 354/2016 e emendas regimentais subsequentes"],[D,"Lei 11.697/2008 e alterações (Organização Judiciária do DF e dos Territórios)"],[D,"Provimento Geral da Corregedoria aplicado aos Juízes e Ofícios Judiciais (DJe 10/10/2014, edição 189, fls. 332–354; alterações)"],[D,"Provimento 07/2010, alterado pelos Provimentos 4/2013 e 1/2012; Provimento 03, DJe 20/06/2011"],[D,"Provimento Judicial aplicado ao Processo Judicial Eletrônico (DJe 21/08/2017, edição 156, fls. 1003–1018; alterações)"]]},
{id:211,name:"Direito Penal",hours:0,items:[
[D,"Aplicação da lei penal: legalidade e anterioridade"],[D,"Lei penal no tempo e no espaço; tempo e lugar do crime"],[D,"Lei penal excepcional, especial e temporária"],[D,"Territorialidade e extraterritorialidade"],[D,"Pena cumprida no estrangeiro e eficácia da sentença estrangeira"],[D,"Contagem de prazo e frações não computáveis da pena"],[D,"Interpretação da lei penal, analogia e irretroatividade"],[D,"Conflito aparente de normas penais"],[D,"Teoria do crime: tipo penal objetivo e subjetivo"],[D,"Ilicitude e causas excludentes"],[D,"Culpabilidade e causas dirimentes"],[D,"Crimes contra a pessoa"],[D,"Crimes contra o patrimônio"],[D,"Crimes contra a administração pública"],[D,"Disposições constitucionais aplicáveis ao Direito Penal"],[D,"Crimes hediondos"],[D,"Abuso de autoridade"],[D,"Estatuto da Criança e do Adolescente"]]},
{id:212,name:"Direito Processual Penal",hours:0,items:[
[D,"Disposições preliminares do Código de Processo Penal"],[D,"Inquérito policial"],[D,"Ação penal"],[D,"Juiz, Ministério Público, acusado e defensor, assistentes e auxiliares da justiça, peritos e intérpretes"],[D,"Citações e intimações"],[D,"Sentença"],[D,"Processo comum e instrução criminal"],[D,"Procedimento do Tribunal do Júri: acusação e instrução preliminar"],[D,"Pronúncia, impronúncia e absolvição sumária"],[D,"Preparação para julgamento em plenário"],[D,"Alistamento dos jurados, desaforamento e organização da pauta"],[D,"Sorteio, convocação e função dos jurados"],[D,"Composição do Tribunal do Júri e Conselho de Sentença"],[D,"Reunião e sessões do Tribunal do Júri; instrução em plenário"],[D,"Debates, questionário e votação"],[D,"Sentença do júri, ata e atribuições do presidente"],[D,"Prisão e liberdade provisória"],[D,"Processo e julgamento dos crimes de responsabilidade dos funcionários públicos"],[D,"Habeas corpus e seu processo"],[D,"Disposições constitucionais aplicáveis ao Processo Penal"]]},
{id:213,name:"Direito Civil",hours:0,items:[
[D,"LINDB: vigência, aplicação, interpretação e integração das leis"],[D,"Conflito das leis no tempo e eficácia da lei no espaço"],[D,"Pessoas naturais: personalidade, capacidade, nome, estado e domicílio"],[D,"Direitos da personalidade"],[D,"Pessoas jurídicas: disposições gerais, domicílio, associações e fundações"],[D,"Bens"],[D,"Fatos jurídicos"],[D,"Negócio jurídico"],[D,"Atos jurídicos lícitos e ilícitos"],[D,"Prescrição: disposições gerais"],[D,"Decadência"]]},
{id:214,name:"Redação (Prova Discursiva)",hours:1,items:[
[B,"Treino de discursiva: estrutura e planejamento do texto"],[B,"Treino de introdução, tese e desenvolvimento"],[B,"Coesão, coerência, conectivos e conclusão"],[B,"Produção integral e correção da discursiva"]]},
];
export const scopeLabel=(scope:string)=>scope==="Só BB"?"TJGO":scope==="Só Caixa"?"TJDFT":"TJGO + TJDFT";
const scope=(t:Tribunal)=>t==="TJGO"?"Só BB":t==="TJDFT"?"Só Caixa":"Comum (Caixa + BB)";
export const tribunalCatalog:Catalog={
 materias:tribunalGroups.map(g=>{
   const go=g.items.some(i=>i[0]!==D),df=g.items.some(i=>i[0]!==G);
   return {numero:g.id,titulo_central:g.name,nomenclatura_bb:go?g.name:"—",nomenclatura_caixa:df?g.name:"—",ciclo:g.hours?"Ciclo 1":"Ciclo 2",secao_ordem:"",escopo:scope(go&&df?B:go?G:D)};
 }),
 assuntos:tribunalGroups.flatMap(g=>g.items.map(([t,title],i)=>({id:g.id*100+i+1,materia_numero:g.id,ciclo:g.hours?"Ciclo 1":"Ciclo 2",escopo:scope(t),bloco_ordem:scopeLabel(scope(t)),topico_central:title,nomenclatura_bb:t!==D?title:"—",nomenclatura_caixa:t!==G?title:"—",ordem_exibicao:g.id*100+i+1}))),
};
export const tribunalSubjectNames=new Set(tribunalGroups.map(g=>g.name));
export const isTribunalSubject=(name:string)=>tribunalSubjectNames.has(name);
export const tribunalInitialSlots=[
 [201,1.5],[204,.5],[203,1],[202,1],[201,1.5],[204,.5],[203,1],[202,1],[201,1],[204,1],[203,.5],[202,.5],[214,1]
] as const;

// Ordem de apresentação independente dos IDs históricos: Anexo IV TJGO 02/2021
// (AJAA) e Anexo I TJDFT 01/2022 (Técnico Administrativo).
// Índices originais (1-based), nunca novas chaves de assuntos.
export type TribunalOrder = "bb" | "caixa" | "bnb";
const editalPositions: Partial<Record<number, Record<"bb"|"caixa", readonly number[]>>> = {
  "201": {
    "bb": [
      7,
      1,
      8,
      2,
      9,
      10,
      11,
      12,
      3,
      13,
      14,
      15,
      16,
      17,
      18,
      4,
      19,
      20,
      21,
      22,
      5,
      23
    ],
    "caixa": [
      6,
      24,
      1,
      2,
      25,
      4,
      3
    ]
  },
  "202": {
    "bb": [
      1,
      17,
      18,
      2,
      3,
      19,
      20,
      4,
      21,
      22,
      23,
      6,
      15,
      24,
      9,
      25,
      8,
      10,
      11,
      26,
      5,
      12,
      27,
      13,
      28,
      14,
      16,
      29
    ],
    "caixa": [
      30,
      4,
      1,
      2,
      31,
      8,
      5,
      12,
      32,
      33,
      9,
      10,
      34,
      11,
      6,
      7,
      3,
      13,
      14,
      35,
      15,
      36,
      16
    ]
  },
  "203": {
    "bb": [
      1,
      10,
      2,
      3,
      11,
      12,
      7,
      13,
      8,
      9,
      14,
      5,
      15,
      4,
      16,
      6,
      17
    ],
    "caixa": [
      18,
      2,
      1,
      19,
      20,
      4,
      21,
      5,
      22,
      23,
      3,
      6,
      24,
      25,
      26,
      7,
      8,
      27,
      9,
      28
    ]
  },
  "204": {
    "bb": [
      1,
      8,
      2,
      9,
      3,
      4,
      10,
      5,
      11,
      6,
      12,
      13,
      14,
      7,
      15
    ],
    "caixa": [
      16,
      5,
      1,
      2,
      3,
      4,
      17,
      18,
      6,
      7,
      19,
      20,
      21
    ]
  }
};
export function officialTopicOrder(matter: number, exam: "bb"|"caixa"): number[] {
 const explicit=editalPositions[matter]?.[exam];
 if(explicit)return explicit.map(n=>matter*100+n);
 return tribunalCatalog.assuntos.filter(a=>a.materia_numero===matter&&(exam==="bb"?a.escopo!=="Só Caixa":a.escopo!=="Só BB")).map(a=>a.id);
}
export function orderTribunalTopics<T>(items: readonly T[], matter: number, focus: TribunalOrder, id: (item:T)=>number|null): T[] {
 const first=focus==="caixa"?"caixa":"bb";
 const ids=[...new Set([...officialTopicOrder(matter,first),...officialTopicOrder(matter,first==="bb"?"caixa":"bb")])];
 const rank=new Map(ids.map((key,i)=>[key,i]));
 return [...items].sort((a,b)=>(rank.get(id(a)??-1)??Infinity)-(rank.get(id(b)??-1)??Infinity));
}
export function topicOrderLabel(focus:TribunalOrder):string {
 return focus==="caixa"?"Ordem do edital TJDFT; demais assuntos ao final.":focus==="bb"?"Ordem do edital TJGO; demais assuntos ao final.":"Ordem TJGO, seguida dos assuntos exclusivos do TJDFT; personalizados ao final.";
}
