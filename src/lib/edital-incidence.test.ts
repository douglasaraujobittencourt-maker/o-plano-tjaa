import { test, expect } from "bun:test";
import { buildIncidenceIndex, incidenceOrigin, incidencePresentation } from "./edital-incidence";
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
