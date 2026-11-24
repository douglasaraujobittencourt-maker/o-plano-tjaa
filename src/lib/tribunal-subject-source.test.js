import {test,expect} from "bun:test";
import {officialDefinition,selectPlannerSubjects,topicsForSubject,subjectCategories,catalogFromSubjects,PROGRESS_TRIBUNAL_LEGEND} from "./tribunal-subject-source";
const portuguese={name:"Língua Portuguesa",tribunal_data:officialDefinition("Língua Portuguesa")};
const law={name:"Direito Administrativo",tribunal_data:officialDefinition("Direito Administrativo")};
test("mesma legenda e seleção nos consumidores",()=>{
 expect(subjectCategories(portuguese,"bb")).toEqual(["goBasic"]);
 expect(subjectCategories(portuguese,"caixa")).toEqual(["dfBasic"]);
 expect(subjectCategories(law,"bnb")).toEqual(["goSpecific","dfSpecific"]);
 expect(PROGRESS_TRIBUNAL_LEGEND.dfBasic.color).toBe("#0284C7");
 expect(PROGRESS_TRIBUNAL_LEGEND.dfSpecific.color).toBe("#0F172A");
 expect(subjectCategories({name:"Redação (Prova Discursiva)"},"bnb")).toEqual(["writing"]);
});
test("assuntos pertencem à matéria e ao tribunal selecionados",()=>{
 const go=topicsForSubject(portuguese,"bb"),df=topicsForSubject(portuguese,"caixa"),both=topicsForSubject(portuguese,"bnb");
 expect(go.every(a=>a.escopo!=="Só Caixa")).toBe(true);
 expect(df.every(a=>a.escopo!=="Só BB")).toBe(true);
 expect(new Set([...go,...df].map(a=>a.id)).size).toBe(both.length);
 expect(topicsForSubject(law,"bnb").every(a=>a.materia_numero===203)).toBe(true);
});
test("adição, edição e arquivamento propagam para a mesma fonte",()=>{
 const subject={name:"Nova",tribunal_data:{number:1000000,categories:["goBasic"],topics:[{id:1000001,title:"Original",scope:"Só BB"}]}};
 const updated={...subject,name:"Renomeada",tribunal_data:{...subject.tribunal_data,topics:[{...subject.tribunal_data.topics[0],title:"Editado"}]}};
 expect(selectPlannerSubjects([subject],"caixa")).toEqual([]);
 expect(catalogFromSubjects([updated]).materias[0].titulo_central).toBe("Renomeada");
 expect(topicsForSubject(updated,"bb")[0].topico_central).toBe("Editado");
 expect(topicsForSubject({...updated,tribunal_data:{...updated.tribunal_data,topics:[]}},"bb")).toEqual([]);
 const archived={...updated,tribunal_data:{...updated.tribunal_data,archived:true}};
 expect(selectPlannerSubjects([archived],"bnb")).toEqual([]);
 expect(catalogFromSubjects([archived]).assuntos).toEqual([]);
});
test("modo legado não exige migração para ler assuntos oficiais",()=>expect(topicsForSubject({name:"Língua Portuguesa"},"bb").length).toBeGreaterThan(0));

test("metadados legados são aplicados mesmo após a migração e preservam IDs",()=>{
 const old=law.tribunal_data.topics[0],other=law.tribunal_data.topics[1];
 const edited={...law,topic_overrides:{[old.id]:{title:"Renomeado",scope:old.scope},[other.id]:{removed:true}}};
 const result=topicsForSubject(edited,"bnb");
 expect(result.find(t=>t.id===old.id).topico_central).toBe("Renomeado");
 expect(result.some(t=>t.id===other.id)).toBe(false);
 expect(law.tribunal_data.topics.length).toBe(result.length+1);
 expect(catalogFromSubjects([edited]).assuntos).toEqual(result);
});
