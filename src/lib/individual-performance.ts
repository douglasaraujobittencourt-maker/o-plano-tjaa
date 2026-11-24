import {subjectMatchesExam,subjectCategories,type SubjectRef} from "./tribunal-subject-source";

export type PerformanceFilter="all"|"go"|"df"|"basic"|"specific"|"writing";
export type PerformanceSort="name"|"hours"|"accuracy";
export type PerformanceRow=SubjectRef & {id:string;hours:number;minutes:number;qDone:number;accuracy:number};
export const performanceFilters:readonly {value:PerformanceFilter;label:string}[]=[
 {value:"all",label:"Todos"},
 {value:"go",label:"TJ Goiás"},
 {value:"df",label:"TJDFT"},
 {value:"basic",label:"Básicos"},
 {value:"specific",label:"Específicos"},
 {value:"writing",label:"Redação"},
];

export function performanceMatches(row:SubjectRef,filter:PerformanceFilter):boolean{
 if(filter==="all")return true;
 if(filter==="go")return subjectMatchesExam(row,"bb");
 if(filter==="df")return subjectMatchesExam(row,"caixa");
 const categories=subjectCategories(row,"bnb");
 if(filter==="basic")return categories.some(c=>c==="goBasic"||c==="dfBasic");
 if(filter==="specific")return categories.some(c=>c==="goSpecific"||c==="dfSpecific");
 return categories.includes("writing");
}
export function performanceTribunalLabel(row:SubjectRef):string{
 const go=subjectMatchesExam(row,"bb"),df=subjectMatchesExam(row,"caixa");
 return go&&df?"TJ Goiás + TJDFT":go?"TJ Goiás":df?"TJDFT":"";
}
// Aplica somente filtros/ordenação de apresentação, sem modificar a coleção original.
export function visiblePerformanceRows<T extends PerformanceRow>(rows:readonly T[],filter:PerformanceFilter,sort:PerformanceSort):T[]{
 const byName=(a:T,b:T)=>a.name.localeCompare(b.name,"pt-BR",{sensitivity:"base"})||a.id.localeCompare(b.id);
 return rows.filter(row=>performanceMatches(row,filter)).sort((a,b)=>{
  if(sort==="hours")return b.minutes-a.minutes||byName(a,b);
  if(sort==="accuracy"){
   // Sem questões não significa 0%: sempre após matérias com questões.
   if((a.qDone>0)!==(b.qDone>0))return a.qDone>0?-1:1;
   if(a.qDone>0&&b.qDone>0)return b.accuracy-a.accuracy||byName(a,b);
  }
  return byName(a,b);
 });
}
