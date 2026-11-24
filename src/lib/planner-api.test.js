import {beforeEach,expect,mock,test} from "bun:test";
import {tribunalGroups} from "./tribunal-catalog";
const rows=tribunalGroups.map((g,i)=>({id:String(g.id),name:g.name,color:"#0284C7",ord:i,study_status:g.hours?"active":"pending"}));
let stored=rows.map(row=>({...row}));
let writeError=null;
const initialCycle=[{id:"slot-red",subject_id:"214",ord:4,hours_per_cycle:1,done_hours:0},{id:"slot-admin",subject_id:"201",ord:0,hours_per_cycle:4,done_hours:2}];
let bootstrapWrites=0;
let metadata={tribunal_plan_version:1};let authWriteError=null;let authWrites=[];let rpcError=null;let rpcWrites=[];
mock.module("@/integrations/supabase/external-client",()=>({supabase:{
 auth:{
  getUser:async()=>({data:{user:{id:"owner",user_metadata:{...metadata}}}}),
  updateUser:async({data})=>{authWrites.push(data);if(authWriteError)return {data:{user:null},error:authWriteError};metadata={...metadata,...data};return {data:{user:{id:"owner",user_metadata:{...metadata}}},error:null};}
 },
 rpc:async(name,args)=>{rpcWrites.push({name,args});if(rpcError)return {data:null,error:rpcError};if(name==="planner_update_tribunal_data"){stored=stored.map(row=>row.id===args.p_subject_id?{...row,tribunal_data:args.p_next}:row);return {data:true,error:null};}throw Error("Unexpected RPC");},
 from:table=>({
  select:()=>({
   order:async()=>({data:(table==="cycle_slots"?initialCycle:stored).map(row=>({...row})),error:null}),
   eq:()=>({maybeSingle:async()=>({data:{id:"owner",exam_name:"TJGO + TJDFT"},error:null}),order:async()=>({data:stored.map(row=>({...row})),error:null})}),
  }),
  insert:()=>{bootstrapWrites++;throw Error("Bootstrap não deve inserir novamente");},
  update:patch=>({eq:async(_column,id)=>{if(table!=="subjects")bootstrapWrites++;if(!writeError)stored=stored.map(row=>row.id===id?{...row,...patch}:row);return {error:writeError};}}),
 })
}}));
const {updateSubject,getSubjects,getCycle,ensureUserBootstrap,changeTribunalTopic,tribunalTopicError,archiveTribunalSubject,archiveSubjectError,subjectArchiveKey}=await import("./planner-api");
const {officialDefinition,topicsForSubject,topicOverrideKey,catalogFromSubjects}=await import("./tribunal-subject-source");
beforeEach(()=>{stored=rows.map(row=>({...row}));writeError=null;bootstrapWrites=0;metadata={tribunal_plan_version:1};authWriteError=null;authWrites=[];rpcError=null;rpcWrites=[];});
test("Preserva a cor escolhida após reabrir o planner de tribunais",async()=>{
 await updateSubject("201",{color:"#F97316"});
 await ensureUserBootstrap();
 const list=await getSubjects();
 expect(list.find(row=>row.id==="201")?.color).toBe("#F97316");
 expect(list.length).toBe(14);expect(bootstrapWrites).toBe(0);
});
test("Não restaura cores automáticas nem altera a fila já inicializada",async()=>{
 await updateSubject("202",{color:"#1D4ED8"});
 await ensureUserBootstrap();
 expect((await getSubjects()).find(row=>row.id==="202")?.color).toBe("#1D4ED8");
 expect(bootstrapWrites).toBe(0);
});
test("Erro de gravação é propagado",async()=>{
 writeError={message:"write rejected"};
 await expect(updateSubject("201",{color:"#F97316"})).rejects.toEqual(writeError);
 expect(stored.find(row=>row.id==="201")?.color).toBe("#0284C7");
});

test("edita assunto legado sem migração e mantém o ID após recarregar",async()=>{
 const original=officialDefinition("Direito Administrativo").topics[0];
 const input={id:original.id,title:"Assunto atualizado",scope:original.scope};
 await changeTribunalTopic("203",input);
 expect(authWrites).toHaveLength(1);expect(rpcWrites).toHaveLength(0);
 const subject=(await getSubjects()).find(s=>s.id==="203");
 expect(topicsForSubject(subject,"bnb").find(t=>t.id===original.id).topico_central).toBe("Assunto atualizado");
 expect(stored).toEqual(rows);expect(metadata[topicOverrideKey("203",original.id)].title).toBe("Assunto atualizado");
});
test("exclui apenas da lista, sem excluir linhas históricas ou reativar após recarregar",async()=>{
 const original=officialDefinition("Direito Administrativo").topics[0];
 await changeTribunalTopic("203",{id:original.id,remove:true});
 expect(topicsForSubject((await getSubjects()).find(s=>s.id==="203"),"bnb").some(t=>t.id===original.id)).toBe(false);
 expect(metadata[topicOverrideKey("203",original.id)]).toEqual({removed:true});
 expect(stored).toEqual(rows);
});
test("catálogo migrado grava no registro original, sem criar outro ID",async()=>{
 const definition=officialDefinition("Direito Administrativo");stored=stored.map(row=>row.id==="203"?{...row,tribunal_data:definition}:row);
 const original=definition.topics[0];await changeTribunalTopic("203",{id:original.id,title:"Renomeado",scope:original.scope});
 expect(rpcWrites).toHaveLength(1);expect(authWrites).toHaveLength(0);
 expect(topicsForSubject((await getSubjects()).find(s=>s.id==="203"),"bnb")[0].topico_central).toBe("Renomeado");
});
test("RPC ausente usa persistência compatível; erro RLS não é contornado",async()=>{
 const definition=officialDefinition("Direito Administrativo");stored=stored.map(row=>row.id==="203"?{...row,tribunal_data:definition}:row);
 const original=definition.topics[0];
 rpcError={code:"PGRST202",message:"missing function"};await changeTribunalTopic("203",{id:original.id,title:"Compatível",scope:original.scope});
 expect(authWrites).toHaveLength(1);
 rpcError={code:"42501",message:"permission denied"};const second=definition.topics[1];
 await expect(changeTribunalTopic("203",{id:second.id,remove:true})).rejects.toEqual(rpcError);
 expect(authWrites).toHaveLength(1);expect(tribunalTopicError(rpcError)).toContain("RLS");
});
test("falha de gravação não altera catálogo e chave estrangeira tem mensagem clara",async()=>{
 const original=officialDefinition("Direito Administrativo").topics[0];authWriteError={status:403,message:"forbidden"};
 await expect(changeTribunalTopic("203",{id:original.id,remove:true})).rejects.toEqual(authWriteError);
 expect(topicsForSubject((await getSubjects()).find(s=>s.id==="203"),"bnb").some(t=>t.id===original.id)).toBe(true);
 expect(tribunalTopicError({code:"23503",message:"fk"})).toContain("chave estrangeira");
});

test("arquiva Redação sem migração, preserva linha e remove das listas e do ciclo",async()=>{
 const before=stored.map(s=>({...s}));
 await archiveTribunalSubject("214");
 expect(metadata[subjectArchiveKey("214")]).toBe(true);
 expect(authWrites).toHaveLength(1);expect(rpcWrites).toHaveLength(0);
 expect(stored).toEqual(before);
 await ensureUserBootstrap();
 const subjects=await getSubjects();
 expect(subjects).toHaveLength(13);
 expect(subjects.some(s=>s.id==="214")).toBe(false);
 expect(catalogFromSubjects(subjects).materias.some(m=>m.numero===214)).toBe(false);
 expect((await getCycle()).map(s=>s.subject_id)).toEqual(["201"]);
 expect(initialCycle).toHaveLength(2);
});
test("arquiva uma matéria migrada usando RPC existente",async()=>{
 const definition=officialDefinition("Direito Administrativo");
 stored=stored.map(row=>row.id==="203"?{...row,tribunal_data:definition}:row);
 await archiveTribunalSubject("203");
 expect(rpcWrites).toHaveLength(1);expect(authWrites).toHaveLength(0);
 expect(stored.find(s=>s.id==="203").tribunal_data.archived).toBe(true);
 expect((await getSubjects()).some(s=>s.id==="203")).toBe(false);
});
test("RPC ausente permite arquivar por conta; RLS jamais aciona alternativa",async()=>{
 const definition=officialDefinition("Direito Administrativo");
 stored=stored.map(row=>row.id==="203"?{...row,tribunal_data:definition}:row);
 rpcError={code:"PGRST202",message:"missing function"};
 await archiveTribunalSubject("203");
 expect(metadata[subjectArchiveKey("203")]).toBe(true);
 expect((await getSubjects()).some(s=>s.id==="203")).toBe(false);
 stored=stored.map(row=>row.id==="201"?{...row,tribunal_data:officialDefinition("Administração Pública")}:row);
 rpcError={code:"42501",message:"permission denied"};
 await expect(archiveTribunalSubject("201")).rejects.toEqual(rpcError);
 expect(authWrites).toHaveLength(1);
 expect((await getSubjects()).some(s=>s.id==="201")).toBe(true);
 expect(archiveSubjectError(rpcError)).toContain("RLS");
});
test("falha do Supabase Auth mantém matéria visível e retorna erro",async()=>{
 authWriteError={status:403,message:"forbidden"};
 await expect(archiveTribunalSubject("214")).rejects.toEqual(authWriteError);
 expect(metadata[subjectArchiveKey("214")]).toBeUndefined();
 expect((await getSubjects()).some(s=>s.id==="214")).toBe(true);
 expect(archiveSubjectError(authWriteError)).toContain("RLS");
 expect(archiveSubjectError({code:"23503"})).toContain("chave estrangeira");
});
test("matéria ausente não gera alteração no banco",async()=>{
 await expect(archiveTribunalSubject("unknown")).rejects.toThrow("Matéria não encontrada");
 expect(authWrites).toHaveLength(0);expect(rpcWrites).toHaveLength(0);
});
