import {beforeEach,expect,mock,test} from "bun:test";
import {tribunalGroups} from "./tribunal-catalog";
const rows=tribunalGroups.map((g,i)=>({id:String(g.id),name:g.name,color:"#0284C7",ord:i,study_status:g.hours?"active":"pending"}));
let stored=rows.map(row=>({...row}));
let writeError=null;
let bootstrapWrites=0;
mock.module("@/integrations/supabase/external-client",()=>({supabase:{
 auth:{getUser:async()=>({data:{user:{id:"owner",user_metadata:{tribunal_plan_version:1}}}})},
 from:table=>({
  select:()=>({
   order:async()=>({data:stored.map(row=>({...row})),error:null}),
   eq:()=>({maybeSingle:async()=>({data:{id:"owner",exam_name:"TJGO + TJDFT"},error:null}),order:async()=>({data:stored.map(row=>({...row})),error:null})}),
  }),
  insert:()=>{bootstrapWrites++;throw Error("Bootstrap não deve inserir novamente");},
  update:patch=>({eq:async(_column,id)=>{if(table!=="subjects")bootstrapWrites++;if(!writeError)stored=stored.map(row=>row.id===id?{...row,...patch}:row);return {error:writeError};}}),
 })
}}));
const {updateSubject,getSubjects,ensureUserBootstrap}=await import("./planner-api");
beforeEach(()=>{stored=rows.map(row=>({...row}));writeError=null;bootstrapWrites=0;});
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
