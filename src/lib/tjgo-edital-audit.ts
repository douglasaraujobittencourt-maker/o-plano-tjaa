// Auditoria de apresentação exclusiva do Edital Verticalizado: TJGO 02/2021,
// Anexo IV, conhecimentos comuns e específicos AJAA. Sem migração nem novos IDs.
import type { Assunto, Catalog } from "./edital-caixa-bb-data";
import { officialTopicOrder, tribunalCatalog } from "./tribunal-catalog";
import { incidenceMaps } from "./incidence-data";
import { topicIncidenceDetails, type IncidenceDetail, type IncidenceOrigin } from "./edital-incidence";
import type { BankExam } from "./bank-exams";
export const goMatterOrder = [202,206,205,204,203,201] as const;
const titles: Record<number,string> = {
  "20101": "Administração pública burocrática",
  "20102": "Nova gestão pública",
  "20103": "Processo orçamentário",
  "20104": "Indicadores de desempenho",
  "20107": "Paradigmas da Administração Pública e reformas administrativas",
  "20112": "Ferramentas de planejamento no setor público: planos; programas de governo",
  "20114": "Governança: princípios da governança; fundamentos e governança pública",
  "20121": "Transparência no setor público: Lei de acesso à informação (Lei nº 12.527, de 18 de novembro de 2011) e Lei da transparência (Lei nº 12.527, de 18 de novembro de 2011)",
  "20123": "Terceiro setor: organizações sociais e organizações da sociedade civil de interesse público",
  "20201": "Leitura e análise de textos de diferentes gêneros textuais",
  "20202": "Significados contextuais das expressões linguísticas",
  "20203": "Organização do texto: fatores de textualidade — coesão",
  "20204": "Sequências textuais: descritiva, narrativa, argumentativa",
  "20205": "Classes de palavras",
  "20216": "Norma e uso",
  "20218": "Mecanismos de produção de sentidos nos textos: polissemia, ironia, comparação, ambiguidade, citação, inferência, pressuposto",
  "20219": "Coerência, intertextualidade, informatividade, intencionalidade, aceitabilidade, situacionalidade",
  "20223": "Funcionalidade e características dos gêneros textuais oficiais: ofício, memorando, e-mail, carta comercial, aviso, e-mail etc.",
  "20224": "Características dos diferentes discursos (jornalístico, político, acadêmico, publicitário, literário, científico etc.)",
  "20229": "Variação linguística: estilística, sociocultural, geográfica, histórica; variação entre modalidades da língua (fala e escrita)",
  "20301": "Princípios de Direito Administrativo",
  "20304": "Servidores públicos",
  "20307": "Licitação",
  "20311": "Atos administrativos: elementos e atributos; classificações e espécies",
  "20312": "Anulação, revogação e convalidação dos atos administrativos; competência",
  "20313": "Contratos administrativos: formalização e espécies",
  "20316": "Agentes públicos: agentes políticos",
  "20401": "Direitos e deveres fundamentais; direitos e deveres individuais e coletivos",
  "20405": "Princípios constitucionais: individuais e da administração pública",
  "20406": "Normas constitucionais relativas à Administração Pública e aos servidores públicos da Administração Pública",
  "20413": "Constituição do Estado de Goiás",
  "20501": "Regimento Interno do Tribunal de Justiça do Estado de Goiás",
  "20502": "Lei Estadual nº 9.129 de 22 de dezembro de 1981 (com atualizações da Lei nº 20.816/2020)",
  "20503": "Resolução 325 de 29 de junho de 2020 do Conselho Nacional de Justiça (CNJ)"
};
const corrections: Record<number,readonly number[]> = {
 202:[20201,20217,20218,20202,20203,20219,20220,20204,20221,20222,20223,20206,20215,20224,20209,20225,20208,20210,20211,20226,20205,20212,20227,20213,20228,20214,20229,20216],
 203:[20301,20310,20302,20303,20311,20312,20313,20307,20308,20309,20314,20305,20315,20316,20304,20306,20317],
 205:[20501,20502,20503,20413,20504],
};
export const goOrder = (matter:number): readonly number[] => corrections[matter]??officialTopicOrder(matter,"bb");
export type AuditTopic = Assunto & { reference?:boolean; supplemental?:boolean; custom?:boolean; originalTitle?:string; missingRegistration?:boolean };
const official = new Map(tribunalCatalog.assuntos.map(a=>[a.id,a]));
const complementary: Record<number,readonly number[]> = {202:[20235],203:[20325,20326]};
export function auditGoTopics(matter:number, catalog:Catalog, bank:BankExam):AuditTopic[] {
 const available=catalog.assuntos.filter(a=>a.materia_numero===matter);
 if(bank==="caixa"||!goMatterOrder.some(n=>n===matter))return available.filter(a=>bank==="bnb"||(bank==="caixa"?a.escopo!=="Só BB":a.escopo!=="Só Caixa"));
 const ids=goOrder(matter);
 const rows:AuditTopic[]=ids.map(id=>{
  const base=official.get(id)!;
  const live=catalog.assuntos.find(a=>a.id===id);
  return {...base,materia_numero:matter,topico_central:titles[id]??base.topico_central,
    ...(matter===205&&id===20413?{reference:true}:{}),
    ...(!live?{missingRegistration:true}:{}),
    ...(live&&live.topico_central!==base.topico_central?{originalTitle:live.topico_central}:{})};
 });
 for(const id of complementary[matter]??[]){
  const base=official.get(id)!;
  rows.push({...base,supplemental:true});
 }
 const seen=new Set(rows.map(a=>a.id));
 for(const a of available)if(!seen.has(a.id)&&(bank==="bnb"||a.escopo!=="Só Caixa")){
  rows.push({...a,custom:!official.has(a.id),supplemental:true});
 }
 return rows;
}
export function auditGoMatters(catalog:Catalog,bank:BankExam):Catalog["materias"]{
 if(bank==="caixa")return catalog.materias;
 const officialMatters=goMatterOrder.map(id=>catalog.materias.find(m=>m.numero===id)??tribunalCatalog.materias.find(m=>m.numero===id)!);
 return [...officialMatters,...catalog.materias.filter(m=>!goMatterOrder.some(id=>id===m.numero))];
}
// Cada tema e cada subtópico da fonte tem uma âncora única por ID estável.
// Tema pode aparecer como referência contextual quando seus filhos estão em outro assunto.
type Link = { owner:number; children:Record<string,number> };
export const verbenaLinks: Record<string,Record<string,Link>> = {
  "Noções de Administração Pública": {
    "Paradigmas e Modelos da Gestão Pública": {
      "owner": 20107,
      "children": {
        "Modelo Burocrático Weberiano": 20101,
        "Modelo Gerencial e Reforma do Estado (PDRAE 1995)": 20102
      }
    },
    "Terceiro Setor e Formas de Parceria": {
      "owner": 20123,
      "children": {
        "Organizações Sociais (OS — Lei nº 9.637/1998)": 20123,
        "OSCIPs (Lei nº 9.790/1999)": 20123
      }
    },
    "Transparência, Governança e Accountability": {
      "owner": 20114,
      "children": {
        "Lei de Acesso à Informação (LAI — Lei nº 12.527/2011)": 20121,
        "Governabilidade vs. Governança": 20115
      }
    },
    "Orçamento Público e Gestão por Processos": {
      "owner": 20103,
      "children": {
        "Instrumentos Orçamentários (CF/88, Art. 165)": 20113,
        "Gestão por Processos e Indicadores": 20122
      }
    },
    "Políticas Públicas": {
      "owner": 20111,
      "children": {
        "Ciclo de Políticas Públicas": 20111
      }
    }
  },
  "Legislação Complementar (TJGO e Estado de Goiás)": {
    "Regimento Interno do TJGO": {
      "owner": 20501,
      "children": {
        "Competências dos Órgãos Julgadores": 20501,
        "Dinâmica de Distribuição": 20501,
        "Vedações Processuais": 20501
      }
    },
    "Constituição do Estado de Goiás": {
      "owner": 20413,
      "children": {
        "Estrutura do Judiciário Estadual": 20413,
        "Prazos da LDO": 20413,
        "Limites Fiscais Municipais": 20413
      }
    },
    "Código de Organização Judiciária de Goiás — COJ/GO": {
      "owner": 20504,
      "children": {
        "Criação de Comarcas": 20504
      }
    },
    "Resolução CNJ nº 325/2020": {
      "owner": 20503,
      "children": {
        "Gestão Estratégica do Judiciário": 20503
      }
    }
  },
  "Língua Portuguesa": {
    "Compreensão, Interpretação e Recursos Argumentativos": {
      "owner": 20201,
      "children": {
        "Análise Textual e Tese": 20201,
        "Recursos Discursivos": 20218
      }
    },
    "Sintaxe do Período Composto e Orações": {
      "owner": 20209,
      "children": {
        "Classificação de Orações": 20209,
        "Morfossintaxe Aplicada": 20205
      }
    },
    "Tipologia e Sequências Textuais": {
      "owner": 20204,
      "children": {
        "Sequências Linguísticas": 20204
      }
    },
    "Pontuação, Crase e Formação de Palavras": {
      "owner": 20215,
      "children": {
        "Pontuação Estilística": 20215,
        "Crase e Morfologia": 20235
      }
    }
  },
  "Noções de Direito Administrativo": {
    "Princípios e Atos Administrativos": {
      "owner": 20301,
      "children": {
        "Atributos e Elementos do Ato": 20311,
        "Convalidação": 20312,
        "Princípios e Promoção Pessoal": 20301
      }
    },
    "Licitações e Contratos — Lei nº 14.133/2021": {
      "owner": 20309,
      "children": {
        "Agentes de Contratação": 20309,
        "Modalidades e Benefícios": 20309
      }
    },
    "Improbidade Administrativa — Lei nº 8.429/1992": {
      "owner": 20325,
      "children": {
        "Atos que Causam Dano ao Erário": 20325,
        "Aplicação de Penas": 20325
      }
    },
    "Agentes Públicos e Responsabilidade Civil": {
      "owner": 20304,
      "children": {
        "Direitos e Estabilidade": 20304,
        "Responsabilidade Objetiva do Estado (Art. 37, § 6º da CF)": 20326
      }
    }
  },
  "Noções de Direito Constitucional": {
    "Direitos e Garantias Fundamentais — Art. 5º da CF": {
      "owner": 20401,
      "children": {
        "Princípios Fundamentais": 20401,
        "Remédios Constitucionais": 20401
      }
    },
    "Servidores Públicos e Organização do Estado": {
      "owner": 20406,
      "children": {
        "Remuneração por Subsídio (Art. 39, § 4º)": 20406
      }
    },
    "Poder Judiciário e Precedentes": {
      "owner": 20407,
      "children": {
        "Regras de Funcionamento": 20407,
        "Súmulas Vinculantes": 20407
      }
    },
    "Processo Legislativo Estadual": {
      "owner": 20413,
      "children": {
        "Emenda à Constituição Estadual": 20413
      }
    }
  },
  "História e Geografia de Goiás": {
    "História de Goiás": {
      "owner": 20601,
      "children": {
        "Século XIX e Estrutura Judiciária": 20609,
        "Século XX e Urbanismo": 20609,
        "Política e Sociedade": 20607
      }
    },
    "Geografia e Economia Goiana": {
      "owner": 20602,
      "children": {
        "Setor Sucroenergético": 20606,
        "Socioeconomia e Comunidades": 20601
      }
    }
  }
};
export type AuditDetail = IncidenceDetail & { contextOnly?:boolean };
export function auditedVerbenaDetails(matter:number,id:number):AuditDetail[]{
 const map=incidenceMaps.tjgo?.verbena;
 if(!map)return [];
 const result:AuditDetail[]=[];
 for(const subject of map.subjects){
  for(const theme of subject.themes){
   const link=verbenaLinks[subject.name]?.[theme.title];
   if(!link||theme.percent<=0)continue;
   // A referência da Constituição em Legislação recebe os dados daquela matéria;
   // Constitucional recebe somente o tema de Processo Legislativo Estadual.
   if(id===20413&&((subject.name.startsWith("Legislação")&&matter!==205)||(!subject.name.startsWith("Legislação")&&matter===205)))continue;
   if(id!==20413&&Math.floor(id/100)!==matter)continue;
   const children=theme.subtopics.filter(s=>link.children[s.title]===id&&s.percent!==0&&s.questions!==0);
   if(link.owner!==id&&!children.length)continue;
   const key="tjgo:verbena:"+subject.name+":"+theme.title;
   result.push({key,bank:"verbena",tribunal:"tjgo",theme:theme.title,percent:theme.percent,approximate:map.approximate,
    highTheme:theme.percent===Math.max(...subject.themes.map(t=>t.percent)),contextOnly:link.owner!==id,
    subtopics:children.map(s=>({key:key+":"+s.title,title:s.title,description:s.description,percent:s.percent,questions:s.questions,weight:s.percent??(s.questions!=null&&subject.total>0?100*s.questions/subject.total:null),high:false}))});
  }
 }
 const weighted=result.flatMap(d=>d.subtopics).filter(s=>s.weight!=null);
 const max=weighted.length?Math.max(...weighted.map(s=>s.weight!)):Math.max(0,...result.filter(d=>d.subtopics.length).map(d=>d.percent));
 for(const d of result)for(const s of d.subtopics)s.high=max>0&&(weighted.length?s.weight===max:d.percent===max);
 return result;
}
export function auditedTopicDetails(matter:number,id:number,subject:string,title:string,bank:BankExam):AuditDetail[]{
 if(bank==="caixa")return topicIncidenceDetails(subject,title);
 // Mantém suporte às outras fontes cadastradas, sem duplicar o levantamento auditado.
 const other={...incidenceMaps,tjgo:{...incidenceMaps.tjgo,verbena:undefined}};
 return [...auditedVerbenaDetails(matter,id),...topicIncidenceDetails(subject,title,other)];
}
export function originFromDetails(details:readonly IncidenceDetail[]):IncidenceOrigin|null{
 const v=details.some(d=>d.bank==="verbena"),f=details.some(d=>d.bank==="fgv");
 return v&&f?"both":v?"verbena":f?"fgv":null;
}
