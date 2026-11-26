import {test,expect} from "bun:test";
import {officialDefinition,selectPlannerSubjects,topicsForSubject,subjectCategories,catalogFromSubjects,PROGRESS_TRIBUNAL_LEGEND} from "./tribunal-subject-source";
const portuguese={name:"Língua Portuguesa",tribunal_data:officialDefinition("Língua Portuguesa")};
const law={name:"Direito Administrativo",tribunal_data:officialDefinition("Direito Administrativo")};
test("mesma legenda e seleção nos consumidores",()=>{
 expect(subjectCategories(portuguese,"bb")).toEqual(["goBasic"]);
 expect(subjectCategories(portuguese,"caixa")).toEqual(["dfBasic"]);
 expect(subjectCategories(law,"bnb")).toEqual(["goSpecific","dfSpecific"]);
 expect(PROGRESS_TRIBUNAL_LEGEND.dfBasic.color).toBe("#0284C7");
 expect(PROGRESS_TRIBUNAL_LEGEND.dfSpecific.color).toBe("#1E3A8A");
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

import {performanceMatches,performanceTribunalLabel,visiblePerformanceRows} from "./individual-performance";
import {tribunalGroups} from "./tribunal-catalog";
test("desempenho inclui todas as 14 matérias e não duplica as compartilhadas",()=>{
 const rows=tribunalGroups.map(g=>({id:String(g.id),name:g.name,hours:0,minutes:0,qDone:0,accuracy:0}));
 const all=visiblePerformanceRows(rows,"all","name"),go=visiblePerformanceRows(rows,"go","name"),df=visiblePerformanceRows(rows,"df","name");
 expect(all).toHaveLength(14);
 expect(new Set([...go,...df].map(row=>row.id)).size).toBe(14);
 expect(go.filter(row=>row.id==="202")).toHaveLength(1);
 expect(df.filter(row=>row.id==="202")).toHaveLength(1);
 expect(performanceTribunalLabel(rows.find(row=>row.id==="202"))).toBe("TJ Goiás + TJDFT");
 expect(visiblePerformanceRows(rows,"writing","name").map(row=>row.id)).toEqual(["214"]);
 expect(performanceMatches(rows.find(row=>row.id==="202"),"basic")).toBe(true);
 expect(performanceMatches(rows.find(row=>row.id==="203"),"specific")).toBe(true);
 expect(performanceMatches(rows.find(row=>row.id==="214"),"specific")).toBe(false);
});
test("ordena por horas reais, nome e acerto sem confundir ausência de questões com zero por cento",()=>{
 const rows=[
 {id:"1",name:"Zeta",hours:1,minutes:59,qDone:0,accuracy:0},
 {id:"2",name:"Beta",hours:1,minutes:61,qDone:3,accuracy:0},
 {id:"3",name:"Alfa",hours:0,minutes:0,qDone:4,accuracy:75},
 ];
 expect(visiblePerformanceRows(rows,"all","name").map(r=>r.id)).toEqual(["3","2","1"]);
 expect(visiblePerformanceRows(rows,"all","hours").map(r=>r.id)).toEqual(["2","1","3"]);
 expect(visiblePerformanceRows(rows,"all","accuracy").map(r=>r.id)).toEqual(["3","2","1"]);
 expect(rows.map(r=>r.id)).toEqual(["1","2","3"]);
});
test("filtros respeitam matérias novas e categorias da fonte única, não o nome histórico",()=>{
 const custom={id:"new",name:"Matéria personalizada",tribunal_data:{number:1000000,categories:["goBasic","dfSpecific"],topics:[]},hours:0,minutes:0,qDone:0,accuracy:0};
 for(const filter of ["all","go","df","basic","specific"])expect(visiblePerformanceRows([custom],filter,"name")).toEqual([custom]);
 expect(visiblePerformanceRows([custom],"writing","name")).toEqual([]);
 expect(performanceTribunalLabel(custom)).toBe("TJ Goiás + TJDFT");
});

import {resolveCycle,cycleTotals,serializeCycle,validateCycle} from "./editable-cycle";
const editableSlots=[["a","201",4],["b","202",2.5],["c","203",2.5],["d","204",2],["e","214",1]].map(([id,subject_id,hours_per_cycle],ord)=>({id,subject_id,hours_per_cycle,ord,done_hours:0}));
test("ciclo inicial conserva seis sessões e 720 minutos",()=>{
 const sessions=resolveCycle(editableSlots,null);
 expect(sessions).toHaveLength(6);expect(sessions.map(s=>s.reduce((n,b)=>n+b.minutes,0))).toEqual([120,120,120,120,120,120]);
 expect([...cycleTotals(sessions).values()].reduce((n,m)=>n+m,0)).toBe(720);
});
test("ciclo personalizado mantém divisão em sessões e substituição da fila por slot",()=>{
 const sessions=[[{subjectId:"201",minutes:35},{subjectId:"202",minutes:25}],[{subjectId:"201",minutes:25}]];
 const custom=[{...editableSlots[0],hours_per_cycle:1},{...editableSlots[1],hours_per_cycle:25/60}];
 const layout=serializeCycle(sessions,new Map(custom.map(s=>[s.subject_id,s])));
 expect(resolveCycle(custom,layout)).toEqual(sessions);
 expect(resolveCycle([{...custom[0],subject_id:"205"},custom[1]],layout)[0][0]).toEqual({subjectId:"205",minutes:35});
 expect(resolveCycle([], {version:1,sessions:[]})).toEqual([]);
});
test("redistribuição conserva minutos inteiros, exclusão não recria vagas",()=>{
 const layout={version:1,sessions:[[{slotId:"a",minutes:30}],[{slotId:"a",minutes:30}],[{slotId:"a",minutes:30}],[{slotId:"b",minutes:30}]]};
 const resolved=resolveCycle([{...editableSlots[0],hours_per_cycle:1/60}],layout);
 expect(resolved.flat()).toEqual([{subjectId:"201",minutes:1}]);
 expect(()=>validateCycle([[{subjectId:"201",minutes:0}]],new Set(["201"]))).toThrow();
 expect(()=>validateCycle([[{subjectId:"unknown",minutes:30}]],new Set(["201"]))).toThrow();
 expect(()=>validateCycle([[]],new Set())).toThrow();
 expect(()=>validateCycle([],new Set())).not.toThrow();
});

import {officialTopicOrder,orderTribunalTopics,tribunalCatalog} from "./tribunal-catalog";
test("cada edital tem ordem própria e todos os IDs oficiais permanecem presentes",()=>{
 for(const matter of tribunalCatalog.materias){
  for(const exam of ["bb","caixa"]){
   const expected=tribunalCatalog.assuntos.filter(a=>a.materia_numero===matter.numero&&(exam==="bb"?a.escopo!=="Só Caixa":a.escopo!=="Só BB")).map(a=>a.id);
   const ordered=officialTopicOrder(matter.numero,exam);
   expect([...ordered].sort((a,b)=>a-b)).toEqual(expected.sort((a,b)=>a-b));
  }
 }
 expect(topicsForSubject(portuguese,"bb").slice(0,3).map(t=>t.id)).toEqual([20201,20217,20218]);
 expect(topicsForSubject(portuguese,"caixa").slice(0,3).map(t=>t.id)).toEqual([20230,20204,20201]);
 expect(topicsForSubject({name:"Administração Pública"},"bb")[0].id).toBe(20107);
 const rows=[{id:9999999},{id:20215},{id:20201},{id:8888888}];
 expect(orderTribunalTopics(rows,202,"bb",r=>r.id).map(r=>r.id)).toEqual([20201,20215,9999999,8888888]);
 expect(rows.map(r=>r.id)).toEqual([9999999,20215,20201,8888888]);
});


import {auditGoMatters,auditGoTopics,auditedVerbenaDetails,goMatterOrder,originFromDetails} from "./tjgo-edital-audit";
import {incidenceMaps} from "./incidence-data";
test("auditoria TJGO preserva todos os 100 IDs oficiais e insere a referência sem duplicar progresso",()=>{
 const catalog=tribunalCatalog;
 expect(auditGoMatters(catalog,"bb").slice(0,6).map(m=>m.numero)).toEqual([...goMatterOrder]);
 const rows=goMatterOrder.flatMap(m=>auditGoTopics(m,catalog,"bb"));
 const officialRows=rows.filter(r=>!r.supplemental&&!r.reference);
 expect(officialRows.length).toBe(100);
 expect(new Set(officialRows.map(r=>r.id)).size).toBe(100);
 expect(auditGoTopics(205,catalog,"bb").map(r=>r.id)).toEqual([20501,20502,20503,20413,20504]);
 expect(auditGoTopics(203,catalog,"bb").filter(r=>r.supplemental).map(r=>r.id)).toEqual([20325,20326]);
 expect(auditGoTopics(202,catalog,"bb").filter(r=>!r.supplemental).at(-1).topico_central).toBe("Norma e uso");
 const expected=tribunalCatalog.assuntos.filter(a=>goMatterOrder.includes(a.materia_numero)&&a.escopo!=="Só Caixa").map(a=>a.id).sort((a,b)=>a-b);
 expect(officialRows.map(r=>r.id).sort((a,b)=>a-b)).toEqual(expected);
});
test("cada tema e subtópico Verbena aparece uma vez como registro, com percentuais originais",()=>{
 const rows=goMatterOrder.flatMap(m=>auditGoTopics(m,tribunalCatalog,"bb").map(a=>({m,a})));
 const details=rows.flatMap(({m,a})=>auditedVerbenaDetails(m,a.id));
 const owners=details.filter(d=>!d.contextOnly);
 const children=details.flatMap(d=>d.subtopics);
 const expected=incidenceMaps.tjgo.verbena.subjects.flatMap(s=>s.themes.map(t=>({key:"tjgo:verbena:"+s.name+":"+t.title,percent:t.percent,children:t.subtopics.map(x=>({key:"tjgo:verbena:"+s.name+":"+t.title+":"+x.title,description:x.description}))})));
 expect(owners.length).toBe(23);
 expect(children.length).toBe(44);
 expect(new Set(children.map(s=>s.key)).size).toBe(44);
 expect(owners.map(d=>[d.key,d.percent]).sort()).toEqual(expected.map(d=>[d.key,d.percent]).sort());
 expect(children.map(s=>[s.key,s.description]).sort()).toEqual(expected.flatMap(d=>d.children.map(s=>[s.key,s.description])).sort());
 expect(children.every(s=>s.percent===undefined&&s.weight===null)).toBe(true);
 expect(originFromDetails(auditedVerbenaDetails(201,20109))).toBeNull();
 expect(originFromDetails(auditedVerbenaDetails(201,20101))).toBe("verbena");
 expect(auditedVerbenaDetails(201,20101)[0].subtopics[0].high).toBe(true);
});
