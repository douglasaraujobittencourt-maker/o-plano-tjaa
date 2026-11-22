import { test } from "node:test";
import { strict as assert } from "node:assert";
import { studyMinutesBy, sumStudyMinutes } from "./study-metrics";

const sessions = [
  { session_date: "2026-10-13", subject_id: "portugues", kind: "leitura", task: "Videoaula", minutes: 90 },
  { session_date: "2026-10-13", subject_id: "portugues", kind: "leitura", task: "Leitura de PDF", minutes: 30 },
  { session_date: "2026-10-12", subject_id: "direito", kind: "leitura", task: "Videoaula", minutes: 60 },
  { session_date: "2026-10-01", subject_id: null, kind: "leitura", task: "Videoaula", minutes: 45 },
  { session_date: "2026-09-30", subject_id: "direito", kind: "questoes", task: "Questões", minutes: 15 },
];

test("today includes video lesson minutes alongside PDF reading", () => {
  assert.equal(sumStudyMinutes(sessions.filter(s => s.session_date === "2026-10-13")), 120);
});
test("this week includes every video lesson in the period", () => {
  assert.equal(sumStudyMinutes(sessions.filter(s => s.session_date >= "2026-10-12" && s.session_date <= "2026-10-13")), 180);
});
test("this month includes video lessons even without an assigned subject", () => {
  assert.equal(sumStudyMinutes(sessions.filter(s => s.session_date >= "2026-10-01" && s.session_date <= "2026-10-13")), 225);
});
test("global performance includes all modalities and unassigned sessions without double counting", () => {
  assert.equal(sumStudyMinutes(sessions), 240);
});
test("daily charts include video lesson time on each day", () => {
  assert.deepEqual(studyMinutesBy(sessions, "session_date"), { "2026-10-13": 120, "2026-10-12": 60, "2026-10-01": 45, "2026-09-30": 15 });
});
test("subject charts include video lessons in their respective subjects", () => {
  assert.deepEqual(studyMinutesBy(sessions, "subject_id"), { portugues: 120, direito: 75 });
});
test("empty session lists have zero study hours", () => {
  assert.equal(sumStudyMinutes([]), 0);
});