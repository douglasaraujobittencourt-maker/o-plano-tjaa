import { test, expect } from "bun:test";
import { buildIncidenceIndex, incidenceOrigin, incidencePresentation, topicIncidenceDetails } from "./edital-incidence";
import { incidenceMaps } from "./incidence-data";

test("assuntos principais e subtópicos equivalentes recebem a origem real", () => {
  expect(incidenceOrigin("Administração Pública", "Administração pública burocrática (Weber)")).toBe("verbena");
  expect(incidenceOrigin("Direito Administrativo", "Atos administrativos")).toBe("verbena");
  expect(incidenceOrigin("Direito Administrativo", "Convalidação dos atos administrativos")).toBe("verbena");
  expect(incidenceOrigin("Língua Portuguesa", "Pontuação")).toBe("verbena");
  expect(incidenceOrigin("Direito Constitucional", "Constituição do Estado de Goiás (também em Legislação Complementar)")).toBe("verbena");
  expect(incidenceOrigin("Legislação Complementar", "Resolução CNJ 325/2020")).toBe("verbena");
});
test("sem incidência ou em disciplina diferente não recebe marca", () => {
  expect(incidenceOrigin("Administração Pública", "Inovação no setor público")).toBeNull();
  expect(incidenceOrigin("Direito Administrativo", "Lei 8.666/1993 (referência histórica, revogada)")).toBeNull();
  expect(incidenceOrigin("Direito Penal", "Pontuação")).toBeNull();
  expect(incidenceOrigin("Legislação Institucional do TJDFT", "Regimento Interno do TJDFT: Portaria GPR 354/2016 e emendas regimentais subsequentes")).toBeNull();
});
test("FGV e ambas aparecem automaticamente quando houver dados, sem duplicar etiquetas", () => {
  const fgv = { exams: 1, approximate: false, source: "teste", subjects: [{ name: "Língua Portuguesa", total: 2, note: "", themes: [
    { title: "Pontuação", percent: 50, subtopics: [] },
    { title: "Ortografia oficial", percent: 50, subtopics: [] },
    { title: "Coesão textual", percent: 0, subtopics: [] },
  ] }] };
  const index = buildIncidenceIndex({ tjgo: { ...incidenceMaps.tjgo, fgv } });
  expect(incidenceOrigin("Língua Portuguesa", "Pontuação", index)).toBe("both");
  expect(incidenceOrigin("Língua Portuguesa", "Ortografia oficial", index)).toBe("fgv");
  expect(incidenceOrigin("Língua Portuguesa", "Coesão textual", index)).toBeNull();
  expect(incidencePresentation.both.label).toBe("Instituto Verbena + FGV");
});
test("equivalência não cria incidência se a banca não tiver o tema de origem", () => {
  const index = buildIncidenceIndex({});
  expect(incidenceOrigin("Direito Administrativo", "Atos administrativos", index)).toBeNull();
});


test("expansão retorna subtópicos correspondentes e preserva pesos no nível correto", () => {
  const models = topicIncidenceDetails("Administração Pública", "Paradigmas da Administração Pública e reformas administrativas");
  expect(models).toHaveLength(1);
  expect(models[0].percent).toBe(25);
  expect(models[0].highTheme).toBe(true);
  expect(models[0].subtopics).toHaveLength(2);
  expect(models[0].subtopics.every(s => s.high && s.percent === undefined)).toBe(true);
  const bureaucratic = topicIncidenceDetails("Administração Pública", "Administração pública burocrática (Weber)");
  expect(bureaucratic[0].subtopics.map(s => s.title)).toEqual(["Modelo Burocrático Weberiano"]);
  expect(topicIncidenceDetails("Administração Pública", "Inovação no setor público")).toEqual([]);
  const policies = topicIncidenceDetails("Administração Pública", "Processo das políticas públicas");
  expect(policies[0].highTheme).toBe(false);
  expect(policies[0].subtopics[0].high).toBe(true);
});
test("prioridade interna usa peso individual quando existe e mantém empates", () => {
  const fgv = { exams: 1, approximate: false, source: "teste", subjects: [{ name: "Língua Portuguesa", total: 10, note: "", themes: [
    { title: "Pontuação", percent: 60, subtopics: [
      { title: "Vírgula", description: "", percent: 30 },
      { title: "Dois-pontos", description: "", questions: 3 },
      { title: "Ponto e vírgula", description: "", percent: 10 },
      { title: "Sem peso", description: "" },
      { title: "Sem ocorrência", description: "", percent: 0 },
    ] },
    { title: "Ortografia oficial", percent: 40, subtopics: [] },
  ] }] };
  const details = topicIncidenceDetails("Língua Portuguesa", "Pontuação", { tjgo: { ...incidenceMaps.tjgo, fgv } });
  const result = details.find(d => d.bank === "fgv")!;
  expect(result.subtopics.filter(s => s.high).map(s => s.title)).toEqual(["Vírgula","Dois-pontos"]);
  expect(result.subtopics.some(s => s.title === "Sem ocorrência")).toBe(false);
  expect(details.some(d => d.bank === "verbena")).toBe(true);
});
test("Constituição de Goiás expande no item único de Direito Constitucional", () => {
  const rows = topicIncidenceDetails("Direito Constitucional", "Constituição do Estado de Goiás (também em Legislação Complementar)");
  expect(rows[0].theme).toBe("Constituição do Estado de Goiás");
  expect(rows[0].subtopics).toHaveLength(3);
});

import {orderIncidenceItems} from "./edital-incidence";
test("temas do mapa respeitam a ordem do edital, preservando valores e extras",()=>{
 const rows=[{title:"Código de Organização Judiciária de Goiás — COJ/GO",percent:15},{title:"Extra",percent:5},{title:"Constituição do Estado de Goiás",percent:30},{title:"Resolução CNJ nº 325/2020",percent:10},{title:"Regimento Interno do TJGO",percent:45}];
 expect(orderIncidenceItems(rows,"Legislação Complementar","tjgo").map(r=>r.percent)).toEqual([45,10,30,15,5]);
 expect(rows.map(r=>r.percent)).toEqual([15,5,30,10,45]);
});
