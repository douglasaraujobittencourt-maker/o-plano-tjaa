import type {BankExam} from "./bank-exams";
import type {Assunto,Catalog} from "./edital-caixa-bb-data";
import {tribunalCatalog} from "./tribunal-catalog";
export const PROGRESS_TRIBUNAL_LEGEND={
 goBasic:{label:"TJ Goiás — Conhecimentos Básicos",color:"#28A745"},
 goSpecific:{label:"TJ Goiás — Conhecimentos Específicos",color:"#EACB00"},
 dfBasic:{label:"TJDFT — Conhecimentos Básicos",color:"#0284C7"},
 dfSpecific:{label:"TJDFT — Conhecimentos Específicos",color:"#1E3A8A"},
 writing:{label:"Redação (TJ Goiás e TJDFT)",color:"#D1D5DB"},
} as const;
export type ProgressCategory=keyof typeof PROGRESS_TRIBUNAL_LEGEND;
export type TopicScope="Só BB"|"Só Caixa"|"Comum (Caixa + BB)";
export type TribunalTopic={id:number;title:string;scope:TopicScope};
export type TribunalData={number:number;categories:ProgressCategory[];topics:TribunalTopic[];archived?:boolean};
export type TopicOverride={removed:true}|{title:string;scope:TopicScope;added?:true};
export type TopicOverrides=Record<string,TopicOverride>;
export type SubjectRef={name:string;tribunal_data?:TribunalData|null;legacy_tribunal_data?:TribunalData|null;topic_overrides?:TopicOverrides};
export const subjectDefinitionKey=(id:string)=>"planner_tribunal_subject_v1:"+id;
export function isValidCategories(value:unknown):value is ProgressCategory[]{
 return Array.isArray(value)&&value.length>0&&value.every(c=>typeof c==="string"&&Object.prototype.hasOwnProperty.call(PROGRESS_TRIBUNAL_LEGEND,c))&&new Set(value).size===value.length;
}
export function legacyDefinitionForSubject(metadata:Record<string,unknown>,id:string):TribunalData|null{
 const value=metadata[subjectDefinitionKey(id)] as TribunalData|undefined;
 if(!value||!Number.isInteger(value.number)||value.number<1000000||value.number>2147483647||!isValidCategories(value.categories)||!Array.isArray(value.topics)||value.topics.length!==0)return null;
 return value;
}
// Reserva a faixa alta dos inteiros PostgreSQL para IDs locais à conta.
// Não reutiliza IDs do catálogo, dos registros arquivados ou dos assuntos removidos.
export function allocateLegacyCatalogId(metadata:Record<string,unknown>,rows:readonly SubjectRef[]):number{
 const used=new Set<number>();
 for(const row of rows){for(const data of [row.tribunal_data,row.legacy_tribunal_data,officialDefinition(row.name)]){if(!data)continue;used.add(data.number);for(const topic of data.topics)used.add(topic.id);}}
 for(const [key,value] of Object.entries(metadata)){
  if(key.startsWith("planner_tribunal_subject_v1:")&&value&&typeof value==="object"){
   const id=(value as {number?:number}).number;if(typeof id==="number")used.add(id);
  }
  if(key.startsWith("planner_tribunal_topic_v1:"))used.add(Number(key.slice(key.lastIndexOf(":")+1)));
 }
 for(let attempt=0;attempt<100;attempt++){
  const id=1000000000+(crypto.getRandomValues(new Uint32Array(1))[0]%1000000000);
  if(!used.has(id))return id;
 }
 throw new Error("Não foi possível reservar um identificador único. Tente novamente.");
}
const TOPIC_PREFIX="planner_tribunal_topic_v1:";
export function topicOverrideKey(subjectId:string,topicId:number):string{return TOPIC_PREFIX+subjectId+":"+topicId;}
export function topicOverridesForSubject(metadata:Record<string,unknown>,subjectId:string):TopicOverrides{
 const prefix=TOPIC_PREFIX+subjectId+":";
 const entries=Object.entries(metadata).filter(([key])=>key.startsWith(prefix)&&/^\d+$/.test(key.slice(prefix.length)));
 const valid=entries.flatMap(([key,value]):Array<readonly [string,TopicOverride]>=>{
  if(!value||typeof value!=="object")return [];
  const v=value as {removed?:boolean;title?:string;scope?:TopicScope;added?:boolean};
  const id=key.slice(prefix.length);
  if(v.removed===true)return [[id,{removed:true}]];
  if(typeof v.title==="string"&&v.title.trim()&&["Só BB","Só Caixa","Comum (Caixa + BB)"].includes(v.scope??""))return [[id,{title:v.title,scope:v.scope!,...(v.added===true?{added:true as const}:{})}]];
  return [];
 });
 return Object.fromEntries(valid);
}
export function applyTopicOverrides(data:TribunalData,overrides:TopicOverrides={}):TribunalData{
 const topics=data.topics.flatMap(t=>{
  const patch=overrides[String(t.id)];
  if(!patch)return [t];
  if("removed" in patch)return [];
  return [{...t,title:patch.title,scope:patch.scope}];
 });
 const original=new Set(data.topics.map(t=>t.id));
 for(const [key,patch] of Object.entries(overrides)){
  const id=Number(key);
  if(!("removed" in patch)&&patch.added===true&&Number.isInteger(id)&&id>0&&id<=2147483647&&!original.has(id))topics.push({id,title:patch.title,scope:patch.scope});
 }
 return {...data,topics};
}
export function officialDefinition(name:string):TribunalData|null{
 const m=tribunalCatalog.materias.find(m=>m.titulo_central===name);if(!m)return null;
 const categories:ProgressCategory[]=[];
 if(m.numero===214)categories.push("writing");
 else{
  if(m.escopo!=="Só Caixa")categories.push([202,205,206].includes(m.numero)?"goBasic":"goSpecific");
  if(m.escopo!=="Só BB")categories.push([202,208,210].includes(m.numero)?"dfBasic":"dfSpecific");
 }
 return {number:m.numero,categories,topics:tribunalCatalog.assuntos.filter(a=>a.materia_numero===m.numero).map(a=>({id:a.id,title:a.topico_central,scope:a.escopo as TopicScope}))};
}
export function subjectDefinition(s:SubjectRef):TribunalData|null{const data=s.tribunal_data?.archived?s.tribunal_data:s.legacy_tribunal_data??s.tribunal_data??officialDefinition(s.name);return data?applyTopicOverrides(data,s.topic_overrides):null;}
export function scopeForCategories(categories:ProgressCategory[]):TopicScope{
 const go=categories.some(c=>c==="writing"||c.startsWith("go")),df=categories.some(c=>c==="writing"||c.startsWith("df"));
 return go&&df?"Comum (Caixa + BB)":go?"Só BB":"Só Caixa";
}
export function subjectCategories(s:SubjectRef,bank:BankExam):ProgressCategory[]{
 const d=subjectDefinition(s);if(!d)return [];
 return d.categories.filter(c=>c==="writing"||bank==="bnb"||(bank==="bb"?c.startsWith("go"):c.startsWith("df")));
}
export function subjectMatchesExam(s:SubjectRef,bank:BankExam):boolean{
 const d=subjectDefinition(s);return !!d&&!d.archived&&subjectCategories(s,bank).length>0;
}
export function selectPlannerSubjects<T extends SubjectRef>(subjects:readonly T[],bank:BankExam):T[]{return subjects.filter(s=>subjectMatchesExam(s,bank));}
export const isWritingSubject=(s:SubjectRef)=>subjectDefinition(s)?.categories.includes("writing")??false;
export function topicsForSubject(s:SubjectRef|undefined,bank:BankExam):Assunto[]{
 const d=s&&subjectDefinition(s);if(!d||d.archived||!s||!subjectMatchesExam(s,bank))return [];
 return d.topics.filter(t=>bank==="bnb"||(bank==="bb"?t.scope!=="Só Caixa":t.scope!=="Só BB")).map((t,i)=>({id:t.id,materia_numero:d.number,ciclo:"",escopo:t.scope,bloco_ordem:"",topico_central:t.title,nomenclatura_bb:t.scope==="Só Caixa"?"—":t.title,nomenclatura_caixa:t.scope==="Só BB"?"—":t.title,ordem_exibicao:i}));
}
export function catalogFromSubjects(subjects:readonly SubjectRef[]):Catalog{
 const active=selectPlannerSubjects(subjects,"bnb");
 return {materias:active.map(s=>{const d=subjectDefinition(s)!;const scope=scopeForCategories(d.categories);return {numero:d.number,titulo_central:s.name,nomenclatura_bb:scope==="Só Caixa"?"—":s.name,nomenclatura_caixa:scope==="Só BB"?"—":s.name,ciclo:(s as SubjectRef&{study_status?:string}).study_status==="active"?"Ciclo 1":"Ciclo 2",secao_ordem:"",escopo:scope};}),assuntos:active.flatMap(s=>topicsForSubject(s,"bnb"))};
}
export const categoryChoices:readonly {value:string;label:string;categories:ProgressCategory[]}[]=[
 ...Object.entries(PROGRESS_TRIBUNAL_LEGEND).map(([value,item])=>({value,label:item.label,categories:[value as ProgressCategory]})),
 {value:"both-basic",label:"TJGO + TJDFT — Básicos",categories:["goBasic","dfBasic"]},
 {value:"both-specific",label:"TJGO + TJDFT — Específicos",categories:["goSpecific","dfSpecific"]},
 {value:"go-basic-df-specific",label:"TJGO Básicos + TJDFT Específicos",categories:["goBasic","dfSpecific"]},
 {value:"go-specific-df-basic",label:"TJGO Específicos + TJDFT Básicos",categories:["goSpecific","dfBasic"]},
];
export function scopeOptions(s:SubjectRef):TopicScope[]{
 const d=subjectDefinition(s);if(!d)return [];
 const scope=scopeForCategories(d.categories);return scope==="Comum (Caixa + BB)"?[scope,"Só BB","Só Caixa"]:[scope];
}
