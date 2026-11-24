import {beforeEach,expect,mock,test} from "bun:test";
import {tribunalGroups} from "./tribunal-catalog";
const rows=tribunalGroups.map((g,i)=>({id:String(g.id),name:g.name,color:"#0284C7",ord:i,study_status:g.hours?"active":"pending"}));
let stored=rows.map(row=>({...row}));
let writeError=null;
let insertError=null;let missingColumn=false;let inserted=[];let nextCatalogId=1000000;
const initialCycle=[{id:"slot-red",subject_id:"214",ord:4,hours_per_cycle:1,done_hours:0},{id:"slot-admin",subject_id:"201",ord:0,hours_per_cycle:4,done_hours:2}];
let bootstrapWrites=0;
let metadata={tribunal_plan_version:1};let authWriteError=null;let authWrites=[];let rpcError=null;let rpcWrites=[];
mock.module("@/integrations/supabase/external-client",()=>({supabase:{
 auth:{
  getUser:async()=>({data:{user:{id:"owner",user_metadata:{...metadata}}}}),
  updateUser:async({data})=>{authWrites.push(data);if(authWriteError)return {data:{user:null},error:authWriteError};metadata={...metadata,...data};return {data:{user:{id:"owner",user_metadata:{...metadata}}},error:null};}
 },
 rpc:async(name,args)=>{rpcWrites.push({name,args});if(rpcError)return {data:null,error:rpcError};if(name==="planner_allocate_tribunal_id")return {data:nextCatalogId++,error:null};if(name==="planner_update_tribunal_data"){stored=stored.map(row=>row.id===args.p_subject_id?{...row,tribunal_data:args.p_next}:row);return {data:true,error:null};}throw Error("Unexpected RPC");},
 from:table=>({
  select:()=>({
   order:async()=>({data:(table==="cycle_slots"?initialCycle:stored).map(row=>({...row})),error:null}),
   eq:(_column,id)=>({maybeSingle:async()=>({data:table==="subjects"?stored.find(s=>s.id===id)??null:{id:"owner",exam_name:"TJGO + TJDFT"},error:null}),order:async()=>({data:stored.map(row=>({...row})),error:null})}),
  }),
  insert:row=>{
   if(table!=="subjects"||!row.id){bootstrapWrites++;throw Error("Bootstrap não deve inserir novamente");}
   return {select:()=>({single:async()=>{
    if(insertError)return {data:null,error:insertError};
    if(missingColumn&&row.tribunal_data)return {data:null,error:{code:"PGRST204",message:"missing column"}};
    inserted.push(row);stored.push({...row});return {data:{id:row.id},error:null};
   }})};
  },
  update:patch=>({eq:async(_column,id)=>{if(table!=="subjects")bootstrapWrites++;if(!writeError)stored=stored.map(row=>row.id===id?{...row,...patch}:row);return {error:writeError};}}),
 })
}}));
const {updateSubject,getSubjects,getCycle,ensureUserBootstrap,changeTribunalTopic,tribunalTopicError,archiveTribunalSubject,archiveSubjectError,subjectArchiveKey,createSubject,createSubjectError}=await import("./planner-api");
const {officialDefinition,topicsForSubject,topicOverrideKey,catalogFromSubjects,subjectDefinitionKey,subjectCategories,subjectDefinition}=await import("./tribunal-subject-source");
beforeEach(()=>{stored=rows.map(row=>({...row}));writeError=null;insertError=null;missingColumn=false;inserted=[];nextCatalogId=1000000;bootstrapWrites=0;metadata={tribunal_plan_version:1};authWriteError=null;authWrites=[];rpcError=null;rpcWrites=[];});
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

test("cria matéria no banco sem RPC, preserva UUID, categoria, dados e histórico",async()=>{
 rpcError={code:"PGRST202",message:"missing function"};
 const id=await createSubject({name:"Nova matéria",categories:["goBasic","dfSpecific"],pages:42,pages_read:5,video_minutes_total:90,planned_hours_per_week:2});
 expect(inserted).toHaveLength(1);expect(inserted[0].id).toBe(id);expect(inserted[0].tribunal_data).toBeUndefined();
 expect(inserted[0].pages).toBe(42);expect(inserted[0].planned_hours_per_week).toBe(2);
 const found=(await getSubjects()).find(s=>s.id===id);
 expect(found.name).toBe("Nova matéria");expect(subjectCategories(found,"bnb")).toEqual(["goBasic","dfSpecific"]);
 expect(catalogFromSubjects(await getSubjects()).materias.some(m=>m.titulo_central==="Nova matéria")).toBe(true);
 expect(metadata[subjectDefinitionKey(id)].number).toBeGreaterThanOrEqual(1000000000);
 expect(stored.slice(0,14)).toEqual(rows);
});
test("catálogo migrado usa a RPC e a coluna existente, sem fallback Auth",async()=>{
 const id=await createSubject({name:"Nova migrada",categories:["dfBasic"]});
 expect(authWrites).toHaveLength(0);
 expect(inserted[0].tribunal_data.number).toBe(1000000);
 expect(subjectCategories((await getSubjects()).find(s=>s.id===id),"caixa")).toEqual(["dfBasic"]);
});
test("coluna ausente com RPC existente recorre ao cadastro legado",async()=>{
 missingColumn=true;
 const id=await createSubject({name:"Nova compatível",categories:["goSpecific"]});
 expect(inserted).toHaveLength(1);expect(inserted[0].tribunal_data).toBeUndefined();
 expect(metadata[subjectDefinitionKey(id)].number).toBe(1000000);
 expect((await getSubjects()).some(s=>s.id===id)).toBe(true);
});
test("permissão negada não contorna RPC nem cria linhas invisíveis",async()=>{
 rpcError={code:"42501",message:"permission denied"};
 await expect(createSubject({name:"Negada",categories:["dfBasic"]})).rejects.toEqual(rpcError);
 expect(authWrites).toHaveLength(0);expect(inserted).toHaveLength(0);
 expect(createSubjectError(rpcError)).toContain("RLS");
 rpcError={code:"PGRST202"};authWriteError={status:403};
 await expect(createSubject({name:"Negada",categories:["dfBasic"]})).rejects.toEqual(authWriteError);
 expect(inserted).toHaveLength(0);expect(stored).toEqual(rows);
});
test("falha de inserção limpa marcador da nova matéria sem excluir dados",async()=>{
 rpcError={code:"PGRST202"};insertError={code:"42501",message:"permission denied"};
 await expect(createSubject({name:"Falhou",categories:["goBasic"]})).rejects.toEqual(insertError);
 expect(inserted).toHaveLength(0);expect(stored).toEqual(rows);
 expect(Object.entries(metadata).filter(([key,value])=>key.startsWith("planner_tribunal_subject_v1:")&&value)).toHaveLength(0);
});
test("assunto novo em matéria legada é persistente, editável, removível e mantém ID",async()=>{
 rpcError={code:"PGRST202"};
 const id=await createSubject({name:"Matéria com assuntos",categories:["goBasic"]});
 let subject=await changeTribunalTopic(id,{title:"Primeiro tópico",scope:"Só BB"});
 const topic=topicsForSubject(subject,"bb")[0];
 expect(topic.topico_central).toBe("Primeiro tópico");
 expect(topic.id).not.toBe(subjectDefinition(subject).number);
 await changeTribunalTopic(id,{id:topic.id,title:"Renomeado",scope:"Só BB"});
 subject=(await getSubjects()).find(s=>s.id===id);
 expect(topicsForSubject(subject,"bb").map(t=>[t.id,t.topico_central])).toEqual([[topic.id,"Renomeado"]]);
 await changeTribunalTopic(id,{id:topic.id,remove:true});
 expect(topicsForSubject((await getSubjects()).find(s=>s.id===id),"bnb")).toEqual([]);
 await archiveTribunalSubject(id);
 expect((await getSubjects()).some(s=>s.id===id)).toBe(false);
 expect(stored.some(s=>s.id===id)).toBe(true);
});
test("matéria oficial sem migração também aceita novo assunto sem alterar os IDs anteriores",async()=>{
 const before=topicsForSubject((await getSubjects()).find(s=>s.id==="203"),"bnb");
 const updated=await changeTribunalTopic("203",{title:"Complemento",scope:"Comum (Caixa + BB)"});
 const after=topicsForSubject(updated,"bnb");
 expect(after.slice(0,-1)).toEqual(before);expect(after.at(-1).topico_central).toBe("Complemento");
 expect(catalogFromSubjects(await getSubjects()).assuntos.some(t=>t.id===after.at(-1).id)).toBe(true);
});
