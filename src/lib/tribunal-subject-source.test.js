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
test("importa integralmente os 83 assuntos disponíveis, por matéria e ID existente",()=>{
 expect(Object.keys(goStudyDetails).length).toBe(83);
 const go=filteredEditalGroups(tribunalCatalog,"bb");
 for(const [key,detail] of Object.entries(goStudyDetails)){
  const [matter,id]=key.split(":").map(Number);
  const group=go.find(g=>g.m.numero===matter);
  expect(groupCleanSyllabus(matter,group.all,true,true).some(r=>r.id===id)).toBe(true);
  expect(detail.subtopics.length).toBeGreaterThan(0);
 }
 expect(getGoStudyDetail(205,20501).subtopics.length).toBe(4);
 expect(getGoStudyDetail(205,20413).subtopics.length).toBe(3);
 expect(getGoStudyDetail(205,20501).charge).toBeNull();
 expect(getGoStudyDetail(205,20413).charge).toBeNull();
 expect(getGoStudyDetail(204,20413).subtopics.length).toBe(1);
 expect(getGoStudyDetail(202,20204).subtopics.length).toBe(1);
 expect(Object.values(goStudyWeights).reduce((sum,m)=>sum+m.points,0)).toBe(100);
});


test("História e Geografia transcreve os nove assuntos das páginas 12 e 13 do PDF",()=>{
 const go=filteredEditalGroups(tribunalCatalog,"bb").find(g=>g.m.numero===206);
 const rows=groupCleanSyllabus(206,go.all,true);
 const expected={
  "206:20601": {
    "title": "Aspectos da História Social de Goiás: o povoamento branco, os grupos indígenas, a escravidão e cultura negra, os movimentos sociais no campo e a cultura popular",
    "subtopics": [
      "Estrutura Social e Judiciária do Século XIX no Período Imperial."
    ],
    "charge": "Análise histórica fundamentada nos relatórios provisórios de 1835 sobre a extrema carência de bacharéis letrados nas comarcas do interior de Goiás (apenas a Comarca de Goyaz dispunha de Juiz de Direito letrado), ocasionando morosidade e graves dificuldades na aplicação das leis formais."
  },
  "206:20602": {
    "title": "Aspectos da história econômica de Goiás: a mineração no século XVIII, a agropecuária nos séculos XIX e XX, a estrada de ferro e a modernização da economia goiana, as transformações econômicas com a construção de Goiânia e Brasília, industrialização, infraestrutura e planejamento; modernização da agricultura e urbanização do território goiano",
    "subtopics": [
      "Expansão do Setor Sucroenergético a partir de 2006."
    ],
    "charge": "Crescimento acelerado da cultura da cana-de-açúcar em Goiás focado na produção de etanol e na cogeração de bioeletricidade a partir do bagaço, impulsionado por fatores edafoclimáticos extremamente favoráveis (qualidade do solo e clima) e por políticas de incentivo fiscal."
  },
  "206:20607": {
    "title": "Aspectos da história política de Goiás: a independência em Goiás, o Coronelismo na República Velha, as oligarquias, a Revolução de 1930, a administração política de 1930 até os dias atuais",
    "subtopics": [
      "O Coronelismo, Folclore Político e as Campanhas Eleitorais do Século XX."
    ],
    "charge": "Caracterização do mandonismo local, alianças oligárquicas regionais, religiosidade e práticas culturais inseridas na dinâmica política cotidiana goiana."
  },
  "206:20609": {
    "title": "Aspectos históricos e urbanísticos de Goiás e de Goiânia",
    "subtopics": [
      "Estilo Arquitetônico Art Déco e o Discurso Político da Modernidade."
    ],
    "charge": "O acervo arquitetônico Art Déco na construção dos edifícios públicos pioneiros de Goiânia nas décadas de 1930/1940 (linhas retas, simetria e formas geométricas) e a utilização do ideário de \"modernidade\" e \"marcha para o oeste\" para legitimar a mudança da capital da cidade de Goiás para Goiânia (1933) e a posterior transferência da capital federal para Brasília (1960)."
  },
  "206:20610": {
    "title": "Aspectos da Cultura Goiana: culinária regional, festas religiosas, folclore, patrimônio histórico-cultural e turismo",
    "subtopics": [
      "Festas Tradicionais e Patrimônio Imaterial (Procissão do Fogaréu e Cavalhadas)."
    ],
    "charge": "Manifestações religiosas e culturais de Pirenópolis e da cidade de Goiás como atrativos turísticos e marcas da identidade histórica goiana."
  },
  "206:20611": {
    "title": "População goiana: povoamento, migrações, densidade, distribuição demográfica, população economicamente ativa",
    "subtopics": [
      "Dinâmica de Migração e Concentração Populacional no Eixo Goiânia-Anápolis-Brasília."
    ],
    "charge": "Fluxos migratórios atraídos pela expansão da fronteira agrícola e pela industrialização, gerando forte adensamento populacional na Região Metropolitana de Goiânia."
  },
  "206:20612": {
    "title": "As regiões goianas e as desigualdades regionais",
    "subtopics": [
      "Disparidades Socioeconômicas entre o Sul/Sudoeste e o Norte/Nordeste Goiano."
    ],
    "charge": "Contraste entre a elevada produtividade agrícola e industrial do Sul/Sudoeste goiano e os menores índices de desenvolvimento humano (IDH) do Nordeste de Goiás."
  },
  "206:20613": {
    "title": "Aspectos físicos do território goiano: hidrografia, clima, relevo e vegetação",
    "subtopics": [
      "Domínio do Bioma Cerrado e Bacias Hidrográficas."
    ],
    "charge": "Características do Cerrado (estação seca bem definida e estação chuvosa), relevo de planaltos e o papel de Goiás como divisor de águas de importantes bacias hidrográficas nacionais (Tocantins-Araguaia e São Francisco)."
  },
  "206:20614": {
    "title": "Atualidades econômicas, políticas e sociais do Estado de Goiás",
    "subtopics": [
      "Etnodesenvolvimento e Desafios Socioambientais em Territórios Quilombolas."
    ],
    "charge": "Projetos de sustentabilidade, preservação do meio ambiente e incentivo ao turismo comunitário nos territórios Kalunga localizados no Nordeste de Goiás."
  }
};
 expect(rows.map(r=>r.id)).toEqual([20601,20602,20607,20609,20610,20611,20612,20613,20614]);
 expect(rows.map(r=>getGoStudyDetail(206,r.id))).toEqual(rows.map(r=>expected["206:"+r.id]));
 expect(rows.every(r=>getGoStudyDetail(206,r.id)?.subtopics.length===1&&getGoStudyDetail(206,r.id)?.charge)).toBe(true);
});


test("Português apresenta exatamente os 23 assuntos do documento, com todos os subtópicos e cobranças, sem perder IDs",()=>{
 for(const bank of ["bb","bnb"]){
  const group=filteredEditalGroups(tribunalCatalog,bank).find(g=>g.m.numero===202);
  const displayed=groupCleanSyllabus(202,group.all,true,true);
  const go=displayed.filter(r=>r.official);
  expect(go.map(r=>r.id)).toEqual([20201,20217,20218,20202,20203,20220,20204,20222,20223,20206,20215,20224,20209,20225,20208,20210,20211,20226,20205,20212,20213,20229,20216]);
  expect(go.every(r=>getGoStudyDetail(202,r.id)?.subtopics.length===1&&getGoStudyDetail(202,r.id)?.charge)).toBe(true);
  expect(displayed.flatMap(r=>r.ids)).toEqual(group.all.map(a=>a.id));
  expect(go.find(r=>r.id===20212).ids).toEqual([20212,20227]);
  expect(go.find(r=>r.id===20213).ids).toEqual([20213,20228,20214]);
  expect(getGoStudyDetail(202,20229).title).toBe("Variação linguística: estilística, sociocultural, geográfica, histórica");
  expect(getGoStudyDetail(202,20216).title).toBe("Variação entre modalidades da língua (fala e escrita), norma e uso");
 }
 const expected={
  "202:20204": {
    "title": "Sequências textuais: descritiva, narrativa, argumentativa, injuntiva, dialogal",
    "subtopics": [
      "Predomínio de Sequências Argumentativas em Artigos e Ensaios."
    ],
    "charge": "Distinção prática entre a sequência argumentativa (cujo objetivo é defender um ponto de vista e convencer o leitor) e as sequências descritivas, narrativas ou injuntivas presentes em trechos do mesmo texto."
  },
  "202:20222": {
    "title": "Tipos de argumento",
    "subtopics": [
      "Argumento de Autoridade e Argumentação por Causa/Consequência."
    ],
    "charge": "Identificação das estratégias persuasivas utilizadas pelo autor para respaldar a tese (citações de especialistas, dados estatísticos ou nexos causais)."
  },
  "202:20223": {
    "title": "Funcionalidade e características dos gêneros textuais oficiais: ofício, memorando, e-mail, carta comercial, aviso etc.",
    "subtopics": [
      "Atributos da Redação Oficial (Clareza, Concisão, Impessoalidade e Uso do Padrão Culto)."
    ],
    "charge": "Conformidade com o Manual de Redação da Presidência da República, uniformidade do fecho e adequação dos pronomes de tratamento."
  },
  "202:20206": {
    "title": "Uso dos pronomes",
    "subtopics": [
      "Emprego Anafórico e Catafórico dos Demonstrativos (Este/Esse/Isto/Isso)."
    ],
    "charge": "Uso de este/isto para o que vai ser dito ou elemento imediatamente próximo, e esse/isso para o que já foi mencionado no texto."
  },
  "202:20215": {
    "title": "Pontuação",
    "subtopics": [
      "Emprego da Vírgula pela Inversão da Ordem Direta da Frase."
    ],
    "charge": "Justificativa sintática da vírgula pelo deslocamento de adjuntos adverbiais longos ou orações subordinadas adverbiais antepostas à oração principal."
  },
  "202:20224": {
    "title": "Características dos diferentes discursos (jornalístico, político, acadêmico, publicitário, literário, científico etc.)",
    "subtopics": [
      "Marcas de Persuasão nos Discursos Publicitário e Jornalístico."
    ],
    "charge": "Identificação do grau de subjetividade, adjetivação e escolha lexical direcionada ao público-alvo de cada discursos."
  },
  "202:20209": {
    "title": "Organização da frase: Processos de coordenação e de subordinação",
    "subtopics": [
      "Sintaxe do Período Composto — Orações Adjetivas e Adverbiais."
    ],
    "charge": "Diferenciação semântico-gramatical entre orações subordinadas adjetivas restritivas (sem vírgulas) e explicativas (com vírgulas), além do valor lógico de orações adverbiais causais, condicionais e concessivas."
  },
  "202:20225": {
    "title": "Verbos que constituem predicado e verbos que não constituem predicado",
    "subtopics": [
      "Verbos Nocionais vs. Verbos de Ligação (Predicado Verbal, Nominal e Verbo-Nominal)."
    ],
    "charge": "Análise do papel sintático dos verbos na estruturação do predicado e na atribuição de predicativos ao sujeito ou ao objeto."
  },
  "202:20208": {
    "title": "Tempos e modos verbais",
    "subtopics": [
      "Emprego do Modo Subjuntivo e Correlação Verbal."
    ],
    "charge": "Articulação harmônica entre tempos verbais no período composto (ex.: imperfeito do subjuntivo + futuro do pretérito do indicativo)."
  },
  "202:20210": {
    "title": "Concordância verbal e nominal",
    "subtopics": [
      "Concordância Verbal com Sujeito Composto, Expressões Partitivas e Partícula Passivadora (se)."
    ],
    "charge": "Regras de concordância em voz passiva sintética (ex.: \"Vende-se casa\" vs. \"Vendem-se casas\") e com expressões como \"a maioria de\", \"grande parte de\"."
  },
  "202:20211": {
    "title": "Regência dos nomes e dos verbos",
    "subtopics": [
      "Regência Verbal associada ao Emprego do Acento Grave de Crase."
    ],
    "charge": "Verificação da exigência de preposição pelo verbo antecedente combinada com a presença de artigo feminino no termo regido."
  },
  "202:20226": {
    "title": "Constituição e funcionalidade do Sujeito",
    "subtopics": [
      "Identificação do Sujeito Indeterminado e Orações sem Sujeito (Verbos Impessoais)."
    ],
    "charge": "Casos de impessoalidade dos verbos haver (no sentido de existir/ocorrer) e fazer (indicando tempo decorrido), mantendo-se obrigatoriamente na 3ª pessoa do singular."
  },
  "202:20205": {
    "title": "Classes de palavras",
    "subtopics": [
      "Valor Sintático-Semântico das Conjunções Coordenativas e Subordinativas."
    ],
    "charge": "Reconhecimento do valor lógico introduzido por conectivos como contudo, todavia, porquanto, conquanto, visto que, à medida que."
  },
  "202:20212": {
    "title": "Formação das palavras: Composição, derivação",
    "subtopics": [
      "Derivação Sufixal e Significado de Radicais Técnicos."
    ],
    "charge": "Análise morfológica de sufixos formadores de substantivos/adjetivos e compreensão de radicais gregos/latinos (ex.: o sufixo -metria indicando medição no termo \"Jurimetria\")."
  },
  "202:20213": {
    "title": "Ortografia oficial, fonemas e acentuação gráfica",
    "subtopics": [
      "Regras Formais de Acentuação Gráfica (Proparoxítonas, Paroxítonas e Oxítonas)."
    ],
    "charge": "Exigência de justificativa gramatical para o uso do acento gráfico (ex.: a regra de que todas as proparoxítonas são acentuadas)."
  },
  "202:20229": {
    "title": "Variação linguística: estilística, sociocultural, geográfica, histórica",
    "subtopics": [
      "Marcas de Variação Sociocultural e Geográfica no Texto."
    ],
    "charge": "Identificação de dialetos, regionalismos ou jargões profissionais e o respeito à adequação contextual da linguagem."
  },
  "202:20216": {
    "title": "Variação entre modalidades da língua (fala e escrita), norma e uso",
    "subtopics": [
      "Distinção entre Registro Informal/Oralidade e Padrão Formulto Escrito."
    ],
    "charge": "Questões exigindo a reescrita de trechos informais para adequação estrita às regras da gramática normativa."
  }
};
 for(const [key,detail] of Object.entries(expected))expect(goStudyDetails[key]).toEqual(detail);
});


test("Direito Administrativo e Constitucional: 27 detalhes completos, sem perder IDs",()=>{
 const expected={
  "203:20301": {
    "title": "Princípios de Direito Administrativo",
    "subtopics": [
      "Princípio da Impessoalidade e Publicidade (Art. 37, § 1º da CF/88)."
    ],
    "charge": "Vedação absoluta de constar nomes, símbolos ou imagens em publicidades de obras e serviços públicos que caracterizem promoção pessoal de autoridades ou servidores."
  },
  "203:20310": {
    "title": "Regime Jurídico-Administrativo",
    "subtopics": [
      "Bipolariedade do Regime: Supremacia vs. Indisponibilidade do Interesse Público."
    ],
    "charge": "Equilíbrio entre as prerrogativas especiais da Administração Pública (poderes de império) e as restrições impostas em garantia aos direitos dos administrados."
  },
  "203:20302": {
    "title": "Administração Pública direta e indireta",
    "subtopics": [
      "Caracterização das Entidades da Administração Indireta (Autarquias, Fundações, EP e SEM)."
    ],
    "charge": "Autarquias criadas diretamente por lei específica (personalidade de direito público), enquanto Empresas Públicas e Sociedades de Economia Mista têm criação autorizada por lei (direito privado)."
  },
  "203:20303": {
    "title": "Atos Administrativos: elementos e atributos",
    "subtopics": [
      "Presunção de Legitimidade e Atributos/Elementos do Ato."
    ],
    "charge": "A presunção de legitimidade e veracidade decorre diretamente do princípio da legalidade. Exige-se também o domínio dos 5 elementos (Competência, Finalidade, Forma, Motivo e Objeto)."
  },
  "203:20311": {
    "title": "Classificações e espécies dos atos administrativos",
    "subtopics": [
      "Atos Normativos, Ordinatórios e Vinculados vs. Discricionários."
    ],
    "charge": "Diferenciação entre atos que expressam a margem de conveniência e oportunidade da Administração e atos de aplicação estrita da lei."
  },
  "203:20312": {
    "title": "Anulação, revogação e convalidação dos atos administrativos",
    "subtopics": [
      "Regime Jurídico da Convalidação (Ex Tunc)."
    ],
    "charge": "A convalidação suprime defeito sanável de ato ilegal (vícios de competência não exclusiva e forma não essencial), produzindo efeitos retroativos (ex tunc) à data de edição do ato original."
  },
  "203:20312:competencia": {
    "title": "Competência administrativa",
    "subtopics": [
      "Delegação e Avocação de Competência (Lei nº 9.784/1999)."
    ],
    "charge": "Hipóteses de vedação da delegação (edição de atos normativos, decisão de recursos administrativos e matérias de competência exclusiva)."
  },
  "203:20313": {
    "title": "Contratos administrativos: formalização e espécies",
    "subtopics": [
      "Cláusulas Exorbitantes e Alteração Unilateral do Contrato."
    ],
    "charge": "Prerrogativas estatais de rescisão unilateral, modificação de quantitativos e aplicação de penalidades contratuais."
  },
  "203:20307": {
    "title": "Licitação: Lei n. 8.666/93 e Lei nº 14.133, de 01 de abril de 2021",
    "subtopics": [
      "Agentes de Contratação, Modalidades Novas e Margem de Preferência."
    ],
    "charge": "Exigência de que os agentes de contratação não possuam vínculo de parentesco (até 3º grau) com licitantes habituais; hipóteses de cabimento do Diálogo Competitivo; e concessão de margem de preferência para empresas com reserva legal de vagas para pessoas com deficiência (PCD)."
  },
  "203:20314": {
    "title": "Recursos administrativos: critérios e prazos",
    "subtopics": [
      "Efeitos dos Recursos Administrativos (Devolutivo e Suspensivo)."
    ],
    "charge": "Regra geral do efeito apenas devolutivo, salvo previsão legal expressa em contrário ou concessão de efeito suspensivo por justa causa."
  },
  "203:20305": {
    "title": "Processos administrativos e prescrição administrativa",
    "subtopics": [
      "Princípios do Processo Administrativo (Contraditório, Ampla Defesa e Verdade Real)."
    ],
    "charge": "Prazo prescricional de 5 anos para a Administração anular atos administrativos ilegais dos quais decorram efeitos favoráveis aos destinatários (salvo comprovada má-fé)."
  },
  "203:20316": {
    "title": "Agentes públicos: agentes políticos e servidores públicos",
    "subtopics": [
      "Provimento, Estabilidade e Reintegração vs. Disponibilidade."
    ],
    "charge": "Reintegração como retorno do servidor estável demitido ilegalmente (com ressarcimento de direitos); e colocação em disponibilidade com remuneração proporcional ao tempo de serviço quando extinto o cargo."
  },
  "203:20306": {
    "title": "Controle da Administração Pública",
    "subtopics": [
      "Atos de Improbidade Administrativa (Lei nº 8.429/1992 com alterações da Lei nº 14.230/2021)."
    ],
    "charge": "Caracterização dos atos que causam prejuízo ao erário (como permitir/facilitar a aquisição ou locação por preço superior ao de mercado); exigência estrita de dolo; e efetivação da perda da função pública e suspensão dos direitos políticos somente após o trânsito em julgado."
  },
  "203:20317": {
    "title": "Organizações sociais",
    "subtopics": [
      "Requisitos de Qualificação e Regime de Bens/Pessoal."
    ],
    "charge": "Formalização por Contrato de Gestão e a cessão de servidores públicos com ônus para o cessionário."
  },
  "204:20401": {
    "title": "Direitos e deveres fundamentais; Direitos e deveres individuais e coletivos, direito à vida, à liberdade, à igualdade, à segurança e à propriedade",
    "subtopics": [
      "Garantias do Artigo 5º da CF/88 (Inafastabilidade da Jurisdição, Impenhorabilidade e Manifestação do Pensamento)."
    ],
    "charge": "Inafastabilidade: A lei não excluirá da apreciação do Poder Judiciário lesão ou ameaça a direito (art. 5º, XXXV). Impenhorabilidade: A pequena propriedade rural trabalhada pela família não será objeto de penhora para pagamento de débitos decorrentes de sua atividade produtiva. Manifestação: Livre manifestação do pensamento, sendo vedado o anonimato."
  },
  "204:20402": {
    "title": "Direitos sociais",
    "subtopics": [
      "Rol dos Direitos Sociais do Art. 6º e Direitos dos Trabalhadores (Art. 7º)."
    ],
    "charge": "Aplicação dos direitos sociais aos servidores públicos e cláusula da reserva do possível vinculada ao mínimo existencial."
  },
  "204:20409": {
    "title": "Direitos difusos",
    "subtopics": [
      "Tutela Constitucional dos Interesses Difusos e Coletivos via Ação Popular e Ação Civil Pública."
    ],
    "charge": "Legitimidade do cidadão para propor Ação Popular para anular ato lesivo ao patrimônio público, moralidade administrativa, meio ambiente e patrimônio histórico/cultural."
  },
  "204:20403": {
    "title": "Nacionalidade e cidadania",
    "subtopics": [
      "Hipóteses de Nacionalidade Nata e Perda da Nacionalidade (Art. 12 da CF)."
    ],
    "charge": "Cargos privativos de brasileiro nato e as novas regras de perda da nacionalidade brasileira introduzidas por emenda constitucional."
  },
  "204:20404": {
    "title": "Direitos políticos",
    "subtopics": [
      "Condições de Elegibilidade e Inelegibilidades (Art. 14 da CF)."
    ],
    "charge": "Idades mínimas para cargos eletivos e inelegibilidade reflexa de parentes do Chefe do Executivo."
  },
  "204:20410": {
    "title": "Garantias constitucionais individuais, sociais e políticas",
    "subtopics": [
      "Remédios Constitucionais (Mandado de Segurança, Habeas Data e Mandado de Injunção)."
    ],
    "charge": "Prazo decadencial de 120 dias para impetração do Mandado de Segurança e cabimento do Habeas Data para assegurar o conhecimento de informações relativas à pessoa do impetrante."
  },
  "204:20405": {
    "title": "Princípios constitucionais: individuais e da administração pública",
    "subtopics": [
      "Aplicação dos Princípios Constitucionais à Atividade Administrativa e Judiciária."
    ],
    "charge": "Exigência de motivação das decisões e transparência dos atos públicos."
  },
  "204:20411": {
    "title": "Poder constituinte",
    "subtopics": [
      "Poder Constituinte Originário vs. Derivado Reformador (Limitações às Emendas Constitucionais)."
    ],
    "charge": "Limitações materiais (Cláusulas Pétreas do art. 60, § 4º) e limitações formais/procedimentais de votação."
  },
  "204:20406": {
    "title": "Normas constitucionais relativas à Administração Pública e aos servidores públicos da Administração Pública",
    "subtopics": [
      "Remuneração por Subsídio (Art. 39, § 4º da CF) e Teto Remuneratório."
    ],
    "charge": "Fixação da remuneração de membros de Poder por subsídio em parcela única, vedado o acréscimo de qualquer gratificação ou adicional; e teto no âmbito estadual limitado ao subsídio do Governador no Executivo e Desembargadores do TJ no Judiciário."
  },
  "204:20412": {
    "title": "Constituição Federal",
    "subtopics": [
      "Supremacia Constitucional e Controle de Constitucionalidade."
    ],
    "charge": "Princípios fundamentais da República Federativa do Brasil e a hierarquia das normas."
  },
  "204:20413": {
    "title": "Constituição do Estado de Goiás",
    "subtopics": [
      "Processo Legislativo Estadual — Proposta de Emenda à Constituição Estadual (PEC Estadual)."
    ],
    "charge": "Legitimidade para propor Emenda à Constituição de Goiás: exige no mínimo 1/5 dos Deputados Estaduais, o Governador do Estado ou mais da metade das Câmaras Municipais manifestando-se pela maioria relativa de seus membros."
  },
  "204:20414": {
    "title": "Princípios e garantias dos membros do poder judiciário",
    "subtopics": [
      "Garantias Institucionais e Funcionais dos Magistrados (Vitaliciedade, Inamovibilidade e Irredutibilidade de Subsídio)."
    ],
    "charge": "Prazo de 2 anos de efetivo exercício para aquisição da vitaliciedade e as hipóteses excepcionais de perda do cargo por decisão do tribunal ou sentença judicial transitada em julgado."
  },
  "204:20407": {
    "title": "Poder Judiciário: juízes, Tribunais Estaduais e Regionais, do Supremo Tribunal Federal, do Superior Tribunal de Justiça, dos Tribunais e Juízes dos Estados",
    "subtopics": [
      "Obrigatoriedade de Distribuição Imediata e Criação do Órgão Especial (Art. 93 e 95 da CF)."
    ],
    "charge": "Princípio da distribuição imediata de processos em todos os graus de jurisdição; e possibilidade de constituição de Órgão Especial em tribunais com número superior a 25 julgadores (mínimo de 11 e máximo de 25 membros)."
  }
};
 for(const [key,detail] of Object.entries(expected))expect(goStudyDetails[key]).toEqual(detail);
 for(const bank of ["bb","bnb"]){
  for(const matter of [203,204]){
   const group=filteredEditalGroups(tribunalCatalog,bank).find(g=>g.m.numero===matter);
   const rows=groupCleanSyllabus(matter,group.all,true,true);
   expect(rows.flatMap(r=>r.ids)).toEqual(group.all.map(a=>a.id));
   const official=rows.filter(r=>r.official);
   expect(official.length).toBe(13);
   expect(official.every(r=>getGoStudyDetail(matter,r.id)?.charge)).toBe(true);
  }
 }
 expect(getGoStudyDetail(203,"20312:competencia").title).toBe("Competência administrativa");
 expect(getGoStudyDetail(205,20413).charge).toBeNull();
 expect(Object.keys(goStudyDetails).filter(k=>k.startsWith("203:")).length).toBe(14);
 expect(Object.keys(goStudyDetails).filter(k=>k.startsWith("204:")).length).toBe(13);
});
