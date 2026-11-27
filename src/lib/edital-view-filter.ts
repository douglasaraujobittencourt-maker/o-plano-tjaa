// Filtro exclusivo do Edital Verticalizado. Nenhum registro do catálogo ou progresso é alterado.
import type {Catalog} from "./edital-caixa-bb-data";
import type {BankExam} from "./bank-exams";
import {officialTopicOrder,tribunalCatalog} from "./tribunal-catalog";
import {auditGoTopics,goMatterOrder,goOrder,auditedTopicDetails,verbenaLinks,type AuditTopic,type AuditDetail} from "./tjgo-edital-audit";
import {incidenceMaps} from "./incidence-data";
import {normalizeIncidenceTitle} from "./edital-incidence";

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
export function filteredEditalDetails(matter:number,topic:AuditTopic,subject:string,bank:BankExam):AuditDetail[]{
 const details=auditedTopicDetails(matter,topic.id,subject,topic.topico_central,bank);
 if(bank==="bb")return details.filter(d=>d.tribunal==="tjgo");
 if(bank==="caixa")return details.filter(d=>d.tribunal==="tjdft");
 // A referência única na visão conjunta reúne os dois vínculos da Constituição estadual.
 if(matter===204&&topic.id===20413){
  const bridge=auditedTopicDetails(205,topic.id,"Legislação Complementar",topic.topico_central,bank);
  return [...new Map([...details,...bridge].map(d=>[d.key,d])).values()];
 }
 return details;
}

// Grifo estrito: só evidências diretas no mapa da própria matéria e banca.
// Referências cruzadas continuam disponíveis para consulta, mas não propagam grifos.
const incidenceMatterKey=(name:string)=>normalizeIncidenceTitle(name).replace(/^nocoes de /,"").replace(/^legislacao complementar tjgo e estado de goias$/,"legislacao complementar");
export function strictMarkedDetails(matter:number,topic:AuditTopic,details:readonly AuditDetail[],maps:typeof incidenceMaps=incidenceMaps):AuditDetail[]{
 const name=officialMatters.get(matter)?.titulo_central;
 if(!name)return [];
 const key=incidenceMatterKey(name);
 const officialTitle=officialTopics.get(topic.id)?.topico_central;
 if(!officialTitle)return [];
 const exactTitles=new Set([normalizeIncidenceTitle(officialTitle),normalizeIncidenceTitle(topic.topico_central)]);
 return details.flatMap(d=>{
  const source=maps[d.tribunal]?.[d.bank]?.subjects.find(s=>incidenceMatterKey(s.name)===key);
  const theme=source?.themes.find(t=>t.title===d.theme&&t.percent>0);
  if(!source||!theme)return [];
  const link=d.tribunal==="tjgo"&&d.bank==="verbena"?verbenaLinks[source.name]?.[theme.title]:undefined;
  const children=d.subtopics.filter(s=>{
   const entry=theme.subtopics.find(x=>x.title===s.title&&x.percent!==0&&x.questions!==0);
   if(!entry)return false;
   // Verbena/TJGO: associação explícita auditada de cada subtópico ao ID oficial.
   if(d.tribunal==="tjgo"&&d.bank==="verbena")return link?.children[entry.title]===topic.id;
   // Outras fontes: correspondência literal normalizada até haver vínculos explícitos.
   return exactTitles.has(normalizeIncidenceTitle(theme.title))||exactTitles.has(normalizeIncidenceTitle(entry.title));
  });
  // Administração Pública: os cinco temas expressamente solicitados também
  // recebem etiqueta na sua âncora oficial, mesmo quando os filhos ficam em outra linha.
  const explicitAdminTheme=matter===201&&d.tribunal==="tjgo"&&d.bank==="verbena"&&link?.owner===topic.id;
  return children.length||explicitAdminTheme?[{...d,subtopics:children}]:[];
 });
}
