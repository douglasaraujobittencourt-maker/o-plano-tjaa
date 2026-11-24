import {tribunalStudyPlan} from "./tribunal-study-plan";
import {tribunalGroups} from "./tribunal-catalog";
export const CYCLE_LAYOUT_KEY="planner_cycle_layout_v1";
export type CycleBlock={subjectId:string;minutes:number};
export type CycleSessions=CycleBlock[][];
export type CycleSlot={id:string;subject_id:string;ord:number;hours_per_cycle:number;done_hours:number};
export type StoredLayout={version:1;sessions:{slotId:string;minutes:number}[][]};
export const minutesForSlot=(s:CycleSlot)=>Math.max(0,Math.round(Number(s.hours_per_cycle)*60));
export function cycleTotals(sessions:CycleSessions){
 const totals=new Map<string,number>();
 for(const b of sessions.flat())totals.set(b.subjectId,(totals.get(b.subjectId)??0)+b.minutes);
 return totals;
}
export function validateCycle(sessions:CycleSessions,allowed:Set<string>){
 if(sessions.length>52)throw Error("O ciclo aceita até 52 sessões.");
 for(const session of sessions){
  if(!session.length||session.length>24)throw Error("Cada sessão deve ter de 1 a 24 blocos.");
  for(const b of session){
   if(!allowed.has(b.subjectId))throw Error("Selecione uma matéria cadastrada em cada bloco.");
   if(!Number.isInteger(b.minutes)||b.minutes<1||b.minutes>1440)throw Error("Informe minutos inteiros entre 1 e 1.440.");
  }
  if(session.reduce((n,b)=>n+b.minutes,0)>1440)throw Error("Uma sessão não pode ultrapassar 24 horas.");
 }
}
export function serializeCycle(sessions:CycleSessions,slots:Map<string,CycleSlot>):StoredLayout{
 return {version:1,sessions:sessions.map(s=>s.map(b=>{const slot=slots.get(b.subjectId);if(!slot)throw Error("Matéria sem posição no ciclo.");return {slotId:slot.id,minutes:b.minutes};}))};
}
function validLayout(value:unknown):value is StoredLayout{
 const x=value as StoredLayout;
 return x?.version===1&&Array.isArray(x.sessions)&&x.sessions.every(s=>Array.isArray(s)&&s.every(b=>typeof b?.slotId==="string"&&Number.isInteger(b.minutes)&&b.minutes>0));
}
export function resolveCycle(slots:CycleSlot[],saved:unknown):CycleSessions{
 const byOrd=new Map(slots.map(s=>[s.ord,s]));
 const layout=validLayout(saved)?saved:{version:1,sessions:tribunalStudyPlan.sessions.map(s=>s.flatMap(b=>{
  const g=tribunalGroups.find(g=>g.name===b.subject);
  const slot=byOrd.get(g?.id===214?4:(g?.id??201)-201);
  return slot?[{slotId:slot.id,minutes:b.minutes}]:[];
 }))};
 const result=layout.sessions.map(s=>s.map(b=>({...b})));
 for(const slot of slots){
  const target=minutesForSlot(slot),blocks=result.flat().filter(b=>b.slotId===slot.id);
  if(!blocks.length){if(target>0)result.push([{slotId:slot.id,minutes:target}]);continue;}
  const base=blocks.reduce((n,b)=>n+b.minutes,0);
  const shares=blocks.map((b,i)=>({i,exact:b.minutes*target/base}));
  const allocated=shares.map(s=>Math.floor(s.exact));
  let remainder=target-allocated.reduce((n,x)=>n+x,0);
  for(const share of [...shares].sort((a,b)=>(b.exact-Math.floor(b.exact))-(a.exact-Math.floor(a.exact))||a.i-b.i)){if(remainder<=0)break;allocated[share.i]++;remainder--;}
  blocks.forEach((b,i)=>b.minutes=allocated[i]);
 }
 const byId=new Map(slots.map(s=>[s.id,s]));
 return result.map(s=>s.flatMap(b=>{const slot=byId.get(b.slotId);return slot&&b.minutes>0?[{subjectId:slot.subject_id,minutes:b.minutes}]:[];})).filter(s=>s.length);
}
export function formatCycleHours(minutes:number){return (minutes/60).toLocaleString("pt-BR",{maximumFractionDigits:2})+"h";}
