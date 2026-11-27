// Filtro exclusivo do Edital Verticalizado. Nenhum registro do catálogo ou progresso é alterado.
import type {Catalog} from "./edital-caixa-bb-data";
import type {BankExam} from "./bank-exams";
import {officialTopicOrder,tribunalCatalog} from "./tribunal-catalog";
import {auditGoTopics,goMatterOrder,goOrder,auditedTopicDetails,type AuditTopic,type AuditDetail} from "./tjgo-edital-audit";

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
