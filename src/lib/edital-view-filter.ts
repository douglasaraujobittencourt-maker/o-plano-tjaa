// Filtro exclusivo do Edital Verticalizado. Nenhum registro do catálogo ou progresso é alterado.
import type {Catalog} from "./edital-caixa-bb-data";
import type {BankExam} from "./bank-exams";
import {officialTopicOrder,tribunalCatalog} from "./tribunal-catalog";
import {auditGoTopics,goMatterOrder,goOrder,verbenaLinks,type AuditTopic,type AuditDetail} from "./tjgo-edital-audit";
import {incidenceMaps,type Theme,type Subtopic} from "./incidence-data";
import {incidenceMatchKey,reviewedIncidenceTitles} from "./edital-incidence";

// TJDFT 2022, Anexo I, pp. 52–54; gestão pública está dividida em dois blocos no planner.
const dfMatterOrder=[202,208,210,207,201,204,203,213,209,211,212] as const;
const officialTopics=new Map(tribunalCatalog.assuntos.map(a=>[a.id,a]));
const officialMatters=new Map(tribunalCatalog.materias.map(m=>[m.numero,m]));
const unique=<T,>(items:readonly T[])=>[...new Set(items)];
export function filteredEditalGroups(catalog:Catalog,bank:BankExam){
 const ids=bank==="bb"?[...goMatterOrder,214]:bank==="caixa"?[...dfMatterOrder,214]:unique([...goMatterOrder,...dfMatterOrder,214]);
 const liveById=new Map(catalog.assuntos.map(a=>[a.id,a]));
 const groups=ids.map(numero=>{
  const base=officialMatters.get(numero)!;
  const m={...base,...catalog.materias.find(x=>x.numero===numero),escopo:base.escopo};
  const goIds=numero===214?officialTopicOrder(numero,"bb"):goMatterOrder.some(n=>n===numero)?goOrder(numero):[];
  const dfIds=officialTopicOrder(numero,"caixa");
  const goRows=goMatterOrder.some(n=>n===numero)?auditGoTopics(numero,catalog,"bb").filter(a=>goIds.includes(a.id)):[];
  const ordered=bank==="bb"?goIds:bank==="caixa"?dfIds:unique([...goIds,...dfIds]);
  const all:AuditTopic[]=ordered.flatMap(id=>{
   const baseTopic=officialTopics.get(id);
   if(!baseTopic)return [];
   // Constituição de Goiás: referência nas duas disciplinas no TJGO; na visão conjunta
   // há uma única linha, em Constitucional, e uma nota em Legislação Complementar.
   if(bank==="bnb"&&numero===205&&id===20413)return [];
   const go=bank!=="caixa"?goRows.find(a=>a.id===id):undefined;
   if(go)return [go];
   const live=liveById.get(id);
   return [{...baseTopic,...live,escopo:baseTopic.escopo,materia_numero:numero,
    ...(!live?{missingRegistration:true}:{})}];
  });
  return {m,all,progressRows:all.filter(a=>!a.reference)};
 });
 return groups.filter(g=>g.all.length>0);
}
// A fonte é o próprio mapa (percentuais, títulos e descrições), nunca uma cópia de etiquetas.
const incidenceMatterKey=(name:string)=>incidenceMatchKey(name).replace(/^nocoes de /,"").replace(/^legislacao complementar tjgo e estado de goias$/,"legislacao complementar");
type SourceDetail=AuditDetail & {sourceMatter:number};
function validTarget(matter:number,id:number):boolean {
 return officialTopics.get(id)?.materia_numero===matter||(matter===205&&id===20413);
}
function resolveIds(matter:number,subject:string,item:Theme|Subtopic,legacy:readonly number[]|undefined):number[]{
 // ID explícito é soberano: nunca recorrer a uma palavra-chave se foi fornecido.
 if(item.editalTopicIds!==undefined)return unique(item.editalTopicIds).filter(id=>validTarget(matter,id));
 if(legacy?.length)return unique(legacy).filter(id=>validTarget(matter,id));
 const titles=new Set(reviewedIncidenceTitles(subject,item.title));
 return [...officialTopics.values()].filter(a=>validTarget(matter,a.id)&&titles.has(incidenceMatchKey(a.topico_central))).map(a=>a.id);
}
function resolveIncidence(matter:number,topic:AuditTopic,bank:BankExam,maps:typeof incidenceMaps):SourceDetail[]{
 const name=officialMatters.get(matter)?.titulo_central;
 if(!name||!validTarget(matter,topic.id))return [];
 const result:SourceDetail[]=[];
 for(const tribunal of ["tjgo","tjdft"] as const){
  if(bank==="bb"&&tribunal!=="tjgo"||bank==="caixa"&&tribunal!=="tjdft")continue;
  for(const banca of ["verbena","fgv"] as const){
   const map=maps[tribunal]?.[banca];if(!map)continue;
   for(const subject of map.subjects){
    if(incidenceMatterKey(subject.name)!==incidenceMatterKey(name))continue;
    const oldSubject=Object.entries(verbenaLinks).find(([title])=>incidenceMatterKey(title)===incidenceMatterKey(subject.name))?.[1];
    const maxTheme=Math.max(0,...subject.themes.map(t=>t.percent));
    for(const theme of subject.themes){
     if(theme.percent<=0)continue;
     const oldTheme=Object.entries(oldSubject??{}).find(([title])=>incidenceMatchKey(title)===incidenceMatchKey(theme.title))?.[1];
     const themeIds=resolveIds(matter,subject.name,theme,oldTheme?[oldTheme.owner]:undefined);
     const owner=themeIds.includes(topic.id);
     const children=theme.subtopics.filter(s=>s.percent!==0&&s.questions!==0).filter(s=>{
      const oldChild=Object.entries(oldTheme?.children??{}).find(([title])=>incidenceMatchKey(title)===incidenceMatchKey(s.title))?.[1];
      const ids=resolveIds(matter,subject.name,s,oldChild===undefined?undefined:[oldChild]);
      // Um subtópico novo sem relação própria pode herdar uma âncora única do seu tema.
      return (ids.length||s.editalTopicIds!==undefined?ids:themeIds.length===1?themeIds:[]).includes(topic.id);
     });
     if(!owner&&!children.length)continue;
     const key=tribunal+":"+banca+":"+incidenceMatterKey(subject.name)+":"+incidenceMatchKey(theme.title);
     result.push({key,bank:banca,tribunal,sourceMatter:matter,theme:theme.title,percent:theme.percent,approximate:map.approximate,highTheme:theme.percent===maxTheme,contextOnly:themeIds[0]!==topic.id,
      subtopics:children.map(s=>({key:key+":"+incidenceMatchKey(s.title),title:s.title,description:s.description,questions:s.questions,percent:s.percent,weight:s.percent??(s.questions!=null&&subject.total>0?100*s.questions/subject.total:null),high:theme.percent===maxTheme}))});
    }
   }
  }
 }
 return [...new Map(result.map(d=>[d.key,d])).values()];
}
export function filteredEditalDetails(matter:number,topic:AuditTopic,_subject:string,bank:BankExam,maps:typeof incidenceMaps=incidenceMaps):SourceDetail[]{
 const details=resolveIncidence(matter,topic,bank,maps);
 // Na visão conjunta existe uma única linha da Constituição estadual: mostrar a
 // fonte original da referência, sem criar outro item nem duplicar progresso.
 if(bank==="bnb"&&matter===204&&topic.id===20413)return [...details,...resolveIncidence(205,topic,bank,maps)];
 return details;
}
export function strictMarkedDetails(matter:number,topic:AuditTopic,details:readonly AuditDetail[],maps:typeof incidenceMaps=incidenceMaps):SourceDetail[]{
 // Valida contra a fonte atual, inclusive quando a descrição/título mudou.
 // Uma referência da outra matéria não propaga grifo para a linha oficial.
 const allowed=resolveIncidence(matter,topic,"bnb",maps);
 const keys=new Set(details.map(d=>d.tribunal+":"+d.bank+":"+incidenceMatchKey(d.theme)));
 return allowed.filter(d=>keys.has(d.tribunal+":"+d.bank+":"+incidenceMatchKey(d.theme)));
}

// Seleção de alta incidência solicitada apenas para Administração Pública (TJGO).
// Usa os vínculos explícitos da fonte compartilhada; a primeira âncora exibe
// o detalhe e as demais recebem o selo, sem duplicar o conteúdo ou o progresso.
export function adminVerbenaMarks(matter:number,topicId:number,bank:BankExam){
 if(matter!==201||bank==="caixa"||!validTarget(matter,topicId)||!goOrder(201).includes(topicId))return [];
 const subject=incidenceMaps.tjgo?.verbena?.subjects.find(s=>incidenceMatterKey(s.name)==="administracao publica");
 return (subject?.themes??[]).filter(t=>t.percent>0).flatMap(theme=>{
  const eligible=theme.subtopics.filter(s=>s.percent!==0&&s.questions!==0);
  const linked=(theme.editalTopicIds??[]).includes(topicId)||eligible.some(s=>s.editalTopicIds?.includes(topicId));
  if(!linked)return [];
  return [{theme:theme.title,percent:theme.percent,showTheme:theme.editalTopicIds?.[0]===topicId,
   subtopics:eligible.filter(s=>s.editalTopicIds?.[0]===topicId)}];
 });
}
