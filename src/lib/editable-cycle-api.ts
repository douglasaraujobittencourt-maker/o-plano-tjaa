import {supabase} from "@/integrations/supabase/external-client";
import {getSubjects,announcePlannerProgress} from "@/lib/planner-api";
import {CYCLE_LAYOUT_KEY,cycleTotals,resolveCycle,serializeCycle,validateCycle,minutesForSlot,type CycleSessions,type CycleSlot} from "./editable-cycle";
export type CycleSnapshot={sessions:CycleSessions;revision:string};
type OwnedSlot=CycleSlot&{user_id:string;created_at:string};
async function readState(){
 const {data:auth,error:authError}=await supabase.auth.getUser();
 if(authError||!auth.user)throw Error("Sua sessão expirou. Entre novamente.");
 const uid=auth.user.id;
 const [{data,error},subjects]=await Promise.all([supabase.from("cycle_slots").select("*").eq("user_id",uid).order("ord"),getSubjects()]);
 if(error)throw error;
 const allSlots=(data??[]) as OwnedSlot[];
 const allowed=new Set(subjects.map(s=>s.id));
 const slots=allSlots.filter(s=>allowed.has(s.subject_id));
 const layout=auth.user.user_metadata?.[CYCLE_LAYOUT_KEY]??null;
 const revision=JSON.stringify([layout,slots.map(s=>[s.id,s.subject_id,s.ord,minutesForSlot(s)]),subjects.map(s=>[s.id,s.study_status,s.planned_hours_per_week])]);
 return {uid,subjects,slots,allSlots,layout,revision};
}
export async function getEditableCycle():Promise<CycleSnapshot>{
 const s=await readState();return {sessions:resolveCycle(s.slots,s.layout),revision:s.revision};
}
function requireRow(r:{data:unknown[]|null;error:unknown},label:string){
 if(r.error)throw r.error;if(r.data?.length!==1)throw Error(label+": alteração recusada ou registro alterado em outra aba (RLS).");
}
export function cycleSaveError(error:unknown){
 const e=error as {message?:string;code?:string};
 if(e?.code==="42501")return "O Supabase recusou a gravação por permissão/RLS.";
 if(e?.code==="23503")return "A matéria não está mais disponível. Atualize o ciclo.";
 return e?.message??"Não foi possível salvar o ciclo.";
}
// A tabela existente mantém uma posição por matéria; os metadados da conta
// guardam a ordem e a divisão dos blocos por sessão. Sem nova migração.
export async function saveEditableCycle(sessions:CycleSessions,expectedRevision:string):Promise<CycleSnapshot>{
 const state=await readState(),{uid,subjects,slots}=state;
 if(state.revision!==expectedRevision)throw Error("O ciclo mudou. Feche a edição e abra novamente.");
 validateCycle(sessions,new Set(subjects.map(s=>s.id)));
 if(new Set(slots.map(s=>s.subject_id)).size!==slots.length)throw Error("Há posições duplicadas no ciclo. Atualize o cadastro antes de editar.");
 const totals=cycleTotals(sessions),bySubject=new Map(slots.map(s=>[s.subject_id,s]));
 const undo:(()=>Promise<void>)[]=[];
 let nextOrd=Math.max(-1,...state.allSlots.map(s=>s.ord))+1;
 const planned=new Map<string,CycleSlot>();
 try{
  for(const [id,minutes] of totals){
   const current=bySubject.get(id),hours=minutes/60;
   if(current){
    if(minutesForSlot(current)!==minutes){
     requireRow(await supabase.from("cycle_slots").update({hours_per_cycle:hours}).eq("user_id",uid).eq("id",current.id).eq("hours_per_cycle",current.hours_per_cycle).eq("subject_id",id).select("id"),"Carga do ciclo");
     undo.push(async()=>{requireRow(await supabase.from("cycle_slots").update({hours_per_cycle:current.hours_per_cycle}).eq("user_id",uid).eq("id",current.id).eq("subject_id",id).select("id"),"Restaurar carga");});
    }
    planned.set(id,{...current,hours_per_cycle:hours});
   }else{
    const row={id:crypto.randomUUID(),user_id:uid,subject_id:id,ord:nextOrd++,hours_per_cycle:hours,done_hours:0};
    requireRow(await supabase.from("cycle_slots").insert(row).select("id"),"Nova posição");
    undo.push(async()=>{requireRow(await supabase.from("cycle_slots").delete().eq("user_id",uid).eq("id",row.id).select("id"),"Restaurar posição");});
    planned.set(id,row);
   }
  }
  for(const subject of subjects){
   const minutes=totals.get(subject.id)??0,existing=bySubject.get(subject.id);
   if(!minutes&&!existing)continue;
   const prevHours=subject.planned_hours_per_week??0,prevStatus=subject.study_status??"pending";
   const hours=minutes/60,status=prevStatus==="finalized"?"finalized":minutes>0?"active":"pending";
   if(Math.round(prevHours*60)===minutes&&prevStatus===status)continue;
   requireRow(await supabase.from("subjects").update({planned_hours_per_week:hours,study_status:status}).eq("user_id",uid).eq("id",subject.id).eq("planned_hours_per_week",prevHours).eq("study_status",prevStatus).select("id"),"Matéria "+subject.name);
   undo.push(async()=>{requireRow(await supabase.from("subjects").update({planned_hours_per_week:prevHours,study_status:prevStatus}).eq("user_id",uid).eq("id",subject.id).select("id"),"Restaurar matéria");});
  }
  for(const slot of slots.filter(s=>!totals.has(s.subject_id))){
   requireRow(await supabase.from("cycle_slots").delete().eq("user_id",uid).eq("id",slot.id).eq("subject_id",slot.subject_id).eq("hours_per_cycle",slot.hours_per_cycle).select("id"),"Remover posição");
   undo.push(async()=>{requireRow(await supabase.from("cycle_slots").insert(slot).select("id"),"Restaurar posição removida");});
  }
  const layout=serializeCycle(sessions,planned);
  const {data,error}=await supabase.auth.updateUser({data:{[CYCLE_LAYOUT_KEY]:layout}});
  if(error)throw error;
  undo.push(async()=>{const {error}=await supabase.auth.updateUser({data:{[CYCLE_LAYOUT_KEY]:state.layout}});if(error)throw error;});
  const confirmed=data.user?.user_metadata?.[CYCLE_LAYOUT_KEY];
  // JSONB pode reordenar as chaves; compare conteúdo normalizado, não ordem de propriedades.
  if(confirmed?.version!==1||!Array.isArray(confirmed.sessions)||JSON.stringify(confirmed.sessions.map((session:any[])=>session.map(b=>[b.slotId,b.minutes])))!==JSON.stringify(layout.sessions.map(session=>session.map(b=>[b.slotId,b.minutes]))))throw Error("O servidor não confirmou a programação.");
  const verified=await getEditableCycle();
  if(JSON.stringify(verified.sessions)!==JSON.stringify(sessions))throw Error("O banco não confirmou todos os minutos planejados.");
  await announcePlannerProgress();return verified;
 }catch(error){
  let failed=false;for(const restore of undo.reverse())try{await restore();}catch{failed=true;}
  await announcePlannerProgress();
  throw Error(cycleSaveError(error)+(failed?" Não foi possível restaurar todas as alterações. Recarregue e confira a programação.":""));
 }
}
