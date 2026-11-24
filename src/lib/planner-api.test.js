import {beforeEach,expect,mock,test} from "bun:test";
import {tribunalGroups} from "./tribunal-catalog";
const rows=tribunalGroups.map((g,i)=>({id:String(g.id),name:g.name,color:"#0284C7",ord:i,study_status:g.hours?"active":"pending"}));
let stored=rows.map(row=>({...row}));
let writeError=null;
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
   order:async()=>({data:stored.map(row=>({...row})),error:null}),
   eq:()=>({maybeSingle:async()=>({data:{id:"owner",exam_name:"TJGO + TJDFT"},error:null}),order:async()=>({data:stored.map(row=>({...row})),error:null})}),
  }),
  insert:()=>{bootstrapWrites++;throw Error("Bootstrap não deve inserir novamente");},
  update:patch=>({eq:async(_column,id)=>{if(table!=="subjects")bootstrapWrites++;if(!writeError)stored=stored.map(row=>row.id===id?{...row,...patch}:row);return {error:writeError};}}),
 })
}}));
const {updateSubject,getSubjects,ensureUserBootstrap,changeTribunalTopic,tribunalTopicError}=await import("./planner-api");
const {officialDefinition,topicsForSubject,topicOverrideKey}=await import("./tribunal-subject-source");
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
