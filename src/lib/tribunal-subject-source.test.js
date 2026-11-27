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


import {auditGoMatters,auditGoTopics,auditedVerbenaDetails,goMatterOrder,originFromDetails,summarizeMappedIncidence,hasPriorityIncidence,isPrioritySubtopic} from "./tjgo-edital-audit";
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


test("Administração Pública separa 11 vínculos, 5 temas, 9 subtópicos e prioridade real",()=>{
 const rows=auditGoTopics(201,tribunalCatalog,"bb").map(a=>({id:a.id,details:auditedVerbenaDetails(201,a.id)}));
 expect(summarizeMappedIncidence(rows)).toEqual({linkedTopics:11,themes:5,subtopics:9,highThemes:1,highSubtopics:2,priorityTopics:3});
 expect(rows.filter(r=>hasPriorityIncidence(r.details)).map(r=>r.id)).toEqual([20107,20101,20102]);
 for(const id of [20108,20116,20104])expect(originFromDetails(auditedVerbenaDetails(201,id))).toBeNull();
 for(const id of [20123,20111,20121]){
  const detail=auditedVerbenaDetails(201,id)[0];
  expect(detail.subtopics.length).toBeGreaterThan(0);
  expect(detail.subtopics.every(s=>!s.high&&!isPrioritySubtopic(detail,s))).toBe(true);
  expect(hasPriorityIncidence([detail])).toBe(false);
 }
 const duplicate=[...rows,...rows];
 expect(summarizeMappedIncidence(duplicate)).toEqual(summarizeMappedIncidence(rows));
});


import {filteredEditalGroups,filteredEditalDetails,strictMarkedDetails,adminVerbenaMarks} from "./edital-view-filter";
test("filtros do edital excluem assuntos do tribunal oposto e unificam IDs sem duplicatas",()=>{
 const get=bank=>filteredEditalGroups(tribunalCatalog,bank);
 const go=get("bb"),df=get("caixa"),both=get("bnb");
 const ids=groups=>groups.flatMap(g=>g.all.map(a=>a.id));
 expect(go.map(g=>g.m.numero)).toEqual([202,206,205,204,203,201,214]);
 expect(df.map(g=>g.m.numero)).toEqual([202,208,210,207,201,204,203,213,209,211,212,214]);
 expect(go.flatMap(g=>g.all).every(a=>a.escopo!=="Só Caixa")).toBe(true);
 expect(df.flatMap(g=>g.all).every(a=>a.escopo!=="Só BB")).toBe(true);
 expect(ids(go)).not.toContain(20325);expect(ids(go)).not.toContain(20235);
 expect(ids(df)).not.toContain(20413);expect(ids(df)).not.toContain(20501);
 expect(ids(both).length).toBe(new Set(ids(both)).size);
 expect([...new Set([...ids(go),...ids(df)])].sort((a,b)=>a-b)).toEqual(ids(both).sort((a,b)=>a-b));
 expect(go.find(g=>g.m.numero===201).all.slice(0,4).map(a=>a.id)).toEqual([20107,20101,20108,20102]);
 expect(df.find(g=>g.m.numero===202).all.slice(0,3).map(a=>a.id)).toEqual([20230,20204,20201]);
 const children=(groups,bank)=>groups.flatMap(g=>g.all.flatMap(a=>filteredEditalDetails(g.m.numero,a,g.m.titulo_central,bank).flatMap(d=>d.subtopics.map(s=>s.key))));
 expect(new Set(children(go,"bb")).size).toBe(40);
 expect(children(df,"caixa").length).toBe(0);
 expect(children(both,"bnb").length).toBe(45);
 expect(new Set(children(both,"bnb")).size).toBe(44);
});


test("grifos do edital exigem subtópico direto no mapa da mesma matéria e banca",()=>{
 const groups=filteredEditalGroups(tribunalCatalog,"bb");
 const ap=groups.find(g=>g.m.numero===201);
 const marked=ap.all.filter(a=>strictMarkedDetails(201,a,filteredEditalDetails(201,a,ap.m.titulo_central,"bb")).length);
 expect(marked.map(a=>a.id).sort((a,b)=>a-b)).toEqual([20101,20102,20103,20104,20107,20111,20113,20114,20115,20116,20121,20122,20123]);
 const counts=marked.flatMap(a=>strictMarkedDetails(201,a,filteredEditalDetails(201,a,ap.m.titulo_central,"bb")).flatMap(d=>d.subtopics));
 expect(counts.length).toBe(10);
 const markedThemes=marked.flatMap(a=>strictMarkedDetails(201,a,filteredEditalDetails(201,a,ap.m.titulo_central,"bb")).filter(d=>!d.contextOnly));
 expect(markedThemes.length).toBe(5);
 expect(markedThemes.map(d=>d.percent).sort((a,b)=>b-a)).toEqual([25,22,20,20,13]);
 expect(new Set(counts.map(s=>s.key)).size).toBe(9);
 expect(new Set(markedThemes.map(d=>d.key)).size).toBe(5);
 for(const id of [20108,20109,20110]){
  const a=ap.all.find(a=>a.id===id);
  expect(strictMarkedDetails(201,a,filteredEditalDetails(201,a,ap.m.titulo_central,"bb"))).toEqual([]);
 }
 const joint=filteredEditalGroups(tribunalCatalog,"bnb");
 const constitution=joint.find(g=>g.m.numero===204).all.find(a=>a.id===20413);
 const bridge=filteredEditalDetails(204,constitution,"Direito Constitucional","bnb");
 expect(bridge.flatMap(d=>d.subtopics).length).toBe(4);
 const strict=strictMarkedDetails(204,constitution,bridge);
 expect(strict.flatMap(d=>d.subtopics.map(s=>s.title))).toEqual(["Emenda à Constituição Estadual"]);
 const reference=groups.find(g=>g.m.numero===205).all.find(a=>a.id===20413);
 expect(strictMarkedDetails(205,reference,filteredEditalDetails(205,reference,"Legislação Complementar","bb")).flatMap(d=>d.subtopics).length).toBe(3);
 for(const g of filteredEditalGroups(tribunalCatalog,"caixa"))for(const a of g.all)expect(strictMarkedDetails(g.m.numero,a,filteredEditalDetails(g.m.numero,a,g.m.titulo_central,"caixa"))).toEqual([]);
 const example=ap.all.find(a=>a.id===20101);
 const valid=filteredEditalDetails(201,example,"Administração Pública","bb");
 expect(originFromDetails(strictMarkedDetails(201,example,valid))).toBe("verbena");
 const fabricated=valid.map(d=>({...d,bank:"fgv"}));
 expect(strictMarkedDetails(201,example,fabricated)).toEqual([]);
 const fgv={exams:1,approximate:false,source:"teste",subjects:[{name:"Administração Pública",total:2,note:"",themes:[{title:example.topico_central,percent:100,subtopics:[{title:valid[0].subtopics[0].title,description:"teste"}]}]}]};
 const fgvDetail={...valid[0],key:"fgv-test",bank:"fgv",theme:example.topico_central};
 const maps={...incidenceMaps,tjgo:{...incidenceMaps.tjgo,fgv}};
 expect(originFromDetails(strictMarkedDetails(201,example,[...valid,fgvDetail],maps))).toBe("both");
 expect(strictMarkedDetails(203,example,valid)).toEqual([]);
});


test("fonte compartilhada sincroniza temas e subtópicos de todas as matérias e bancos",()=>{
 const joint=filteredEditalGroups(tribunalCatalog,"bnb");
 const get=(maps,bank="bnb")=>filteredEditalGroups(tribunalCatalog,bank).flatMap(g=>g.all.flatMap(a=>filteredEditalDetails(g.m.numero,a,g.m.titulo_central,bank,maps)));
 const current=get(incidenceMaps);
 expect(current.filter(d=>!d.contextOnly).length).toBe(23);
 expect(new Set(current.flatMap(d=>d.subtopics.map(s=>s.key))).size).toBe(44);
 const clone=JSON.parse(JSON.stringify(incidenceMaps));
 const ap=clone.tjgo.verbena.subjects.find(s=>s.name==="Noções de Administração Pública");
 ap.themes[0].title="Tema 1: Novo título";ap.themes[0].percent=26;
 ap.themes[0].subtopics[0].title="Subtópico 1.1 — Novo título Weber";
 const renamed=get(clone);expect(renamed.find(d=>d.theme==="Tema 1: Novo título").percent).toBe(26);
 expect(renamed.some(d=>d.subtopics.some(s=>s.title==="Subtópico 1.1 — Novo título Weber"))).toBe(true);
 ap.themes[0].percent=0;expect(get(clone).some(d=>d.theme==="Tema 1: Novo título")).toBe(false);
 const map=JSON.parse(JSON.stringify(incidenceMaps.tjgo.verbena));
 map.subjects=map.subjects.filter(s=>s.name==="Noções de Administração Pública");
 delete map.subjects[0].themes[0].editalTopicIds;
 map.subjects[0].themes[0].title="Tema 1: Paradigmas e Modelos da Gestao Publica";
 delete map.subjects[0].themes[0].subtopics[0].editalTopicIds;
 map.subjects[0].themes[0].subtopics[0].title="Subtópico 1.1 — Modelo Burocratico Weberiano";
 const both={...incidenceMaps,tjgo:{...incidenceMaps.tjgo,fgv:map}};
 const group=joint.find(g=>g.m.numero===201),topic=group.all.find(a=>a.id===20101);
 expect(originFromDetails(filteredEditalDetails(201,topic,group.m.titulo_central,"bnb",both))).toBe("both");
 expect(get(both,"caixa")).toEqual([]);
 const wrong=JSON.parse(JSON.stringify(incidenceMaps));wrong.tjgo.verbena.subjects[0].themes[0].editalTopicIds=[20301];
 expect(get(wrong).some(d=>d.theme==="Paradigmas e Modelos da Gestão Pública"&&!d.contextOnly)).toBe(false);
});


test("Accountability e Indicadores recebem a etiqueta Verbena pelo mapa, sem novos assuntos oficiais",()=>{
 const groups=filteredEditalGroups(tribunalCatalog,"bb");
 const ap=groups.find(g=>g.m.numero===201);
 for(const [id,theme,percent] of [[20116,"Transparência, Governança e Accountability",20],[20104,"Orçamento Público e Gestão por Processos",20]]){
  const a=ap.all.find(a=>a.id===id);
  const details=filteredEditalDetails(201,a,ap.m.titulo_central,"bb");
  expect(originFromDetails(strictMarkedDetails(201,a,details))).toBe("verbena");
  expect(details.some(d=>d.theme===theme&&d.percent===percent)).toBe(true);
 }
 const indicators=ap.all.find(a=>a.id===20104);
 expect(filteredEditalDetails(201,indicators,ap.m.titulo_central,"bb")[0].subtopics[0].title).toBe("Gestão por Processos e Indicadores");
 const rows=ap.all.flatMap(a=>filteredEditalDetails(201,a,ap.m.titulo_central,"bb"));
 expect(new Set(rows.map(d=>d.key)).size).toBe(5);
 expect(new Set(rows.flatMap(d=>d.subtopics.map(s=>s.key))).size).toBe(9);
});


import {cleanGoRows,cleanGoNames,cleanGoTitle,groupCleanSyllabus} from "./tjgo-clean-syllabus";
test("edital limpo mantém sequência e IDs oficiais do TJGO",()=>{
 const groups=filteredEditalGroups(tribunalCatalog,"bb").filter(g=>cleanGoNames[g.m.numero]);
 expect(groups.map(g=>g.m.numero)).toEqual([202,206,205,204,203,201]);
 for(const g of groups){expect(cleanGoRows[g.m.numero].map(r=>r[0])).toEqual(g.all.map(a=>a.id));expect(g.all.every(a=>cleanGoTitle(g.m.numero,a.id))).toBe(true);}
 expect(new Set(groups.flatMap(g=>g.all.map(a=>a.id))).size).toBe(100);
 expect(cleanGoTitle(201,20102)).toBe("Nova gestão pública.");
 expect(cleanGoTitle(205,20413)).toBe("Constituição do Estado de Goiás.");
});


test("etiqueta solicitada somente em Administração Pública, todos os cinco temas e nove subtópicos sem duplicação",()=>{
 for(const bank of ["bb","bnb"]){
  const groups=filteredEditalGroups(tribunalCatalog,bank);
  const ap=groups.find(g=>g.m.numero===201);
  const marked=ap.all.filter(a=>adminVerbenaMarks(201,a.id,bank).length);
  expect(marked.map(a=>a.id).sort((a,b)=>a-b)).toEqual([20101,20102,20103,20104,20107,20111,20113,20114,20115,20116,20121,20122,20123]);
  const details=marked.flatMap(a=>adminVerbenaMarks(201,a.id,bank));
  expect(details.filter(d=>d.showTheme).map(d=>d.percent).sort((a,b)=>b-a)).toEqual([25,22,20,20,13]);
  const children=details.flatMap(d=>d.subtopics.map(s=>s.title));
  expect(children.length).toBe(9);expect(new Set(children).size).toBe(9);
  for(const g of groups.filter(g=>g.m.numero!==201))for(const a of g.all)expect(adminVerbenaMarks(g.m.numero,a.id,bank)).toEqual([]);
 }
 for(const g of filteredEditalGroups(tribunalCatalog,"caixa"))for(const a of g.all)expect(adminVerbenaMarks(g.m.numero,a.id,"caixa")).toEqual([]);
});


test("edital reúne todos os fragmentos oficiais sem perder IDs ou modificar o texto",()=>{
 const groups=filteredEditalGroups(tribunalCatalog,"bb").filter(g=>cleanGoNames[g.m.numero]);
 const expectedCounts={201:19,202:26,203:16,204:13,205:5,206:9};
 for(const g of groups){
  const rows=groupCleanSyllabus(g.m.numero,g.all,true);
  expect(rows.flatMap(r=>r.ids)).toEqual(g.all.map(a=>a.id));
  expect(rows.length).toBe(expectedCounts[g.m.numero]);
  expect(rows.map(r=>r.displayTitle).join(" ")).toBe(cleanGoRows[g.m.numero].map(r=>r[1]).join(" "));
  expect(rows.every(r=>!/[,:;]$/.test(r.displayTitle))).toBe(true);
  expect(rows.every(r=>(r.displayTitle.match(/\(/g)??[]).length===(r.displayTitle.match(/\)/g)??[]).length)).toBe(true);
 }
 const pt=groups.find(g=>g.m.numero===202);
 const text=groupCleanSyllabus(202,pt.all,true).find(r=>r.id===20203);
 expect(text.ids).toEqual([20203,20219]);
 expect(text.displayTitle).toBe("Organização do texto: Fatores de textualidade (coesão, coerência, intertextualidade, informatividade, intencionalidade, aceitabilidade, situacionalidade).");
 for(const g of filteredEditalGroups(tribunalCatalog,"caixa"))expect(groupCleanSyllabus(g.m.numero,g.all,false).flatMap(r=>r.ids)).toEqual(g.all.map(a=>a.id));
});


import {isGoHighIncidence} from "./tjgo-high-incidence";
test("matriz explícita marca apenas as linhas oficiais solicitadas, sem alterar agrupamento ou filtros",()=>{
 const counts={"201":13,"202":21,"203":16,"204":13,"205":5,"206":7};
 const go=filteredEditalGroups(tribunalCatalog,"bb").filter(g=>cleanGoNames[g.m.numero]);
 for(const g of go){const rows=groupCleanSyllabus(g.m.numero,g.all,true);
  expect(rows.filter(r=>isGoHighIncidence(g.m.numero,r,"bb")).length).toBe(counts[g.m.numero]);
  expect(rows.every(r=>!isGoHighIncidence(g.m.numero,r,"caixa"))).toBe(true);
 }
 const rows=(m)=>groupCleanSyllabus(m,go.find(g=>g.m.numero===m).all,true);
 expect(isGoHighIncidence(201,rows(201).find(r=>r.id===20108),"bb")).toBe(true);
 expect(isGoHighIncidence(201,rows(201).find(r=>r.id===20112),"bb")).toBe(true);
 expect(isGoHighIncidence(201,rows(201).find(r=>r.id===20118),"bb")).toBe(true);
 expect(isGoHighIncidence(202,rows(202).find(r=>r.id===20203),"bb")).toBe(false);
 expect(isGoHighIncidence(205,rows(205).find(r=>r.id===20502),"bb")).toBe(true);
 expect(isGoHighIncidence(206,rows(206).find(r=>r.id===20610),"bb")).toBe(false);
 expect(isGoHighIncidence(206,rows(206).find(r=>r.id===20614),"bb")).toBe(false);
 expect(isGoHighIncidence(204,{ids:[20413],official:true},"bnb")).toBe(true);
 expect(isGoHighIncidence(205,{ids:[20413],official:true},"bb")).toBe(true);
 expect(isGoHighIncidence(201,{ids:[20101],official:false},"bnb")).toBe(false);
 expect(isGoHighIncidence(203,{ids:[20101],official:true},"bb")).toBe(false);
 for(const g of filteredEditalGroups(tribunalCatalog,"bnb"))for(const r of groupCleanSyllabus(g.m.numero,g.all,true))if(!r.official)expect(isGoHighIncidence(g.m.numero,r,"bnb")).toBe(false);
});


import {goStudyDetails,getGoStudyDetail,goStudyWeights} from "./tjgo-study-details";
test("importa integralmente os 30 assuntos completos disponíveis, por matéria e ID existente",()=>{
 expect(Object.keys(goStudyDetails).length).toBe(30);
 const go=filteredEditalGroups(tribunalCatalog,"bb");
 for(const [key,detail] of Object.entries(goStudyDetails)){
  const [matter,id]=key.split(":").map(Number);
  const group=go.find(g=>g.m.numero===matter);
  expect(groupCleanSyllabus(matter,group.all,true).some(r=>r.id===id)).toBe(true);
  expect(detail.subtopics.length).toBeGreaterThan(0);
 }
 expect(getGoStudyDetail(205,20501).subtopics.length).toBe(4);
 expect(getGoStudyDetail(205,20413).subtopics.length).toBe(3);
 expect(getGoStudyDetail(205,20501).charge).toBeNull();
 expect(getGoStudyDetail(205,20413).charge).toBeNull();
 expect(getGoStudyDetail(204,20413)).toBeUndefined();
 expect(getGoStudyDetail(202,20204)).toBeUndefined();
 expect(Object.values(goStudyWeights).reduce((sum,m)=>sum+m.points,0)).toBe(100);
});


test("História e Geografia usa os cinco subtópicos cadastrados no mapa, incluindo IDs agrupados",()=>{
 const go=filteredEditalGroups(tribunalCatalog,"bb").find(g=>g.m.numero===206);
 const rows=groupCleanSyllabus(206,go.all,true);
 const entries=rows.map(r=>({row:r,detail:getGoStudyDetail(206,r.id,r.ids)}));
 expect(rows.length).toBe(9);
 const mapped=entries.filter(x=>x.detail);
 expect(mapped.map(x=>x.row.id)).toEqual([20601,20602,20607,20609]);
 expect(mapped.flatMap(x=>x.detail.subtopics).sort()).toEqual(["Século XIX e Estrutura Judiciária","Século XX e Urbanismo","Política e Sociedade","Setor Sucroenergético","Socioeconomia e Comunidades"].sort());
 expect(mapped.every(x=>x.detail.source==="incidence-map"&&x.detail.charge)).toBe(true);
 expect(mapped.find(x=>x.row.id===20602).detail.charge).toContain("Expansão canavieira pós-2006");
 expect(getGoStudyDetail(206,20610)).toBeUndefined();
 expect(getGoStudyDetail(206,20614)).toBeUndefined();
 expect(getGoStudyDetail(202,20201).source).toBeUndefined();
});
